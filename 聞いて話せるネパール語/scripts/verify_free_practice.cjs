// Exercise the production queue and puzzle builder against every published question.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),cache={};
function load(name){if(cache[name])return cache[name].exports;const m={exports:{}};cache[name]=m;const s=fs.readFileSync(path.join(root,'packages/shared/src',name+'.ts'),'utf8');const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(n=>n.startsWith('.')?load(n.slice(2)):require(n),m,m.exports);return m.exports;}
const {createFreePracticeSession,createPracticeSession,seededRandom}=load('practicePool');
const {emptyStudyState,decodeStudy,studyKey,createStudyStore,rateStudy}=load('learning');
const {freePracticeQuestion,matchesPuzzle}=load('freePractice');
const paths=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../文法教材/grammar_practice.json'),'utf8'));
for(const lang of ['ja','en']){
 const p=paths[lang],data={LEARNING_PATH:p};
 for(const step of p.steps){
  for(const stage of [2,3,4]){
   let state=emptyStudyState(),seen=[],previous;
   for(let n=0;n<61;n++){
    const launch=createFreePracticeSession(state,p,step.guideThemeId,stage,n,seededRandom(123+n));state=decodeStudy(JSON.stringify(launch.state));
    assert.deepEqual(state.resume.session,launch.session);assert.equal(launch.session.items.length,1);
    assert.equal(launch.session.freePractice.answered,n);assert.equal(launch.session.freePractice.stage,stage);
    const key=studyKey(launch.session.items[0]);assert.notEqual(key,previous,'No immediate repeat across cycle boundaries');previous=key;
    if(n%20===0)seen=[];seen.push(key);assert.equal(new Set(seen).size,seen.length,'No repeat before exhaustion');
    assert(Object.keys(state.practicePools).every(k=>k===`${step.guideThemeId}:${stage}`),'Other modes must not be consumed');
   }
  }
  const old=createPracticeSession(emptyStudyState(),p,step.guideThemeId,seededRandom(77));
  const changed=createFreePracticeSession(old.state,p,step.guideThemeId,4,0,seededRandom(78));
  for(const stage of [2,3])assert.deepEqual(changed.state.practicePools[`${step.guideThemeId}:${stage}`],old.state.practicePools[`${step.guideThemeId}:${stage}`]);
  assert.equal(studyKey(changed.session.items[0]),old.state.practicePools[`${step.guideThemeId}:4`].remaining[0]);
  for(const ref of step.items){
   const e=p.exercises[ref.exerciseId],q=freePracticeQuestion(data,ref,56),again=freePracticeQuestion(data,ref,56);
   assert.deepEqual(q,again,'Stable on rerender/restart');
   assert.equal(q.puzzleTokens.length,e.words.length+2);
   assert.equal(new Set(q.puzzleTokens.map(t=>t.id)).size,q.puzzleTokens.length);
   for(const token of q.puzzleTokens.filter(t=>t.id.startsWith('extra-'))){
    assert(!e.words.some(w=>w.text.normalize('NFC')===token.text.normalize('NFC')));
    assert(token.roman.length>0,'All distractors have a reading');assert(!('meaning' in token),'Do not leak correct tokens or invent a gloss');
    const option=e.selection.options[Number(token.id.slice(6))];assert.equal(token.text,(e.selection.prefix??'')+option.form);
    if(e.selection.prefix){const correct=e.selection.options.find(o=>o.form===e.selection.answer);const full=e.words[e.selection.wordIndex].roman.normalize('NFC'),suffix=correct.roman.normalize('NFC');assert(full.endsWith(suffix));assert.equal(token.roman,full.slice(0,-suffix.length)+option.roman);}
   }
   const ids=e.words.map((_,i)=>'word-'+i);assert(matchesPuzzle(q.puzzleTokens,ids,q.answerWords));
   assert(!matchesPuzzle(q.puzzleTokens,[q.puzzleTokens.find(t=>t.id.startsWith('extra-')).id,...ids.slice(1)],q.answerWords));
   assert(!matchesPuzzle(q.puzzleTokens,ids.slice(1),q.answerWords));
   assert(!matchesPuzzle(q.puzzleTokens,[...ids,ids[0]],q.answerWords));
  }
 }
 console.log(`PASS ${lang}: 36 themes × 3 freely selectable modes × 61 draws; bounded restartable session; 720 puzzles each with two valid wrong forms and romanizations.`);
}
const base=createFreePracticeSession(emptyStudyState(),paths.ja,1,2,3,seededRandom(8));
for(const mutate of [s=>s.freePractice.stage=1,s=>s.freePractice.answered=-1,s=>s.freePractice.answered=.5,s=>s.questionStages=[3],s=>s.items.push(s.items[0]),s=>s.answered=['bad']]){const bad=structuredClone(base.state);mutate(bad.resume.session);assert.equal(decodeStudy(JSON.stringify(bad)).resume,undefined);}
const repeat=[{id:'a',text:'पनि'},{id:'b',text:'पनि'}];assert(matchesPuzzle(repeat,['a','b'],['पनि','पनि']));assert(!matchesPuzzle(repeat,['a','a'],['पनि','पनि']));
(async()=>{
 let raw=JSON.stringify(base.state),published,fail=false;
 const store=createStudyStore({getItem:async()=>raw,setItem:async(_,value)=>{if(fail)throw Error('disk full');raw=value;}},'test',s=>published=s);
 await store.load();const before=raw;
 const advance=s=>createFreePracticeSession(rateStudy(s,s.resume.item,'supported',Date.now()),paths.ja,1,2,s.resume.session.freePractice.answered+1,seededRandom(9)).state;
 fail=true;await assert.rejects(store.change(advance));assert.equal(raw,before);assert.equal(published.resume.session.freePractice.answered,3);
 fail=false;await store.change(advance);assert.equal(published.resume.session.freePractice.answered,4);assert.equal(Object.keys(published.ratings).length,1);assert.deepEqual(published.completed,{});
 console.log('PASS invalid resume rejection, duplicate-word IDs, atomic save failure/retry, supported practice without false completion.');
})().catch(e=>{console.error(e);process.exitCode=1;});
