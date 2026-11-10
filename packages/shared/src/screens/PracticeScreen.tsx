import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Line, Path, Polyline } from 'react-native-svg';
import { colors, spacing, radius } from '../theme';
import type { RootStackParamList } from '../types';
import { useSettings, useScaleStyle } from '../SettingsContext';
import { useI18n } from '../i18n';
import { useAppData } from '../AppDataContext';
import { getL1 } from '../l1';
import { useCardFlip } from '../useCardFlip';
import { useHorizontalSwipe } from '../useHorizontalSwipe';
import { grammarThemeLabel, withoutThemePrefix } from '../themeLabels';
import { useLearning } from '../LearningContext';
import { learningCopy } from '../learningCopy';
import { learningStyles } from '../LearningLaunch';
import { rateStudy, resolveStudy, studyKey, stepSignature, type StudyRef } from '../learning';
import GuidedPracticeScreen from './GuidedPracticeScreen';
import FreePracticeScreen from './FreePracticeScreen';
import ExampleStudyScreen from './ExampleStudyScreen';

function tokenize(text: string): string[] {
  return text
    .replace(/([।॥?!,;:"'"'（）()「」『』])/g, ' $1 ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
}
function isPunct(w: string): boolean {
  return /^[।॥?!,;:"'"'（）()「」『』]+$/.test(w);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Practice'>;
type R = RouteProp<RootStackParamList, 'Practice'>;

// モノクロ SVG アイコン
function SpeakerIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.inkMute} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </Svg>
  );
}

export default function PracticeScreen() {
  const learning = useLearning();
  const params = useRoute<R>().params;
  // Existing 15-question course resumes also enter free practice at their saved question.
  const session = params.studySession;
  if (learning && session && (session.freePractice || (session.kind === 'course' && session.questionStages?.length)) && !params.challenge) return <FreePracticeScreen key={JSON.stringify(params)} />;
  if (learning && params.studySession && !params.challenge) return <GuidedPracticeScreen key={JSON.stringify(params)} />;
  if (learning && params.examplesOnly && params.mode === 'grammar') return <ExampleStudyScreen key={JSON.stringify(params)} />;
  return <ChallengePracticeScreen />;
}

function ChallengePracticeScreen() {
  const contentNames = useAppData().CONTENT_NAMES;
  const data = useAppData();
  const { LEVELS, THEMES, GRAMMAR_THEMES, getExamples, getGrammarExamples, audio, VOCAB, GRAMMAR_VOCAB, CONV_VOCAB, JP_READING, nativeLang, vocabTokenize, grammarTextOnlyLabel } = data;
  const learning = useLearning();
  const { nepaliAudio, japaneseAudio, nepaliGrammarAudio, japaneseGrammarAudio } = audio;
  const l1 = getL1(nativeLang, data.targetLang);
  const navigation = useNavigation<Nav>();
  const { t, lang , copy: trCopy } = useI18n();
  const isJaUI = lang === 'ja';
  // 母語(訳)側UIか＝学習対象(ネパール語)を「単語」列に出す。ja/en=母語UI(App A)。
  // ne/bn UI(App B 等)は逆向き(対象語を単語列・母語を意味列)。
  const glossUI = data.targetLang === 'ne' || lang === 'ja' || lang === 'en';
  const { themeId: initialThemeId, levelId: initialLevelId, startIndex, mode, studySession: session } = useRoute<R>().params;
  const [position, setPosition] = useState(session?.position ?? 0);
  const [answered, setAnswered] = useState<string[]>(session?.answered ?? []);
  const [finished, setFinished] = useState(false), [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const selected = session?.items[position];
  const isGrammar = selected ? selected.mode === 'grammar' : mode === 'grammar';
  const sessionValid = !session || (session.items.length > 0 && session.items.every(r => resolveStudy(data, r)));
  const studyCopy = learningCopy(lang);

  // テーマを跨いだナビゲーションのため、themeId/levelId/index を state にする
  const [normalThemeId, setThemeId] = useState(initialThemeId);
  const [normalLevelId, setLevelId] = useState<number>(initialLevelId ?? 1);
  const [normalIndex, setIndex] = useState(startIndex ?? 0);
  const themeId = selected?.themeId ?? normalThemeId, levelId = selected?.levelId ?? normalLevelId, index = selected?.index ?? normalIndex;
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setThemeId(initialThemeId); setLevelId(initialLevelId ?? 1); setIndex(startIndex ?? 0);
    setPosition(session?.position ?? 0); setAnswered(session?.answered ?? []); setFinished(false); setRevealed(false);
  }, [initialThemeId, initialLevelId, startIndex, mode, session]);

  const examples = useMemo(
    () => (isGrammar ? getGrammarExamples(themeId) : getExamples(themeId, levelId)),
    // nativeLang(=パック) が変わったら再計算 (言語切替を既存画面にも反映)
    [isGrammar, themeId, levelId, nativeLang, getExamples, getGrammarExamples],
  );
  const themeName = isGrammar
    ? withoutThemePrefix(grammarThemeLabel(GRAMMAR_THEMES, themeId, t(`grammarThemes.${themeId}`)))
    : (contentNames?.themes?.[themeId] ?? t(`themes.${themeId}`));
  // 表示番号はテーマ選択画面と同じ「リスト位置」に揃える(themeId=データキーは並び替えでidとズレるため)。
  const themeNo = ((isGrammar ? GRAMMAR_THEMES : THEMES).findIndex(x => x.id === themeId) + 1) || themeId;
  const levelName = isGrammar ? t('practice.grammarLabel') : (contentNames?.levels?.[levelId] ?? t(`levels.${levelId}`));

  const { practiceDirection, romaji } = useSettings();
  const ss = useScaleStyle();
  const { flip, animatedStyle } = useCardFlip();

  useLayoutEffect(() => {
    navigation.setOptions({ title: isGrammar ? t('practice.titleGrammar') : t('practice.titleConv') });
  }, [navigation, isGrammar, t]);

  const ex = examples[index];
  const current: StudyRef = { mode: isGrammar ? 'grammar' : 'conversation', themeId, ...(isGrammar ? {} : { levelId }), index, ne: ex?.ne ?? '' };
  const currentKey = studyKey(current);
  const ready = learning?.ready;
  const change = learning?.change;
  useEffect(() => {
    if (!ready || !change || !ex || finished || !sessionValid) return;
    void change(s => ({ ...s, resume: { item: current, ...(session ? { session: { ...session, position, answered } } : {}) } }));
  }, [currentKey, ex?.ne, ready, change, finished, sessionValid, session, position, answered]);
  const isJa2Ne = practiceDirection === 'ja2ne';
  const audioKey = isGrammar
    ? `${themeId}-${index + 1}`
    : `${themeId}-${levelId}-${index + 1}`;

  // 問題側音声プレイヤー / 答え側音声プレイヤー
  const neSrc = isGrammar ? nepaliGrammarAudio[audioKey] : nepaliAudio[audioKey];
  const jaSrc = isGrammar ? japaneseGrammarAudio[audioKey] : japaneseAudio[audioKey];
  const questionAudioSrc = isJa2Ne ? jaSrc : neSrc;
  const answerAudioSrc = isJa2Ne ? neSrc : jaSrc;
  const questionPlayer = useAudioPlayer(questionAudioSrc);
  const answerPlayer = useAudioPlayer(answerAudioSrc);

  const playOnce = (player: ReturnType<typeof useAudioPlayer>) => {
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  // テーマを跨いで次/前へ進む
  const go = (delta: number) => {
    questionPlayer.pause(); answerPlayer.pause();
    if (session) {
      setPosition(p => Math.max(0, Math.min(session.items.length - 1, p + delta)));
      setRevealed(false); return;
    }
    if (delta > 0) {
      // 次へ
      if (index + 1 < examples.length) {
        setIndex(index + 1);
      } else {
        // 次のテーマ（文法は同一系列、会話は同レベル → 次レベル）
        if (isGrammar) {
          for (let t = themeId + 1; t <= GRAMMAR_THEMES.length; t++) {
            if (getGrammarExamples(t).length > 0) {
              setThemeId(t);
              setIndex(0);
              setRevealed(false);
              return;
            }
          }
        } else {
          // 同レベルで次のテーマ
          for (let t = themeId + 1; t <= THEMES.length; t++) {
            if (getExamples(t, levelId).length > 0) {
              setThemeId(t);
              setIndex(0);
              setRevealed(false);
              return;
            }
          }
          // 全テーマ終わり → 次のレベルの先頭テーマへ
          if (levelId < LEVELS.length) {
            for (let t = 1; t <= THEMES.length; t++) {
              if (getExamples(t, levelId + 1).length > 0) {
                setThemeId(t);
                setLevelId(levelId + 1);
                setIndex(0);
                setRevealed(false);
                return;
              }
            }
          }
        }
      }
    } else {
      // 前へ
      if (index > 0) {
        setIndex(index - 1);
      } else {
        // 前のテーマの最終例題
        if (isGrammar) {
          for (let t = themeId - 1; t >= 1; t--) {
            const exs = getGrammarExamples(t);
            if (exs.length > 0) {
              setThemeId(t);
              setIndex(exs.length - 1);
              setRevealed(false);
              return;
            }
          }
        } else {
          for (let t = themeId - 1; t >= 1; t--) {
            const exs = getExamples(t, levelId);
            if (exs.length > 0) {
              setThemeId(t);
              setIndex(exs.length - 1);
              setRevealed(false);
              return;
            }
          }
          // 前のレベルの末尾テーマへ
          if (levelId > 1) {
            for (let t = THEMES.length; t >= 1; t--) {
              const exs = getExamples(t, levelId - 1);
              if (exs.length > 0) {
                setThemeId(t);
                setLevelId(levelId - 1);
                setIndex(exs.length - 1);
                setRevealed(false);
                return;
              }
            }
          }
        }
      }
    }
    setRevealed(false);
  };

  // 端判定（無効化用）
  const atFirst = session ? position === 0 : index === 0 && themeId === 1 && (isGrammar || levelId === 1);
  const atLast = (() => {
    if (session) return position === session.items.length - 1;
    if (index < examples.length - 1) return false;
    if (isGrammar) return themeId >= GRAMMAR_THEMES.length;
    if (themeId < THEMES.length) return false;
    return levelId >= LEVELS.length;
  })();

  // 横スワイプで移動（左=次へ / 右=前へ）。端では無効。
  // カード上で開始したジェスチャーはスワイプ無効（タップのみ）にするための ref。
  const cardSwipeBlock = useRef(false);
  const swipe = useHorizontalSwipe(
    () => { if (!atLast && !savingRef.current) go(1); },
    () => { if (!atFirst && !savingRef.current) go(-1); },
    cardSwipeBlock,
  );

  const record = async (result: 'known' | 'again') => {
    if (!learning?.ready || !revealed || savingRef.current || !ex) return;
    savingRef.current = true; setSaving(true);
    const nextAnswered = [...new Set([...answered, currentKey])];
    const complete = !!session && session.items.every(r => nextAnswered.includes(studyKey(r)));
    const saved = await learning.change(state => {
      let next = rateStudy(state, current, result, Date.now());
      if (complete && session) {
        next = { ...next, resume: undefined };
        if (session.kind === 'course' && session.stepId) next.completed = { ...next.completed, [session.stepId]: stepSignature(session.items) };
      }
      return next;
    });
    savingRef.current = false; setSaving(false);
    if (!saved) return;
    setAnswered(nextAnswered);
    if (complete) { questionPlayer.pause(); answerPlayer.pause(); setFinished(true); }
    else if (session) { setPosition(session.items.findIndex(r => !nextAnswered.includes(studyKey(r)))); setRevealed(false); }
    else if (!atLast) go(1);
  };

  if (session && (!sessionValid || finished)) return <ScrollView contentContainerStyle={styles.container}>
    <View style={[learningStyles.card,learningStyles.green]}>
      <Text accessibilityRole="header" style={[learningStyles.title,ss(22,32)]}>{finished ? studyCopy.finish : studyCopy.unavailable}</Text>
      {finished && <Text style={[learningStyles.body,ss(16,27)]}>{studyCopy.finishBody}</Text>}
      <Pressable accessibilityRole="button" style={learningStyles.primary} onPress={() => navigation.goBack()}><Text style={[learningStyles.primaryText,ss(16,24)]}>{trCopy('c_3474b9c8237c', '一覧に戻る', 'Back to list')}</Text></Pressable>
    </View>
  </ScrollView>;

  if (!ex) return null;

  const questionText = isJa2Ne ? ex.jp : ex.ne;
  const answerText = isJa2Ne ? ex.ne : ex.jp;

  // 現在表示するテキスト（未反転: 問題側、反転: 答え側）
  const displayText = revealed ? answerText : questionText;
  const displayIsNe = revealed ? isJa2Ne : !isJa2Ne;
  const currentPlayer = revealed ? answerPlayer : questionPlayer;

  // 日本語文の読み補助 (かな+ローマ字)。言語=ネパール語で日本語カード表示時に使用。
  const jpReading = JP_READING?.[ex.jp];

  return (
    <View style={styles.swipeWrap} {...swipe}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.metaRow}>
        {session && <Text style={[learningStyles.badge,ss(16,25)]}>{studyCopy.session} · {position + 1} / {session.items.length}</Text>}
        <Text style={[styles.metaText, ss(12)]}>
          <Text style={styles.metaCur}>{themeNo}.</Text> {themeName} · {levelName} · {t('practice.exampleCounter')} <Text style={styles.metaCur}>{index + 1}</Text> / {examples.length}
        </Text>
      </View>

      {/* センテンスカード（タップで言語切り替え・フリップアニメ付き／スワイプ移動はしない=タップのみ） */}
      <Pressable
        onPress={() => flip(() => setRevealed(r => !r))}
        onPressIn={() => { cardSwipeBlock.current = true; }}
        onPressOut={() => { cardSwipeBlock.current = false; }}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.sentenceCard, pressed && styles.sentenceCardPressed, animatedStyle]}>
            <Text style={[styles.cardHint, ss(10)]}>{t('practice.cardHint', { state: revealed ? t('practice.answer') : t('practice.question') })}</Text>
            <Text style={[
              displayIsNe ? styles.neText : styles.jaText,
              ss(displayIsNe ? 30 : 26, displayIsNe ? 44 : 40),
            ]}>{displayText}</Text>
            {/* 学習対象(ネパール語)テキストのローマ字: 母語UI(ja/en)で表示。romanizer を持つ L1 のみ */}
            {displayIsNe && romaji && glossUI && l1.romanizeSentence && (
              <Text style={[styles.romaji, ss(14, 22)]}>
                {isGrammar && l1.romanizeSentenceWithDict
                  ? l1.romanizeSentenceWithDict(ex.ne, (w) => GRAMMAR_VOCAB?.[w]?.rom ?? VOCAB[w]?.rom)
                  : l1.romanizeSentence(ex.ne)}
              </Text>
            )}
            {/* 日本語表示時 & 言語=ネパール語: かな(常時) + ローマ字(ローマ字設定ON) */}
            {!displayIsNe && !isJaUI && jpReading?.kana ? (
              <Text style={[styles.jaKana, ss(15, 23)]}>{jpReading.kana}</Text>
            ) : null}
            {!displayIsNe && !isJaUI && romaji && jpReading?.romaji ? (
              <Text style={[styles.romaji, ss(14, 22)]}>{jpReading.romaji}</Text>
            ) : null}
          </Animated.View>
        )}
      </Pressable>

      {/* 音声ボタン（言語の方向は設定で変更） */}
      <View style={styles.actionRow}>
        <Pressable
          disabled={(revealed ? answerAudioSrc : questionAudioSrc) == null}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed, (revealed ? answerAudioSrc : questionAudioSrc) == null && { opacity: 0.5 }]}
          onPress={() => playOnce(currentPlayer)}
        >
          <SpeakerIcon size={17} />
          <Text style={[styles.actionBtnText, ss(13)]}>{isGrammar && neSrc == null && jaSrc == null && grammarTextOnlyLabel ? grammarTextOnlyLabel : t('practice.playAudio')}</Text>
        </Pressable>
      </View>

      {/* スワイプで移動（左=次へ / 右=前へ） */}
      <View style={styles.swipeHintRow}>
        <Text style={[styles.swipeHint, ss(11)]}>{t('common.swipeHint')}</Text>
      </View>

      {learning && <View style={[learningStyles.card,learningStyles.green]}>
        <Text style={[learningStyles.body,ss(15,24)]}>{studyCopy.rating}</Text>
        {!revealed && <Pressable accessibilityRole="button" style={learningStyles.primary} onPress={()=>setRevealed(true)}><Text style={[learningStyles.primaryText,ss(16,24)]}>{studyCopy.reveal}</Text></Pressable>}
        {revealed && learning.ready && <View style={{gap:10}}>
          <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{disabled:saving}} style={learningStyles.primary} onPress={()=>record('known')}><Text style={[learningStyles.primaryText,ss(16,24)]}>{saving?studyCopy.saving:studyCopy.known}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{disabled:saving}} style={learningStyles.secondary} onPress={()=>record('again')}><Text style={[learningStyles.link,ss(16,24)]}>{studyCopy.again}</Text></Pressable>
        </View>}
        {learning.error && <Text style={[learningStyles.error,ss(15,24)]}>{studyCopy.error}</Text>}
      </View>}

      {/* 単語と意味 (全単語を表示)
            日本語 UI: ネパール語 (デーヴァナーガリー) + ローマ字 / 意味=日本語
            ネパール語 UI: 日本語 (各 ne 単語の ja 訳) / 意味=ネパール語  */}
      {(() => {
        // 文法: sentence_id = テーマ-例題 / 会話: テーマ-レベル-例題
        const sentenceId = isGrammar
          ? `${themeId}-${index + 1}`
          : `${themeId}-${levelId}-${index + 1}`;
        const ctxDict = isGrammar ? GRAMMAR_VOCAB : CONV_VOCAB;
        type Item = { word: string; jaTrans: string; rom: string; pos?: string | null; note?: string | null };
        let items: Item[];
        if (vocabTokenize === 'jp') {
          // 日本語(分かち書きなし): 空白分割は使えないため、辞書から この文ID を含む語を集め、
          // 日本語文中の出現位置順に並べる (App B 英語パック=学習対象の日本語を分解)。
          const arr: (Item & { at: number })[] = [];
          for (const [w, e] of Object.entries(ctxDict ?? {})) {
            const c = e.contexts?.find(cc => cc.sentence_id === sentenceId);
            if (!c) continue;
            arr.push({ word: w, jaTrans: c.ja || '', rom: e.rom || '', pos: c.pos, note: c.note, at: ex.jp.indexOf(w) });
          }
          arr.sort((a, b) => (a.at < 0 ? 1e9 : a.at) - (b.at < 0 ? 1e9 : b.at));
          items = arr;
        } else {
          // 既定: L1文(ex.ne)を空白分割。文脈依存辞書 → なければ既存 VOCAB へフォールバック。
          items = tokenize(ex.ne).filter(w => !isPunct(w)).map(word => {
            const gctxEntry = ctxDict?.[word];
            const matchedCtx = gctxEntry?.contexts?.find(c => c.sentence_id === sentenceId);
            const fallback = VOCAB[word] ?? {};
            return { word, jaTrans: matchedCtx?.ja || gctxEntry?.base_meaning || fallback.ja || '', rom: gctxEntry?.rom || fallback.rom || '', pos: matchedCtx?.pos, note: matchedCtx?.note };
          });
        }
        return (
          <View style={styles.wordsSection}>
            <View style={styles.wordHeader}>
              <Text style={styles.wordHeaderNum}>#</Text>
              <Text style={styles.wordHeaderLabel}>{t('practice.wordsHeader')}</Text>
              <Text style={styles.wordHeaderLabel}>{t('practice.meaningHeader')}</Text>
            </View>
            {items.map((it, i) => {
              const unknown = !it.jaTrans;
              // 単語列に学習対象、意味列に訳を出す。
              //  App A(target=ネパール語): 母語UI(ja/en)で単語列=ne。
              //  App B(vocabTokenize='jp', target=日本語): 全母語UI(bn/vi/ne/en)で単語列=日本語(it.word)、意味列=母語訳。
              const wordIsTarget = vocabTokenize === 'jp' || glossUI;
              // 単語列が日本語になるのは App B(jp) または App A の ne UI(母語=訳=日本語)。
              const wordIsJa = vocabTokenize === 'jp' || !glossUI;
              const primary = wordIsTarget ? it.word : (it.jaTrans || it.word);
              const primaryRom = wordIsTarget ? it.rom : '';
              const meaning = wordIsTarget ? it.jaTrans : it.word;
              return (
                <View key={i} style={[styles.wordRow, unknown && styles.wordRowUnknown]}>
                  <Text style={styles.wordNum}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={styles.wordContent}>
                    <Text style={[wordIsJa ? styles.wordJa : styles.wordDeva, ss(16)]}>{primary}</Text>
                    {romaji && primaryRom ? <Text style={[styles.wordRom, ss(11)]}>{primaryRom}</Text> : null}
                  </View>
                  <View style={styles.wordMeaningCol}>
                    <Text style={[styles.wordMeaning, unknown && styles.wordMeaningDim, ss(16)]}>
                      {meaning || t('practice.noDictionary')}
                    </Text>
                    {it.pos ? <Text style={[styles.wordCtxPos, ss(10)]}>{it.pos}</Text> : null}
                    {it.note ? <Text style={[styles.wordCtxNote, ss(10)]}>{it.note}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })()}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrap: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 760, width: '100%', alignSelf: 'center' },
  metaRow: { paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: spacing.lg },
  metaText: { fontFamily: 'Courier', fontSize: 12, color: colors.inkMute },
  metaCur: { color: colors.ink, fontWeight: '700' },

  // センテンスカード
  sentenceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  sentenceCardPressed: { backgroundColor: colors.bgSoft },
  cardHint: { fontFamily: 'Courier', fontSize: 10, color: colors.inkFaint, letterSpacing: 1.5, marginBottom: spacing.md },
  jaText: { fontSize: 26, lineHeight: 40, color: colors.ink, textAlign: 'center', fontWeight: '400' },
  neText: { fontSize: 30, lineHeight: 44, color: colors.ink, textAlign: 'center', fontWeight: '600' },
  jaKana: { fontSize: 15, lineHeight: 23, color: colors.inkMute, textAlign: 'center', marginTop: spacing.sm },
  romaji: { fontFamily: 'Courier', fontSize: 14, color: colors.inkQuiet, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },

  // 音声＋言語反転ボタン行
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  actionBtnPressed: { backgroundColor: colors.bgSoft, borderColor: colors.ink },
  actionBtnText: { fontSize: 13, color: colors.inkMute, fontWeight: '500' },

  // スワイプ案内
  swipeHintRow: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: 'center',
  },
  swipeHint: { fontFamily: 'Courier', fontSize: 11, color: colors.inkFaint, letterSpacing: 1 },

  // 前へ/番号/次へ
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  navBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  navPressed: { backgroundColor: colors.ink, borderColor: colors.ink },
  navDisabled: { opacity: 0.35 },
  navText: { fontSize: 14, fontWeight: '500', color: colors.ink },
  navTextDisabled: { color: colors.inkFaint },
  navCount: { fontFamily: 'Courier', fontSize: 13, color: colors.inkMute, fontWeight: '700', minWidth: 56, textAlign: 'center' },

  // 単語リスト
  wordsSection: { marginTop: spacing.xl },
  wordHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  wordHeaderNum: { fontFamily: 'Courier', fontSize: 10, color: colors.inkFaint, width: 32, letterSpacing: 1 },
  wordHeaderLabel: { flex: 1, fontFamily: 'Courier', fontSize: 10, color: colors.inkFaint, letterSpacing: 1 },
  wordMeaningCol: { flex: 1, gap: 2 },
  wordCtxPos: { fontFamily: 'Courier', fontSize: 10, color: colors.inkQuiet },
  wordCtxNote: { fontSize: 10, color: colors.inkFaint, fontStyle: 'italic' },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  wordRowUnknown: { opacity: 0.45 },
  wordNum: { fontFamily: 'Courier', fontSize: 12, color: colors.inkQuiet, width: 32 },
  wordContent: { flex: 1, gap: 3 },
  wordDeva: { fontSize: 20, fontWeight: '500', color: colors.ink },
  wordJa: { fontSize: 20, fontWeight: '500', color: colors.ink },
  wordRom: { fontFamily: 'Courier', fontSize: 11, color: colors.inkFaint, fontStyle: 'italic' },
  wordMeaning: { flex: 1, fontSize: 13, color: colors.ink },
  wordMeaningDim: { color: colors.inkFaint, fontStyle: 'italic' },
});
