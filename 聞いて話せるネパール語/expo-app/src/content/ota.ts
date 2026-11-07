import * as FS from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData } from '@safa/shared';
import app from '../../app.json';
import { composePack } from '../pack/compose';
import { makeNeCore } from '../appData';
import { textFiles, validateManifest, validateContent, type ContentFile, type ContentManifest, type AudioArchive } from './otaModel';
import { extractAudio, hashText, workBudget } from './otaWork';
import coreBaseline from '../../data/ota-baseline/core.json';
import jaBaseline from '../../data/overlays/ja.json';
import enBaseline from '../../data/overlays/en.json';

export const MANIFEST_URL='https://github.com/JinKato2020/safa-language-apps/releases/download/packs-appa-ota/manifest.json';
const ROOT=()=>`${FS.documentDirectory}content-ota/`;
const pointerKey=(lang:string)=>`@nepali_app/content_ota/${lang}`;
const textUri=(sha:string)=>`${ROOT()}text/${sha}.json`;
const audioUri=(sha:string)=>`${ROOT()}audio/${sha}.mp3`;
const baselineVersion=coreBaseline.curriculumRevision;
const locks=new Map<string,Promise<ContentSnapshot>>();
const audioJobs=new Map<string,Promise<AudioIndex>>();
const validated=new Map<string,{sha:string;snapshot:ContentSnapshot}>();
const bundled=new Map<string,ContentSnapshot>();
export type ContentSnapshot={version:number;data:AppData};
type AudioIndex={version:number;files:Record<string,string>};
const options={version:app.expo.version,review:{iosAppId:'6771720689',androidPackage:app.expo.android.package}};

function compose(core:any,overlay:any,ne:Record<string,string>={},l1:Record<string,string>={}):AppData {
  const maps=(files:Record<string,string>)=>{
    const conv:Record<string,string>={},gram:Record<string,string>={};
    for(const [name,uri]of Object.entries(files)){const id=name.replace(/\.mp3$/,'');(id.split('-').length===3?conv:gram)[id]=uri;}return{conv,gram};
  };
  const a=maps(ne),b=maps(l1);
  return composePack(makeNeCore(core,a),{...overlay,nativeLang:overlay.l1,l1Audio:b.conv,l1GrammarAudio:b.gram},options);
}
export function bundledContent(lang:string):ContentSnapshot {
  const cached=bundled.get(lang);if(cached)return cached;
  const overlay=lang==='en'?enBaseline:jaBaseline;
  const result={version:baselineVersion,data:compose(coreBaseline,overlay)};bundled.set(lang,result);return result;
}
async function fetchText(url:string,ms=12000):Promise<string>{
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),ms);
  try{const r=await fetch(url,{signal:ctrl.signal});if(!r.ok)throw new Error(`Content HTTP ${r.status}`);return await r.text();}finally{clearTimeout(timer);}
}
async function readText(file:ContentFile):Promise<any>{
  const raw=await FS.readAsStringAsync(textUri(file.sha256));
  if(await hashText(raw)!==file.sha256)throw new Error('Content checksum mismatch');return JSON.parse(raw);
}
async function ensureText(file:ContentFile):Promise<void>{
  try{await readText(file);return;}catch{}
  const raw=await fetchText(file.url,30000);
  if(await hashText(raw)!==file.sha256)throw new Error('Content checksum mismatch');JSON.parse(raw);
  await FS.writeAsStringAsync(textUri(file.sha256),raw);
}
async function download(file:ContentFile,archive:AudioArchive,missing:Set<string>):Promise<Record<string,string>>{
  const uri=`${ROOT()}${file.sha256}.zip`;
  const task=FS.createDownloadResumable(file.url,uri);
  const timer=setTimeout(()=>{void task.pauseAsync().catch(()=>{});},180000);
  try{
    const response=await task.downloadAsync();if(response?.status!==200)throw new Error('Audio download failed');
    return await extractAudio(uri,file,archive.files,missing,audioUri);
  }finally{clearTimeout(timer);await FS.deleteAsync(uri,{idempotent:true}).catch(()=>{});}
}
async function prepareAudioIndex(archive:AudioArchive,lang:string):Promise<AudioIndex>{
  const indexUri=`${ROOT()}audio-${archive.zip.sha256}.json`;
  let saved:AudioIndex|undefined;try{saved=JSON.parse(await FS.readAsStringAsync(indexUri));}catch{}
  if(!saved)try{saved=JSON.parse(await FS.readAsStringAsync(`${ROOT()}audio-latest-${lang}.json`));}catch{}
  const files:Record<string,string>={}, missing=new Set<string>(),yieldWork=workBudget();
  for(const [name,entry]of Object.entries(archive.files)){
    await yieldWork();
    const candidates=[saved?.files[name],audioUri(entry.sha256),`${FS.documentDirectory}packs/${lang}/audio/${name}`].filter(Boolean) as string[];
    for(const uri of candidates){
      // Native MD5/size validates reusable legacy files without reading every MP3 into JS.
      const info=await FS.getInfoAsync(uri,{md5:true});
      if(info.exists && info.size===entry.bytes && info.md5===entry.md5){files[name]=uri;break;}
    }
    if(!files[name])missing.add(name);
  }
  if(missing.size){
    // A delta is used only when it supplies every missing file; full archive remains the recovery path.
    let extracted:Record<string,string>={};
    if(archive.delta && saved?.version===archive.delta.base){
      try{extracted=await download(archive.delta.zip,archive,missing);}catch{}
    }
    if([...missing].some(name=>!extracted[name]))extracted=await download(archive.zip,archive,missing);
    for(const name of missing){
      if(!extracted[name])throw new Error('Missing audio entry: '+name);
      files[name]=extracted[name];
    }
  }
  const result={version:archive.version,files};await FS.writeAsStringAsync(indexUri,JSON.stringify(result));
  await FS.writeAsStringAsync(`${ROOT()}audio-latest-${lang}.json`,JSON.stringify(result));return result;
}
function audioIndex(archive:AudioArchive,lang:string):Promise<AudioIndex>{
  const key=archive.zip.sha256,running=audioJobs.get(key);if(running)return running;
  const job=prepareAudioIndex(archive,lang).finally(()=>audioJobs.delete(key));audioJobs.set(key,job);return job;
}
async function assemble(m:ContentManifest,lang:string):Promise<{core:any;overlay:any}>{
  const core=await readText(m.core),l=m.languages[lang],overlay=await readText(l.overlay);
  overlay.grammarGuide={};for(const[id,file]of Object.entries(l.guides))overlay.grammarGuide[id]=await readText(file);
  validateContent(core,overlay,lang);
  for(const [archive,refs] of [[m.audio,core.grammarAudioRefs],[l.audio,overlay.grammarAudioRefs]] as [AudioArchive,Record<string,string|null>|undefined][]){
    for(const [key,rows] of Object.entries(core.examplesNe) as [string,string[]][])rows.forEach((_,i)=>{if(!archive.files[`${key}-${i+1}.mp3`])throw new Error('Missing conversation audio');});
    for(const [key,rows] of Object.entries(core.grammarNe) as [string,string[]][])rows.forEach((_,i)=>{const id=`${key}-${i+1}`,ref=refs?refs[id]:id;if(ref!=null && !archive.files[`${ref}.mp3`])throw new Error('Missing grammar audio');});
  }
  return{core,overlay};
}
async function snapshot(sha:string,lang:string):Promise<ContentSnapshot>{
  if(!/^[a-f0-9]{64}$/.test(sha))throw new Error('Invalid content pointer');
  const raw=await FS.readAsStringAsync(textUri(sha));if(await hashText(raw)!==sha)throw new Error('Manifest checksum mismatch');
  const m=JSON.parse(raw) as ContentManifest;validateManifest(m,lang);
  if(m.version<baselineVersion)throw new Error('Content older than bundled baseline');
  const{core,overlay}=await assemble(m,lang);
  const ne:AudioIndex=JSON.parse(await FS.readAsStringAsync(`${ROOT()}audio-${m.audio.zip.sha256}.json`));
  const l1:AudioIndex=JSON.parse(await FS.readAsStringAsync(`${ROOT()}audio-${m.languages[lang].audio.zip.sha256}.json`));
  for(const [archive,index] of [[m.audio,ne],[m.languages[lang].audio,l1]] as [AudioArchive,AudioIndex][])
    if(Object.keys(archive.files).some(name=>typeof index.files[name]!=='string'))throw new Error('Incomplete audio index');
  const directories=new Map<string,Set<string>>();
  for(const files of [ne.files,l1.files])for(const uri of Object.values(files)){
    if(!uri.startsWith(FS.documentDirectory!))throw new Error('Invalid audio cache path');
    const slash=uri.lastIndexOf('/'),dir=uri.slice(0,slash+1),name=uri.slice(slash+1);
    if(!directories.has(dir))directories.set(dir,new Set(await FS.readDirectoryAsync(dir)));
    if(!directories.get(dir)!.has(name))throw new Error('Audio cache incomplete');
  }
  return{version:m.version,data:compose(core,overlay,ne.files,l1.files)};
}
export async function cachedContent(lang:string):Promise<ContentSnapshot|null>{
  try{const p=JSON.parse(await AsyncStorage.getItem(pointerKey(lang))||'null');if(!p)return null;
    let sha=p.sha,result:ContentSnapshot;
    try{result=await snapshot(sha,lang);}catch{if(!p.previous)return null;sha=p.previous;result=await snapshot(sha,lang);}
    validated.set(lang,{sha,snapshot:result});return result;
  }catch{return null;}
}
async function sync(lang:string,onStatus?:(phase:'checking'|'audio')=>void):Promise<ContentSnapshot>{
  onStatus?.('checking');const raw=await fetchText(`${MANIFEST_URL}?t=${Date.now()}`),sha=await hashText(raw);
  // Same immutable manifest: return the exact already-validated data object.
  // No lesson reads, audio scans, composition or whole-app context update.
  const warm=validated.get(lang);if(warm?.sha===sha)return warm.snapshot;
  const m=JSON.parse(raw) as ContentManifest;
  validateManifest(m,lang);
  const cached=await cachedContent(lang);if(m.version<Math.max(baselineVersion,cached?.version??0))return cached??bundledContent(lang);
  const pointer=JSON.parse(await AsyncStorage.getItem(pointerKey(lang))||'null');
  if(cached?.version===m.version && pointer?.sha===sha)return cached;
  await FS.makeDirectoryAsync(`${ROOT()}text/`,{intermediates:true});await FS.makeDirectoryAsync(`${ROOT()}audio/`,{intermediates:true});
  // Immutable chunks are staged and reusable after interruption. Nothing live is overwritten.
  for(const file of textFiles(m,lang))await ensureText(file);
  const{core,overlay}=await assemble(m,lang);onStatus?.('audio');
  const ne=await audioIndex(m.audio,'_core'),l1=await audioIndex(m.languages[lang].audio,lang);
  await FS.writeAsStringAsync(textUri(sha),raw);
  const old=JSON.parse(await AsyncStorage.getItem(pointerKey(lang))||'null');
  if(old?.sha!==sha){
    let previous=old?.sha;if(previous)try{await snapshot(previous,lang);}catch{previous=old?.previous;}
    await AsyncStorage.setItem(pointerKey(lang),JSON.stringify({sha,previous}));
  }
  const result={version:m.version,data:compose(core,overlay,ne.files,l1.files)};
  validated.set(lang,{sha,snapshot:result});return result;
}
export function syncContent(lang:string,onStatus?:(phase:'checking'|'audio')=>void):Promise<ContentSnapshot>{
  const running=locks.get(lang);if(running)return running;
  const job=sync(lang,onStatus).finally(()=>locks.delete(lang));locks.set(lang,job);return job;
}
