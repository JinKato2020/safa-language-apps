import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { PuzzleBoard } from '../PuzzleBoard';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { createConversationPuzzleSession, createFreePracticeSession, type PracticeStage } from '../practicePool';
import { freePracticeQuestion, matchesPuzzle } from '../freePractice';
import { rateStudy, resolveStudy } from '../learning';
import type { RootStackParamList } from '../types';

/** A single persisted question; moving on replaces params instead of growing the stack. */
export default function FreePracticeScreen() {
  const data = useAppData(), learning = useLearning()!, { lang, t , copy: trCopy } = useI18n(), en = lang === 'en', ss = useScaleStyle();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Practice'>>();
  const session = useRoute<RouteProp<RootStackParamList, 'Practice'>>().params.studySession!;
  const puzzleOnly = session.freePractice?.puzzleOnly === true;
  const position = session.freePractice ? 0 : session.position ?? 0;
  const current = session.items[position], mode = session.freePractice?.stage ?? session.questionStages?.[position] ?? 2;
  const answered = session.freePractice?.answered ?? session.answered?.length ?? 0;
  const ex = current && resolveStudy(data, current), path = data.LEARNING_PATH;
  const conversationPuzzle = puzzleOnly && current?.mode === 'conversation';
  const step = conversationPuzzle ? undefined : path?.steps.find(s => s.guideThemeId === current?.themeId);
  const title = conversationPuzzle ? `${data.CONTENT_NAMES?.themes?.[current.themeId] ?? t(`themes.${current.themeId}`)} · ${data.CONTENT_NAMES?.levels?.[current.levelId ?? 1] ?? t(`levels.${current.levelId ?? 1}`)}` : step?.title;
  const question = useMemo(() => ex ? freePracticeQuestion(data, current, session.choiceSeed ?? 0) : null, [data, current, ex, session.choiceSeed]);
  const [choice, setChoice] = useState(''), [order, setOrder] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false), [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false), [showPuzzleIntro] = useState(() => !learning.state.puzzleIntroSeen);
  const busy = useRef(false), focused = useRef(true);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  useLayoutEffect(() => nav.setOptions({ title: puzzleOnly ? (trCopy('c_07bb342a1c56', '文章パズル', 'Sentence puzzles')) : (trCopy('c_0a0288f7db6f', '自由に練習', 'Practice your way')) }), [nav, en, puzzleOnly, trCopy]);
  useEffect(() => { if (mode === 4 && showPuzzleIntro && learning.ready) void learning.change(state => ({ ...state, puzzleIntroSeen: true })); }, [mode, showPuzzleIntro, learning.ready, learning.change]);
  const labels = lang === 'ko' ? ['형태 선택', '뜻 선택', '어순 퍼즐'] : en ? ['Choose a form', 'Choose a meaning', 'Word-order puzzle'] : ['形を選ぶ', '意味を選ぶ', '語順パズル'];
  const solved = !!question && (revealed || (mode === 2 ? choice === question.conjugation?.target.text : mode === 3 ? choice === ex?.jp : matchesPuzzle(question.puzzleTokens, order, question.answerWords)));
  const action = (id: string, label: string, onPress: () => void, primary = false, disabled = false) => <Pressable testID={id} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, primary && styles.primary, disabled && styles.disabled]}><Text style={[ss(16, 25), primary ? styles.primaryText : styles.link]}>{label}</Text></Pressable>;
  async function draw(nextMode: PracticeStage, countAnswer: boolean) {
    if (busy.current || !learning.ready || !ex || !current || (!conversationPuzzle && (!path || !step))) return;
    busy.current = true; setSaving(true);
    let launch: ReturnType<typeof createFreePracticeSession> | undefined;
    const saved = await learning.change(state => {
      const next = countAnswer ? rateStudy(state, current, 'supported', Date.now()) : state;
      launch = conversationPuzzle
        ? createConversationPuzzleSession(next, data, current.themeId, current.levelId ?? 1, answered + Number(countAnswer))
        : createFreePracticeSession(next, path!, current.themeId, nextMode, answered + Number(countAnswer), Math.random, puzzleOnly);
      return launch.state;
    });
    busy.current = false; setSaving(false);
    if (!focused.current) return;
    if (saved && launch) nav.setParams(launch.params);
  }
  if (!ex || !question || !title) return <View style={styles.container}><Text style={ss(18, 28)}>{trCopy('c_d80e3b796124', '練習内容が更新されました。教材から開き直してください。', 'This practice has changed. Please open it again from the lesson.')}</Text>{action('free-back', trCopy('c_b72cd401b9a6', '戻る', 'Back'), () => nav.goBack())}</View>;
  const conj = question.conjugation, roman = question.words.map(w => w.roman).join(' ');
  const extras = question.puzzleTokens.length - question.answerWords.length;
  const wrongTokens = order.some(id => id.startsWith('extra-'));
  const canForm = !!conj, canMeaning = question.meaningChoices.length > 1;
  const longPrompt = ex.jp.length > (en ? 90 : 45);
  const promptFont = longPrompt ? 18 : 24;
  return <ScrollView scrollEnabled={!dragging} contentContainerStyle={styles.container}>
    <View style={styles.heading}><Text style={[styles.theme, ss(14, 23)]}>{title}</Text><Text testID="free-count" style={[styles.count, ss(14, 23)]}>{trCopy('c_539119ce688d', `${answered}問取り組んだ`, `${answered} practised`, {p0: answered})}</Text></View>
    {!puzzleOnly && <View style={styles.modes}>{([2, 3, 4] as const).map((stage, i) => {
      const disabled = saving || !learning.ready || (stage === 2 && !canForm) || (stage === 3 && !canMeaning);
      return <Pressable key={stage} testID={`free-mode-${stage}`} accessibilityRole="tab" accessibilityState={{ selected: mode === stage, disabled }} disabled={disabled} onPress={() => { if (stage !== mode) void draw(stage, false); }} style={[styles.mode, mode === stage && styles.modeSelected, disabled && styles.disabled]}><Text style={[ss(14, 22), mode === stage ? styles.link : styles.muted]}>{labels[i]}</Text></Pressable>;
    })}</View>}
    {!puzzleOnly && <Text accessibilityRole="header" style={[styles.title, ss(23, 34)]}>{labels[mode - 2]}</Text>}
    {mode === 4 ? <View testID="free-prompt" style={styles.prompt}><Text style={[styles.promptLabel, ss(12, 20)]}>{trCopy('c_46069856389c', 'この意味の文を作ろう', 'BUILD THIS MEANING')}</Text><Text style={[styles.promptText, ss(promptFont, longPrompt ? 28 : 37)]}>{ex.jp}</Text></View> : (mode !== 3 || solved) && <Text style={[styles.body, ss(18, 29)]}>{ex.jp}</Text>}
    {mode !== 4 && <View style={styles.sentence}><Text style={[styles.nepali, ss(27, 41)]}>{mode === 2 && !solved ? question.parts.map((part, i) => i === conj?.target.index ? (conj.prefix ?? '') + '＿＿＿' : part).join('') : ex.ne}</Text>{(mode === 3 || solved) && <Text style={[styles.muted, ss(16, 25)]}>{roman}</Text>}</View>}
    {mode === 2 && conj && !solved && <>
      <Text style={[styles.body, ss(16, 26)]}>{conj.prompt ?? (trCopy('c_f0e79553efc0', 'この文に合う形を選ぼう。', 'Choose the form that fits this sentence.'))}</Text>
      <View style={styles.options}>{conj.choices.map((option, i) => action(`free-choice-${i}`, option.form + (option.roman ? ` · ${option.roman}` : ''), () => setChoice(option.form), false, saving))}</View>
      {!!choice && <Text accessibilityRole="alert" style={[styles.feedback, ss(16, 26)]}>{trCopy('c_b5af0ce36d54', 'ほかの形を試そう。', 'Try another form.')}</Text>}
    </>}
    {mode === 3 && !solved && <>
      <Text style={[styles.body, ss(16, 26)]}>{trCopy('c_23ef0fd84e66', 'この文は、どんな意味？', 'What does this sentence mean?')}</Text>
      <View style={styles.options}>{question.meaningChoices.map((text, i) => action(`free-choice-${i}`, text, () => setChoice(text), false, saving))}</View>
      {!!choice && <Text accessibilityRole="alert" style={[styles.feedback, ss(16, 26)]}>{trCopy('c_574bdd338e20', 'もう一度選んでみよう。', 'Try another meaning.')}</Text>}
    </>}
    {mode === 4 && !solved && <>
      {showPuzzleIntro && <Text testID="free-puzzle-intro" style={[styles.body, ss(15, 25)]}>{trCopy('c_1fbaecc5935d', `見本の基本語順で組み立てよう。使わない選択肢が${extras}つあります。`, `Build the model’s basic word order. ${extras} extra choices are not needed.`, {p0: extras})}</Text>}
      <PuzzleBoard tokens={question.puzzleTokens} order={order} limit={question.answerWords.length} onChange={setOrder} onDragging={setDragging} disabled={saving}/>
      {order.length === question.answerWords.length && <Text accessibilityRole="alert" style={[styles.feedback, ss(16, 26)]}>{wrongTokens ? (trCopy('c_acc2ff69718b', '語句を入れ替えてみよう。', 'Try replacing a word.')) : (trCopy('c_a3ff844d17f5', '語順を確かめよう。', 'Try a different order.'))}</Text>}
    </>}
    {solved ? <>
      <View testID="free-feedback" style={styles.success}><Text style={[styles.link, ss(18, 29)]}>{revealed ? (trCopy('c_2d1749b3fb4f', '見本で確認しよう', 'Check the model')) : (trCopy('c_7f681918ef28', '正解！', 'That’s right!'))}</Text>{mode === 4 && <><Text style={[styles.nepali, ss(27, 41)]}>{ex.ne}</Text><Text style={[styles.muted, ss(16, 25)]}>{roman}</Text></>}</View>
      {action('free-next', saving ? (trCopy('c_53c4c52fdd49', '保存中…', 'Saving…')) : (trCopy('c_7c59b5151a8f', '次の問題へ', 'Next question')), () => void draw(mode, true), true, saving || !learning.ready)}
    </> : action('free-model', trCopy('c_ac325df68661', '答えを見て確認', 'Show the answer'), () => setRevealed(true), false, saving)}
    {learning.error && <Text accessibilityRole="alert" style={[styles.error, ss(16, 26)]}>{trCopy('c_a5a1e10e48e4', '保存できませんでした。今の問題を残しています。もう一度お試しください。', 'Could not save. Your question is still here; please try again.')}</Text>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  heading: { gap: 5 }, theme: { color: '#475569', fontWeight: '600' }, count: { color: '#0f766e', fontWeight: '700' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, mode: { minHeight: 44, justifyContent: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', flexGrow: 1 }, modeSelected: { backgroundColor: '#ecfdf5', borderColor: '#0f766e' },
  title: { color: '#0f172a', fontWeight: '800' }, body: { color: '#334155' }, muted: { color: '#64748b' }, nepali: { color: '#0f172a', fontWeight: '600' }, link: { color: '#0f766e', fontWeight: '700' },
  sentence: { backgroundColor: '#f0fdfa', borderRadius: 18, padding: 18, gap: 7 }, options: { gap: 9 },
  button: { minHeight: 48, justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#99d5cb', backgroundColor: '#ffffff' }, primary: { backgroundColor: '#0f766e', borderColor: '#0f766e' }, primaryText: { color: '#ffffff', fontWeight: '700', textAlign: 'center' }, disabled: { opacity: .5 },
  prompt: { backgroundColor: '#153f3b', borderRadius: 18, padding: 20, gap: 8 }, promptLabel: { color: '#c1ded0', fontWeight: '600' }, promptText: { color: '#ffffff', fontWeight: '700' },
  feedback: { color: '#6d28d9' }, success: { backgroundColor: '#ecfdf5', borderRadius: 16, padding: 16, gap: 8 }, error: { color: '#9f1239' },
});
