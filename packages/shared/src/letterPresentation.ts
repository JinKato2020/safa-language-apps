import type { LetterSample, LettersSounds, SoundSample } from './learning';

const mergedSections = new Set(['bare', 'velar', 'affricate', 'retroflex', 'dental', 'labial', 'other']);
export const visibleLetterSections = (data: LettersSounds) => data.sections.filter(s => !mergedSections.has(s.id));

/** Match the whole written form, not क inside कि or त inside स्त. */
export function containsLetterForm(word: SoundSample, sample: LetterSample): boolean {
  if (word.ne === sample.ne) return false;
  const vowelOrMark = /[\u0900-\u0903\u093a-\u094f\u0951-\u0957\u0962\u0963]/;
  const bare = sample.ne.endsWith('्');
  let index = word.ne.indexOf(sample.ne);
  while (index >= 0) {
    const end = index + sample.ne.length, after = word.ne[end] ?? '';
    const startsInsideCluster = word.ne[index - 1] === '्';
    const finalInherentA = end === word.ne.length && /[क-ह]$/.test(sample.ne);
    const explicitFinalA = sample.roman.split(/\s*\/\s*/).some(r => word.roman.endsWith(r));
    // ज्ञ is pronounced gya in Nepali: it must not teach a j sound for ज्.
    const changedClusterSound = bare && sample.ne === 'ज्' && after === 'ञ';
    if (!changedClusterSound && (bare || (!startsInsideCluster && !vowelOrMark.test(after) && (!finalInherentA || explicitFinalA)))) return true;
    index = word.ne.indexOf(sample.ne, index + 1);
  }
  return false;
}

/** Reuse translated, recorded words already supplied with the course; never invent a rare example. */
export function prepareLetterPresentation(source: LettersSounds, language: boolean | string): LettersSounds {
  // Boolean arguments remain supported for existing callers and regression checks.
  const en = language === true || language === 'en', ko = language === 'ko', ar = language === 'ar';
  const allSamples = source.sections.flatMap(s => s.samples);
  const pool = [...new Map(allSamples.flatMap(s => s.examples ?? []).map(w => [w.ne, w])).values()];
  const withExample = (sample: LetterSample): LetterSample => {
    const candidates = [...(sample.examples ?? []), ...pool].filter(w => w.audio?.url && containsLetterForm(w, sample));
    const example = candidates.find(w => w.ne.startsWith(sample.ne)) ?? candidates[0];
    return { ...sample, examples: example ? [example] : undefined };
  };
  const combinations = source.combinations.map(row => {
    const ne = row.consonant + '्';
    const existing = allSamples.find(s => s.ne === ne && s.id.startsWith('bare-')) ?? allSamples.find(s => s.ne === ne);
    const bare: LetterSample = {
      id: existing?.id ?? `bare-${row.consonant}`, ne,
      roman: existing?.roman ?? row.roman.replace(/a$/, ''),
      meaning: ar ? 'صامت فقط · بلا صائت' : ko ? '자음만 · 모음 없음' : en ? 'Consonant only · no vowel' : '子音のみ・母音なし',
      audio: ['क', 'स'].includes(row.consonant) ? existing?.audio : undefined,
      speech: ne,
    };
    return { ...row, samples: [bare, ...row.samples.filter(s => s.ne !== ne)].map(withExample) };
  });
  const sections = visibleLetterSections(source).map(section => {
    let body = section.body;
    if (section.id === 'start') body = body
      .replace('この教材の「子音」一覧も、この文字の読みです。', '「子音＋母音」では、母音なしの形から11の母音を付けた形まで比べられます。')
      .replace('The consonant chart in this course uses these letter readings.', 'In Vowel combinations, compare the vowel-free form with the 11 vowel forms.');
    if (section.id === 'combinations') body = ar
      ? 'الصيغة الأولى صامت فقط، تليها 11 صيغة مع الصوائت. العلامة ् تحذف الصائت الملازم a: क् = k وक = ka. التسجيلات دون صائت متاحة لـ क् وस् فقط؛ أما بقية الصوامت فمعروضة للرجوع إلى شكل الكتابة.'
      : ko
      ? '맨 앞은 자음만 있는 형태이고, 그다음은 모음 11가지를 붙인 형태예요. ्는 기본 모음 a를 없애는 기호예요(क्=k, क=ka). 자음만의 음성은 क्와 स् 두 가지예요. 나머지는 글자 형태로 확인해 보세요.'
      : en
      ? 'First: consonant only. Then: 11 vowel forms. ् removes the inherent a: क् = k, क = ka. Only क् and स् have consonant-only recordings; the other bare forms are written references.'
      : '先頭は子音のみ、その後は11通りの母音付き。् は母音 a を外す印です（क्＝k、क＝ka）。子音のみの音声は क्・स् の2つ。ほかは文字で確認できます。';
    return { ...section, body, samples: section.samples.map(withExample) };
  });
  return {
    ...source, sections, combinations,
    conjunctCombinations: source.conjunctCombinations?.map(row => ({ ...row, samples: row.samples.map(withExample) })),
  };
}
