import { useCallback, useMemo, useState } from 'react';
import { AppState, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeroImage } from '../heroImages';
import { Text } from '../Text';
import { useI18n } from '../i18n';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { emptyStudyState, practiceParams, resolveStudy, reviewItems, studyActivity } from '../learning';
import { useGrammarGuide } from '../grammarGuide';
import { visibleLetterSections } from '../letterPresentation';

const c = { ink: '#123039', muted: '#52666C', navy: '#102F38', teal: '#7DE2CE', page: '#F2F5F3' };
const EMPTY = emptyStudyState();

export default function LearningHomeScreen() {
  const nav = useNavigation<any>(), { lang } = useI18n(), { top } = useSafeAreaInsets();
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
  const en = lang === 'en', state = learning?.state ?? EMPTY, ready = !!learning?.ready;
  const activity = useMemo(() => studyActivity(state, now), [state, now]);
  const due = useMemo(() => reviewItems(state, data, now), [state, data, now]);
  const resume = state.resume && resolveStudy(data, state.resume.item) ? state.resume : undefined;
  const target = Math.min(5, activity.today), achieved = activity.today >= 5;
  const lettersReadCount = data.LETTERS_SOUNDS ? visibleLetterSections(data.LETTERS_SOUNDS).filter(section => state.lettersRead?.includes(section.id)).length : 0;
  const action = resume ? (en ? 'Continue where you left off' : '前回の続きへ')
    : due.length ? (en ? `Review ${due.length} sentences` : `${due.length}文を復習する`)
    : (en ? 'Explore letters & sounds' : '文字と音から始める');
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
        <Text accessibilityRole="header" style={styles.headline}>{en ? 'A little today.\nMore to say tomorrow.' : '昨日より、\nひとこと先へ。'}</Text>
        <View style={styles.goalRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalLabel}>{achieved ? (en ? 'TODAY’S FIVE · DONE' : '今日の5文 · 達成') : (en ? 'TODAY’S FIVE' : '今日の5文')}</Text>
            <Text style={styles.goalHint}>{achieved ? (en ? 'Your small step counts.' : '今日の一歩、積み重なりました。') : (en ? 'One sentence at a time.' : '一文ずつ、自分のペースで。')}</Text>
          </View>
          <Text accessibilityLabel={en ? `${activity.today} sentences practised today. Goal: 5.` : `今日の練習${activity.today}文。目標5文。`} style={styles.goalNumber}>{ready ? target : '—'}<Text style={styles.goalDenominator}> / 5</Text></Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel={en ? 'Daily practice goal' : '今日の練習目標'} accessibilityValue={{ min: 0, max: 5, now: target }} style={styles.segments}>
          {[0, 1, 2, 3, 4].map(i => <View key={i} style={[styles.segment, { backgroundColor: i < target ? c.teal : '#34515A' }]} />)}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={start} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{action}</Text><Text style={styles.arrow}>↗</Text>
        </Pressable>
      </View>
    </View>

    <Pressable testID="home-letters" accessibilityRole="button" accessibilityLabel={en ? 'Letters & sounds' : '文字と音'} onPress={() => nav.navigate('LettersSounds')} style={({ pressed }) => [styles.path, pressed && styles.pressed]}>
      <View style={styles.sectionRow}><Text style={styles.overline}>LETTERS &amp; SOUNDS</Text></View>
      <Text style={styles.pathTitle}>{en ? 'Letters & sounds' : '文字と音'}</Text>
      <Text style={[styles.pathNote,{fontSize:15,lineHeight:25}]}>{en ? 'Vowels, consonants, vowel signs and conjuncts. Tap to hear how the script sounds.' : '母音・子音から、組み合わせ・複合文字まで。文字を見て、音を確かめよう。'}</Text>
      <View style={styles.sectionRow}><Text style={styles.pathNote}>{en ? `${lettersReadCount} sections reviewed` : `${lettersReadCount}項目を確認済み`}</Text><Text style={styles.pathLink}>{en ? 'Explore →' : '開く →'}</Text></View>
    </Pressable>

    {guideCount > 0 && <Pressable testID="home-grammar-lessons" accessibilityRole="button" accessibilityLabel={en ? 'Grammar lessons' : '文法教材'} onPress={() => nav.navigate('GrammarLibrary')} style={({ pressed }) => [styles.path, styles.grammarPath, pressed && styles.pressed]}>
      <View style={styles.sectionRow}><Text style={styles.overline}>GRAMMAR LESSONS</Text></View>
      <Text style={styles.pathTitle}>{en ? 'Grammar lessons' : '文法教材'}</Text>
      <Text style={[styles.pathNote,{fontSize:15,lineHeight:25}]}>{en ? 'Core rules, forms & words, practice your way and a cultural break. Build your understanding one theme at a time.' : '基本ルール・活用と語彙・練習問題・一休み。テーマごとに、文の作り方を学ぼう。'}</Text>
      <View style={styles.sectionRow}><Text style={styles.pathNote}>{en ? `${guideCount} lessons, including appendices` : `付録を含む${guideCount}項目`}</Text><Text style={styles.pathLink}>{en ? 'Open lessons →' : '教材を開く →'}</Text></View>
    </Pressable>}

    <Pressable testID="home-vocabulary" accessibilityRole="button" accessibilityLabel={en ? 'Vocabulary' : '単語'} onPress={() => nav.navigate('VocabCategory')} style={({ pressed }) => [styles.path, { backgroundColor: '#eef1fa', borderColor: '#d6ddeb' }, pressed && styles.pressed]}>
      <View style={styles.sectionRow}><Text style={styles.overline}>VOCABULARY</Text></View>
      <Text style={styles.pathTitle}>{en ? 'Vocabulary' : '単語'}</Text>
      <Text style={[styles.pathNote,{fontSize:15,lineHeight:25}]}>{en ? 'Choose the meaning or choose the Nepali word. Practise both ways with four choices.' : 'ネパール語から意味を選ぶ。母語からことばを選ぶ。4択で繰り返し練習しよう。'}</Text>
      <View style={styles.sectionRow}><Text style={styles.pathLink}>{en ? 'Explore words →' : '単語を学ぶ →'}</Text></View>
    </Pressable>

    {!!data.NEPALI_DICTIONARY?.entries.length && <Pressable testID="home-dictionary" accessibilityRole="button" accessibilityLabel={en ? 'Nepali dictionary' : 'ネパール語辞書'} onPress={() => nav.navigate('NepaliDictionary')} style={({ pressed }) => [styles.path, { backgroundColor: '#DDEEE8' }, pressed && styles.pressed]}>
      <Text style={styles.overline}>DICTIONARY</Text>
      <Text style={styles.pathTitle}>{en ? 'Nepali dictionary' : 'ネパール語辞書'}</Text>
      <Text style={[styles.pathNote, { fontSize: 15, lineHeight: 25 }]}>{en ? 'Find a word, hear its sound and understand how to use it. Search in Nepali, romanization, English or Japanese.' : '気になることばを調べて、音と使い方を確かめよう。日本語・英語・ネパール語・ローマ字に対応。'}</Text>
      <Text style={styles.pathLink}>{en ? 'Look up a word →' : 'ことばを調べる →'}</Text>
    </Pressable>}

    {learning?.error && <Pressable accessibilityRole="button" onPress={learning.retry} style={styles.error}><Text style={styles.errorText}>{en ? 'Could not load or save progress. Tap to retry.' : '学習記録を読み込み・保存できませんでした。タップして再試行。'}</Text></Pressable>}
    <Text style={styles.footer}>{en ? 'A few words today. A real conversation tomorrow.' : '今日のひとことが、次の会話につながる。'}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 44, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: c.navy, borderRadius: 24, overflow: 'hidden' },
  heroBody: { padding: 22, paddingTop: 20 },
  eyebrow: { color: c.teal, fontSize: 11, lineHeight: 18, letterSpacing: 2, fontWeight: '700' },
  headline: { color: '#FFF', fontSize: 30, lineHeight: 39, fontWeight: '700', letterSpacing: -0.5, marginTop: 10, marginBottom: 24 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalLabel: { color: '#ECF9F5', fontSize: 13, lineHeight: 21, fontWeight: '700', letterSpacing: 0.4 },
  goalHint: { color: '#BDCFD0', fontSize: 12, lineHeight: 19, marginTop: 3 },
  goalNumber: { color: c.teal, fontSize: 36, lineHeight: 48, fontWeight: '600', fontVariant: ['tabular-nums'] },
  goalDenominator: { color: '#BDCFD0', fontSize: 16, lineHeight: 24, fontWeight: '400' },
  segments: { flexDirection: 'row', gap: 5, marginTop: 12 }, segment: { flex: 1, height: 4, borderRadius: 2 },
  primary: { marginTop: 22, backgroundColor: c.teal, borderRadius: 14, minHeight: 54, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  primaryText: { flex: 1, color: c.navy, fontSize: 16, lineHeight: 24, fontWeight: '800' }, arrow: { color: c.navy, fontSize: 24, lineHeight: 28 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  overline: { color: c.muted, fontSize: 11, lineHeight: 18, fontWeight: '700', letterSpacing: 1.2, flexShrink: 1 },
  path: { backgroundColor: '#E4EEE8', padding: 22, borderRadius: 22, gap: 9 }, pathDenominator: { color: c.muted, fontSize: 13, lineHeight: 20, fontWeight: '400' },
  pathTitle: { color: c.ink, fontSize: 19, lineHeight: 28, fontWeight: '700' }, pathNote: { color: c.muted, fontSize: 11, lineHeight: 18, flex: 1 }, pathLink: { color: c.ink, fontSize: 12, lineHeight: 20, fontWeight: '700' },
  grammarPath: { backgroundColor: '#E5EBF5' },
  error: { padding: 16, borderRadius: 14, backgroundColor: '#FCEEEF' }, errorText: { color: '#8B2945', fontSize: 13, lineHeight: 21 },
  footer: { color: c.muted, fontSize: 11, lineHeight: 19, textAlign: 'center', marginTop: 2 }, pressed: { opacity: 0.78 },
});
