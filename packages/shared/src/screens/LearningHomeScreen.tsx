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

const c = { ink: '#123039', muted: '#52666C', navy: '#102F38', teal: '#7DE2CE', page: '#F2F5F3' };
const EMPTY = emptyStudyState();

export default function LearningHomeScreen({ accessory }: { accessory?: ReactNode }) {
  const nav = useNavigation<any>(), { lang , copy: trCopy } = useI18n(), { top } = useSafeAreaInsets();
  const data = useAppData(), learning = useLearning(), hero = useHeroImage('grammar');
  const { tabDesign, tabDesignEnabled } = useSettings();
  const palette = tabDesignEnabled ? tabPalette(tabDesign, 'home') : undefined;
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
  const displaySize = width < 360 ? 21 : 25;
  const due = useMemo(() => reviewItems(state, data, now), [state, data, now]);
  const resume = state.resume && resolveStudy(data, state.resume.item) ? state.resume : undefined;
  const action = resume ? (trCopy('c_c3e74a179b32', '前回の続きへ', 'Continue where you left off'))
    : due.length ? (trCopy('c_534c3db39d21', `${due.length}文を復習する`, `Review ${due.length} sentences`, {p0: due.length}))
    : (trCopy('c_0b84f22d7823', '文字と音から始める', 'Explore letters & sounds'));
  const start = () => {
    if (resume) nav.navigate('Practice', practiceParams(resume.item, resume.session));
    else if (due.length) nav.navigate('Practice', practiceParams(due[0], { kind: 'review', items: due }));
    else nav.navigate('LettersSounds');
  };
  const ratio = hero == null ? 3 : (() => { const asset = Image.resolveAssetSource(hero); return asset.width / asset.height; })();

  const primaryColor = palette ? (tabDesign === 'blueprint' ? palette.mastAccent : palette.accent) : c.teal;
  const primaryInk = palette && tabDesign === 'minimal' ? '#FFFFFF' : c.navy;
  const heroBody = <>
      {hero != null && <View style={{ width: '100%', height: Math.min((Math.min(width, 760) - 24) / ratio, shortScreen ? 68 : 136) }}>
        <Image source={hero} resizeMode="contain" style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      </View>}

      <View style={[styles.heroBody, shortScreen && styles.shortHeroBody]}>
        <Text testID="home-motto" accessibilityRole="header" style={[styles.headline, { fontSize: displaySize, lineHeight: displaySize + 6 }, palette && { color: palette.mastInk }]}>
          Small steps build great <Text style={[styles.strength, palette && { color: palette.mastAccent }]}>strength.</Text>
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={start} style={({ pressed }) => [styles.primary, { backgroundColor: primaryColor }, pressed && styles.pressed]}>
          <Text style={[styles.primaryText, { color: primaryInk }]}>{action}</Text><Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.arrow, { color: primaryInk }]}>↗</Text>
        </Pressable>
      </View>
  </>;

  return <ScrollView testID="learning-home" style={{ backgroundColor: palette?.page ?? c.page, marginTop: top }} contentContainerStyle={styles.page}>
    {palette ? <TabMastheadFrame palette={palette} compact testID="home-masthead">{heroBody}</TabMastheadFrame> : <View style={styles.hero}>{heroBody}</View>}

    <View testID="home-content-grid" style={[styles.grid, palette && shortScreen && styles.shortGrid]}>
      <View style={styles.tileRow}>
        <HomeTile id="home-letters" title={trCopy('c_2f46b1d4291b', '文字と音', 'Letters & sounds')} kind="letters" color="#E0EFE8" onPress={() => nav.navigate('LettersSounds')} />
        {guideCount > 0 && <HomeTile id="home-grammar-lessons" title={trCopy('c_c12a73a72dcb', '文法教材', 'Grammar')} kind="grammar" color="#E5EAF7" onPress={() => nav.navigate('GrammarLibrary')} />}
      </View>
      <View style={styles.tileRow}>
        <HomeTile id="home-vocabulary" title={trCopy('c_d282e858f43a', '単語', 'Words')} kind="vocabulary" color="#ECE8F4" onPress={() => nav.navigate('VocabCategory')} />
        {!!data.NEPALI_DICTIONARY?.entries.length && <HomeTile id="home-dictionary" title={trCopy('c_df9dedb2fa8a', 'ネパール語辞書', 'Dictionary')} kind="dictionary" color="#DFEDF0" onPress={() => nav.navigate('NepaliDictionary')} />}
      </View>
      {(hasCulture || accessory != null) && <View style={styles.tileRow}>
        {hasCulture && <HomeTile id="home-culture-break" title={lang === 'ja' ? 'ひと休み' : readingCopy(lang).breaks} kind="culture" color="#F2E8D7" onPress={() => nav.navigate('CultureBreak')} />}
        {accessory}
      </View>}
    </View>
    {learning?.error && <Pressable accessibilityRole="button" onPress={learning.retry} style={styles.error}><Text style={styles.errorText}>{trCopy('c_70a7891dec6e', '学習記録を読み込み・保存できませんでした。タップして再試行。', 'Could not load or save progress. Tap to retry.')}</Text></Pressable>}
  </ScrollView>;
}

export function HomeTile({ id, title, kind, color, onPress, unreadLabel }: {
  id: string; title: string; kind: 'letters' | 'grammar' | 'vocabulary' | 'dictionary' | 'culture' | 'announcement';
  color: string; onPress: () => void; unreadLabel?: string;
}) {
  const { width, height } = useWindowDimensions();
  const { tabDesign, tabDesignEnabled } = useSettings();
  const palette = tabDesignEnabled ? tabPalette(tabDesign, 'home') : undefined;
  const iconInk = palette?.accent ?? '#234D48';
  const compact = width < 360;
  return <Pressable testID={id} accessibilityRole="button" accessibilityLabel={unreadLabel ? `${title} · ${unreadLabel}` : title} onPress={onPress}
    style={({ pressed }) => [
      styles.tile, { backgroundColor: palette ? (pressed ? palette.soft : palette.surface) : color },
      palette && { borderRadius: tabCardRadius, borderWidth: 1, borderColor: palette.line },
      compact && styles.compactTile, height < 640 && styles.shortTile, pressed && !palette && styles.pressed,
    ]}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
      {kind==='letters' ? <Text style={[styles.letterIcon, { color: iconInk }]}>अ</Text> : <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={iconInk} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {kind==='grammar' ? <><Path d="M12 5C8 3 5 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1Z"/><Path d="M12 5v15M5 8l4 1M5 12l4 1M15 9l4-1M15 13l4-1"/></>
          : kind==='vocabulary' ? <><Rect x="6" y="3" width="15" height="17" rx="3"/><Path d="M3 7v12a3 3 0 0 0 3 3M10 8h7M10 12h5"/></>
          : kind==='culture' ? <Path d="M3 8h13v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm13 2h2a3 3 0 0 1 0 6h-2M2 21h19M7 5V3m5 2V3"/>
          : kind==='announcement' ? <Path d="M5 17h14l-2-3V9a5 5 0 1 0-10 0v5Zm5 3a2 2 0 0 0 4 0"/>
          : <><Path d="M4 3h12a2 2 0 0 1 2 2v4M4 3v17M4 3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7M7 7h7M7 11h3"/><Circle cx="16" cy="15" r="4"/><Path d="m19 18 3 3"/></>}
      </Svg>}
    </View>
    <Text style={[styles.tileTitle, compact && styles.compactTileTitle, palette && { color: palette.ink }]}>{title}</Text>
    {unreadLabel && <View testID={`${id}-unread`} style={styles.unreadDot} />}
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 12, paddingBottom: 18, gap: 10, maxWidth: 760, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: c.navy, borderRadius: 18, overflow: 'hidden' },
  heroBody: { padding: 12 },
  shortHeroBody: { paddingVertical: 8 },
  headline: { color: '#F5FAF8', fontWeight: '600', letterSpacing: -.5 },
  strength: { color: c.teal, fontWeight: '800' },
  primary: { marginTop: 8, backgroundColor: c.teal, borderRadius: 11, minHeight: 44, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryText: { flex: 1, color: c.navy, fontSize: 15, lineHeight: 23, fontWeight: '700' }, arrow: { color: c.navy, fontSize: 23, lineHeight: 28 },
  grid: { gap: 8 }, tileRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  shortGrid: { gap: 5 },
  tile: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 13, gap: 7, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 23, minHeight: 24, justifyContent: 'center' }, letterIcon: { color: '#234D48', fontSize: 23, lineHeight: 29, fontWeight: '600' },
  compactTile: { paddingHorizontal: 8, gap: 5 }, compactTileTitle: { fontSize: 14, lineHeight: 19 },
  shortTile: { minHeight: 44, paddingVertical: 3 },
  tileTitle: { flex: 1, color: c.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#C4253E' },
  error: { padding: 16, borderRadius: 14, backgroundColor: '#FCEEEF' }, errorText: { color: '#8B2945', fontSize: 13, lineHeight: 21 }, pressed: { opacity: 0.78 },
});
