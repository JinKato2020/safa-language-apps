import type { AppData } from './AppDataContext';
import type { StudyRef } from './learning';
import { guidedSentence } from './guidedPractice';
import { puzzleSentenceWords, seededRandom, shuffle } from './practicePool';
import { toRomaji } from './transliterate';
import { vocabularyAliases, vocabularyKey } from './vocabularyQuiz';

export function freePracticeQuestion(data: AppData, ref: StudyRef, seed: number) {
  const detail = guidedSentence(data, ref, seed);
  if (ref.mode === 'conversation') detail.words = detail.words.map(word => ({ ...word, roman: word.roman || toRomaji(word.text) }));
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
  if (ref.mode === 'conversation' && !ref.exerciseId) {
    // Reuse real words. Known equivalent meanings must not compete with the model.
    const meanings = (text: string) => [data.CONV_VOCAB?.[text]?.base_meaning, data.VOCAB[text]?.ja].filter((v): v is string => !!v).flatMap(vocabularyAliases);
    const excluded = new Set(detail.words.flatMap(word => [...vocabularyAliases(word.meaning), ...meanings(word.text)]));
    const excludedText = new Set(detail.words.map(word => vocabularyKey(word.text)));
    const local = [...new Set(data.getExamples(ref.themeId, ref.levelId ?? 1).flatMap(example => puzzleSentenceWords(example.ne)))];
    const sources = [shuffle(local, seededRandom(seed + 113)), Object.values(data.WORDS ?? {}).flat().map(word => word.ne)];
    let added = 0;
    for (const candidates of sources) {
      for (const text of candidates) {
        if (added >= 2) break;
        if (excludedText.has(vocabularyKey(text)) || meanings(text).some(meaning => excluded.has(meaning))) continue;
        const roman = data.CONV_VOCAB?.[text]?.rom || data.VOCAB[text]?.rom || toRomaji(text);
        if (!roman || puzzleSentenceWords(text).length !== 1) continue;
        excludedText.add(vocabularyKey(text));
        tokens.push({ id: `extra-${added++}`, text, roman });
      }
      if (added >= 2) break;
    }
  }
  return { ...detail, puzzleTokens: shuffle(tokens, seededRandom(seed + 239)), answerWords: detail.words.map(word => word.text) };
}

export function matchesPuzzle(tokens: { id: string; text: string }[], selected: string[], expected: string[]) {
  if (selected.length !== expected.length || new Set(selected).size !== selected.length) return false;
  const byId = new Map(tokens.map(token => [token.id, token.text.normalize('NFC')]));
  return selected.every((id, i) => byId.get(id) === expected[i].normalize('NFC'));
}
