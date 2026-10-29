// Exercises the shipped 2.1.3 reader and existing 2.1.4 reader, without changing either.
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const ts=require('typescript'),{unzipSync}=require('fflate');
const ROOT=path.resolve(__dirname,'../..'),APP=path.join(ROOT,'聞いて話せるネパール語');
const work=path.resolve(process.argv[2]||'.work-paired-update');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const payloadDir=path.join(work,'publish'),catalog=read(path.join(payloadDir,'catalog.json'));
const payload=url=>read(path.join(payloadDir,url.split('/').pop().split('?')[0]));
const sourceCore=payload(catalog.core.url),report=read(path.join(APP,'文法教材/教材音声セット更新_検証結果.json'));
const familiarThird=/(?<![\u0900-\u097f])(?:उनी(?:हरू)?(?:ले|लाई|को)?|उन(?:ले|लाई|को)|उस(?:ले|लाई|को)|ऊ|उ)(?![\u0900-\u097f])/u;
function* strings(value){
 if(typeof value==='string')yield value;
 else if(Array.isArray(value))for(const x of value)yield* strings(x);
 else if(value&&typeof value==='object')for(const x of Object.values(value))yield* strings(x);
}
for(const [theme,rows] of Object.entries(sourceCore.grammarNe))if(theme!=='7')assert(rows.every(ne=>!familiarThird.test(ne)),`Nonstandard third person in theme ${theme}`);
assert(sourceCore.grammarNe['7'].some(ne=>familiarThird.test(ne)),'Topic7 must retain familiar-pronoun comparisons');
for(const entry of catalog.packs){
 const overlay=payload(entry.url);
 for(const [theme,blocks] of Object.entries(overlay.grammarGuide))if(theme!=='7')for(const text of strings(blocks))assert(!familiarThird.test(text),`Familiar third person in guide ${entry.l1}/${theme}`);
 for(const [theme,rows] of Object.entries(sourceCore.grammarNe))for(const [i,ne] of rows.entries()){
  for(const word of new Set(ne.match(/[^\s।,?？！!：:;“”"'‘’()]+/gu)||[])){
   const v=overlay.grammarVocab[word];assert(v&&v.rom,`${entry.l1}: ${word}`);
   const contexts=v.contexts.filter(c=>c.sentence_id===`${theme}-${i+1}`);assert.equal(contexts.length,1);assert(contexts[0].ja);
  }
 }
}
console.log('PASS respectful third person throughout exercises/lessons; familiar forms in topic7; all contextual dictionary entries');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const blobs=new Map();
for(const entry of [catalog.core,...catalog.packs]){
 const name=entry.audioZip.split('/').pop(),raw=fs.readFileSync(path.join(payloadDir,name));
 blobs.set(name,raw.toString('base64'));
 const files=unzipSync(raw),lang=entry===catalog.core?'ne':entry.l1;
 for(const [id,digest] of Object.entries(report.languages[lang].positionalAudioSHA256))assert.equal(hash(files[id+'.mp3']),digest);
}
function compile(source,customRequire){
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{fetch:async()=>({ok:true,json:async()=>catalog}),setTimeout,clearTimeout,global,console,Buffer,Uint8Array})(customRequire,module,module.exports);
 return module.exports;
}
function codeFor(version,name){
 const relative=`聞いて話せるネパール語/expo-app/src/${name}.ts`;
 return version==='2.1.3'?cp.execFileSync('git',['show',`89c0982a:${relative}`],{cwd:ROOT,encoding:'utf8'}):fs.readFileSync(path.join(ROOT,relative),'utf8');
}
async function scenario(version,lang,cached){
 const disk=new Map(),downloads=[];
 const coreDir='file:///test/packs/_core/',l1Dir=`file:///test/packs/${lang}/`;
 const old=read(path.join(work,'v2/catalog.json'));
 if(cached){
  disk.set(coreDir+'core.json',fs.readFileSync(path.join(work,'v2/core.json'),'utf8'));
  disk.set(coreDir+'core.version',String(old.core.version));
  disk.set(l1Dir+'overlay.json',fs.readFileSync(path.join(work,`v2/overlay-${lang}.json`),'utf8'));
  disk.set(coreDir+'audio.version',String(old.core.audioVersion));
  disk.set(l1Dir+'audio.version',String(old.packs.find(x=>x.l1===lang).audioVersion));
  for(const id of Object.keys(report.languages.ne.positionalAudioSHA256)){
   disk.set(coreDir+`audio/${id}.mp3`,Buffer.from('wrong old positional sound').toString('base64'));
   disk.set(l1Dir+`audio/${id}.mp3`,Buffer.from('wrong old positional sound').toString('base64'));
  }
 }
 const FS={documentDirectory:'file:///test/',
  getInfoAsync:async u=>({exists:disk.has(u)}),
  readAsStringAsync:async u=>{assert(disk.has(u),u);return disk.get(u)},
  writeAsStringAsync:async(u,value)=>disk.set(u,value),makeDirectoryAsync:async()=>{},
  readDirectoryAsync:async dir=>[...disk.keys()].filter(u=>u.startsWith(dir)).map(u=>u.slice(dir.length)),
  deleteAsync:async u=>disk.delete(u),
  downloadAsync:async(url,uri)=>{disk.set(uri,JSON.stringify(payload(url)));downloads.push(url);return{status:200}},
  createDownloadResumable:(url,uri)=>({downloadAsync:async()=>{const name=url.split('/').pop();assert(blobs.has(name),name);disk.set(uri,blobs.get(name));downloads.push(url);return{status:200}}})};
 const compose=compile(codeFor(version,'pack/compose'),()=>{throw Error('Unexpected import')});
 const appData=compile(codeFor(version,'appData'),()=>{throw Error('Unexpected import')});
 const loader=compile(codeFor(version,'packLoader'),name=>{
  if(name==='expo-file-system/legacy')return FS;
  if(name==='fflate')return{unzipSync};
  if(name==='../app.json')return{expo:{version,android:{package:'test'}}};
  if(name==='./appData')return appData;
  if(name==='./pack/compose')return compose;
  throw Error(name);
 });
 const result=await loader.loadPack(lang),overlay=payload(catalog.packs.find(x=>x.l1===lang).url);
 assert.equal(result.GRAMMAR_THEMES.length,36);
 assert(!('grammarAudioRefs' in sourceCore));assert(!('grammarAudioRefs' in overlay));
 let count=0;
 for(const [key,nes] of Object.entries(sourceCore.grammarNe)){
  const rows=result.getGrammarExamples(Number(key));assert.equal(rows.length,nes.length);
  const guide=JSON.stringify(result.GRAMMAR_GUIDE[key]);assert(guide.length>500,key);
  for(let i=0;i<nes.length;i++){
   const id=`${key}-${i+1}`;count++;
   assert.equal(rows[i].ne,nes[i]);assert.equal(rows[i].jp,overlay.grammarL1[key][i]);assert(guide.includes(nes[i]),id);
   for(const [language,map,dir] of [['ne',result.audio.nepaliGrammarAudio,coreDir],[lang,result.audio.japaneseGrammarAudio,l1Dir]]){
    const uri=dir+`audio/${id}.mp3`;assert.equal(map[id],uri);
    assert.equal(hash(Buffer.from(disk.get(uri),'base64')),report.languages[language].positionalAudioSHA256[id],id);
   }
  }
 }
 assert.equal(count,528);assert(downloads.some(u=>u.endsWith('.zip')));
 assert.equal((await loader.getPackDownloadInfo(lang)).needsDownload,false);
 const offline=await loader.loadPack(lang,undefined,true,true);assert.deepEqual(offline.GRAMMAR_EXAMPLES,result.GRAMMAR_EXAMPLES);
 console.log(`PASS ${version} ${lang} ${cached?'old cache -> updated':'fresh'}: all528 text/lesson/translation/audio hashes + offline`);
}
(async()=>{
 for(const version of ['2.1.3','2.1.4'])for(const lang of ['ja','en'])for(const cached of [false,true])await scenario(version,lang,cached);
 for(const key of ['examplesNe','wordsNe','themes','levels','wordCategories'])assert.deepEqual(sourceCore[key],read(path.join(work,'v2/core.json'))[key],key);
 console.log('PASS conversation/vocabulary data unchanged; no shipped recording-reference map');
})().catch(e=>{console.error(e);process.exit(1)});
