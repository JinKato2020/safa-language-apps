// Exercise the production queue and puzzle builder against every published question.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),cache={};
function load(name){if(cache[name])return cache[name].exports;const m={exports:{}};cache[name]=m;const s=fs.readFileSync(path.join(root,'packages/shared/src',name+'.ts'),'utf8');const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(n=>n.startsWith('.')?load(n.slice(2)):require(n),m,m.exports);return m.exports;}
const {createFreePracticeSession,createPracticeSession,seededRandom}=load('practicePool');
const {emptyStudyState,decodeStudy,studyKey,createStudyStore,rateStudy}=load('learning');
const {freePracticeQuestion,matchesPuzzle}=load('freePractice');
const {puzzleInsertion,insertPuzzleToken}=load('puzzleDrag');
const area={x:10,y:20,width:280,height:200},rect=(x,y,width=60)=>({x,y,width,height:44}),rows=[rect(20,50),rect(90,50),rect(20,110),rect(90,110)];
for(const [point,expected] of [[{x:0,y:20},null],[{x:30,y:35},0],[{x:30,y:70},0],[{x:70,y:70},1],[{x:250,y:70},2],[{x:30,y:130},2],[{x:135,y:130},4],[{x:250,y:190},4]])assert.equal(puzzleInsertion(point,area,rows),expected,'Wrapped-row insertion');
assert.equal(puzzleInsertion({x:30,y:70},area,[]),0);
assert.deepEqual(insertPuzzleToken(['a','b'],'c',1,3),['a','c','b']);assert.deepEqual(insertPuzzleToken(['a','b','c'],'c',0,3),['c','a','b']);assert.deepEqual(insertPuzzleToken(['a','b','c'],'a',2,3),['b','c','a']);assert.deepEqual(insertPuzzleToken(['a','b','c'],'d',1,3),['a','b','c']);assert.deepEqual(insertPuzzleToken(['word-0','word-1'],'word-0',1,2),['word-1','word-0']);
assert.equal(decodeStudy(JSON.stringify({...emptyStudyState(),puzzleIntroSeen:true})).puzzleIntroSeen,true);assert.equal(decodeStudy(JSON.stringify({...emptyStudyState(),puzzleIntroSeen:'true'})).puzzleIntroSeen,undefined);
console.log('PASS measured drag geometry: wrapped rows, outside cancellation, empty answer, insertion, reorder, capacity, distinct duplicate-word IDs; one-time intro persistence.');
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
// Conversation puzzles share the same bounded session and drag board, but use
// separate pools for each theme/level so they never consume grammar questions.
const {conversationPuzzleItems,createConversationPuzzleSession,puzzleSentenceWords}=load('practicePool');
const {vocabularyAliases}=load('vocabularyQuiz');
const core=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../expo-app/data/ota-baseline/core.json'),'utf8'));
for(const lang of ['ja','en']){
 const overlay=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../expo-app/data/overlays/${lang}.json`),'utf8'));
 const examples=Object.fromEntries(Object.entries(core.examplesNe).map(([key,rows])=>[key,rows.map((ne,i)=>({ne,jp:overlay.examplesL1[key][i]}))]));
 const data={VOCAB:overlay.vocab,CONV_VOCAB:overlay.convVocab,WORDS:Object.fromEntries(Object.entries(core.wordsNe).map(([key,rows])=>[key,rows.map((ne,i)=>({ne,ja:overlay.wordsL1[key][i]}))])),getExamples:(theme,level)=>examples[`${theme}-${level}`]??[]};
 let total=0;
 for(let theme=1;theme<=30;theme++)for(let level=1;level<=3;level++){
  const refs=conversationPuzzleItems(data,theme,level);assert(refs.length>=16&&refs.length<=20);total+=refs.length;
  let state=createFreePracticeSession(emptyStudyState(),paths[lang],1,4,0,seededRandom(7)).state;
  const grammarPool=structuredClone(state.practicePools['1:4']);let seen=[],previous;
  for(let n=0;n<refs.length*3+1;n++){
   const launch=createConversationPuzzleSession(state,data,theme,level,n,seededRandom(123+n));state=decodeStudy(JSON.stringify(launch.state));
   assert.deepEqual(state.resume.session,launch.session);assert.equal(state.resume.item.mode,'conversation');assert.equal(state.resume.item.levelId,level);
   assert.equal(launch.session.freePractice.puzzleOnly,true);assert.equal(launch.session.freePractice.answered,n);
   assert.deepEqual(state.practicePools['1:4'],grammarPool,'Grammar pool untouched');
   assert(state.practicePools[`conversation:${theme}:${level}:4`],'Conversation pool survives decode');
   const key=studyKey(launch.session.items[0]);assert.notEqual(key,previous);previous=key;
   if(n%refs.length===0)seen=[];seen.push(key);assert.equal(new Set(seen).size,seen.length,'No repeats before exhaustion');
  }
  for(const ref of refs){
   const q=freePracticeQuestion(data,ref,56);assert.deepEqual(q,freePracticeQuestion(data,ref,56));
   assert(q.answerWords.length>=2);assert.deepEqual(q.answerWords,puzzleSentenceWords(ref.ne));
   assert.equal(q.puzzleTokens.length,q.answerWords.length+2);assert.equal(new Set(q.puzzleTokens.map(t=>t.id)).size,q.puzzleTokens.length);
   const ids=q.answerWords.map((_,i)=>'word-'+i);assert(matchesPuzzle(q.puzzleTokens,ids,q.answerWords));
   const aliases=new Set(q.words.flatMap(w=>vocabularyAliases(w.meaning)));
   for(const token of q.puzzleTokens){assert(token.roman,'Every tile has a reading');if(token.id.startsWith('extra-')){assert(!q.answerWords.includes(token.text));assert(!matchesPuzzle(q.puzzleTokens,[token.id,...ids.slice(1)],q.answerWords));const meaning=data.CONV_VOCAB[token.text]?.base_meaning??data.VOCAB[token.text]?.ja??'';assert(!vocabularyAliases(meaning).some(x=>aliases.has(x)),'Known equivalent meanings excluded');}}
  }
 }
 assert.equal(total,1795);assert.throws(()=>createConversationPuzzleSession(emptyStudyState(),{getExamples:()=>[]},1,1));
 const one=createConversationPuzzleSession(emptyStudyState(),data,1,1,0,seededRandom(1)),two=createConversationPuzzleSession(one.state,data,1,2,0,seededRandom(2));
 assert.deepEqual(two.state.practicePools['conversation:1:1:4'],one.state.practicePools['conversation:1:1:4'],'Levels keep independent decks');
 console.log(`PASS ${lang}: 1795 conversation puzzles, 30 themes × 3 levels, two real distractors, translations/readings, three complete shuffled cycles, isolated pools and saved resume.`);
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
