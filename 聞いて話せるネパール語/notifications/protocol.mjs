export const languages = ['ja', 'en', 'ko', 'ar'];
export const announcementId = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const validExpoToken = value => typeof value === 'string'
  && /^(ExponentPushToken|ExpoPushToken)\[[a-zA-Z0-9_-]{8,128}\]$/.test(value);

export function validateAnnouncement(value) {
  if (typeof value?.id !== 'string' || !announcementId.test(value.id) || typeof value.push !== 'boolean') {
    throw new Error('Set a unique lowercase id and a boolean push flag');
  }
  const translations = {};
  for (const lang of languages) {
    const entry = value.translations?.[lang];
    const check = (key, limit) => {
      const text = typeof entry?.[key] === 'string' && entry[key].trim();
      if (!text || text.length > limit) throw new Error(lang + '.' + key + ' is required (max ' + limit + ' characters)');
      return text;
    };
    const title = check('title', 80);
    const body = check('body', 1200);
    const pushBody = value.push ? check('pushBody', 160) : '';
    translations[lang] = { title, body, pushBody };
  }
  return { id: value.id, push: value.push, translations };
}
