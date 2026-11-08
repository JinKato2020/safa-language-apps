import type { AppData } from './AppDataContext';
import type { StudyRef } from './learning';
import { guidedSentence } from './guidedPractice';
import { seededRandom, shuffle } from './practicePool';

export function freePracticeQuestion(data: AppData, ref: StudyRef, seed: number) {
  const detail = guidedSentence(data, ref, seed);
  const exercise = ref.exerciseId ? data.LEARNING_PATH?.exercises?.[ref.exerciseId] : undefined;
  const selection = exercise?.selection;
  const tokens = detail.words.map((word, i) => ({ id: `word-${i}`, text: word.text, roman: word.roman }));
  const seen = new Set(tokens.map(word => word.text.normalize('NFC')));
  if (selection && exercise) {
    const prefix = selection.prefix ?? '';
    const target = exercise.words[selection.wordIndex];
    const correct = selection.options.find(option => option.form === selection.answer);
    const targetRoman = target.roman.normalize('NFC'), suffixRoman = correct?.roman.normalize('NFC') ?? '';
    // Derive a prefixed option only when its romanization can be preserved exactly.
    const prefixRoman = prefix && suffixRoman && targetRoman.endsWith(suffixRoman) ? targetRoman.slice(0, -suffixRoman.length) : '';
    for (const [i, option] of selection.options.entries()) {
      const text = prefix + option.form;
      if (option.form === selection.answer || seen.has(text.normalize('NFC'))) continue;
      seen.add(text.normalize('NFC'));
      tokens.push({ id: `extra-${i}`, text, roman: prefix && !prefixRoman ? '' : prefixRoman + option.roman });
    }
  }
  return { ...detail, puzzleTokens: shuffle(tokens, seededRandom(seed + 239)), answerWords: detail.words.map(word => word.text) };
}

export function matchesPuzzle(tokens: { id: string; text: string }[], selected: string[], expected: string[]) {
  if (selected.length !== expected.length || new Set(selected).size !== selected.length) return false;
  const byId = new Map(tokens.map(token => [token.id, token.text.normalize('NFC')]));
  return selected.every((id, i) => byId.get(id) === expected[i].normalize('NFC'));
}
