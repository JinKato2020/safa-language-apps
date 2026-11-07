import type { AppData } from './AppDataContext';

export type StudyRef = { mode: 'grammar' | 'conversation'; themeId: number; levelId?: number; index: number; ne: string; exerciseId?: string };
export type StudySession = { kind: 'course' | 'review'; items: StudyRef[]; stepId?: string; position?: number; answered?: string[] };
export type LearningAudio = { url: string; sha256: string; bytes: number };
export type SoundSample = { id: string; ne: string; roman: string; meaning: string; audio: LearningAudio };
export type LearningExercise = { ne: string; jp: string; words: {text: string; roman: string; meaning: string}[]; audio: LearningAudio; forms?: {subject: string; form: string; roman: string; meaning: string}[]; family?: string };
export type LearningPath = { title: string; description: string; intro: { title: string; body: string; samples?: SoundSample[] }[]; exercises?: Record<string,LearningExercise>; steps: { id: string; title: string; goal: string; guideThemeId?: number; items: StudyRef[] }[] };
export type Rating = { item: StudyRef; result: 'again' | 'known' | 'supported'; streak: number; due: number; updated: number };
export type StudyState = { version: 1; introRead: boolean; ratings: Record<string, Rating>; completed: Record<string, string>; activity?: Record<string, string[]>; resume?: { item: StudyRef; session?: StudySession } };
export const emptyStudyState = (): StudyState => ({ version: 1, introRead: false, ratings: {}, completed: {}, activity: {} });
export function studyDate(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const studyKey = (r: StudyRef) => r.exerciseId ? `exercise:${r.exerciseId}` : `${r.mode}:${r.themeId}:${r.levelId ?? 1}:${r.index}`;
export const stepSignature = (items: StudyRef[]) => JSON.stringify(items.map(r => [studyKey(r), r.ne]));
export function validRef(r: any): r is StudyRef {
  return !!r && ['grammar','conversation'].includes(r.mode) && Number.isInteger(r.themeId) && r.themeId > 0 && Number.isInteger(r.index) && r.index >= 0 && typeof r.ne === 'string' && !!r.ne && (r.levelId == null || (Number.isInteger(r.levelId) && r.levelId > 0)) && (r.exerciseId == null || /^[a-z0-9-]{1,60}$/.test(r.exerciseId));
}
export function resolveStudy(data: AppData, r: StudyRef) {
  if (!validRef(r)) return undefined;
  const ex = r.exerciseId ? data.LEARNING_PATH?.exercises?.[r.exerciseId] : (r.mode === 'grammar' ? data.getGrammarExamples(r.themeId) : data.getExamples(r.themeId, r.levelId ?? 1))[r.index];
  return ex?.ne === r.ne ? ex : undefined;
}
export function decodeStudy(raw: string | null): StudyState {
  if (!raw) return emptyStudyState();
  const p = JSON.parse(raw);
  if (p?.version !== 1 || !p.ratings || typeof p.ratings !== 'object' || !p.completed || typeof p.completed !== 'object') throw new Error('Invalid study data');
  const state = emptyStudyState(); state.introRead = p.introRead === true;
  for (const [key, r] of Object.entries(p.ratings) as [string, any][]) {
    if (validRef(r?.item) && key === studyKey(r.item) && ['known','again','supported'].includes(r.result) && Number.isInteger(r.streak) && r.streak >= 0 && Number.isFinite(r.due) && Number.isFinite(r.updated)) state.ratings[key] = r;
  }
  for (const [key, v] of Object.entries(p.completed)) if (typeof v === 'string') state.completed[key] = v;
  if (p.activity && typeof p.activity === 'object') {
    for (const [day, keys] of Object.entries(p.activity)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && studyDate(new Date(day + 'T12:00:00').getTime()) === day && Array.isArray(keys)) {
        const valid = keys.filter((key): key is string => typeof key === 'string' && /^(?:(grammar|conversation):\d+:\d+:\d+|exercise:[a-z0-9-]{1,60})$/.test(key));
        if (valid.length) state.activity![day] = [...new Set(valid)];
      }
    }
  } else {
    // Old installs know only each example's latest assessment. Preserve those
    // confirmed dates without inventing earlier days or counting home visits.
    for (const [key, rating] of Object.entries(state.ratings)) {
      const day = studyDate(rating.updated);
      state.activity![day] = [...(state.activity![day] ?? []), key];
    }
  }
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
  const streak = result !== 'known' ? 0 : same && previous.result === 'known' && previous.due > now ? previous.streak : Math.min(3, (same ? previous.streak : 0) + 1);
  const days = [0, 1, 3, 7][streak];
  const due = result === 'supported' ? now + 86400000 : result === 'again' ? now : same && previous.result === 'known' && previous.due > now ? previous.due : now + days * 86400000;
  const day = studyDate(now), activity = state.activity ?? {};
  return { ...state, activity: { ...activity, [day]: [...new Set([...(activity[day] ?? []), key])] }, ratings: { ...state.ratings, [key]: { item, result, streak, updated: now, due } } };
}

/** Calendar-day streaks, using local dates (including DST), not 24-hour offsets. */
export function studyActivity(state: StudyState, now: number) {
  const date = new Date(now), today = studyDate(now), activity = state.activity ?? {};
  const offset = (days: number) => { const d = new Date(date); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + days); return studyDate(d.getTime()); };
  const days = Object.keys(activity).filter(day => day <= today && activity[day].length > 0);
  const active = new Set(days);
  let cursor = active.has(today) ? 0 : -1, streak = 0;
  while (active.has(offset(cursor--))) streak++;
  return {
    today: activity[today]?.length ?? 0, streak, totalDays: days.length,
    week: Array.from({ length: 7 }, (_, index) => {
      const key = offset(index - 6), d = new Date(key + 'T12:00:00');
      return { key, weekday: d.getDay(), day: d.getDate(), count: activity[key]?.length ?? 0, today: key === today };
    }),
  };
}
export function reviewItems(state: StudyState, data: AppData, now: number, limit = 5): StudyRef[] {
  return Object.values(state.ratings).filter(r => r.due <= now && resolveStudy(data, r.item))
    .sort((a,b) => Number(b.result === 'again') - Number(a.result === 'again') || a.due - b.due || a.updated - b.updated)
    .slice(0, limit).map(r => r.item);
}
export function practiceParams(item: StudyRef, studySession?: StudySession) {
  return { themeId: item.themeId, levelId: item.levelId, startIndex: item.index, mode: item.mode === 'grammar' ? 'grammar' as const : undefined, challenge: false, ...(studySession ? { studySession } : {}) };
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
