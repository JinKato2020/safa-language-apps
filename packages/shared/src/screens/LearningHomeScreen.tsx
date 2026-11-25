import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AppState, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeroImage } from '../heroImages';
import { Text } from '../Text';
import { useI18n } from '../i18n';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { emptyStudyState, practiceParams, resolveStudy, reviewItems } from '../learning';
import { useGrammarGuide } from '../grammarGuide';
import { readingCopy } from '../grammarReading';
import { useSettings } from '../SettingsContext';
import { TabMastheadFrame, tabCardRadius, tabPalette } from '../tabAppearance';

const EMPTY = emptyStudyState();

export default function LearningHomeScreen({ accessory }: { accessory?: ReactNode }) {
  const nav = useNavigation<any>(), { lang, t, copy: trCopy } = useI18n(), { top } = useSafeAreaInsets();
  const data = useAppData(), learning = useLearning(), hero = useHeroImage('grammar');
  const { tabDesign, practiceDirection } = useSettings();
  const palette = tabPalette('home', tabDesign);
  const guides = useGrammarGuide(), guideCount = data.GRAMMAR_THEMES.filter(theme => guides?.[String(theme.id)]?.length).length;
  const hasCulture = Object.values(guides ?? {}).some(blocks => blocks.some(block => block.lessonSupplement?.kind === 'culture'));
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer); const current = Date.now(); setNow(current);
      const tomorrow = new Date(current); tomorrow.setHours(24, 0, 1, 0);
      timer = setTimeout(refresh, tomorrow.getTime() - current);
    };
    refresh();
    const sub = AppState.addEventListener('change', value => { if (value === 'active') refresh(); });
    return () => { clearTimeout(timer); sub.remove(); };
  }, []));
  const state = learning?.state ?? EMPTY;
  const { width, height } = useWindowDimensions();
  const shortScreen = height < 640;
  const room = Math.max(0, Math.min(1, (height - 640) / 180));
  const pageInset = Math.round(12 + room * 6);
  const pageSpacing = room > 0 ? {
    paddingHorizontal: pageInset,
    paddingTop: Math.round(12 + room * 10),
    gap: Math.round(10 + room * 10),
  } : undefined;
  const rowStyle = [styles.tileRow, room > 0 && { minHeight: Math.round(52 + room * 40), gap: Math.round(8 + room * 6) }];
  const displaySize = width < 360 ? 21 : 25;
  const due = useMemo(() => reviewItems(state, data, now, 5, practiceDirection), [state, data, now, practiceDirection]);
  const resume = state.resume && (state.resume.session || !due.length) && resolveStudy(data, state.resume.item) ? state.resume : undefined;
  const action = resume ? (trCopy('c_c3e74a179b32', '前回の続きへ', 'Continue where you left off'))
    : due.length ? trCopy('c_534c3db39d21', `${due.length}文を復習する`, `Review ${due.length} sentences`, {p0: due.length}) : null;
  const start = () => {
    if (resume) nav.navigate('Practice', practiceParams(resume.item, resume.session));
    else if (due.length) nav.navigate('Practice', practiceParams(due[0], { kind: 'review', items: due, ...(due[0].exerciseId ? {} : { direction: practiceDirection }) }));
  };
  const ratio = hero == null ? 3 : (() => { const asset = Image.resolveAssetSource(hero); return asset.width / asset.height; })();

  const heroBody = <>
      {hero != null && <View testID="home-hero-image" style={[styles.heroArt, {
        minHeight: Math.min((Math.min(width, 760) - pageInset * 2) / ratio, shortScreen ? 64 : 136),
      }]}>
        <Image source={hero} resizeMode="cover" style={styles.heroImage} accessibilityIgnoresInvertColors />
      </View>}

      <View style={[styles.heroBody, shortScreen && styles.shortHeroBody, room > 0 && {
        paddingHorizontal: Math.round(12 + room * 7), paddingVertical: Math.round(12 + room * 10),
      }]}>
        <Text testID="home-motto" accessibilityRole="header" style={[styles.headline, { fontSize: displaySize, lineHeight: displaySize + 6, color: palette.mastInk }]}>
          Small steps build great <Text style={[styles.strength, { color: palette.mastAccent }]}>strength.</Text>
        </Text>
      </View>
  </>;

  return <ScrollView testID="learning-home"
    style={{ backgroundColor: palette.page, marginTop: palette.dark ? 0 : top }}
    contentContainerStyle={[styles.page, hero != null && styles.fillPage, pageSpacing, palette.dark && { paddingTop: top + (pageSpacing?.paddingTop ?? 12) }]}>
    <TabMastheadFrame palette={palette} compact expand={hero != null} testID="home-masthead">{heroBody}</TabMastheadFrame>

    <View testID="home-content-grid" style={[styles.grid, shortScreen && styles.shortGrid, room > 0 && { gap: Math.round(8 + room * 6) }]}>
      <View style={rowStyle}>
        <HomeTile id="home-letters" title={trCopy('c_2f46b1d4291b', '文字と音', 'Letters & sounds')} kind="letters" onPress={() => nav.navigate('LettersSounds')} />
        {guideCount > 0 && <HomeTile id="home-grammar-lessons" title={trCopy('c_c12a73a72dcb', '文法教材', 'Grammar')} kind="grammar" onPress={() => nav.navigate('GrammarLibrary')} />}
      </View>
      <View style={rowStyle}>
        <HomeTile id="home-vocabulary" title={trCopy('c_d282e858f43a', '単語', 'Words')} kind="vocabulary" onPress={() => nav.navigate('VocabCategory')} />
        {!!data.NEPALI_DICTIONARY?.entries.length && <HomeTile id="home-dictionary" title={trCopy('c_df9dedb2fa8a', 'ネパール語辞書', 'Dictionary')} kind="dictionary" onPress={() => nav.navigate('NepaliDictionary')} />}
      </View>
      {(hasCulture || accessory != null) && <View style={rowStyle}>
        {hasCulture && <HomeTile id="home-culture-break" title={lang === 'ja' ? 'ひと休み' : readingCopy(lang).breaks} kind="culture" onPress={() => nav.navigate('CultureBreak')} />}
        {accessory}
      </View>}
      <View style={[styles.tileRow, { minHeight: shortScreen ? 44 : 56 }]}>
        <HomeTile id="home-similar-sounds" title={t('similarSounds.title')} badge={t('similarSounds.newBadge')} kind="sounds" onPress={() => nav.navigate('SimilarSounds')} />
      </View>
    </View>
    {action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={start}
      style={({ pressed }) => [styles.studyAction, { backgroundColor: palette.surface, borderColor: palette.line }, pressed && styles.pressed]}>
      <Text style={[styles.studyActionText, { color: palette.accent }]}>{action}</Text>
    </Pressable>}
    {learning?.error && <Pressable accessibilityRole="button" onPress={learning.retry} style={[styles.error, { backgroundColor: palette.surface, borderColor: palette.line }]}><Text style={[styles.errorText, { color: palette.danger }]}>{trCopy('c_70a7891dec6e', '学習記録を読み込み・保存できませんでした。タップして再試行。', 'Could not load or save progress. Tap to retry.')}</Text></Pressable>}
  </ScrollView>;
}

export function HomeTile({ id, title, kind, onPress, unreadLabel, badge }: {
  id: string; title: string; kind: 'letters' | 'grammar' | 'vocabulary' | 'dictionary' | 'culture' | 'announcement' | 'sounds';
  onPress: () => void; unreadLabel?: string; badge?: string;
}) {
  const { width, height } = useWindowDimensions();
  const { tabDesign } = useSettings();
  const palette = tabPalette('home', tabDesign);
  const iconInk = palette.accent;
  const compact = width < 360;
  return <Pressable testID={id} accessibilityRole="button" accessibilityLabel={[title, badge, unreadLabel].filter(Boolean).join(' · ')} onPress={onPress}
    style={({ pressed }) => [
      styles.tile, palette.dark && styles.forestTile,
      { backgroundColor: pressed ? palette.soft : palette.surface, borderColor: pressed ? palette.edge : palette.line },
      compact && styles.compactTile, height < 640 && styles.shortTile,
    ]}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[styles.icon, compact && styles.compactIcon, palette.dark && styles.forestIcon, { backgroundColor: palette.soft }]}>
      {kind==='letters' ? <Text style={[styles.letterIcon, compact && styles.compactLetterIcon, { color: iconInk }]}>अ</Text> : <Svg width={compact ? 17 : 20} height={compact ? 17 : 20} viewBox="0 0 24 24" fill="none" stroke={iconInk} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {kind==='grammar' ? <><Path d="M12 5C8 3 5 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1Z"/><Path d="M12 5v15M5 8l4 1M5 12l4 1M15 9l4-1M15 13l4-1"/></>
          : kind==='vocabulary' ? <><Rect x="6" y="3" width="15" height="17" rx="3"/><Path d="M3 7v12a3 3 0 0 0 3 3M10 8h7M10 12h5"/></>
          : kind==='culture' ? <Path d="M3 8h13v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm13 2h2a3 3 0 0 1 0 6h-2M2 21h19M7 5V3m5 2V3"/>
          : kind==='announcement' ? <Path d="M5 17h14l-2-3V9a5 5 0 1 0-10 0v5Zm5 3a2 2 0 0 0 4 0"/>
          : kind==='sounds' ? <Path d="M3 10v4m4-8v12m5-15v18m5-14v10m4-7v4"/>
          : <><Path d="M4 3h12a2 2 0 0 1 2 2v4M4 3v17M4 3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7M7 7h7M7 11h3"/><Circle cx="16" cy="15" r="4"/><Path d="m19 18 3 3"/></>}
      </Svg>}
      {unreadLabel && <View testID={`${id}-unread`} style={[styles.unreadDot, { backgroundColor: palette.unread, borderColor: palette.surface }]} />}
    </View>
    <Text style={[styles.tileTitle, compact && styles.compactTileTitle, { color: palette.ink }]}>{title}</Text>
    {badge && <Text testID={`${id}-badge`} style={[styles.featureBadge, { color: palette.accent, backgroundColor: palette.soft }]}>{badge}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 12, paddingBottom: 8, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' },
  fillPage: { flexGrow: 1 },
  heroArt: { width: '100%', flexGrow: 1, position: 'relative', overflow: 'hidden' },
  heroImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  heroBody: { padding: 12 },
  shortHeroBody: { paddingVertical: 8 },
  headline: { fontWeight: '600', letterSpacing: -.5 },
  strength: { fontWeight: '800' },
  studyAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: tabCardRadius },
  studyActionText: { fontSize: 14, lineHeight: 22, fontWeight: '700' },
  grid: { gap: 8 }, tileRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  shortGrid: { gap: 5 },
  tile: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderRadius: tabCardRadius, gap: 9, flexDirection: 'row', alignItems: 'center' },
  forestTile: { borderRadius: 15 },
  icon: { position: 'relative', width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  compactIcon: { width: 24, height: 26 },
  forestIcon: { borderRadius: 11 },
  letterIcon: { fontSize: 21, lineHeight: 28, fontWeight: '600' },
  compactLetterIcon: { fontSize: 18, lineHeight: 24 },
  compactTile: { paddingHorizontal: 7, gap: 5 }, compactTileTitle: { fontSize: 14, lineHeight: 19 },
  shortTile: { minHeight: 44, paddingVertical: 3 },
  tileTitle: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  featureBadge: { fontSize: 11, lineHeight: 16, fontWeight: '700', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2 },
  unreadDot: { position: 'absolute', top: -3, end: -3, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  error: { padding: 16, borderWidth: 1, borderRadius: tabCardRadius },
  errorText: { fontSize: 13, lineHeight: 21 },
  pressed: { opacity: 0.78 },
});
