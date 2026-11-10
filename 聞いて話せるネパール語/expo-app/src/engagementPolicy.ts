export const DAY = 24 * 60 * 60 * 1000;
export const FIRST_INVITE_DAY = 3;
export const REPEAT_DAYS = 7;
export const INTERVAL = REPEAT_DAYS * DAY;
export type EngagementState = { firstSeen: number; lastInvite: number; disabled: boolean; reviewAttempts: number[] };

export function readEngagement(raw: string | null, now: number): EngagementState {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || !Number.isFinite(value.firstSeen) || value.firstSeen <= 0) throw Error();
    return { firstSeen: Math.min(value.firstSeen, now), lastInvite: Number.isFinite(value.lastInvite) ? Math.min(Math.max(0,value.lastInvite), now) : 0,
      disabled: value.disabled === true, reviewAttempts: Array.isArray(value.reviewAttempts) ? value.reviewAttempts.filter((t: unknown): t is number => typeof t === 'number' && Number.isFinite(t) && t > now - 365 * DAY && t <= now) : [] };
  } catch { return { firstSeen: now, lastInvite: 0, disabled: false, reviewAttempts: [] }; }
}
export function inviteDue(state: EngagementState, now: number): boolean {
  if (state.disabled || now < state.firstSeen || now < state.lastInvite) return false;
  // First use is local calendar day1. The initial day3 follows the local date;
  // subsequent invitations require a full seven days from the actual display.
  const calendarDay = (time: number) => {
    const date = new Date(time);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
  };
  return state.lastInvite > 0
    ? now - state.lastInvite >= INTERVAL
    : calendarDay(now) - calendarDay(state.firstSeen) >= FIRST_INVITE_DAY - 1;
}
export function canRequestReview(state: EngagementState, now: number): boolean {
  return !state.disabled && state.reviewAttempts.filter(t => t > now - 365 * DAY).length < 3;
}
export function isLandingRoute(name?: string): boolean { return ['Theme', 'VocabCategory', 'SettingsTab', 'SettingsMain', 'HomeTab'].includes(name ?? ''); }
export function isStudyReturnRoute(name?: string): boolean { return ['Theme', 'VocabCategory', 'HomeTab'].includes(name ?? ''); }
export function isStudyRoute(name?: string): boolean { return ['Practice', 'Flashcard', 'Listening', 'PosterAudio', 'GrammarGuide'].includes(name ?? ''); }

export function requestMail(lang: string, version: string) {
  if (lang === 'ko') return { recipients: ['contact@safa-lang.com'], subject: '네팔어 앱 — 기능·학습 자료 요청', body: `추가하고 싶은 학습 자료나 기능, 개선이 필요한 점을 적어 주세요.\n\n\n앱 버전: ${version}\n표시 언어: ${lang}` };
  const english = lang === 'en';
  return { recipients: ['contact@safa-lang.com'],
    subject: english ? 'Nepali app — feature or content request' : '聞いて話せるネパール語：機能・教材のリクエスト',
    body: english ? `What would you like to add or improve?\n\n\nApp version: ${version}\nLanguage: ${lang}` : `追加してほしい教材・機能や、改善してほしい点をご記入ください。\n\n\nアプリのバージョン：${version}\n表示言語：${lang}` };
}
