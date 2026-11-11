// Real OTA implementation + real hashes/zip extraction, with deterministic disk/network adapters.
const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),crypto=require('crypto'),{zipSync}=require('fflate');
const ROOT=path.resolve(__dirname,'../..'),DIR='聞いて話せるネパール語/expo-app/';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),md5=b=>crypto.createHash('md5').update(b).digest('hex');
function source(p){return fs.readFileSync(path.join(ROOT,p),'utf8');}
function compile(file,req,globals={}){const m={exports:{}};const js=ts.transpileModule(source(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext('(function(require,module,exports){'+js+'})',{console,setTimeout,clearTimeout,AbortController,Date,Uint8Array,global:{atob,btoa},...globals})(req,m,m.exports);return m.exports;}
const core={curriculumRevision:1,themes:[{id:1,name:'Conversation'}],levels:[{id:1,name:'Basic'}],wordCategories:[],grammarThemes:[{id:1,name:'Identity'}],examplesNe:{'1-1':['नमस्ते।']},grammarNe:{'1':['म विद्यार्थी हुँ।']},grammarAudioRefs:{'1-1':'1-1'},wordsNe:{}};
const makeOverlay=lang=>({l1:lang,examplesL1:{'1-1':['Hello']},grammarL1:{'1':['I am a student']},wordsL1:{},grammarThemeNames:{'1':'Identity'},grammarGuide:{'1':[{type:'p',text:'Lesson'}]}});
const remote=new Map(),disk=new Map(),kv=new Map(),downloads=[],requests=[],requestOptions=[];let offline=false,failSet=false,writeFail='',diskReads=0,infoReads=0;
const FS={documentDirectory:'file:///documents/',EncodingType:{Base64:'base64'},
readDirectoryAsync:async dir=>[...disk.keys()].filter(u=>u.startsWith(dir)&&!u.slice(dir.length).includes('/')).map(u=>u.slice(dir.length)),
makeDirectoryAsync:async()=>{},readAsStringAsync:async(u,o)=>{diskReads++;if(!disk.has(u))throw Error('ENOENT '+u);let value=disk.get(u);if(o?.position!=null)value=value.subarray(o.position,o.position+o.length);return value.toString(o?.encoding==='base64'?'base64':'utf8');},
writeAsStringAsync:async(u,v,o)=>{if(u===writeFail)throw Error('disk full');disk.set(u,Buffer.from(v,o?.encoding==='base64'?'base64':'utf8'));},
getInfoAsync:async(u,o)=>{infoReads++;return disk.has(u)?{exists:true,size:disk.get(u).length,...(o?.md5?{md5:md5(disk.get(u))}:{})}:{exists:false};},
deleteAsync:async u=>{disk.delete(u);},
createDownloadResumable:(url,uri)=>({pauseAsync:async()=>{},downloadAsync:async()=>{if(offline||!remote.has(url))throw Error('network');downloads.push(url);disk.set(uri,Buffer.from(remote.get(url)));return{status:200};}})};
const storage={getItem:async k=>kv.get(k)??null,setItem:async(k,v)=>{if(failSet)throw Error('pointer write failed');kv.set(k,v);}};
const models=compile(DIR+'src/content/otaModel.ts',require),compose=compile(DIR+'src/pack/compose.ts',require),appData=compile(DIR+'src/appData.ts',require);
const actualCore=JSON.parse(source(DIR+'data/ota-baseline/core.json'));
for(const lang of ['ja','en','ko','ar']){
  const actualOverlay=JSON.parse(source(DIR+`data/overlays/${lang}.json`));models.validateContent(actualCore,actualOverlay,lang);
  if(['ko','ar'].includes(lang)){
    const missingMeaning=structuredClone(actualOverlay);delete missingMeaning.nepaliDictionary.entries[0].senses[0][lang];
    assert.throws(()=>models.validateContent(actualCore,missingMeaning,lang),new RegExp('Missing dictionary translation: '+lang));
  }
  if(actualOverlay.learningPathV3){
    const invalid=structuredClone(actualOverlay),step=invalid.learningPathV3.steps[0];step.items[1]=step.items[0];assert.throws(()=>models.validateContent(actualCore,invalid,lang));
    const badCloze=structuredClone(actualOverlay);Object.values(badCloze.learningPathV3.exercises)[0].selection.prefix='broken';assert.throws(()=>models.validateContent(actualCore,badCloze,lang));
    const badLetters=structuredClone(actualOverlay);badLetters.lettersSounds.combinations[0].samples.pop();assert.throws(()=>models.validateContent(actualCore,badLetters,lang));
    const legacyLetters=structuredClone(actualOverlay);delete legacyLetters.lettersSounds.conjunctCombinations;models.validateContent(actualCore,legacyLetters,lang);
    for(const mutation of [r=>r.pop(),r=>r[0].samples.pop(),r=>r[0].samples[1].ne='क',r=>delete r[0].samples[1].audio,r=>r[1]=r[0]]){
      const invalid=structuredClone(actualOverlay);mutation(invalid.lettersSounds.conjunctCombinations);assert.throws(()=>models.validateContent(actualCore,invalid,lang),'Incomplete or mismatched conjunct chart rejected');
    }
    const badWords=structuredClone(actualOverlay);badWords.lettersSounds.sections.find(s=>s.id==='conjuncts').samples.find(s=>s.examples).examples[0].ne='wrong';assert.throws(()=>models.validateContent(actualCore,badWords,lang));
    const missingWordAudio=structuredClone(actualOverlay);delete missingWordAudio.lettersSounds.sections.find(s=>s.id==='vowels').samples[0].examples[0].audio;assert.throws(()=>models.validateContent(actualCore,missingWordAudio,lang));
  }
}
const work=compile(DIR+'src/content/otaWork.ts',name=>name==='expo-file-system/legacy'?FS:require(name));
const loadOta=(bundleCore=core)=>compile(DIR+'src/content/ota.ts',name=>{
if(name==='expo-file-system/legacy')return FS;if(name==='@react-native-async-storage/async-storage')return storage;if(name==='./otaModel')return models;if(name==='./otaWork')return work;
if(name==='../pack/compose')return compose;if(name==='../appData')return appData;if(name==='../../app.json')return{expo:{version:'test',android:{package:'test'}}};
if(name.includes('ota-baseline/core'))return bundleCore;if(name.includes('overlays/'))return makeOverlay(name.includes('ar.json')?'ar':name.includes('ko.json')?'ko':name.includes('en.json')?'en':'ja');return require(name);
},{fetch:async(url,options)=>{requests.push(url);requestOptions.push(options);if(offline)throw Error('offline');const u=url.split('?')[0];if(!remote.has(u))return{ok:false,status:404};return{ok:true,text:async()=>remote.get(u).toString('utf8')};}});
const ota=loadOta();
function file(value,ext='json'){const raw=Buffer.isBuffer(value)?value:Buffer.from(JSON.stringify(value));const url='https://example.test/'+sha(raw)+'.'+ext;remote.set(url,raw);return{url,sha256:sha(raw),bytes:raw.length};}
function archive(version,entries){const raw=Buffer.from(zipSync(Object.fromEntries(Object.entries(entries).map(([n,v])=>[n,Buffer.from(v)]))));return{version,zip:file(raw,'zip'),files:Object.fromEntries(Object.entries(entries).map(([n,v])=>[n,{sha256:sha(v),md5:md5(v),bytes:Buffer.byteLength(v)}]))};}
let manifest={schema:1,version:1,core:file(core),audio:archive(1,{'1-1-1.mp3':'NE greeting','1-1.mp3':'NE identity'}),languages:{}};
for(const lang of ['ja','en','ko','ar']){const o=makeOverlay(lang);delete o.grammarGuide;manifest.languages[lang]={overlay:file(o),guides:{'1':file([{type:'p',text:'Lesson'}])},audio:archive(1,{'1-1-1.mp3':lang+' greeting','1-1.mp3':lang+' identity'})};}
const publish=()=>remote.set(ota.MANIFEST_URL,Buffer.from(JSON.stringify(manifest)));
(async()=>{
assert.equal(ota.MANIFEST_URL,'https://content.safa-lang.com/nepali/_manifest.json');
const {createContentActivation}=compile(DIR+'src/content/otaActivation.ts',require);
const applied=[],pending=[];
const initial={version:1,lesson:'old'},audioReady={...initial,audio:true};
const activation=createContentActivation(initial,'GrammarGuideReader',x=>applied.push(x),()=>pending.push(true));
activation.receive(initial);assert.equal(applied.length,0,'unchanged snapshot does not rerender');
activation.receive(audioReady);assert.strictEqual(applied.at(-1),audioReady,'first audio can attach to the same lesson revision');
activation.receive({version:2,lesson:'new'});assert.equal(applied.length,1,'never replace a lesson while studying');
activation.receive({version:3,lesson:'newest'});activation.receive({version:2,lesson:'stale'});
activation.routeChanged('Listening');activation.routeChanged(undefined);assert.equal(applied.length,1,'playback and unknown routes defer activation');
activation.routeChanged('HomeTab');assert.equal(applied.at(-1).version,3,'latest complete snapshot applies in this launch');
activation.receive({version:2});assert.equal(applied.at(-1).version,3,'no downgrade');
activation.routeChanged('Practice');activation.receive({version:4});activation.stop();activation.routeChanged('Theme');activation.receive({version:5});assert.equal(applied.at(-1).version,3,'language switch/unmount discards pending update');
assert.equal(ota.bundledContent('ja').data.getGrammarExamples(1)[0].ne,'म विद्यार्थी हुँ।');assert.equal(requests.length,0);
publish();await ota.syncContent('ja');assert.equal(downloads.length,2);assert.equal((await ota.cachedContent('ja')).version,1);
const firstDownloads=downloads.length,firstRequests=requests.length,firstReads=diskReads;const warm1=await ota.syncContent('ja'),warm2=await ota.syncContent('ja');assert.strictEqual(warm1,warm2,'unchanged data keeps its React context identity');assert.equal(diskReads,firstReads,'unchanged OTA does no disk reads');assert.equal(downloads.length,firstDownloads);assert.equal(requests.length-firstRequests,2,'unchanged content only fetches manifest');
manifest.version=2;manifest.languages.ja.guides['1']=file([{type:'p',text:'A clearer lesson'}]);publish();const before=requests.length;await ota.syncContent('ja');assert.equal(requests.length-before,2,'only changed guide downloaded');assert.equal(downloads.length,2);assert.equal((await ota.cachedContent('ja')).version,2);
const oldPointer=kv.get('@nepali_app/content_ota/ja');
manifest.version=3;const good=file([{type:'p',text:'Third lesson'}]);manifest.languages.ja.guides['1']=good;publish();const original=remote.get(good.url);remote.set(good.url,Buffer.from('corrupt'));
await assert.rejects(ota.syncContent('ja'));assert.equal(kv.get('@nepali_app/content_ota/ja'),oldPointer);assert.equal((await ota.cachedContent('ja')).version,2);
remote.set(good.url,original);failSet=true;await assert.rejects(ota.syncContent('ja'));assert.equal(kv.get('@nepali_app/content_ota/ja'),oldPointer);failSet=false;await ota.syncContent('ja');assert.equal((await ota.cachedContent('ja')).version,3);
const oldAudio=manifest.audio;manifest.version=4;manifest.audio=archive(2,{'1-1-1.mp3':'NE greeting','1-1.mp3':'NE identity revision'});manifest.audio.delta={base:1,zip:file(Buffer.from(zipSync({'1-1.mp3':Buffer.from('NE identity revision')})),'zip')};publish();await ota.syncContent('ja');assert.equal(downloads.at(-1),manifest.audio.delta.zip.url,'audio delta used');assert(!downloads.includes(manifest.audio.zip.url),'unchanged audio is reused');
manifest.version=5;manifest.languages.ja.overlay=file({...makeOverlay('ja'),grammarL1:{'1':[]}});publish();await assert.rejects(ota.syncContent('ja'));assert.equal((await ota.cachedContent('ja')).version,4,'mismatched translations cannot activate');
offline=true;await assert.rejects(ota.syncContent('ja'));assert.equal((await ota.cachedContent('ja')).version,4);offline=false;
manifest.version=0;publish();assert.equal((await ota.syncContent('ja')).version,4,'downgrade rejected');
// A damaged active manifest falls back to the previous complete snapshot.
const pointer=JSON.parse(kv.get('@nepali_app/content_ota/ja'));disk.set('file:///documents/content-ota/text/'+pointer.sha+'.json',Buffer.from('broken'));assert.equal((await ota.cachedContent('ja')).version,3);
assert.throws(()=>models.validateManifest({...manifest,schema:99},'ja'));
// Existing users reuse byte-verified legacy files without downloading the same audio.
disk.clear();kv.clear();downloads.length=0;manifest.version=6;manifest.audio=oldAudio;const ol=makeOverlay('ja');delete ol.grammarGuide;manifest.languages.ja.overlay=file(ol);
for(const[lang,vals]of Object.entries({_core:{'1-1-1.mp3':'NE greeting','1-1.mp3':'NE identity'},ja:{'1-1-1.mp3':'ja greeting','1-1.mp3':'ja identity'}}))for(const[n,v]of Object.entries(vals))disk.set(`file:///documents/packs/${lang}/audio/${n}`,Buffer.from(v));
publish();await ota.syncContent('ja');assert.equal(downloads.length,0,'legacy audio reused');
await ota.syncContent('en');assert.equal(downloads.length,1,'second language shares Nepali audio');
assert.equal(ota.bundledContent('ko').data.nativeLang,'ko');
await ota.syncContent('ko');assert.equal(downloads.length,2,'Korean shares the same Nepali recordings');
const korean=await ota.cachedContent('ko');assert.equal(korean.data.nativeLang,'ko');
for(const uri of Object.values(korean.data.audio.japaneseAudio))assert(disk.get(uri).toString().startsWith('ko '),'Korean mother-language audio');
offline=true;assert.equal((await ota.cachedContent('ko')).data.nativeLang,'ko');offline=false;
const beforeArabic=downloads.length;
assert.equal(ota.bundledContent('ar').data.nativeLang,'ar');
await ota.syncContent('ar');assert.equal(downloads.length,beforeArabic+1,'Arabic reuses the installed Nepali recordings');
const arabic=await ota.cachedContent('ar');assert.equal(arabic.data.nativeLang,'ar');
for(const uri of Object.values(arabic.data.audio.japaneseAudio))assert(disk.get(uri).toString().startsWith('ar '),'Arabic mother-language audio');
offline=true;assert.equal((await ota.cachedContent('ar')).data.nativeLang,'ar');offline=false;
// A transport migration keeps hashes and cache paths: no MP3 or text re-download.
const previousDownloads=downloads.length,previousRequests=requests.length;
function relocate(value){
  if(!value||typeof value!=='object')return;
  if(value.url){const original=value.url;value.url='https://content.safa-lang.com/nepali/'+original.split('/').at(-1);remote.set(value.url,remote.get(original));}
  for(const child of Object.values(value))relocate(child);
}
relocate(manifest);publish();await ota.syncContent('ar');
assert.equal(downloads.length,previousDownloads,'R2 URL migration reuses every verified recording');
assert.equal(requests.length,previousRequests+1,'R2 URL migration reuses existing content chunks');
assert(requestOptions.every(o=>o.cache==='no-store'),'manifest and content checks bypass stale HTTP caches');
// New app installation over an existing complete older cache, online and offline.
const upgraded=loadOta({...core,curriculumRevision:7});
const savedBeforeUpgrade=kv.get('@nepali_app/content_ota/ja');
const infoBeforeUpgrade=infoReads;
assert.equal(await upgraded.cachedContent('ja'),null,'old cache cannot hide bundled new lessons');
assert.equal(infoReads,infoBeforeUpgrade,'reject outdated cache before expensive audio file scans');
offline=true;assert.equal(upgraded.bundledContent('ja').version,7);await assert.rejects(upgraded.syncContent('ja'));offline=false;
assert.equal(kv.get('@nepali_app/content_ota/ja'),savedBeforeUpgrade,'rejecting old cache does not erase recordings or saved pointers');
assert.equal((await upgraded.syncContent('ja')).version,7,'older remote manifest cannot downgrade the new binary either');
manifest.version=8;publish();assert.equal((await upgraded.syncContent('ja')).version,8);assert.equal((await upgraded.cachedContent('ja')).version,8,'newer OTA still activates normally');
const currentPointer=JSON.parse(kv.get('@nepali_app/content_ota/ja'));disk.set('file:///documents/content-ota/text/'+currentPointer.sha+'.json',Buffer.from('broken'));
assert.equal(await upgraded.cachedContent('ja'),null,'damaged new OTA cannot fall back below bundled content');
console.log('PASS real OTA: existing recovery/integrity checks plus installed-app upgrade, stale cache/remote rejection, offline baseline, newer OTA activation and corrupt-cache fallback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
