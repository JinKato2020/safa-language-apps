import type { AppData } from './AppDataContext';
import { practiceParams, stepSignature, studyKey, type LearningPath, type StudyRef, type StudySession, type StudyState } from './learning';

export type PracticeStage = 2 | 3 | 4;
export type PracticePool = { signature: string; remaining: string[]; previous: string[] };
export function shuffle<T>(values: T[], random: () => number = Math.random): T[] {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function seededRandom(seed: number) {
  let value=seed>>>0;
  return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}

/** Reserve a set atomically with its resume record. No network or timers involved. */
export function createPracticeSession(state: StudyState, path: LearningPath, themeId: number, random: () => number = Math.random) {
  const step=path.steps.find(s=>s.guideThemeId===themeId);
  if(!step || step.items.length<20)throw new Error('A complete practice pool is required');
  const signature=stepSignature(step.items), lookup=new Map(step.items.map(r=>[studyKey(r),r]));
  if(lookup.size!==step.items.length)throw new Error('Duplicate practice questions');
  const pools={...state.practicePools},items: StudyRef[]=[],questionStages: PracticeStage[]=[];
  for(const stage of [2,3,4] as const) {
    const key=`${themeId}:${stage}`,old=pools[key];
    let remaining=old?.signature===signature?old.remaining.filter(id=>lookup.has(id)):[];
    const previous=old?.previous.filter(id=>lookup.has(id))??[];
    if(new Set(remaining).size!==remaining.length)remaining=[];
    if(remaining.length<5) {
      // Twenty questions form four sets. On a fresh cycle, keep the last five
      // away from the front so the boundary cannot immediately repeat them.
      const deck=shuffle([...lookup.keys()],random);
      remaining=[...deck.filter(id=>!previous.includes(id)),...deck.filter(id=>previous.includes(id))];
    }
    const selected=remaining.slice(0,5);
    pools[key]={signature,remaining:remaining.slice(5),previous:selected};
    for(const id of selected){items.push(lookup.get(id)!);questionStages.push(stage);}
  }
  const session: StudySession={kind:'course',stepId:step.id,items,questionStages,choiceSeed:Math.floor(random()*4294967296),position:0,answered:[]};
  return {state:{...state,practicePools:pools,resume:{item:items[0],session}},session,params:practiceParams(items[0],session)};
}
export const practiceTaskKey=(session: StudySession,item: StudyRef,index: number)=>session.questionStages?`${session.questionStages[index]}:${studyKey(item)}`:studyKey(item);

/** One reserved question at a time. Cycling never grows the saved session. */
export function createFreePracticeSession(state: StudyState, path: LearningPath, themeId: number, stage: PracticeStage, answered = 0, random: () => number = Math.random, puzzleOnly = false) {
  const step = path.steps.find(s => s.guideThemeId === themeId);
  return reserveFreeQuestion(state, step?.items ?? [], `${themeId}:${stage}`, step?.id, stage, answered, random, puzzleOnly);
}

/** Keep original example indexes so translations and audio references remain aligned. */
export function conversationPuzzleItems(data: Pick<AppData, 'getExamples'>, themeId: number, levelId: number): StudyRef[] {
  return data.getExamples(themeId, levelId).flatMap((example, index) => example.jp.trim() && puzzleSentenceWords(example.ne).length >= 2
    ? [{ mode: 'conversation' as const, themeId, levelId, index, ne: example.ne }] : []);
}

export function puzzleSentenceWords(sentence: string): string[] {
  return sentence.split(/(\s+|[।॥?!,;:「」『』（）()"“”]+)/u).filter(text => /[\u0900-\u097f\p{L}\p{N}]/u.test(text) && !/^[।॥]+$/.test(text));
}

export function createConversationPuzzleSession(state: StudyState, data: Pick<AppData, 'getExamples'>, themeId: number, levelId: number, answered = 0, random: () => number = Math.random) {
  const items = conversationPuzzleItems(data, themeId, levelId);
  return reserveFreeQuestion(state, items, `conversation:${themeId}:${levelId}:4`, undefined, 4, answered, random, true);
}

function reserveFreeQuestion(state: StudyState, items: StudyRef[], key: string, stepId: string | undefined, stage: PracticeStage, answered: number, random: () => number, puzzleOnly: boolean) {
  if (!items.length || ![2,3,4].includes(stage) || !Number.isSafeInteger(answered) || answered < 0) throw new Error('Invalid free practice request');
  const lookup = new Map(items.map(ref => [studyKey(ref), ref])), signature = stepSignature(items);
  if (lookup.size !== items.length) throw new Error('Duplicate practice questions');
  const old = state.practicePools?.[key];
  let remaining = old?.signature === signature ? old.remaining.filter(id => lookup.has(id)) : [];
  if (new Set(remaining).size !== remaining.length) remaining = [];
  const previous = old?.signature === signature ? old.previous.filter(id => lookup.has(id)) : [];
  if (!remaining.length) {
    const deck = shuffle([...lookup.keys()], random);
    remaining = [...deck.filter(id => !previous.includes(id)), ...deck.filter(id => previous.includes(id))];
  }
  const id = remaining[0], item = lookup.get(id)!;
  const pools = { ...state.practicePools, [key]: { signature, remaining: remaining.slice(1), previous: [id] } };
  const session: StudySession = { kind: 'course', ...(stepId ? { stepId } : {}), items: [item], position: 0, answered: [], questionStages: [stage], choiceSeed: Math.floor(random()*4294967296), freePractice: { stage, answered, ...(puzzleOnly && stage === 4 ? { puzzleOnly: true } : {}) } };
  return { state: { ...state, practicePools: pools, resume: { item, session } }, session, params: practiceParams(item, session) };
}
