import { useCallback, useMemo, useState } from 'react';
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

const c = { ink: '#123039', muted: '#52666C', navy: '#102F38', teal: '#7DE2CE', page: '#F2F5F3' };
const EMPTY = emptyStudyState();

export default function LearningHomeScreen() {
  const nav = useNavigation<any>(), { lang , copy: trCopy } = useI18n(), { top } = useSafeAreaInsets();
  const data = useAppData(), learning = useLearning(), hero = useHeroImage('grammar');
  const guides = useGrammarGuide(), guideCount = data.GRAMMAR_THEMES.filter(theme => guides?.[String(theme.id)]?.length).length;
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
  const en = lang === 'en', state = learning?.state ?? EMPTY;
  const { width } = useWindowDimensions();
  const displaySize = width < 360 ? 25 : 36;
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

  return <ScrollView style={{ backgroundColor: c.page, marginTop: top }} contentContainerStyle={styles.page}>
    <View style={styles.hero}>
      {hero != null && <View style={{ width: '100%', aspectRatio: ratio }}>
        <Image source={hero} resizeMode="contain" style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      </View>}

      <View style={styles.heroBody}>
        <Text style={styles.eyebrow}>NEPALI · EVERY DAY</Text>
        <View testID="home-motto" accessible accessibilityLabel="Small steps build great strength." accessibilityRole="header" style={styles.motto}>
          <Text style={[styles.headline, { fontSize: displaySize, lineHeight: displaySize + 7 }]}>Small steps</Text>
          <Text style={[styles.headline, { fontSize: displaySize, lineHeight: displaySize + 7 }]}>build great</Text>
          <Text style={[styles.strength, { fontSize: displaySize + 8, lineHeight: displaySize + 17 }]}>strength.</Text>
          <View style={styles.accent} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={start} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{action}</Text><Text style={styles.arrow}>↗</Text>
        </Pressable>
      </View>
    </View>

    <View testID="home-content-grid" style={styles.grid}>
      <View style={styles.tileRow}>
        <HomeTile id="home-letters" title={trCopy('c_2f46b1d4291b', '文字と音', 'Letters & sounds')} kind="letters" color="#E0EFE8" onPress={() => nav.navigate('LettersSounds')} />
        {guideCount > 0 && <HomeTile id="home-grammar-lessons" title={trCopy('c_c12a73a72dcb', '文法教材', 'Grammar')} kind="grammar" color="#E5EAF7" onPress={() => nav.navigate('GrammarLibrary')} />}
      </View>
      <View style={styles.tileRow}>
        <HomeTile id="home-vocabulary" title={trCopy('c_d282e858f43a', '単語', 'Words')} kind="vocabulary" color="#ECE8F4" onPress={() => nav.navigate('VocabCategory')} />
        {!!data.NEPALI_DICTIONARY?.entries.length && <HomeTile id="home-dictionary" title={trCopy('c_df9dedb2fa8a', 'ネパール語辞書', 'Dictionary')} kind="dictionary" color="#DFEDF0" onPress={() => nav.navigate('NepaliDictionary')} />}
      </View>
    </View>

    {learning?.error && <Pressable accessibilityRole="button" onPress={learning.retry} style={styles.error}><Text style={styles.errorText}>{trCopy('c_70a7891dec6e', '学習記録を読み込み・保存できませんでした。タップして再試行。', 'Could not load or save progress. Tap to retry.')}</Text></Pressable>}
  </ScrollView>;
}

function HomeTile({ id, title, kind, color, onPress }: {id:string;title:string;kind:'letters'|'grammar'|'vocabulary'|'dictionary';color:string;onPress:()=>void}) {
  const compact = useWindowDimensions().width < 360;
  return <Pressable testID={id} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>[styles.tile,{backgroundColor:color},compact&&styles.compactTile,pressed&&styles.pressed]}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
      {kind==='letters' ? <Text style={styles.letterIcon}>अ</Text> : <Svg width={29} height={29} viewBox="0 0 24 24" fill="none" stroke="#234D48" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {kind==='grammar' ? <><Path d="M12 5C8 3 5 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1Z"/><Path d="M12 5v15M5 8l4 1M5 12l4 1M15 9l4-1M15 13l4-1"/></> : kind==='vocabulary' ? <><Rect x="6" y="3" width="15" height="17" rx="3"/><Path d="M3 7v12a3 3 0 0 0 3 3M10 8h7M10 12h5"/></> : <><Path d="M4 3h12a2 2 0 0 1 2 2v4M4 3v17M4 3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7M7 7h7M7 11h3"/><Circle cx="16" cy="15" r="4"/><Path d="m19 18 3 3"/></>}
      </Svg>}
    </View>
    <Text style={[styles.tileTitle,compact&&styles.compactTileTitle]}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 30, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: c.navy, borderRadius: 24, overflow: 'hidden' },
  heroBody: { padding: 22, paddingTop: 18 },
  eyebrow: { color: '#BAD6D0', fontSize: 10, lineHeight: 17, letterSpacing: 2.5, fontWeight: '700' },
  motto: { marginTop: 14 },
  headline: { color: '#F5FAF8', fontWeight: '600', letterSpacing: -1 },
  strength: { color: c.teal, fontWeight: '800', letterSpacing: -1.4 },
  accent: { width: 38, height: 3, borderRadius: 2, backgroundColor: c.teal, marginTop: 13 },
  primary: { marginTop: 19, backgroundColor: c.teal, borderRadius: 14, minHeight: 50, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryText: { flex: 1, color: c.navy, fontSize: 15, lineHeight: 23, fontWeight: '700' }, arrow: { color: c.navy, fontSize: 23, lineHeight: 28 },
  grid: { gap: 12 }, tileRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  tile: { flex: 1, minWidth: 0, minHeight: 126, padding: 17, borderRadius: 20, gap: 12, justifyContent: 'space-between' },
  icon: { width: 38, height: 36, justifyContent: 'center' }, letterIcon: { color: '#234D48', fontSize: 31, lineHeight: 39, fontWeight: '600' },
  compactTile: { padding: 12 }, compactTileTitle: { fontSize: 15, lineHeight: 23 },
  tileTitle: { color: c.ink, fontSize: 17, lineHeight: 25, fontWeight: '700' },
  error: { padding: 16, borderRadius: 14, backgroundColor: '#FCEEEF' }, errorText: { color: '#8B2945', fontSize: 13, lineHeight: 21 }, pressed: { opacity: 0.78 },
});
