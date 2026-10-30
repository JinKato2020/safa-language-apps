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
 if(entry.l1){
  assert.deepEqual(without(payload(entry.url),['grammarGuide','grammarThemeNames','version','curriculumRevision']),without(oldPayload(old.url),['grammarGuide','grammarThemeNames','version','curriculumRevision']));
  const strip=s=>s.replace(/^(?:テーマ|Theme)\s*\d+\s*(?:[（(](?:付録|Appendix )?[AB][）)])?\s*[｜|:：—–-]\s*/,'');
  for(const [k,name] of Object.entries(payload(entry.url).grammarThemeNames))assert.equal(strip(name),strip(oldPayload(old.url).grammarThemeNames[k]),'Only theme number/appendix label added to the title');
 }
}
const headings={ja:['文の型と使い分け','① 例文でつかもう','② ネパール語のルール'],
 en:['Pattern and choice','① Start with one example','② Nepali grammar rules']};
const familiar=/(?<![\u0900-\u097f])(?:उनी(?:हरू)?(?:ले|लाई|को)?|उन(?:ले|लाई|को)|उस(?:ले|लाई|को)|ऊ|उ)(?![\u0900-\u097f])/u;
for(const lang of ['ja','en']){
 const overlay=payload(catalog.packs.find(x=>x.l1===lang).url);
 assert.equal(Object.keys(overlay.grammarGuide).length,36);
 for(const [key,blocks] of Object.entries(overlay.grammarGuide)){
  const boundary=blocks.findIndex(b=>b.beginnerIntroEnd);assert(boundary>=14,key);
  const intro=JSON.stringify(blocks.slice(0,boundary));
  assert.equal(blocks[0].type,'goal','Body starts with the takeaway');
  assert(!blocks.some(b=>b.lessonTitle||b.text===overlay.grammarThemeNames[key]),'No duplicated theme title in the body');
  assert(overlay.grammarThemeNames[key].startsWith((lang==='ja'?'テーマ':'Theme ')+key),'Theme number in route title');
  assert.equal(blocks.filter(b=>b.type==='note').length,0,'No yellow warning cards');
  assert(!JSON.stringify(blocks).includes('⚠'),'No warning symbols');
  assert.equal(blocks.slice(0,boundary).filter(b=>b.type==='goal').length,1,'One clear takeaway card');
  for(const b of blocks)for(const text of b.type==='table'?[...b.headers,...b.rows.flat()]:[b.text||''])assert.equal((text.match(/\*\*/g)||[]).length%2,0,'Balanced emphasis');
  for(const h of headings[lang])assert(intro.includes(h),key+' '+h);
  assert(blocks.slice(0,boundary).filter(b=>b.type==='h'&&/^\d+\. /.test(b.text)).length>=4,'At least five substantive rules including the takeaway');
  for(const b of blocks.slice(0,boundary))if(b.type==='p'&&!['reading','translation'].includes(b.presentation?.role))assert(/[\u0900-\u097f]/u.test(b.text),'Every rule explains Nepali forms');
  assert(intro.includes(core.grammarNe[key][0]),'Worked exercise missing '+key);
  if(key!=='7')assert(!familiar.test(JSON.stringify(blocks)),key);
  for(const b of blocks){assert(['h','p','table','note','goal'].includes(b.type));if(b.type==='table')for(const row of b.rows)assert.equal(row.length,b.headers.length)}
  const oldBlocks=oldPayload(oldCatalog.packs.find(x=>x.l1===lang).url).grammarGuide[key];
  const oldBoundary=oldBlocks.findIndex(b=>b.beginnerIntroEnd);
  const exercises=bs=>bs.filter(b=>b.type==='h'&&/^(例題\d|Exercise\s*\d)/.test(b.text)).map(b=>b.text);
  assert.deepEqual(exercises(blocks),exercises(oldBlocks.slice(oldBoundary+1)),'Every existing exercise retained in order');
  for(const b of oldBlocks.slice(oldBoundary+1).filter(b=>b.type==='table'&&['語・形','Word or form'].includes(b.headers[0])))assert(blocks.some(n=>JSON.stringify(n)===JSON.stringify(b)),'Existing exercise word table preserved');
  for(const b of blocks.filter(b=>b.type==='table'&&['人称','Person'].includes(b.headers[0]))){
   const ne=b.rows.flat().filter(c=>typeof c==='string'&&c.includes('।'));
   const model=ne.find(c=>c.includes('तपाईं'));
   if(model)for(const row of ne.filter(c=>c.includes('उहाँ')))assert.equal(row.split('।')[0].split(' ').pop(),model.split('।')[0].split(' ').pop(),'Respectful table forms must agree');
  }
  for(const [index,sentence] of core.grammarNe[key].entries()){
   assert(JSON.stringify(blocks).replaceAll('**','').includes(sentence),'Practice missing '+key);
   assert(JSON.stringify(blocks).replaceAll('**','').includes(overlay.grammarL1[key][index]),'Practice translation missing '+lang+' '+key+' '+index);
  }
 }
 for(const key of ['1','2','3','4','36']){
  const text=JSON.stringify(overlay.grammarGuide[key]).replaceAll('**','');
  for(const form of ['हुनु','हो / ho','छ / cha','हुन्छ / huncha','हुनुहुन्छ / hunuhuncha','हुनुहुन्न / hunuhunna'])assert(text.includes(form),key+' '+form);
  const first=({'1':'हुँ / hũ','2':'छु / chu','3':'छु / chu','4':'हुन्छु / hunchu','36':'हुँ / hũ'})[key];assert(text.includes(first));
 }
}
for(const lang of ['ja','en']){
 const bs=payload(catalog.packs.find(x=>x.l1===lang).url).grammarGuide['5'];
 const end=bs.findIndex(b=>b.beginnerIntroEnd),intro=bs.slice(0,end);
 assert(intro.some(b=>b.type==='table'&&b.rows.some(r=>r.some(c=>c.includes('बसबाट')))),'देखि/बाट transport/source comparison table');
 for(const form of ['बिहानदेखि','घरबाट','घरदेखि','बसदेखि'])assert(JSON.stringify(intro).includes(form));
}
console.log('PASS all36 Nepali-rule lessons in ja/en, >=5 substantive rules each, worked examples and translations, hunu map/paradigms; existing text/dictionary/audio unchanged');
const ids=[...Object.entries(core.examplesNe).flatMap(([key,rows])=>rows.map((_,i)=>`${key}-${i+1}`)),...Object.entries(core.grammarNe).flatMap(([key,rows])=>rows.map((_,i)=>`${key}-${i+1}`))];
function source(version,name){const p=`聞いて話せるネパール語/expo-app/src/${name}.ts`;return ['2.1.3','2.1.4'].includes(version)?cp.execFileSync('git',['show',`${version==='2.1.3'?'89c0982a':'62f7b756'}:${p}`],{cwd:ROOT,encoding:'utf8'}):fs.readFileSync(path.join(ROOT,p),'utf8')}
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
 for(const theme of out.GRAMMAR_THEMES)assert.equal(theme.name,payload(entry.url).grammarThemeNames[String(theme.id)],'Numbered title reaches actual app navigation data');
 let count=0;for(const [key,rows] of Object.entries(core.grammarNe))for(const [i,ne] of rows.entries()){
  const id=`${key}-${i+1}`;count++;assert.equal(out.getGrammarExamples(Number(key))[i].ne,ne);assert.equal(out.audio.nepaliGrammarAudio[id],cd+`audio/${id}.mp3`);assert.equal(out.audio.japaneseGrammarAudio[id],ld+`audio/${id}.mp3`);
 }assert.equal(count,528);
 assert.equal(downloads.filter(x=>x.endsWith('.zip')).length,cached?0:2);
 assert.equal((await loader.getPackDownloadInfo(lang)).needsDownload,false);
 const offline=await loader.loadPack(lang,undefined,true,true);assert.deepEqual(offline.GRAMMAR_GUIDE,out.GRAMMAR_GUIDE);
 console.log(`PASS ${version} ${lang} ${cached?'existing cache: zero audio downloads':'fresh: unchanged audio assets'}; all36 guides,528 audio paths, offline reload`);
}
(async()=>{for(const v of ['2.1.3','2.1.4','2.1.5'])for(const l of ['ja','en'])for(const cached of [false,true])await scenario(v,l,cached)})().catch(e=>{console.error(e);process.exit(1)});
