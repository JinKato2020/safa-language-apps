// Text-only lessons must work in shipped readers without redownloading audio.
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict');
const ts=require('typescript');
const ROOT=path.resolve(__dirname,'../..'),work=path.resolve(process.argv[2]||'.work-beginner');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const catalog=read(path.join(work,'publish/catalog.json')),oldCatalog=read(path.join(work,'live/catalog.json'));
const payload=url=>read(path.join(work,'publish',url.split('/').pop()));
const oldPayload=url=>read(path.join(work,'live',url.split('/').pop()));
const core=payload(catalog.core.url),oldCore=oldPayload(oldCatalog.core.url);
const without=(object,keys)=>Object.fromEntries(Object.entries(object).filter(([k])=>!keys.includes(k)));
assert.deepEqual(without(core,['curriculumRevision']),without(oldCore,['curriculumRevision']));
for(const entry of [catalog.core,...catalog.packs]){
 const old=entry===catalog.core?oldCatalog.core:oldCatalog.packs.find(x=>x.l1===entry.l1);
 for(const key of ['audioZip','audioVersion','audioZipBytes'])assert.equal(entry[key],old[key]);
 if(entry.l1)assert.deepEqual(without(payload(entry.url),['grammarGuide','version','curriculumRevision']),without(oldPayload(old.url),['grammarGuide','version','curriculumRevision']));
}
const headings={ja:['何を伝えるための文法か','言葉の意味と文の型','文を作る順番','例文を分けて読む','否定・疑問と、似た言い方との違い','自分で確かめる：問題と理由付きの答え'],
 en:['What this grammar helps you say','Terms and sentence pattern','Build the sentence step by step','Read an example in parts','Negatives, questions and related patterns','Check your understanding: question and explained answer']};
const familiar=/(?<![\u0900-\u097f])(?:उनी(?:हरू)?(?:ले|लाई|को)?|उन(?:ले|लाई|को)|उस(?:ले|लाई|को)|ऊ|उ)(?![\u0900-\u097f])/u;
for(const lang of ['ja','en']){
 const overlay=payload(catalog.packs.find(x=>x.l1===lang).url);
 assert.equal(Object.keys(overlay.grammarGuide).length,36);
 for(const [key,blocks] of Object.entries(overlay.grammarGuide)){
  const boundary=blocks.findIndex(b=>b.beginnerIntroEnd);assert(boundary>10,key);
  const intro=JSON.stringify(blocks.slice(0,boundary));
  for(const h of headings[lang])assert(intro.includes(h),key+' '+h);
  assert(intro.includes(core.grammarNe[key][0]),'Worked exercise missing '+key);
  if(key!=='7')assert(!familiar.test(JSON.stringify(blocks)),key);
  for(const b of blocks){assert(['h','p','table','note','goal'].includes(b.type));if(b.type==='table')for(const row of b.rows)assert.equal(row.length,b.headers.length)}
  for(const sentence of core.grammarNe[key])assert(JSON.stringify(blocks).includes(sentence),'Practice missing '+key);
 }
 for(const key of ['1','2','3','4','36']){
  const text=JSON.stringify(overlay.grammarGuide[key]);
  for(const form of ['हुनु','हो / ho','छ / cha','हुन्छ / huncha','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'])assert(text.includes(form),key+' '+form);
  const first=({'1':'हुँ / hũ','2':'छु / chu','3':'छु / chu','4':'हुन्छु / hunchu','36':'हुँ / hũ'})[key];assert(text.includes(first));
 }
}
console.log('PASS all36 teaching sequences in ja/en, worked examples, question/answer, hunu map/paradigms and supported blocks; existing text/dictionary/audio unchanged');
const ids=[...Object.entries(core.examplesNe).flatMap(([key,rows])=>rows.map((_,i)=>`${key}-${i+1}`)),...Object.entries(core.grammarNe).flatMap(([key,rows])=>rows.map((_,i)=>`${key}-${i+1}`))];
function source(version,name){const p=`聞いて話せるネパール語/expo-app/src/${name}.ts`;return version==='2.1.3'?cp.execFileSync('git',['show',`89c0982a:${p}`],{cwd:ROOT,encoding:'utf8'}):fs.readFileSync(path.join(ROOT,p),'utf8')}
function compile(code,customRequire){
 const module={exports:{}};const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${js}\n})`,{fetch:async()=>({ok:true,json:async()=>catalog}),setTimeout,clearTimeout,global,console,Buffer,Uint8Array})(customRequire,module,module.exports);return module.exports;
}
async function scenario(version,lang,cached){
 const disk=new Map(),audio=new Set(),downloads=[];const cd='file:///test/packs/_core/',ld=`file:///test/packs/${lang}/`;
 const entry=catalog.packs.find(x=>x.l1===lang),oldEntry=oldCatalog.packs.find(x=>x.l1===lang);
 if(cached){
  disk.set(cd+'core.json',JSON.stringify(oldCore));disk.set(cd+'core.version',String(oldCatalog.core.version));
  disk.set(ld+'overlay.json',JSON.stringify(oldPayload(oldEntry.url)));disk.set(cd+'audio.version',String(oldCatalog.core.audioVersion));disk.set(ld+'audio.version',String(oldEntry.audioVersion));
  for(const id of ids){audio.add(cd+`audio/${id}.mp3`);audio.add(ld+`audio/${id}.mp3`)}
 }
 const FS={documentDirectory:'file:///test/',getInfoAsync:async u=>({exists:disk.has(u)||audio.has(u)}),
 readAsStringAsync:async u=>{assert(disk.has(u),u);return disk.get(u)},writeAsStringAsync:async(u,v)=>{disk.set(u,v);if(u.endsWith('.mp3'))audio.add(u)},makeDirectoryAsync:async()=>{},deleteAsync:async u=>disk.delete(u),
 readDirectoryAsync:async dir=>[...audio].filter(x=>x.startsWith(dir)).map(x=>x.slice(dir.length)),
 downloadAsync:async(url,uri)=>{disk.set(uri,JSON.stringify(payload(url)));downloads.push(url);return{status:200}},
 createDownloadResumable:(url,uri)=>({downloadAsync:async()=>{assert([entry.audioZip,catalog.core.audioZip].includes(url));downloads.push(url);disk.set(uri,Buffer.from('unchanged audio fixture').toString('base64'));return{status:200}}})};
 const compose=compile(source(version,'pack/compose'),()=>{throw Error('Unexpected import')}),appData=compile(source(version,'appData'),()=>{throw Error('Unexpected import')});
 const loader=compile(source(version,'packLoader'),name=>{
  if(name==='expo-file-system/legacy')return FS;
  if(name==='fflate')return{unzipSync:()=>Object.fromEntries(ids.map(id=>[id+'.mp3',new Uint8Array([1])]))};
  if(name==='../app.json')return{expo:{version,android:{package:'test'}}};if(name==='./appData')return appData;if(name==='./pack/compose')return compose;throw Error(name);
 });
 const info=await loader.getPackDownloadInfo(lang);assert(info.needsDownload);
 if(cached)assert.equal(info.bytes,entry.sizeBytes,'Existing audio must not be charged as a new download');
 const out=await loader.loadPack(lang);assert.deepEqual(JSON.parse(JSON.stringify(out.GRAMMAR_GUIDE)),payload(entry.url).grammarGuide);
 let count=0;for(const [key,rows] of Object.entries(core.grammarNe))for(const [i,ne] of rows.entries()){
  const id=`${key}-${i+1}`;count++;assert.equal(out.getGrammarExamples(Number(key))[i].ne,ne);assert.equal(out.audio.nepaliGrammarAudio[id],cd+`audio/${id}.mp3`);assert.equal(out.audio.japaneseGrammarAudio[id],ld+`audio/${id}.mp3`);
 }assert.equal(count,528);
 assert.equal(downloads.filter(x=>x.endsWith('.zip')).length,cached?0:2);
 assert.equal((await loader.getPackDownloadInfo(lang)).needsDownload,false);
 const offline=await loader.loadPack(lang,undefined,true,true);assert.deepEqual(offline.GRAMMAR_GUIDE,out.GRAMMAR_GUIDE);
 console.log(`PASS ${version} ${lang} ${cached?'existing cache: zero audio downloads':'fresh: unchanged audio assets'}; all36 guides,528 audio paths, offline reload`);
}
(async()=>{for(const v of ['2.1.3','2.1.4'])for(const l of ['ja','en'])for(const cached of [false,true])await scenario(v,l,cached)})().catch(e=>{console.error(e);process.exit(1)});
