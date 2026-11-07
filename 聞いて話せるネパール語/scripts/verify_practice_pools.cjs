// Real production sampling, persistence decoding and cloze assembly for every pool.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),cache={};
function load(name){if(cache[name])return cache[name].exports;const m={exports:{}};cache[name]=m;const s=fs.readFileSync(path.join(root,'packages/shared/src',name+'.ts'),'utf8');const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(n=>n.startsWith('.')?load(n.slice(2)):require(n),m,m.exports);return m.exports;}
const {createPracticeSession,seededRandom,practiceTaskKey}=load('practicePool'),{emptyStudyState,decodeStudy,studyKey}=load('learning'),{guidedSentence}=load('guidedPractice');
const paths=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../文法教材/grammar_practice.json'),'utf8'));
for(const lang of ['ja','en']){
 const p=paths[lang],data={LEARNING_PATH:p};assert.equal(p.steps.length,36);assert.equal(Object.keys(p.exercises).length,720);
 for(const step of p.steps){
  assert.equal(step.items.length,20);let state=emptyStudyState(),prior={},round={};
  for(let run=0;run<40;run++){
   const next=createPracticeSession(state,p,step.guideThemeId,seededRandom(101+run));state=decodeStudy(JSON.stringify(next.state));
   assert.deepEqual(state.resume.session,next.session);assert.equal(next.session.items.length,15);
   assert.equal(new Set(next.session.items.map((r,i)=>practiceTaskKey(next.session,r,i))).size,15);
   for(const stage of [2,3,4]){
    const selected=next.session.items.filter((_,i)=>next.session.questionStages[i]===stage).map(studyKey);assert.equal(selected.length,5);assert.equal(new Set(selected).size,5);
    assert(!selected.some(id=>(prior[stage]??[]).includes(id)),'No immediate repeat, including cycle boundary');
    if(run%4===0)round[stage]=[];round[stage].push(...selected);if(run%4===3)assert.equal(new Set(round[stage]).size,20,'Every pool is exhausted once in four sessions');prior[stage]=selected;
   }
  }
  for(const ref of step.items){
   const e=p.exercises[ref.exerciseId],q=guidedSentence(data,ref,123),target=q.conjugation.target;
   assert.equal(q.parts.join(''),e.ne);assert.equal(q.parts[target.index],(q.conjugation.prefix??'')+target.text);
   assert.equal(q.conjugation.choices.filter(c=>c.form===target.text).length,1);assert.equal(new Set(q.meaningChoices).size,3);assert(q.meaningChoices.includes(e.jp));
   assert(e.words.every(w=>w.roman&&w.meaning));assert(e.selection.options.every(o=>o.roman));
   assert.equal(e.words.map(w=>w.text).join(' '),e.ne.replace(/[।?]$/,''));
  }
 }
 console.log('PASS '+lang+': all 720 clozes/translations/order models; 36 pools × 40 sessions; no repeats before exhaustion; resume round-trip.');
}
for(const [id,ja]of Object.entries(paths.ja.exercises)){const en=paths.en.exercises[id];assert.equal(ja.ne,en.ne);assert.equal(ja.selection.answer,en.selection.answer);}
console.log('PASS aligned JA/EN IDs and answers.');
