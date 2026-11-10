import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { useSettings, useScaleStyle } from '../SettingsContext';
import { isLockedAt, useEntitlement } from '../entitlement';
import { toRomaji } from '../transliterate';
import type { RootStackParamList } from '../types';
import { answerVocabularyQuiz, nextVocabularyQuiz, prepareVocabularyDecks, startVocabularyQuiz, type VocabularyDeck, type VocabularyDirection } from '../vocabularyQuiz';

export default function VocabularyQuizScreen() {
  const data = useAppData(), { t, lang , copy: trCopy } = useI18n(), ent = useEntitlement();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { categoryId, direction } = useRoute<RouteProp<RootStackParamList, 'Flashcard'>>().params;
  const decks = useMemo(() => prepareVocabularyDecks(data.WORDS, categoryId), [data.WORDS, categoryId]);
  useLayoutEffect(() => nav.setOptions({ title: trCopy('c_a7fb752caad4', '単語クイズ', 'Vocabulary quiz') }), [nav, lang, trCopy]);
  const index = data.WORD_CATEGORIES.findIndex(c => c.id === categoryId);
  const locked = index >= 0 && isLockedAt(ent, index);
  if (locked || index < 0 || !decks.ne2ja.questions.length || !decks.ja2ne.questions.length) return <View style={styles.container}>
    <Text style={styles.empty}>{locked ? (trCopy('c_fb7e831a839f', 'このテーマを解放すると練習できます。', 'Unlock this theme to practise its words.')) : (trCopy('c_49f1da83b734', '4択にできる単語が不足しています。別のテーマを選んでください。', 'There are not enough distinct word meanings for a four-choice quiz. Please choose another theme.'))}</Text>
    <Pressable testID="vocab-quiz-back" accessibilityRole="button" onPress={() => locked ? nav.navigate('Paywall') : nav.goBack()} style={styles.next}><Text style={styles.nextText}>{locked ? (trCopy('c_7b318c514302', 'テーマを解放', 'Unlock themes')) : (trCopy('c_120d00f16d92', 'テーマに戻る', 'Back to themes'))}</Text></Pressable>
  </View>;
  const category = data.CONTENT_NAMES?.categories?.[categoryId] ?? t(`vocabCategories.${categoryId}`);
  return <QuizSession key={`${categoryId}:${data.nativeLang}:${direction}:${decks.ne2ja.revision}`} decks={decks} initialDirection={direction} category={category} />;
}

function QuizSession({ decks, initialDirection, category }: { decks: Record<VocabularyDirection, VocabularyDeck>; initialDirection: VocabularyDirection; category: string }) {
  const { t, lang , copy: trCopy } = useI18n(), en = lang === 'en', { romaji } = useSettings(), ss = useScaleStyle();
  const direction = initialDirection;
  const [sessions, setSessions] = useState(() => ({ ne2ja: startVocabularyQuiz(decks.ne2ja)!, ja2ne: startVocabularyQuiz(decks.ja2ne)! }));
  const scroll = useRef<ScrollView>(null), session = sessions[direction], question = session.question;
  const answered = !!session.response, promptIsNepali = direction === 'ne2ja';
  const choose = (id: string | null) => setSessions(current => {
    const next = answerVocabularyQuiz(current[direction], id);
    return next === current[direction] ? current : { ...current, [direction]: next };
  });
  const nextQuestion = () => {
    setSessions(current => {
      const next = nextVocabularyQuiz(decks[direction], current[direction]);
      return next === current[direction] ? current : { ...current, [direction]: next };
    });
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  return <ScrollView ref={scroll} style={styles.root} contentContainerStyle={styles.container}>
    <View style={styles.meta}><Text style={[styles.category, ss(16, 25)]}>{category}</Text><Text style={[styles.muted, ss(13, 22)]}>{decks[direction].questions.length}{trCopy('c_d17430b8f47d', '語', ' words')}</Text></View>
    <View style={styles.counts}><Text testID="vocab-quiz-count" style={[styles.muted, ss(13, 22)]}>{trCopy('c_69768e234ffb', `今回 ${session.answered}問`, `${session.answered} answered this session`, {p0: session.answered})}</Text><Text testID="vocab-quiz-score" style={[styles.score, ss(13, 22)]}>{trCopy('c_025f1ade73c0', `正解 ${session.correct}問`, `${session.correct} correct`, {p0: session.correct})}</Text></View>
    <View testID="vocab-quiz-prompt" style={styles.prompt}>
      <Text style={[styles.promptLabel, ss(13, 22)]}>{promptIsNepali ? (trCopy('c_d79cc997341a', '意味を選ぼう', 'Choose the meaning')) : (trCopy('c_5b41da71852b', 'ネパール語を選ぼう', 'Choose the Nepali word'))}</Text>
      <Text testID="vocab-quiz-word" style={[styles.promptText, ss(promptIsNepali ? 34 : 28, promptIsNepali ? 48 : 41)]}>{question.prompt}</Text>
      {promptIsNepali && romaji && <Text style={[styles.promptRoman, ss(16, 26)]}>{toRomaji(question.prompt)}</Text>}
    </View>
    <View style={styles.options}>{question.choices.map((option, index) => {
      const correct = answered && option.id === question.id, incorrect = answered && session.response?.choice === option.id && !correct;
      return <Pressable key={option.id} testID={`vocab-option-${index}`} accessibilityRole="button" accessibilityLabel={`${option.text}${correct ? (trCopy('c_329a7f06b724', '、正解', ', correct answer')) : incorrect ? (trCopy('c_bd067216dbe5', '、選んだ答え、不正解', ', your answer, incorrect')) : ''}`} accessibilityState={{ disabled: answered }} disabled={answered} onPress={() => choose(option.id)} style={({ pressed }) => [styles.option, correct && styles.optionCorrect, incorrect && styles.optionIncorrect, answered && !correct && !incorrect && styles.optionQuiet, pressed && styles.pressed]}>
        <Text style={[styles.optionLetter, correct && styles.correctInk, incorrect && styles.incorrectInk, ss(14, 22)]}>{correct ? '✓' : incorrect ? '×' : String.fromCharCode(65 + index)}</Text>
        <View style={styles.optionBody}><Text style={[styles.optionText, correct && styles.correctInk, incorrect && styles.incorrectInk, ss(promptIsNepali ? 20 : 25, promptIsNepali ? 31 : 37)]}>{option.text}</Text>{!promptIsNepali && romaji && <Text style={[styles.muted, ss(14, 23)]}>{toRomaji(option.text)}</Text>}</View>
      </Pressable>;
    })}</View>
    {answered ? <>
      <View testID="vocab-quiz-feedback" accessibilityLiveRegion="polite" style={styles.feedback} onLayout={() => scroll.current?.scrollToEnd({ animated: true })}>
        <Text style={[styles.feedbackTitle, ss(18, 28)]}>{session.response?.correct ? (trCopy('c_82df0295e579', '正解！', 'Correct!')) : session.response?.choice === null ? (trCopy('c_6495d71d08a2', '答えを確認しよう', 'Check the answer')) : (trCopy('c_a6811849c0fc', '正解はこちら', 'Here is the correct answer'))}</Text>
        <Text style={[styles.feedbackWord, ss(25, 37)]}>{question.word.ne}</Text>
        {romaji && <Text style={[styles.muted, ss(14, 23)]}>{toRomaji(question.word.ne)}</Text>}
        <Text style={[styles.optionText, ss(18, 28)]}>{question.word.ja}</Text>
      </View>
      <Pressable testID="vocab-quiz-next" accessibilityRole="button" onPress={nextQuestion} style={({ pressed }) => [styles.next, pressed && styles.pressed]}><Text style={[styles.nextText, ss(17, 27)]}>{trCopy('c_4106a42c46c7', '次の問題へ →', 'Next question →')}</Text></Pressable>
    </> : <Pressable testID="vocab-quiz-reveal" accessibilityRole="button" onPress={() => choose(null)} style={styles.reveal}><Text style={[styles.revealText, ss(15, 24)]}>{trCopy('c_ac325df68661', '答えを見て確認', 'Show the answer')}</Text></Pressable>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7f3' }, container: { padding: 20, paddingBottom: 36, gap: 14, width: '100%', maxWidth: 680, alignSelf: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 }, category: { flex: 1, color: '#334155', fontWeight: '700' }, muted: { color: '#52666c' },
  counts: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }, score: { color: '#126b60', fontWeight: '700' },
  prompt: { borderRadius: 20, padding: 20, gap: 7, backgroundColor: '#153f3b' }, promptLabel: { color: '#c1ded0', fontWeight: '600' }, promptText: { color: '#fff', fontWeight: '700' }, promptRoman: { color: '#d5e5dc' },
  options: { gap: 9 }, option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: '#ccd9d2', backgroundColor: '#fff' }, optionLetter: { color: '#64748b', minWidth: 18, fontWeight: '700' }, optionBody: { flex: 1, gap: 2 }, optionText: { color: '#183c3a' },
  optionCorrect: { borderColor: '#15806c', backgroundColor: '#e2f7ed' }, optionIncorrect: { borderColor: '#c76d87', backgroundColor: '#fff0f4' }, optionQuiet: { opacity: .6 }, correctInk: { color: '#0f6857', fontWeight: '700' }, incorrectInk: { color: '#9f3455' },
  feedback: { backgroundColor: '#edf4f1', borderRadius: 16, padding: 16, gap: 4 }, feedbackTitle: { color: '#126b60', fontWeight: '700' }, feedbackWord: { color: '#183c3a', fontWeight: '600' },
  next: { minHeight: 52, padding: 14, borderRadius: 14, backgroundColor: '#126b60', alignItems: 'center', justifyContent: 'center' }, nextText: { color: '#fff', fontSize: 17, fontWeight: '700' }, reveal: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 10 }, revealText: { color: '#52666c', fontWeight: '600' }, empty: { fontSize: 18, lineHeight: 29, color: '#334155' }, pressed: { opacity: .78 },
});
