import type { AppData } from './AppDataContext';
import type { StudyRef } from './learning';
import { seededRandom, shuffle } from './practicePool';

export function guidedSentence(data: AppData, ref: StudyRef, seed = 0) {
  if (ref.exerciseId) {
    const exercise=data.LEARNING_PATH?.exercises?.[ref.exerciseId];
    if (!exercise || exercise.ne!==ref.ne) throw new Error('Changed learning exercise');
    const parts=ref.ne.split(/(\s+|[।॥?!,;:「」『』（）()"“”]+)/u).filter(Boolean);
    let cursor=0;
    const words=exercise.words.map(w=>{const index=parts.indexOf(w.text,cursor);cursor=index+1;return {...w,index};});
    const fullTarget=words[exercise.selection?.wordIndex??words.length-1];
    const target={...fullTarget,text:exercise.selection?.answer??fullTarget.text};
    const rotate=<T,>(a:T[])=>shuffle(a,seededRandom(seed+ref.index*97+ref.themeId));
    const step=data.LEARNING_PATH!.steps.find(s=>s.items.some(r=>r.exerciseId===ref.exerciseId));
    const meanings=(exercise.meaningChoices??[exercise.jp,...(step?.items??[]).map(r=>data.LEARNING_PATH!.exercises![r.exerciseId!]?.jp)]).filter((s,i,a)=>!!s&&a.indexOf(s)===i).slice(0,3);
    const selection=exercise.selection;
    return {parts,words,target,choices:words,sentenceId:ref.exerciseId,meaningChoices:rotate(meanings),conjugation:selection?{family:selection.rule,subject:'',forms:[],choices:rotate(selection.options),target,prompt:selection.prompt,prefix:selection.prefix??''}:exercise.forms?.some(f=>f.form===target.text)?{family:exercise.family??'',subject:words[0].text,forms:exercise.forms,choices:rotate(exercise.forms),target,prompt:undefined,prefix:''}:null};
  }
  const sentenceId = ref.mode === 'grammar' ? `${ref.themeId}-${ref.index + 1}` : `${ref.themeId}-${ref.levelId ?? 1}-${ref.index + 1}`;
  const dictionary = ref.mode === 'grammar' ? data.GRAMMAR_VOCAB : data.CONV_VOCAB;
  // Retain every separator so revealing the blank always reproduces the source exactly.
  const parts = ref.ne.split(/(\s+|[।॥?!,;:「」『』（）()"“”]+)/u).filter(Boolean);
  const lexical = parts.map((text, index) => ({ text, index })).filter(p => /[\u0900-\u097f\p{L}\p{N}]/u.test(p.text) && !/^[।॥]+$/.test(p.text));
  const words = lexical.map(({text, index}) => {
    const entry = dictionary?.[text], context = entry?.contexts?.find(c => c.sentence_id === sentenceId), fallback = data.VOCAB[text];
    return { text, index, roman: entry?.rom || fallback?.rom || '', meaning: context?.ja || entry?.base_meaning || fallback?.ja || '' };
  });
  // Only words just shown in this very sentence are offered. Never invent distractors
  // or borrow another sentence's context-dependent gloss.
  const target = words.at(-1);
  const candidates = target ? [...new Map([target, ...words].map(w => [w.text, w])).values()].slice(0, 3) : [];
  const choices = candidates.sort((a,b) => a.index - b.index);
  const examples = ref.mode === 'grammar' ? data.getGrammarExamples(ref.themeId) : data.getExamples(ref.themeId, ref.levelId ?? 1);
  const answer = examples[ref.index]?.jp ?? '';
  const meanings = [answer, ...examples.filter(e => e.ne !== ref.ne).map(e => e.jp)].filter((s,i,a) => !!s && a.indexOf(s) === i).slice(0,3);
  const rotate = <T,>(a: T[]) => { const n = a.length ? (ref.index + ref.themeId) % a.length : 0; return [...a.slice(n),...a.slice(0,n)]; };
  // These are present-tense affirmative paradigms taught in topics 1–3.
  // A subject alone does not choose ho/chha: the unchanged predicate supplies context.
  const identity = ref.mode === 'grammar' && ref.themeId === 1;
  const locationOrState = ref.mode === 'grammar' && [2,3].includes(ref.themeId);
  const paradigms = identity ? [
    { subject:'म', form:'हुँ', roman:'hũ' }, { subject:'हामी', form:'हौं', roman:'haũ' }, { subject:'तपाईं / उहाँ', form:'हुनुहुन्छ', roman:'hunuhuncha' },
  ] : [
    { subject:'म', form:'छु', roman:'chu' }, { subject:'हामी', form:'छौं', roman:'chaũ' }, { subject:'तपाईं / उहाँ', form:'हुनुहुन्छ', roman:'hunuhuncha' },
  ];
  const subject = words[0]?.text;
  const personal = ['म','हामी','तपाईं','तपाईंहरू','उहाँ','उहाँहरू'].includes(subject);
  const conjugation = (identity || locationOrState) && personal && paradigms.some(p => p.form === target?.text)
    ? { family: identity ? 'ho' : 'chha', subject, forms: paradigms, choices: rotate(paradigms), target: target!, prompt: undefined, prefix: '' } : null;
  return { parts, words, target, choices, sentenceId, meaningChoices: rotate(meanings), conjugation };
}
