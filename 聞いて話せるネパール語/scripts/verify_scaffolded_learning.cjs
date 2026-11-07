const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
function compile(p,req=require){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.join(root,p),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext('(function(require,module,exports){'+js+'})',{Date,Promise,Uint8Array,atob})(req,m,m.exports);return m.exports;}
const policy=compile('packages/shared/src/learning.ts'),guided=compile('packages/shared/src/guidedPractice.ts'),compose=compile('聞いて話せるネパール語/expo-app/src/pack/compose.ts').composePack;
const core=read('聞いて話せるネパール語/expo-app/data/ota-baseline/core.json'),oldBank=new Set([...Object.values(core.grammarNe),...Object.values(core.examplesNe)].flat());
const audio=read('聞いて話せるネパール語/文法教材/learning_audio_manifest.json');
for(const lang of ['ja','en']){
 const o=read(`聞いて話せるネパール語/expo-app/data/overlays/${lang}.json`),data=compose({...core,nepaliAudio:{},nepaliGrammarAudio:{}},{...o,nativeLang:lang},{version:'test'});
 assert.equal(data.LEARNING_PATH.steps.flatMap(s=>s.items).length,21);
 // Older installed clients still receive their original valid 35-item path.
 assert.equal(o.learningPath.steps.flatMap(s=>s.items).length,35);
 for(const s of o.learningPath.steps)for(const r of s.items)assert(policy.resolveStudy({...data,LEARNING_PATH:o.learningPath},r));
 for(const step of data.LEARNING_PATH.steps)for(const ref of step.items){
  const ex=policy.resolveStudy(data,ref),d=guided.guidedSentence(data,ref);assert(ex);assert(!oldBank.has(ex.ne));
  assert.equal(d.parts.join(''),ex.ne);assert(d.words.every(w=>w.meaning&&w.roman&&w.index>=0));
  assert.equal(d.words.map(w=>w.text).join(' '),ex.ne.replace(/[।॥?!,;:]/g,'').trim());
  assert.equal(d.meaningChoices.length,3);assert.equal(d.meaningChoices.filter(x=>x===ex.jp).length,1);
  if(d.conjugation){assert.equal(new Set(d.conjugation.forms.map(f=>f.form)).size,3);assert(d.conjugation.forms.some(f=>f.form===d.target.text));}
  const state=policy.rateStudy(policy.emptyStudyState(),ref,'supported',1000),rating=state.ratings[policy.studyKey(ref)];
  assert.equal(rating.streak,0);assert.equal(rating.due,86401000);assert.equal(policy.decodeStudy(JSON.stringify(state)).ratings[policy.studyKey(ref)].result,'supported');
  assert.equal(policy.reviewItems(state,data,1001).length,0);assert.equal(policy.reviewItems(state,data,86401000).length,1);
  assert.equal(policy.resolveStudy(data,{...ref,ne:'changed'}),undefined);
 }
 for(const [theme,blocks] of Object.entries(o.grammarGuide)){
  assert(!blocks.some(b=>b.type==='h'&&/^(例題\d+|Exercise\s+\d+|復習する教材|Review topics|自分で組み立てる練習|Build your own sentence)$/.test(b.text)));
  if(Number(theme)<=16||Number(theme)>=35)assert(blocks.some(b=>b.type==='table'),'keep the existing form/reference tables');
 }
 for(const sample of data.LEARNING_PATH.intro.flatMap(b=>b.samples))assert.deepEqual(sample.audio,audio[sample.ne]);
}
for(const [ne,a]of Object.entries(audio)){
 const bytes=fs.readFileSync(path.join(root,'聞いて話せるネパール語/expo-app/assets/learning-audio',`learning-${a.sha256}.mp3`));assert.equal(bytes.length,a.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);
}
// Run the actual per-clip cache against I/O failures and corrupted bytes.
const sample=Object.values(audio)[0],real=fs.readFileSync(path.join(root,'聞いて話せるネパール語/expo-app/assets/learning-audio',`learning-${sample.sha256}.mp3`));
let disk=new Map(),bad=false,downloads=0;
const io={documentDirectory:'doc/',EncodingType:{Base64:'base64'},getInfoAsync:async p=>disk.has(p)?{exists:true,size:disk.get(p).length}:{exists:false},readAsStringAsync:async p=>disk.get(p).toString('base64'),makeDirectoryAsync:async()=>{},downloadAsync:async(u,p)=>{downloads++;disk.set(p,bad?Buffer.alloc(real.length):real);return{status:200}},moveAsync:async({from,to})=>{disk.set(to,disk.get(from));disk.delete(from)},deleteAsync:async p=>{disk.delete(p)}};
const loader=compile('聞いて話せるネパール語/expo-app/src/learningAudioCache.ts',n=>n==='expo-file-system/legacy'?io:n==='./introAudio'?{INTRO_AUDIO:{}}:n==='./content/otaModel'?{contentHash:b=>crypto.createHash('sha256').update(b).digest('hex')}:require(n));
(async()=>{
 const result=await Promise.all([loader.resolveLearningAudio(sample),loader.resolveLearningAudio(sample)]);assert(result.every(Boolean));assert.equal(downloads,1);
 await loader.resolveLearningAudio(sample);assert.equal(downloads,1,'valid disk clip reused');
 disk.set(result[0].uri,Buffer.alloc(real.length));bad=true;assert.equal(await loader.resolveLearningAudio(sample),null,'reject corrupted disk and downloaded clips');assert(![...disk.keys()].some(p=>p.endsWith('.part')));
 bad=false;assert(await loader.resolveLearningAudio(sample));
 console.log('PASS JA/EN21 independent practice sentences,31 audio hashes, literal word coverage, conjugation/meaning banks, supported review schedules, legacy35 compatibility, guide separation and audio cache failure/retry/deduplication.');
})().catch(e=>{console.error(e);process.exitCode=1;});
