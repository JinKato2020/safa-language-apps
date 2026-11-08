import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { LearningSound } from '../LearningSound';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { createFreePracticeSession, type PracticeStage } from '../practicePool';
import { freePracticeQuestion, matchesPuzzle } from '../freePractice';
import { rateStudy, resolveStudy } from '../learning';
import type { RootStackParamList } from '../types';

/** A single persisted question; moving on replaces params instead of growing the stack. */
export default function FreePracticeScreen() {
  const data = useAppData(), learning = useLearning()!, { lang } = useI18n(), en = lang === 'en', ss = useScaleStyle();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Practice'>>();
  const session = useRoute<RouteProp<RootStackParamList, 'Practice'>>().params.studySession!;
  const position = session.freePractice ? 0 : session.position ?? 0;
  const current = session.items[position], mode = session.freePractice?.stage ?? session.questionStages?.[position] ?? 2;
  const answered = session.freePractice?.answered ?? session.answered?.length ?? 0;
  const ex = current && resolveStudy(data, current), path = data.LEARNING_PATH;
  const step = path?.steps.find(s => s.guideThemeId === current?.themeId);
  const question = useMemo(() => ex ? freePracticeQuestion(data, current, session.choiceSeed ?? 0) : null, [data, current, ex, session.choiceSeed]);
  const [choice, setChoice] = useState(''), [order, setOrder] = useState<string[]>([]), [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false), [hint, setHint] = useState(false), [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null), playNumber = useRef(0), busy = useRef(false), focused = useRef(true);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; setPlaying(null); }; }, []));
  useLayoutEffect(() => nav.setOptions({ title: en ? 'Practice your way' : '自由に練習' }), [nav, en]);
  const stopAudio = useCallback(() => setPlaying(null), []);
  const labels = en ? ['Choose a form', 'Choose a meaning', 'Word-order puzzle'] : ['形を選ぶ', '意味を選ぶ', '語順パズル'];
  const solved = !!question && (revealed || (mode === 2 ? choice === question.conjugation?.target.text : mode === 3 ? choice === ex?.jp : checked && matchesPuzzle(question.puzzleTokens, order, question.answerWords)));
  const action = (id: string, label: string, onPress: () => void, primary = false, disabled = false) => <Pressable testID={id} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, primary && styles.primary, disabled && styles.disabled]}><Text style={[ss(16, 25), primary ? styles.primaryText : styles.link]}>{label}</Text></Pressable>;
  async function draw(nextMode: PracticeStage, countAnswer: boolean) {
    if (busy.current || !learning.ready || !path || !ex || !current || !step) return;
    busy.current = true; setSaving(true); setPlaying(null);
    let launch: ReturnType<typeof createFreePracticeSession> | undefined;
    const saved = await learning.change(state => {
      const next = countAnswer ? rateStudy(state, current, 'supported', Date.now()) : state;
      launch = createFreePracticeSession(next, path, current.themeId, nextMode, answered + Number(countAnswer));
      return launch.state;
    });
    busy.current = false; setSaving(false);
    if (!focused.current) return;
    if (saved && launch) nav.setParams(launch.params);
  }
  if (!ex || !question || !step) return <View style={styles.container}><Text style={ss(18, 28)}>{en ? 'This practice has changed. Please open it again from the lesson.' : '練習内容が更新されました。教材から開き直してください。'}</Text>{action('free-back', en ? 'Back' : '戻る', () => nav.goBack())}</View>;
  const conj = question.conjugation, roman = question.words.map(w => w.roman).join(' ');
  const tokens = new Map(question.puzzleTokens.map(token => [token.id, token]));
  const extras = question.puzzleTokens.length - question.answerWords.length;
  const wrongTokens = order.some(id => id.startsWith('extra-'));
  const exercise = current.exerciseId ? path?.exercises?.[current.exerciseId] : undefined;
  const selection = exercise?.selection;
  const canForm = !!conj, canMeaning = question.meaningChoices.length > 1;
  return <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.heading}><Text style={[styles.theme, ss(14, 23)]}>{step.title}</Text><Text testID="free-count" style={[styles.count, ss(14, 23)]}>{en ? `${answered} practised` : `${answered}問取り組んだ`}</Text></View>
    <View style={styles.modes}>{([2, 3, 4] as const).map((stage, i) => {
      const disabled = saving || !learning.ready || (stage === 2 && !canForm) || (stage === 3 && !canMeaning);
      return <Pressable key={stage} testID={`free-mode-${stage}`} accessibilityRole="tab" accessibilityState={{ selected: mode === stage, disabled }} disabled={disabled} onPress={() => { if (stage !== mode) void draw(stage, false); }} style={[styles.mode, mode === stage && styles.modeSelected, disabled && styles.disabled]}><Text style={[ss(14, 22), mode === stage ? styles.link : styles.muted]}>{labels[i]}</Text></Pressable>;
    })}</View>
    <Text style={[styles.muted, ss(13, 22)]}>{en ? 'Switch any time. Keep going for as long as you like.' : '好きな練習だけでOK。途中で切り替えもできます。'}</Text>
    <Text accessibilityRole="header" style={[styles.title, ss(23, 34)]}>{labels[mode - 2]}</Text>
    {(mode !== 3 || solved) && <Text style={[styles.body, ss(18, 29)]}>{ex.jp}</Text>}
    {mode !== 4 && <View style={styles.sentence}><Text style={[styles.nepali, ss(27, 41)]}>{mode === 2 && !solved ? question.parts.map((part, i) => i === conj?.target.index ? (conj.prefix ?? '') + '＿＿＿' : part).join('') : ex.ne}</Text>{(mode === 3 || solved) && <Text style={[styles.muted, ss(16, 25)]}>{roman}</Text>}</View>}
    {mode === 2 && conj && !solved && <>
      <Text style={[styles.body, ss(16, 26)]}>{conj.prompt ?? (en ? 'Choose the form that fits this sentence.' : 'この文に合う形を選ぼう。')}</Text>
      <View style={styles.options}>{conj.choices.map((option, i) => action(`free-choice-${i}`, option.form + (option.roman ? ` · ${option.roman}` : ''), () => setChoice(option.form), false, saving))}</View>
      {!!choice && <Text accessibilityRole="alert" style={[styles.feedback, ss(16, 26)]}>{en ? 'Try another form. Check the subject and the rule in the hints.' : 'ほかの形を試そう。ヒントで主語とルールを確認できます。'}</Text>}
    </>}
    {mode === 3 && !solved && <>
      <Text style={[styles.body, ss(16, 26)]}>{en ? 'What does this sentence mean?' : 'この文は、どんな意味？'}</Text>
      <View style={styles.options}>{question.meaningChoices.map((text, i) => action(`free-choice-${i}`, text, () => setChoice(text), false, saving))}</View>
      {!!choice && <Text accessibilityRole="alert" style={[styles.feedback, ss(16, 26)]}>{en ? 'Try again. You can check the words in the hints.' : 'もう一度選んでみよう。ヒントで単語の意味を確認できます。'}</Text>}
    </>}
    {mode === 4 && !solved && <>
      <Text style={[styles.body, ss(16, 26)]}>{en ? `Build the model’s basic word order. ${extras} extra choices are not needed.` : `見本の基本語順で組み立てよう。使わない選択肢が${extras}つあります。`}</Text>
      <View testID="free-answer" style={styles.answer}>
        <Text style={[styles.muted, ss(13, 21)]}>{order.length} / {question.answerWords.length} {en ? 'words · tap to remove' : '語・タップで取り消し'}</Text>
        <View style={styles.chips}>{order.length ? order.map((id, i) => <Pressable key={id} testID={`free-remove-${i}`} accessibilityRole="button" accessibilityLabel={`${en ? 'Remove' : '取り消す'}: ${tokens.get(id)!.text}`} onPress={() => { setOrder(order.filter(x => x !== id)); setChecked(false); }} style={styles.answerChip}><Text style={[styles.nepali, ss(23, 35)]}>{tokens.get(id)!.text}</Text></Pressable>) : <Text style={[styles.muted, ss(16, 26)]}>{en ? 'Choose words from below' : '下の語句から選んでね'}</Text>}</View>
      </View>
      <View testID="free-bank" style={styles.chips}>{question.puzzleTokens.map(token => {
        const used = order.includes(token.id), disabled = used || order.length >= question.answerWords.length || saving;
        return <Pressable key={token.id} testID={`free-token-${token.id}`} accessibilityRole="button" accessibilityLabel={token.text} accessibilityState={{ disabled }} disabled={disabled} onPress={() => { setOrder([...order, token.id]); setChecked(false); }} style={[styles.chip, used && styles.used]}><Text style={[styles.nepali, ss(23, 35)]}>{token.text}</Text>{!!token.roman && <Text style={[styles.muted, ss(13, 21)]}>{token.roman}</Text>}</Pressable>;
      })}</View>
      {order.length > 0 && action('free-reset', en ? 'Clear your sentence' : '並びをやり直す', () => { setOrder([]); setChecked(false); })}
      {action('free-check', en ? 'Check the sentence' : '文を確かめる', () => setChecked(true), true, order.length !== question.answerWords.length || saving)}
      {checked && <Text accessibilityRole="alert" style={[styles.feedback, ss(16, 26)]}>{wrongTokens ? (en ? 'One of the words does not fit this sentence. Tap a selected word to replace it.' : 'この文に合わない語が入っています。選んだ語をタップして入れ替えてみよう。') : (en ? 'Compare the order with the model. Nepali can also allow other word orders.' : '見本の基本語順と比べてみよう。ネパール語では、ほかの語順が使える場合もあります。')}</Text>}
    </>}
    {solved ? <>
      <View testID="free-feedback" style={styles.success}><Text style={[styles.link, ss(18, 29)]}>{revealed ? (en ? 'Check the model' : '見本で確認しよう') : (en ? 'That’s right!' : '正解！')}</Text>{mode === 4 && <><Text style={[styles.nepali, ss(27, 41)]}>{ex.ne}</Text><Text style={[styles.muted, ss(16, 25)]}>{roman}</Text></>}{(mode === 2 || mode === 4) && <Text style={[styles.body, ss(16, 26)]}>{selection?.rule ?? conj?.family}</Text>}</View>
      {action('free-next', saving ? (en ? 'Saving…' : '保存中…') : (en ? 'Next question' : '次の問題へ'), () => void draw(mode, true), true, saving || !learning.ready)}
    </> : action('free-model', en ? 'Show the answer' : '答えを見て確認', () => setRevealed(true), false, saving)}
    {action('free-hint', hint ? (en ? 'Close hints' : 'ヒントを閉じる') : (en ? 'Word & rule hints' : '単語・ルールのヒント'), () => setHint(!hint))}
    {hint && <View testID="free-hints" style={styles.hints}><Text style={[styles.link, ss(16, 26)]}>{selection?.rule ?? conj?.family}</Text>{question.words.map((word, i) => <View key={i} style={styles.gloss}><Text style={[styles.nepali, ss(19, 30)]}>{word.text} <Text style={[styles.muted, ss(14, 23)]}>{word.roman}</Text></Text><Text style={[styles.body, ss(15, 24)]}>{word.meaning}</Text></View>)}</View>}
    {exercise?.audio && (mode === 3 || solved || hint) && <>{action('free-audio', en ? 'Listen to the sentence' : '文の音声を聞く', () => setPlaying(++playNumber.current))}{playing !== null && <LearningSound key={playing} audio={exercise.audio} onFinished={stopAudio} />}</>}
    {learning.error && <Text accessibilityRole="alert" style={[styles.error, ss(16, 26)]}>{en ? 'Could not save. Your question is still here; please try again.' : '保存できませんでした。今の問題を残しています。もう一度お試しください。'}</Text>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  heading: { gap: 5 }, theme: { color: '#475569', fontWeight: '600' }, count: { color: '#0f766e', fontWeight: '700' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, mode: { minHeight: 44, justifyContent: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', flexGrow: 1 }, modeSelected: { backgroundColor: '#ecfdf5', borderColor: '#0f766e' },
  title: { color: '#0f172a', fontWeight: '800' }, body: { color: '#334155' }, muted: { color: '#64748b' }, nepali: { color: '#0f172a', fontWeight: '600' }, link: { color: '#0f766e', fontWeight: '700' },
  sentence: { backgroundColor: '#f0fdfa', borderRadius: 18, padding: 18, gap: 7 }, options: { gap: 9 },
  button: { minHeight: 48, justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#99d5cb', backgroundColor: '#ffffff' }, primary: { backgroundColor: '#0f766e', borderColor: '#0f766e' }, primaryText: { color: '#ffffff', fontWeight: '700', textAlign: 'center' }, disabled: { opacity: .5 },
  answer: { backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#ddd6fe', padding: 14, borderRadius: 16, minHeight: 100, gap: 10 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { maxWidth: '100%', minHeight: 48, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: '#b9c6d8', backgroundColor: '#fff', borderRadius: 12 }, answerChip: { maxWidth: '100%', minHeight: 44, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#ede9fe', borderRadius: 10 }, used: { opacity: .3 },
  feedback: { color: '#6d28d9' }, success: { backgroundColor: '#ecfdf5', borderRadius: 16, padding: 16, gap: 8 }, hints: { backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, gap: 10 }, gloss: { gap: 2, borderTopWidth: 1, borderColor: '#dbeafe', paddingTop: 8 }, error: { color: '#9f1239' },
});
