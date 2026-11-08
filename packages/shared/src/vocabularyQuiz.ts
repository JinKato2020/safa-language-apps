import type { Word } from './types';

export type VocabularyDirection = 'ne2ja' | 'ja2ne';
type Entry = Word & { id: string; category: string; group: string };
export type VocabularyChoice = { id: string; text: string };
export type VocabularyQuestion = {
  id: string; prompt: string; answer: string; word: Word; choices: VocabularyChoice[];
};
type Seed = Omit<VocabularyQuestion, 'choices'> & { candidates: VocabularyChoice[] };
export type VocabularyDeck = { revision: string; questions: Seed[] };
export type VocabularySession = {
  question: VocabularyQuestion; remaining: string[]; answered: number; correct: number;
  response: { choice: string | null; correct: boolean } | null;
};

export const vocabularyKey = (text: string) => text.normalize('NFKC').toLowerCase()
  .replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();

/** Conservative aliases: ambiguity excludes a distractor, never creates a new answer. */
export function vocabularyAliases(text: string) {
  const key = vocabularyKey(text);
  const plain = key.replace(/\([^)]*\)/g, '').trim();
  return [...new Set([key, plain, ...plain.split(/\s*[/、,;・]\s*/)]
    .map(value => value.replace(/^to\s+/, '').trim()).filter(Boolean))];
}

function shuffled<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Equivalent prompts/translations across every category must not compete as answers. */
export function prepareVocabularyDecks(words: Record<string, Word[]>, categoryId: number): Record<VocabularyDirection, VocabularyDeck> {
  const parent = new Map<string, string>();
  const root = (node: string): string => {
    const p = parent.get(node);
    if (!p) { parent.set(node, node); return node; }
    if (p === node) return node;
    const r = root(p); parent.set(node, r); return r;
  };
  const entries: Entry[] = [];
  for (const [category, rows] of Object.entries(words)) rows.forEach((word, index) => {
    if (!word.ne?.trim() || !word.ja?.trim()) return;
    const nodes = [...vocabularyAliases(word.ne).map(s => 'ne:' + s), ...vocabularyAliases(word.ja).map(s => 'l1:' + s)];
    if (!nodes.length) return;
    nodes.forEach(node => parent.set(root(node), root(nodes[0])));
    entries.push({ ...word, ne: word.ne.trim(), ja: word.ja.trim(), category, id: `${category}:${index}`, group: nodes[0] });
  });
  for (const entry of entries) entry.group = root(entry.group);
  const local = entries.filter(e => e.category === String(categoryId));
  const other = entries.filter(e => e.category !== String(categoryId));
  // The complete data signature remounts a running quiz if OTA text or language changes.
  const revision = JSON.stringify(entries.map(e => [e.id, e.ne, e.ja]));
  const build = (direction: VocabularyDirection): VocabularyDeck => {
    const questions: Seed[] = [], seen = new Set<string>();
    for (const entry of local) {
      const prompt = direction === 'ne2ja' ? entry.ne : entry.ja;
      const answer = direction === 'ne2ja' ? entry.ja : entry.ne;
      const pair = JSON.stringify([vocabularyKey(prompt), vocabularyKey(answer)]);
      if (seen.has(pair)) continue;
      seen.add(pair);
      const groups = new Set([entry.group]), candidates: VocabularyChoice[] = [];
      // Prefer the selected category; fall back only when it lacks distinct meanings.
      for (const source of [local, other]) {
        if (candidates.length >= 3) break;
        for (const candidate of source) {
          if (groups.has(candidate.group)) continue;
          groups.add(candidate.group);
          candidates.push({ id: candidate.id, text: direction === 'ne2ja' ? candidate.ja : candidate.ne });
        }
      }
      if (candidates.length >= 3) questions.push({ id: entry.id, prompt, answer, word: { ne: entry.ne, ja: entry.ja }, candidates });
    }
    return { revision, questions };
  };
  return { ne2ja: build('ne2ja'), ja2ne: build('ja2ne') };
}

function questionFrom(seed: Seed, random: () => number): VocabularyQuestion {
  const { candidates, ...question } = seed;
  return { ...question, choices: shuffled([{ id: seed.id, text: seed.answer }, ...shuffled(candidates, random).slice(0, 3)], random) };
}

export function startVocabularyQuiz(deck: VocabularyDeck, random = Math.random): VocabularySession | null {
  const [first, ...rest] = shuffled(deck.questions, random);
  return first ? { question: questionFrom(first, random), remaining: rest.map(q => q.id), answered: 0, correct: 0, response: null } : null;
}

export function answerVocabularyQuiz(session: VocabularySession, choice: string | null): VocabularySession {
  if (session.response || (choice !== null && !session.question.choices.some(c => c.id === choice))) return session;
  const correct = choice === session.question.id;
  return { ...session, response: { choice, correct }, answered: session.answered + 1, correct: session.correct + Number(correct) };
}

export function nextVocabularyQuiz(deck: VocabularyDeck, session: VocabularySession, random = Math.random): VocabularySession {
  if (!session.response) return session;
  let remaining = session.remaining.filter(id => deck.questions.some(q => q.id === id));
  if (!remaining.length) {
    const next = shuffled(deck.questions, random);
    const different = next.findIndex(q => vocabularyKey(q.prompt) !== vocabularyKey(session.question.prompt));
    if (different > 0) [next[0], next[different]] = [next[different], next[0]];
    remaining = next.map(q => q.id);
  }
  const [id, ...rest] = remaining, seed = deck.questions.find(q => q.id === id);
  return seed ? { ...session, question: questionFrom(seed, random), remaining: rest, response: null } : session;
}
