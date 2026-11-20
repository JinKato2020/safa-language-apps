import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeHero, useHeroImage } from '../heroImages';
import { Text } from '../Text';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../theme';
import type { RootStackParamList } from '../types';
import { useScaleStyle, useSettings } from '../SettingsContext';
import { useI18n } from '../i18n';
import { useAppData } from '../AppDataContext';
import { useEntitlement, isLockedAt, LockBadge } from '../entitlement';
import { useGrammarGuide } from '../grammarGuide';
import { withoutThemePrefix } from '../themeLabels';
import { useLearning } from '../LearningContext';
import { createConversationPuzzleSession, createFreePracticeSession } from '../practicePool';
import { TabMasthead, tabPalette } from '../tabAppearance';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Theme'>;
type R = RouteProp<RootStackParamList, 'Theme'>;

export default function ThemeScreen() {
  const data = useAppData(), contentNames = data.CONTENT_NAMES;
  const { THEMES, GRAMMAR_THEMES, LEVELS, LEARNING_PATH } = data;
  const learning = useLearning();
  const busy = useRef(false), focused = useRef(true);
  const [starting, setStarting] = useState(false);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  const ent = useEntitlement();
  const grammarGuide = useGrammarGuide();
  const navigation = useNavigation<Nav>();
  const { t, lang , copy: trCopy } = useI18n();
  const ss = useScaleStyle();
  const settings = useSettings();
  const { mode, source, guidesOnHome, composition, puzzleOnly, grammarFirst, levelId } = useRoute<R>().params;
  const heroSrc = useHeroImage(composition ? 'conversation' : mode);
  const { top } = useSafeAreaInsets();
  const isListening = mode === 'listening';
  const tab = puzzleOnly ? 'puzzle' : composition ? 'composition' : isListening && grammarFirst ? 'listening' : undefined;
  const palette = tab && settings.tabDesignEnabled ? tabPalette(settings.tabDesign, tab) : undefined;
  // Route params retain the source and level when returning from practice/playback.
  const listenSource = source ?? (grammarFirst ? 'grammar' : 'conversation');
  const effectiveSource = isListening
    ? (listenSource === 'grammar' ? 'grammar' : undefined)
    : source;

  const isGrammarMode = mode === 'grammar';
  const isGrammarListen = isListening && effectiveSource === 'grammar';
  const isConversationListen = isListening && !isGrammarListen;
  const useGrammarThemes = isGrammarMode || isGrammarListen;
  const items = puzzleOnly && isGrammarMode ? GRAMMAR_THEMES.filter(theme => LEARNING_PATH?.steps.some(step => step.guideThemeId === theme.id && step.items.length)) : useGrammarThemes ? GRAMMAR_THEMES : THEMES;

  // 会話モードおよび聞き流し×会話モードでレベルピルを表示
  const showLevelPills = mode === 'conversation' || isConversationListen || mode === 'sakubun';
  const selectedLevel = levelId ?? 1;

  const titleText = t('themeScreen.title');

  useLayoutEffect(() => {
    navigation.setOptions({ title: titleText });
  }, [navigation, titleText]);

  let headerText: string;
  if (isGrammarMode) {
    headerText = guidesOnHome
      ? (trCopy('c_fb6fd62a5745', 'テーマを選んで、例題と音声で文法を身につけよう。', 'Choose a theme to practise its example sentences with audio.'))
      : t('themeScreen.headerGrammar');
  } else if (isGrammarListen || mode === 'listening') {
    headerText = t('themeScreen.headerListen');
  } else {
    headerText = t('themeScreen.headerConv');
  }

  // 聞き流しは会話/文法トグルに依らず常に「聞き流しモード」見出し
  let modeTitle: string;
  if (mode === 'grammar') {
    modeTitle = t('themeScreen.modeTitleGrammar');
  } else if (mode === 'listening') {
    modeTitle = t('themeScreen.modeTitleListen');
  } else if (mode === 'sakubun') {
    modeTitle = t('sakubun.title');
  } else {
    modeTitle = t('themeScreen.modeTitleConv');
  }

  const getThemeDisplayName = (id: number): string => {
    if (useGrammarThemes) {
      // 文法テーマ名はパック(GRAMMAR_THEMES[].name)から=OTA配信。i18nには依存しない。
      const gt = GRAMMAR_THEMES.find(x => x.id === id);
      return gt?.name ?? String(id);
    }
    return (contentNames?.themes?.[id] ?? t(`themes.${id}`));
  };

  if (composition) { modeTitle = t('nav.composition'); headerText = t('themeScreen.compositionDesc'); }
  if (puzzleOnly) { modeTitle = lang === 'en' ? 'Sentence puzzles' : t('nav.puzzle'); headerText = t('themeScreen.puzzleDesc'); }

  const onPressItem = async (id: number) => {
    if (puzzleOnly) {
      if (busy.current || !learning?.ready || (isGrammarMode && !LEARNING_PATH)) return;
      busy.current = true; setStarting(true);
      let launch: ReturnType<typeof createFreePracticeSession> | undefined;
      const saved = await learning.change(state => {
        launch = isGrammarMode
          ? createFreePracticeSession(state, LEARNING_PATH!, id, 4, 0, Math.random, true)
          : createConversationPuzzleSession(state, data, id, selectedLevel);
        return launch.state;
      });
      busy.current = false; setStarting(false);
      if (focused.current && saved && launch) navigation.navigate('Practice', launch.params);
    } else if (mode === 'sakubun') {
      navigation.navigate('Sakubun', { themeId: id, levelId: selectedLevel, startIndex: 0 });
    } else if (mode === 'grammar') {
      navigation.navigate('Practice', { themeId: id, mode: 'grammar' });
    } else if (isGrammarListen) {
      navigation.navigate('Listening', { themeId: id, source: 'grammar' });
    } else if (isConversationListen) {
      navigation.navigate('Listening', { themeId: id, levelId: selectedLevel });
    } else if (mode === 'conversation') {
      navigation.navigate('Practice', { themeId: id, levelId: selectedLevel });
    } else {
      navigation.navigate('Level', { mode, themeId: id });
    }
  };

  return (
    <FlatList
      testID="mode-theme-list"
      style={[palette && { backgroundColor: palette.page }, heroSrc != null && { marginTop: top }]}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
        {palette ? <TabMasthead title={modeTitle} description={headerText} palette={palette} image={heroSrc} />
          : heroSrc != null && <ModeHero source={heroSrc} />}
        <View style={[styles.head, palette && styles.refinedHead]}>
          {!palette && <>
            <Text style={[styles.modeTitle, ss(20)]}>{modeTitle}</Text>
            <Text style={[styles.desc, ss(14, 21)]}>{headerText}</Text>
          </>}
          {(composition || puzzleOnly) && <View style={[styles.sourceToggle, palette && styles.refinedToggle]}>{(['grammar', 'conversation'] as const).map(value => <Pressable key={value} testID={`${puzzleOnly ? 'puzzle' : 'composition'}-${value}`} accessibilityRole="tab" accessibilityState={{ selected: mode === value }} style={[styles.sourceTab, mode === value && styles.sourceTabOn, palette && styles.refinedSegment, palette && { backgroundColor: mode === value ? palette.accent : palette.surface, borderColor: mode === value ? palette.accent : palette.line }]} onPress={() => navigation.setParams({ mode: value })}><Text style={[styles.sourceTabText, mode === value && styles.sourceTabTextOn, palette && mode !== value && { color: palette.ink }, ss(14)]}>{t(`nav.${value}`)}</Text></Pressable>)}</View>}
          {puzzleOnly && learning?.error && <Text accessibilityRole="alert" style={[styles.desc, { color: '#9f1239' }]}>{trCopy('c_10a188e49af5', '保存できませんでした。テーマをタップして再試行してください。', 'Could not save. Please tap the theme to try again.')}</Text>}
          {isListening && <View style={[styles.sourceToggle, palette && styles.refinedToggle]}>
            {(grammarFirst ? ['grammar', 'conversation'] as const : ['conversation', 'grammar'] as const).map(value => <Pressable key={value} testID={`listen-source-${value}`} accessibilityRole="tab" accessibilityState={{ selected: listenSource === value }} style={[styles.sourceTab, listenSource === value && styles.sourceTabOn, palette && styles.refinedSegment, palette && { backgroundColor: listenSource === value ? palette.accent : palette.surface, borderColor: listenSource === value ? palette.accent : palette.line }]} onPress={() => navigation.setParams({ source: value })}>
              <Text style={[styles.sourceTabText, listenSource === value && styles.sourceTabTextOn, palette && listenSource !== value && { color: palette.ink }, ss(14)]}>{t(value === 'grammar' ? 'listenSource.grammarName' : 'listenSource.convName')}</Text>
            </Pressable>)}
          </View>}
          {showLevelPills && (
            <View style={styles.levelPillRow}>
              {LEVELS.map(lv => (
                <Pressable
                  key={lv.id}
                  testID={`theme-level-${lv.id}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedLevel === lv.id }}
                  style={[styles.levelPill, selectedLevel === lv.id && styles.levelPillOn, palette && { backgroundColor: selectedLevel === lv.id ? palette.soft : palette.surface, borderColor: selectedLevel === lv.id ? palette.edge : palette.line }]}
                  onPress={() => navigation.setParams({ levelId: lv.id })}
                >
                  <Text style={[styles.levelPillText, selectedLevel === lv.id && styles.levelPillTextOn, palette && { color: selectedLevel === lv.id ? palette.accent : palette.muted }, ss(13)]}>
                    {(contentNames?.levels?.[lv.id] ?? t(`levels.${lv.id}`))}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        </>
      }
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => {
        // 表示番号(index+1)が無料枠を超えたらロック。タップでペイウォールへ。
        const locked = isLockedAt(ent, index);
        // 文法モードで、ロックされておらず、このテーマの教材(解説)がある時だけ「教材」ボタンを右に表示。
        const showGuide = isGrammarMode && !guidesOnHome && !locked && !!grammarGuide && !!grammarGuide[String(item.id)];
        return (
          <Pressable
            testID={`theme-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={getThemeDisplayName(item.id)}
            accessibilityState={{ disabled: !!puzzleOnly && (starting || !learning?.ready) }}
            disabled={!!puzzleOnly && (starting || !learning?.ready)}
            style={({ pressed }) => [
              styles.card,
              palette ? [
                styles.refinedCard, index === 0 && styles.refinedFirst, index === items.length - 1 && styles.refinedLast,
                { borderColor: palette.line, backgroundColor: pressed ? palette.soft : palette.surface },
              ] : pressed && styles.cardPressed,
              locked && styles.cardLocked,
            ]}
            onPress={() => (locked ? navigation.navigate('Paywall') : onPressItem(item.id))}
          >
            {/* 表示番号はリスト上の位置(=テーマ並び順)。データキーは item.id を維持。 */}
            {palette ? <View style={[styles.themeIndex, { backgroundColor: palette.soft }]}>
              <Text style={[styles.refinedIndex, { color: palette.accent }]}>{String(index + 1).padStart(2, '0')}</Text>
            </View> : <Text style={styles.num}>{String(index + 1).padStart(2, '0')}</Text>}
            <Text style={[styles.name, palette && { color: palette.ink, fontWeight: '600' }, ss(palette ? 15 : 14)]}>{withoutThemePrefix(getThemeDisplayName(item.id))}</Text>
            {locked && <LockBadge />}
            {palette && !locked && <Text accessible={false} style={[styles.chevron, { color: palette.accent }]}>{lang === 'ar' ? '‹' : '›'}</Text>}
            {showGuide && (
              <Pressable
                style={({ pressed }) => [styles.guideBtn, pressed && styles.guideBtnPressed]}
                onPress={() => navigation.navigate('GrammarGuide', { themeId: item.id, title: getThemeDisplayName(item.id) })}
                hitSlop={6}
              >
                <Text style={[styles.guideBtnText, ss(12)]}>{trCopy('c_402678d91498', '教材', 'Guide')}</Text>
              </Pressable>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 760, width: '100%', alignSelf: 'center' },
  head: { marginBottom: spacing.xl },
  refinedHead: { marginBottom: 12 },
  modeTitle: { fontSize: 20, fontWeight: '700', color: colors.accentJa, letterSpacing: 0.2, marginBottom: spacing.sm, textAlign: 'center' },
  kicker: { fontSize: 11, color: colors.inkQuiet, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs, letterSpacing: -0.5 },
  desc: { fontSize: 14, color: colors.inkMute, lineHeight: 21, marginBottom: spacing.md },
  sourceToggle: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  refinedToggle: { gap: 6, marginBottom: 4 },
  refinedSegment: { flex: 1, minWidth: 0, borderRadius: 11, paddingHorizontal: 10 },
  sourceTab: {
    minWidth: 92,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  sourceTabOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  sourceTabText: { fontSize: 14, fontWeight: '600', color: colors.inkMute },
  sourceTabTextOn: { color: '#fff' },
  levelPillRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.xs },
  levelPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 99,
  },
  levelPillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  levelPillText: { fontSize: 13, fontWeight: '500', color: colors.inkMute },
  levelPillTextOn: { color: '#fff' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: { backgroundColor: colors.bgSoft, borderColor: colors.ink },
  refinedCard: { borderRadius: 0, minHeight: 55, marginBottom: 0, borderTopWidth: 0, paddingVertical: 9, gap: 10 },
  refinedFirst: { borderTopWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  refinedLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  themeIndex: { width: 35, height: 31, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  refinedIndex: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chevron: { fontSize: 21, lineHeight: 26 },
  cardLocked: { opacity: 0.55 },
  num: { fontFamily: 'Courier', fontSize: 11, color: colors.inkFaint, width: 24 },
  name: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.ink },
  guideBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.accentJa,
    backgroundColor: colors.surface,
  },
  guideBtnPressed: { backgroundColor: colors.bgSoft },
  guideBtnText: { fontSize: 12, fontWeight: '700', color: colors.accentJa },
});
