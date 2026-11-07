import type { GuideBlock } from './grammarGuide';

export type ReadingPart = 'rules' | 'reference' | 'examples' | 'breaks';
export type ReadingGroup = { title: string; blocks: GuideBlock[]; subtitle?: string };
export const readingCopy = (lang: string) => lang === 'ja' ? {
  rules: '基本ルール', reference: '活用・語彙', examples: '例題', breaks: '一休み', exercises: '練習問題',
  close: '教材を閉じる', practice: '例題と音声を見る', empty: '教材を準備しています',
  referenceHint: '確かめたい項目を開くと、活用や語の使い分けを読めます。',
  examplesHint: '例題を開くと、読み方・訳・単語の意味を確認できます。音声は「例題と音声を見る」から。',
  extra: '補足と復習', open: '開く', hide: '閉じる',
} : {
  rules: 'Core rules', reference: 'Forms & words', examples: 'Examples', breaks: 'Take a break', exercises: 'Practice',
  close: 'Close lesson', practice: 'View examples & audio', empty: 'This lesson is being prepared',
  referenceHint: 'Open a topic to check forms and how words are used.',
  examplesHint: 'Open an example for its reading, translation and word meanings. For audio, choose “View examples & audio”.',
  extra: 'Notes & review', open: 'Open', hide: 'Close',
};

// The boundary comes from the existing downloaded lessons. Never discard a
// content block, or require a new pack just to use the more readable reader.
export function partitionLesson(blocks: GuideBlock[]): Record<ReadingPart, GuideBlock[]> {
  const result: Record<ReadingPart, GuideBlock[]> = { rules: [], reference: [], examples: [], breaks: [] };
  const boundary = blocks.findIndex(b => b.beginnerIntroEnd);
  if (boundary < 0) { result.rules = blocks; return result; }
  let part: ReadingPart = 'rules', inRules = false;
  blocks.forEach((b, i) => {
    if (b.beginnerIntroEnd) { part = 'reference'; return; }
    if (b.lessonSupplement) { result.breaks.push(b); return; }
    if (b.type === 'h') {
      if (i < boundary) {
        if (/^\d+\.\s/.test(b.text)) inRules = true;
        else if (inRules) part = 'reference';
      } else {
        part = /^(例題\d+|Exercise\s+\d+)$/i.test(b.text) ? 'examples' : 'reference';
      }
    }
    result[part].push(b);
  });
  return result;
}

/** Reuse a complete authored culture card when a theme has no assigned break. */
export function fallbackCultureBreak(guides: Record<string, GuideBlock[]>, themeId: number): GuideBlock[] {
  const cards = new Map<string, GuideBlock[]>();
  for (const blocks of Object.values(guides)) for (const b of blocks) {
    const supplement = b.lessonSupplement;
    if (supplement?.kind === 'culture' && !cards.has(supplement.id)) {
      cards.set(supplement.id, blocks.filter(part => part.lessonSupplement?.kind === 'culture' && part.lessonSupplement.id === supplement.id));
    }
  }
  const ids = [...cards.keys()].sort();
  return ids.length ? cards.get(ids[(themeId - 1) % ids.length])! : [];
}

export function readingGroups(blocks: GuideBlock[], fallback: string): ReadingGroup[] {
  const groups: ReadingGroup[] = [];
  // Reuse the lesson's own bilingual inventory; beginners must not have to
  // recognise a Nepali question word before deciding which panel to open.
  const vocabulary = new Map<string, string>();
  const normalized = (text: string) => text.replace(/\*\*|（[^）]*）|\([^)]*\)/g, '').trim();
  for (const b of blocks) if (b.type === 'table' && b.headers.length === 2) {
    for (const row of b.rows) {
      const [word, reading] = row[0].split('\n');
      if (reading) vocabulary.set(normalized(word), `${reading} · ${row[1]}`);
    }
  }
  for (const b of blocks) {
    if (b.type === 'h') groups.push({ title: b.text, blocks: [], subtitle: vocabulary.get(normalized(b.text)) });
    else {
      if (!groups.length) groups.push({ title: fallback, blocks: [] });
      groups[groups.length - 1].blocks.push(b);
    }
  }
  return groups;
}

export function examplePreview(group: ReadingGroup): string {
  const sentence = group.blocks.find(b => b.type === 'p' && /[\u0900-\u097f]/.test(b.text));
  return sentence?.type === 'p' ? sentence.text.replace(/\*\*/g, '') : '';
}
