export const DAY = 24 * 60 * 60 * 1000;
export const INTERVAL = 4 * DAY;
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
  return !state.disabled && now >= Math.max(state.firstSeen, state.lastInvite) + INTERVAL;
}
export function canRequestReview(state: EngagementState, now: number): boolean {
  return !state.disabled && state.reviewAttempts.filter(t => t > now - 365 * DAY).length < 3;
}
export function isLandingRoute(name?: string): boolean { return ['Theme', 'VocabCategory', 'SettingsTab', 'SettingsMain', 'HomeTab'].includes(name ?? ''); }
export function isStudyRoute(name?: string): boolean { return ['Practice', 'Flashcard', 'Listening', 'PosterAudio', 'GrammarGuide'].includes(name ?? ''); }

export function requestMail(lang: string, version: string) {
  const english = lang === 'en';
  return { recipients: ['contact@safa-lang.com'],
    subject: english ? 'Nepali app — feature or content request' : '聞いて話せるネパール語：機能・教材のリクエスト',
    body: english ? `What would you like to add or improve?\n\n\nApp version: ${version}\nLanguage: ${lang}` : `追加してほしい教材・機能や、改善してほしい点をご記入ください。\n\n\nアプリのバージョン：${version}\n表示言語：${lang}` };
}
