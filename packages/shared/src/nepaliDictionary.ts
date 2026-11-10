import type { LearningAudio } from './learning';
import { toRomaji } from './transliterate';

export type DictionaryTranslation = { ja: string; en: string; ko?: string };
export type DictionarySense = DictionaryTranslation & { pos: string };
export type NepaliDictionaryEntry = {
  id: string; ne: string; roman: string; senses: DictionarySense[];
  forms: string[]; sources: string[]; themes: number[];
  note?: DictionaryTranslation;
  examples: (DictionaryTranslation & { ne: string })[];
  audio?: LearningAudio;
};
export type NepaliDictionary = { schema: 1; revision: number; sourceRowCount: number; entries: NepaliDictionaryEntry[] };

/** Keep Devanagari vowel signs; stripping all combining marks corrupts Nepali. */
export function dictionaryKey(text: string): string {
  return text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u00C0-\u024F\u1E00-\u1EFF]/g, c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ँ/g, 'ं')
    .replace(/[।॥?!.,、。・：:;()[\]「」『』]/g, ' ').replace(/\s+/g, ' ').trim();
}
const latinKey = (s: string) => dictionaryKey(s).replace(/aa/g,'a').replace(/ii/g,'i').replace(/uu/g,'u');
type IndexedEntry = { entry: NepaliDictionaryEntry; head: string; roman: string[]; forms: string[]; formRoman: string[]; gloss: string[]; text: string };
export function indexDictionary(entries: NepaliDictionaryEntry[]): IndexedEntry[] {
  return entries.map(entry => {
    const gloss = entry.senses.flatMap(s => [s.ja, s.en, s.ko].filter((v): v is string => !!v).map(dictionaryKey));
    const nasal = entry.roman.normalize('NFD').replace(/\u0304/g,'').replace(/([aeiou])\u0303/g,'$1n');
    const formRoman=entry.forms.flatMap(form=>{
      const spelling=toRomaji(form).replace(/m̐|ṃ/g,'n');
      return [latinKey(spelling),latinKey(spelling.replace(/ch/g,'chh').replace(/c(?!h)/g,'ch'))];
    });
    return { entry, head: dictionaryKey(entry.ne), roman: [latinKey(entry.roman),latinKey(nasal)], forms: entry.forms.map(dictionaryKey), formRoman, gloss,
      text: [...gloss, dictionaryKey(entry.note?.ja ?? ''), dictionaryKey(entry.note?.en ?? ''), dictionaryKey(entry.note?.ko ?? '')].join(' ') };
  });
}
export function searchDictionary(index: IndexedEntry[], query: string, category?: number): NepaliDictionaryEntry[] {
  const key = dictionaryKey(query), roman = latinKey(query), terms = key.split(' ');
  return index.flatMap((row, order) => {
    if (category != null && !row.entry.sources.some(s => s.startsWith(`${category}:`))) return [];
    let score = 9;
    if (!key) score=8;
    else if (row.head===key) score=0;
    else if (row.forms.includes(key) || row.formRoman.includes(roman)) score=1;
    else if (row.roman.includes(roman) || row.gloss.includes(key)) score=2;
    else if (row.head.startsWith(key) || row.roman.some(r=>r.startsWith(roman))) score=3;
    else if (row.gloss.some(g=>g.split(/[;；・／]/).some(s=>s.trim()===key))) score=4;
    else if (row.head.includes(key) || row.forms.some(f=>f.includes(key))) score=5;
    else if (terms.every(t=>row.text.includes(t))) score=6;
    return score<9 ? [{entry:row.entry,score,order}] : [];
  }).sort((a,b)=>a.score-b.score || a.order-b.order).map(r=>r.entry);
}

export function dictionaryTranslation(value: DictionaryTranslation, lang: string): string {
  return lang === 'ko' ? value.ko ?? value.en : lang === 'en' ? value.en : value.ja;
}
export const dictionaryPos: Record<string, [string,string,string]> = {
  noun:['名詞','Noun','명사'], verb:['動詞','Verb','동사'], adjective:['形容詞','Adjective','형용사'],
  adverb:['副詞','Adverb','부사'], pronoun:['代名詞','Pronoun','대명사'], postposition:['後置詞','Postposition','후치사'],
  location:['位置の表現','Location','위치 표현'], modifier:['修飾語','Modifier','수식어'], phrase:['表現','Expression','표현'],
};
