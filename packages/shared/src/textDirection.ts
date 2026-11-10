/** Presentation only: source text, puzzle tokens, search keys and audio IDs stay unchanged. */
const ARABIC_LETTER = /[\u0620-\u063f\u0641-\u064a\u066e-\u06d3\u06fa-\u06fc]/;
const LTR_LETTER = /[A-Za-z\u00c0-\u02af\u0900-\u097f]/;
const LTR_RUN = /[A-Za-z\u00c0-\u02af\u0900-\u097f][A-Za-z\u00c0-\u02af\u0300-\u036f\u0900-\u097f0-9]*(?:[ \t+\/=:\-→←⇒⇔*]+[A-Za-z\u00c0-\u02af\u0900-\u097f0-9][A-Za-z\u00c0-\u02af\u0300-\u036f\u0900-\u097f0-9]*)*/g;

export function textDirection(text: string): 'rtl' | 'ltr' | undefined {
  if (ARABIC_LETTER.test(text)) return 'rtl';
  if (LTR_LETTER.test(text)) return 'ltr';
  return undefined;
}

/** Unicode isolates keep embedded Nepali, Latin readings and formulas in LTR order. */
export function isolateLtrInArabic(text: string): string {
  if (/[\u2066-\u2069]/.test(text)) return text;
  return text.replace(LTR_RUN, run => `\u2066${run}\u2069`)
    // Localized chevrons already encode the intended physical direction.
    // Isolate them so the Unicode bidi algorithm does not mirror them again.
    .replace(/[‹›]/g, arrow => `\u2066${arrow}\u2069`);
}

/** Ignore Arabic vowel marks and tatweel in search, retaining all Nepali signs. */
export function normalizeArabicSearch(text: string): string {
  return text.replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا');
}
