import app from '../../app.json';

export const announcementId = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const noticeLanguages = ['ja', 'en', 'ko', 'ar'] as const;
export type NoticeLanguage = typeof noticeLanguages[number];
export type Notice = { id: string; title: string; body: string; publishedAt: number };
export const toNoticeLanguage = (lang: string): NoticeLanguage =>
  noticeLanguages.find(value => value === lang) ?? 'ja';

const api = (app.expo.extra as { nepaliNoticesUrl?: string }).nepaliNoticesUrl;
export const noticesConfigured = !!api;

export function parseNotices(value: unknown): Notice[] {
  if (!Array.isArray(value) || value.length > 50) throw Error('Invalid announcements');
  const ids = new Set<string>();
  for (const notice of value) {
    if (typeof notice?.id !== 'string' || !announcementId.test(notice.id) || ids.has(notice.id)
      || typeof notice.title !== 'string' || !notice.title.trim() || notice.title.length > 80
      || typeof notice.body !== 'string' || !notice.body.trim() || notice.body.length > 1200
      || !Number.isSafeInteger(notice.publishedAt) || notice.publishedAt <= 0) throw Error('Invalid announcement');
    ids.add(notice.id);
  }
  return value;
}

async function request(path: string, init?: RequestInit) {
  if (!api) throw Error('Announcements are not configured');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const response = await fetch(api + path, { ...init, signal: ctrl.signal });
    if (!response.ok) throw Error('Announcements HTTP ' + response.status);
    return response.status === 204 ? null : await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getNotices(lang: NoticeLanguage, id?: string) {
  const result = await request('/v1/announcements?lang=' + lang + (id ? '&id=' + encodeURIComponent(id) : ''));
  return parseNotices(result?.items);
}

export async function updateSubscription(secret: string, subscription?: { token: string; lang: NoticeLanguage }) {
  await request('/v1/subscription', {
    method: subscription ? 'PUT' : 'DELETE',
    headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
    body: subscription ? JSON.stringify(subscription) : undefined,
  });
}
