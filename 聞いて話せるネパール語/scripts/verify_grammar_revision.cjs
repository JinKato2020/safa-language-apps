const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../..');
const ts=require('typescript');
const WORK=path.join(ROOT,'.work-grammar-redesign');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const release={};for(const f of ['core.json','overlay-ja.json','overlay-en.json','catalog.json'])release[f]=read(path.join(WORK,'release',f));
const legacyBank=read(path.join(ROOT,'聞いて話せるネパール語/文法教材/grammar_recording_texts_v2.json'));
const recordingLedger=path.join(ROOT,'聞いて話せるネパール語/文法教材/grammar_recordings_v3.json');
const bank={...legacyBank,...(fs.existsSync(recordingLedger)?read(recordingLedger).recordings:{})};
const expected=read(path.join(WORK,'report.json'));
const compile=(file,customRequire)=>{
 const source=fs.readFileSync(file,'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{fetch:async url=>({ok:true,json:async()=>release['catalog.json']}),setTimeout,clearTimeout,global,console,Buffer,Uint8Array})(customRequire,module,module.exports);
 return module.exports;
};
const base=path.join(ROOT,'聞いて話せるネパール語/expo-app');
const compose=compile(path.join(base,'src/pack/compose.ts'),()=>{throw Error('Unexpected runtime import')});
const appData=compile(path.join(base,'src/appData.ts'),()=>{throw Error('Unexpected runtime import')});
const sentenceTokens=ne=>ne.match(/[^\s।,?？！!：:;“”"'‘’()]+/gu)||[];

async function scenario(lang,cached,mismatch=false){
 const disk=new Map(),present=new Set();
 const oldCatalog=read(path.join(WORK,'live/catalog.json'));
 const oldVersion=oldCatalog.packs.find(x=>x.l1===lang).audioVersion;
 const coreDir='file:///test/packs/_core/',l1Dir=`file:///test/packs/${lang}/`;
 if(cached){disk.set(coreDir+'audio.version',String(oldCatalog.core.audioVersion));disk.set(l1Dir+'audio.version',String(oldVersion))}
 const audioIds=[...Object.keys(bank),...Object.entries(release['core.json'].examplesNe).flatMap(([k,rs])=>rs.map((_,i)=>`${k}-${i+1}`))];
 if(cached)for(const id of audioIds.filter(id=>!id.startsWith('900-'))){present.add(coreDir+`audio/${id}.mp3`);present.add(l1Dir+`audio/${id}.mp3`)}
 if(cached){disk.set(coreDir+'core.json',fs.readFileSync(path.join(WORK,'live/core.json'),'utf8'));disk.set(coreDir+'core.version',String(oldCatalog.core.version));disk.set(l1Dir+'overlay.json',fs.readFileSync(path.join(WORK,`live/overlay-${lang}.json`),'utf8'))}
 let downloads=[];
 const FS={documentDirectory:'file:///test/',EncodingType:{Base64:'base64'},getInfoAsync:async u=>({exists:disk.has(u)||present.has(u)}),readAsStringAsync:async u=>{assert(disk.has(u),u);return disk.get(u)},writeAsStringAsync:async(u,t)=>{disk.set(u,t);if(u.endsWith('.mp3'))present.add(u)},makeDirectoryAsync:async()=>{},readDirectoryAsync:async dir=>[...present].filter(x=>x.startsWith(dir)).map(x=>x.slice(dir.length)),downloadAsync:async(url,uri)=>{const name=url.split('/').pop();assert(name.endsWith('.json'));const payload=name.replace(/-\d+(?=\.json$)/,'');assert(release[payload],name);disk.set(uri,JSON.stringify(release[payload]));downloads.push(name);return{status:200}},deleteAsync:async u=>disk.delete(u),createDownloadResumable:(url,uri)=>({downloadAsync:async()=>{assert(url.endsWith('.zip'));downloads.push(url.split('/').pop());disk.set(uri,Buffer.from('verified archive fixture').toString('base64'));return{status:200}}})};
 const loader=compile(path.join(base,'src/packLoader.ts'),name=>{
  if(name==='expo-file-system/legacy')return FS;
  if(name==='fflate')return {unzipSync:()=>Object.fromEntries(audioIds.map(id=>[`${id}.mp3`,new Uint8Array([1])]))};
  if(name==='../app.json')return read(path.join(base,'app.json'));
  if(name==='./appData')return appData;
  if(name==='./pack/compose')return compose;
  throw Error(name);
 });
 if(mismatch){
  const original=release[`overlay-${lang}.json`].curriculumRevision;
  delete release[`overlay-${lang}.json`].curriculumRevision;
  try{await assert.rejects(()=>loader.loadPack(lang),/version|版/)}finally{release[`overlay-${lang}.json`].curriculumRevision=original}
  console.log('PASS incompatible text/language pack rejected:',lang);return;
 }
 const result=await loader.loadPack(lang);
 const core=release['core.json'],overlay=release[`overlay-${lang}.json`];
 assert.equal(result.GRAMMAR_THEMES.length,36);
 let count=0,voiced=0,textOnly=0;
 for(const t of result.GRAMMAR_THEMES){
  const key=String(t.id),rows=result.getGrammarExamples(t.id);assert.equal(rows.length,t.exampleCount);
  const guide=JSON.stringify(result.GRAMMAR_GUIDE[key]);assert(guide.length>500,key);
  for(const [i,r] of rows.entries()){
   const id=`${key}-${i+1}`,ref=core.grammarAudioRefs[id];count++;
   assert.equal(r.ne,core.grammarNe[key][i]);assert.equal(r.jp,overlay.grammarL1[key][i]);assert(guide.includes(r.ne),'Exercise missing from lesson '+id);
   for(const word of new Set(sentenceTokens(r.ne))){const item=result.GRAMMAR_VOCAB[word];assert(item,word);const ctx=item.contexts.filter(c=>c.sentence_id===id);assert.equal(ctx.length,1,`${id} ${word}`);assert(ctx[0].ja&&item.rom,word)}
   if(ref===null){textOnly++;assert.equal(result.audio.nepaliGrammarAudio[id],undefined);assert.equal(result.audio.japaneseGrammarAudio[id],undefined)}
   else{voiced++;assert.equal(bank[ref].ne,r.ne);assert.equal(bank[ref][lang],r.jp);assert.equal(result.audio.nepaliGrammarAudio[id],coreDir+`audio/${ref}.mp3`);assert.equal(result.audio.japaneseGrammarAudio[id],l1Dir+`audio/${ref}.mp3`)}
  }
 }
 assert.equal(count,expected.examples);assert.equal(voiced,expected.recordedExamples??expected.reusedRecordings);assert.equal(textOnly,expected.textOnly);
 assert(result.grammarTextOnlyLabel);
 const offline=await loader.loadPack(lang,undefined,true,true);assert.deepEqual(offline.GRAMMAR_EXAMPLES,result.GRAMMAR_EXAMPLES);
 assert(downloads.some(n=>/^core(?:-\d+)?\.json$/.test(n))&&downloads.some(n=>new RegExp(`^overlay-${lang}(?:-\\d+)?\\.json$`).test(n)));
 assert(downloads.some(n=>/^audio-core(?:-\d+)?\.zip$/.test(n))&&downloads.some(n=>new RegExp(`^audio-${lang}(?:-\\d+)?\\.zip$`).test(n)));
 console.log('PASS actual loadPack:',lang,cached?'old text/audio cache -> updated pack':'fresh text/audio download',count,'exercises;',voiced,'exact recording refs;',textOnly,'silent exercises');
}
(async()=>{
 for(const lang of ['ja','en'])for(const cached of [false,true])await scenario(lang,cached);
 for(const lang of ['ja','en'])await scenario(lang,false,true);
 const sources={'1-1':'original.mp3','1-2':'wrong-old-index.mp3'};
 const baseCore={...release['core.json'],nepaliAudio:{},nepaliGrammarAudio:sources,grammarAudioRefs:{'1-1':null,'1-2':'1-1','1-3':'missing'}};
 const out=compose.composePack(baseCore,{nativeLang:'ja',examplesL1:{},grammarL1:{},wordsL1:{},l1GrammarAudio:sources,grammarAudioRefs:baseCore.grammarAudioRefs},{version:'test'});
 assert.deepEqual({...out.audio.nepaliGrammarAudio},{'1-2':'original.mp3'});
 const legacy=compose.composePack({...baseCore,grammarAudioRefs:undefined},{nativeLang:'ja',examplesL1:{},grammarL1:{},wordsL1:{},l1GrammarAudio:sources},{version:'test'});assert.equal(legacy.audio.nepaliGrammarAudio,sources);
 console.log('PASS null/missing references never fall back to an old positional recording; legacy packs still work.');
 const listening=compile(path.join(ROOT,'packages/shared/src/ListeningAudioContext.tsx'),name=>name==='react'?{createContext:()=>({})}:{});
 const deps={GRAMMAR_THEMES:[{id:1},{id:2}],getGrammarExamples:t=>Array(t===1?3:2).fill({})};
 const recorded=id=>['1-1','2-2'].includes(id);
 assert.equal(listening.findNextRecordedGrammar(deps,1,0,false,recorded).themeId,2);
 assert.equal(listening.findNextRecordedGrammar(deps,1,0,false,recorded).index,1);
 assert.equal(listening.findNextRecordedGrammar(deps,2,1,false,recorded).ended,true);
 assert.equal(listening.findNextRecordedGrammar(deps,2,1,true,recorded).themeId,1);
 assert.equal(listening.findNextRecordedGrammar(deps,1,0,true,()=>false).ended,true);
 assert.equal(listening.findPrevRecordedGrammar(deps,2,1,recorded).themeId,1);
 assert.equal(listening.findPrevRecordedGrammar(deps,1,0,recorded),null);
 console.log('PASS listening skips text-only exercises both ways; looping with no recordings terminates.');
})().catch(e=>{console.error(e);process.exit(1)});
