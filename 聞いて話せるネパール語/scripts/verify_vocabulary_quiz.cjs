// Exercise actual vocabulary decks, ambiguity filtering and the quiz state transitions.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'packages/shared/src/vocabularyQuiz.ts');
const compiled=ts.transpileModule(fs.readFileSync(modulePath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={exports:{}};new Function('require','module','exports',compiled)(require,loaded,loaded.exports);
const {prepareVocabularyDecks,startVocabularyQuiz,answerVocabularyQuiz,nextVocabularyQuiz}=loaded.exports;
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const app=path.join(root,'聞いて話せるネパール語/expo-app');
const core=JSON.parse(fs.readFileSync(path.join(app,'data/ota-baseline/core.json'),'utf8'));
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
for(const lang of ['ja','en']){
  const overlay=JSON.parse(fs.readFileSync(path.join(app,`data/overlays/${lang}.json`),'utf8'));
  const words=Object.fromEntries(Object.entries(core.wordsNe).map(([key,rows])=>[key,rows.map((ne,i)=>({ne,ja:overlay.wordsL1[key][i]}))]));
  const all=Object.values(words).flat();let total=0;
  for(const category of core.wordCategories){
    const decks=prepareVocabularyDecks(words,category.id),local=words[category.id];
    for(const direction of ['ne2ja','ja2ne']){
      const deck=decks[direction],random=rng(123+category.id);
      assert.equal(deck.questions.length,new Set(local.map(w=>JSON.stringify([norm(w.ne),norm(w.ja)]))).size,'Every distinct word pair is available');
      const prompt=w=>direction==='ne2ja'?w.ne:w.ja,answer=w=>direction==='ne2ja'?w.ja:w.ne;
      let session=startVocabularyQuiz(deck,random),seen=new Set(),last;
      for(let n=0;n<deck.questions.length*3;n++){
        const q=session.question;
        assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>norm(c.text))).size,4);
        assert.equal(q.prompt,prompt(q.word));assert.equal(q.answer,answer(q.word));
        assert.equal(q.choices.filter(c=>c.id===q.id).length,1);assert(q.choices.some(c=>c.id===q.id&&c.text===q.answer));
        assert.notEqual(q.id,last,'No immediate repeated question across a cycle');last=q.id;
        if(n%deck.questions.length===0)seen=new Set();assert(!seen.has(q.id),'No repetition before the whole theme is used');seen.add(q.id);
        const valid=new Set(all.filter(w=>norm(prompt(w))===norm(q.prompt)).map(w=>norm(answer(w))));
        assert.equal(q.choices.filter(c=>valid.has(norm(c.text))).length,1,'Alternate translations are not marked wrong');
        for(const choice of q.choices)assert(local.some(w=>norm(answer(w))===norm(choice.text)),'Real theme words provide the distractors');
        assert.strictEqual(nextVocabularyQuiz(deck,session,random),session,'Unanswered questions cannot be skipped by stale Next taps');
        const answered=answerVocabularyQuiz(session,q.id);assert.equal(answered.correct,n+1);assert.equal(answered.answered,n+1);
        assert.strictEqual(answerVocabularyQuiz(answered,q.id),answered,'Double tap is scored once');
        session=nextVocabularyQuiz(deck,answered,random);
      }
      const unanswered=startVocabularyQuiz(deck,random);assert.strictEqual(answerVocabularyQuiz(unanswered,'not-an-option'),unanswered);
      const wrong=unanswered.question.choices.find(c=>c.id!==unanswered.question.id);
      const missed=answerVocabularyQuiz(unanswered,wrong.id);assert.equal(missed.correct,0);assert.equal(missed.answered,1);
      const shown=answerVocabularyQuiz(unanswered,null);assert.equal(shown.correct,0);assert.equal(shown.answered,1);assert.strictEqual(answerVocabularyQuiz(shown,shown.question.id),shown);
      total+=deck.questions.length;
    }
  }
  const deck=prepareVocabularyDecks(words,1).ne2ja,positions=new Set();
  for(let seed=1;seed<50;seed++){const s=startVocabularyQuiz(deck,rng(seed));positions.add(s.question.choices.findIndex(c=>c.id===s.question.id));}
  assert.equal(positions.size,4,'The correct option can appear in all four positions');
  const revised=structuredClone(words);revised['1'][0].ja+=' updated';assert.notEqual(prepareVocabularyDecks(revised,1).ne2ja.revision,deck.revision);
  console.log(`PASS ${lang}: ${total} word/direction questions across 30 themes, three complete shuffled cycles, four distinct real options, existing alternate meanings excluded, scoring/reveal/double taps, all answer positions and OTA revision.`);
}
const fixture={1:[{ne:'उत्तर',ja:'north'},{ne:'उत्तर',ja:'answer'},{ne:'जवाफ',ja:'answer'},{ne:'छिटो',ja:'quickly / fast'},{ne:'शीघ्र',ja:'fast'},{ne:'दक्षिण',ja:'south'},{ne:'पूर्व',ja:'east'},{ne:'पश्चिम',ja:'west'},{ne:'पानी',ja:'water'}]};
for(const direction of ['ne2ja','ja2ne']){
  const deck=prepareVocabularyDecks(fixture,1)[direction];
  for(const seed of deck.questions){
    if(['1:0','1:1','1:2'].includes(seed.id))assert(!seed.candidates.some(c=>['1:0','1:1','1:2'].includes(c.id)),'Transitive same-word/same-translation alternatives excluded');
    if(['1:3','1:4'].includes(seed.id))assert(!seed.candidates.some(c=>['1:3','1:4'].includes(c.id)),'Slash-separated translation variants excluded');
  }
}
const sparse={1:[{ne:'क',ja:'a'}],9:[{ne:'ख',ja:'b'},{ne:'ग',ja:'c'},{ne:'घ',ja:'d'}]};
assert.equal(startVocabularyQuiz(prepareVocabularyDecks(sparse,1).ne2ja,rng(8)).question.choices.length,4);
assert.equal(startVocabularyQuiz(prepareVocabularyDecks({1:sparse['1']},1).ne2ja),null);
assert.equal(startVocabularyQuiz(prepareVocabularyDecks({},1).ne2ja),null);
console.log('PASS ambiguity chains, translation aliases, real-word fallback, insufficient/empty data without invented answers.');
