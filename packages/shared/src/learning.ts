import type { AppData } from './AppDataContext';

export type StudyRef = { mode: 'grammar' | 'conversation'; themeId: number; levelId?: number; index: number; ne: string };
export type StudySession = { kind: 'course' | 'review'; items: StudyRef[]; stepId?: string; position?: number; answered?: string[] };
export type LearningPath = { title: string; description: string; intro: { title: string; body: string }[]; steps: { id: string; title: string; goal: string; guideThemeId?: number; items: StudyRef[] }[] };
export type Rating = { item: StudyRef; result: 'again' | 'known'; streak: number; due: number; updated: number };
export type StudyState = { version: 1; introRead: boolean; ratings: Record<string, Rating>; completed: Record<string, string>; resume?: { item: StudyRef; session?: StudySession } };
export const emptyStudyState = (): StudyState => ({ version: 1, introRead: false, ratings: {}, completed: {} });
export const studyKey = (r: StudyRef) => `${r.mode}:${r.themeId}:${r.levelId ?? 1}:${r.index}`;
export const stepSignature = (items: StudyRef[]) => JSON.stringify(items.map(r => [studyKey(r), r.ne]));
export function validRef(r: any): r is StudyRef {
  return !!r && ['grammar','conversation'].includes(r.mode) && Number.isInteger(r.themeId) && r.themeId > 0 && Number.isInteger(r.index) && r.index >= 0 && typeof r.ne === 'string' && !!r.ne && (r.levelId == null || (Number.isInteger(r.levelId) && r.levelId > 0));
}
export function resolveStudy(data: AppData, r: StudyRef) {
  if (!validRef(r)) return undefined;
  const ex = (r.mode === 'grammar' ? data.getGrammarExamples(r.themeId) : data.getExamples(r.themeId, r.levelId ?? 1))[r.index];
  return ex?.ne === r.ne ? ex : undefined;
}
export function decodeStudy(raw: string | null): StudyState {
  if (!raw) return emptyStudyState();
  const p = JSON.parse(raw);
  if (p?.version !== 1 || !p.ratings || typeof p.ratings !== 'object' || !p.completed || typeof p.completed !== 'object') throw new Error('Invalid study data');
  const state = emptyStudyState(); state.introRead = p.introRead === true;
  for (const [key, r] of Object.entries(p.ratings) as [string, any][]) {
    if (validRef(r?.item) && key === studyKey(r.item) && ['known','again'].includes(r.result) && Number.isInteger(r.streak) && r.streak >= 0 && Number.isFinite(r.due) && Number.isFinite(r.updated)) state.ratings[key] = r;
  }
  for (const [key, v] of Object.entries(p.completed)) if (typeof v === 'string') state.completed[key] = v;
  if (validRef(p.resume?.item)) {
    const s = p.resume.session;
    if (!s) state.resume = { item: p.resume.item };
    else if (['course','review'].includes(s.kind) && Array.isArray(s.items) && s.items.length > 0 && s.items.every(validRef) && Number.isInteger(s.position) && s.position >= 0 && s.position < s.items.length && Array.isArray(s.answered) && s.answered.every((x: unknown) => typeof x === 'string')) state.resume = p.resume;
  }
  return state;
}
export function rateStudy(state: StudyState, item: StudyRef, result: Rating['result'], now: number): StudyState {
  const key = studyKey(item), previous = state.ratings[key];
  const same = previous?.item.ne === item.ne;
  const streak = result === 'again' ? 0 : same && previous.result === 'known' && previous.due > now ? previous.streak : Math.min(3, (same ? previous.streak : 0) + 1);
  const days = [0, 1, 3, 7][streak];
  const due = result === 'again' ? now : same && previous.result === 'known' && previous.due > now ? previous.due : now + days * 86400000;
  return { ...state, ratings: { ...state.ratings, [key]: { item, result, streak, updated: now, due } } };
}
export function reviewItems(state: StudyState, data: AppData, now: number, limit = 5): StudyRef[] {
  return Object.values(state.ratings).filter(r => r.due <= now && resolveStudy(data, r.item))
    .sort((a,b) => Number(b.result === 'again') - Number(a.result === 'again') || a.due - b.due || a.updated - b.updated)
    .slice(0, limit).map(r => r.item);
}
export function practiceParams(item: StudyRef, studySession?: StudySession) {
  return { themeId: item.themeId, levelId: item.levelId, startIndex: item.index, mode: item.mode === 'grammar' ? 'grammar' as const : undefined, ...(studySession ? { studySession } : {}) };
}

/** Serialize reads/writes and publish only successfully persisted states. Failed reads never overwrite saved data. */
export function createStudyStore(storage: { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> }, key: string, publish: (state: StudyState) => void) {
  let state = emptyStudyState(), ready = false, tail: Promise<unknown> = Promise.resolve();
  return {
    async load() { state = decodeStudy(await storage.getItem(key)); ready = true; publish(state); },
    change(update: (s: StudyState) => StudyState): Promise<void> {
      const job = tail.then(async () => {
        if (!ready) throw new Error('Study data not loaded');
        const next = update(state);
        if (JSON.stringify(next) === JSON.stringify(state)) return;
        await storage.setItem(key, JSON.stringify(next)); state = next; publish(next);
      });
      tail = job.catch(() => {}); return job;
    },
  };
}
