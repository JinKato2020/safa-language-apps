import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningSound } from '../LearningSound';
import type { LearningAudio, SoundSample } from '../learning';
import { prepareLetterPresentation } from '../letterPresentation';

const ink = '#183c3a', teal = '#126b60', muted = '#526c67';
const categories = [
  { id: 'start', sections: ['start'], glyph: 'अ', ja: 'はじめに', en: 'Start here', subJa: '文字のしくみを知る', subEn: 'How the script works' },
  { id: 'vowels', sections: ['vowels'], glyph: 'अ आ', ja: '母音', en: 'Vowels', subJa: '11字 · 音と例単語', subEn: '11 letters · sounds & words' },
  { id: 'combinations', sections: ['combinations'], glyph: 'कि कु', ja: '子音＋母音', en: 'Vowel combinations', subJa: '子音のみ＋母音11通り', subEn: 'Consonant only + 11 vowel forms' },
  { id: 'conjuncts', sections: ['conjuncts', 'marks', 'numbers'], glyph: 'क्ष ँ', ja: '複合・記号', en: 'Conjuncts & signs', subJa: '複合文字・記号・数字', subEn: 'Conjuncts, signs & digits' },
];

export default function LettersSoundsScreen() {
  const { LETTERS_SOUNDS: source } = useAppData(), learning = useLearning(), { lang } = useI18n(), ss = useScaleStyle(), nav = useNavigation();
  const en = lang === 'en';
  const data = useMemo(() => source ? prepareLetterPresentation(source, en) : undefined, [source, en]);
  const [section, setSection] = useState<number | null>(null), [selected, setSelected] = useState<number | null>(null), [row, setRow] = useState(0), [conjunctIndex, setConjunctIndex] = useState(0);
  const [playing, setPlaying] = useState<{ id: string; audio: LearningAudio; key: number } | null>(null);
  const scroll = useRef<ScrollView>(null), serial = useRef(0);
  const stop = useCallback(() => setPlaying(null), []);
  useLayoutEffect(() => nav.setOptions({ title: en ? 'Letters & sounds' : '文字と音' }), [nav, en]);
  useFocusEffect(useCallback(() => stop, [stop]));
  if (!data) return <View style={styles.empty}><Text style={ss(18, 30)}>{en ? 'Your letters lesson is being prepared. Reopen it after the content update.' : '文字教材を準備しています。コンテンツの更新後に開き直してください。'}</Text></View>;

  const read = learning?.state.lettersRead ?? [], completed = data.sections.filter(s => read.includes(s.id)).length;
  const current = section === null ? null : data.sections[section];
  const category = categories.find(c => current && c.sections.includes(current.id));
  const isCombination = current?.id === 'combinations';
  const isConjunct = current?.id === 'conjuncts';
  const conjuncts = isConjunct ? current.samples.filter(s => s.audio) : [];
  const conjunct = conjuncts[conjunctIndex] ?? conjuncts[0];
  const samples = current ? (isCombination ? data.combinations[row].samples : isConjunct ? data.conjunctCombinations?.find(r => r.consonant === conjunct?.ne)?.samples ?? (conjunct ? [conjunct] : []) : current.samples) : [];
  const selectionIndex = selected ?? (isConjunct ? Math.max(0, samples.findIndex(s => s.examples?.length)) : 0);
  const sample = samples[selectionIndex] ?? samples[0];
  const isChart = isCombination || isConjunct;
  const chartLetters = isConjunct ? conjuncts.map(s => ({ id: s.id, ne: s.ne })) : data.combinations.map(r => ({ id: r.consonant, ne: r.consonant }));
  const chartIndex = isConjunct ? conjunctIndex : row;
  const words = sample?.examples?.slice(0, 1);
  const move = (index: number | null) => {
    stop(); setSection(index); setSelected(null); setConjunctIndex(0);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const play = (id: string, audio: LearningAudio) => setPlaying({ id, audio, key: ++serial.current });
  const textButton = (label: string, action: () => void, primary = false, disabled = false, testID?: string) => <Pressable
    testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action}
    style={({ pressed }) => [styles.button, primary && styles.primary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, primary && styles.white, ss(15, 24)]}>{label}</Text>
  </Pressable>;
  const sectionName = (id: string, fallback: string) => ({
    conjuncts: en ? 'Conjuncts' : '複合文字',
    marks: en ? 'Signs' : '記号', numbers: en ? 'Digits' : '数字',
  }[id] ?? fallback);
  const destination = (index: number) => {
    const target = data.sections[index], group = categories.find(c => c.sections.includes(target.id));
    const name = en ? group?.en : group?.ja;
    return group && group.sections.length > 1 ? `${name} · ${sectionName(target.id, target.title)}` : name ?? target.title;
  };
  const exampleWords = (words: SoundSample[]) => <View style={styles.wordsCard} testID="letters-example-words"><Text style={[styles.muted, ss(12, 20)]}>{en ? 'EXAMPLE WORD' : '例単語'}</Text>{words.map((word, i) => <View key={word.id} style={[styles.wordRow, i > 0 && styles.wordDivider]}>
    <Pressable testID={`letters-play-word-${i}`} accessibilityRole="button" accessibilityLabel={`${en ? 'Play word' : '単語を聞く'}: ${word.ne}`} onPress={() => play(word.id, word.audio)} style={({ pressed }) => [styles.wordButton, pressed && styles.pressed]}>
      <View style={styles.wordContent}><View style={styles.wordTitleRow}><Text style={[styles.wordNe, ss(23, 35)]}>{word.ne}</Text><Text style={[styles.wordRoman, ss(14, 23)]}>{word.roman}</Text></View><Text style={[styles.body, ss(14, 23)]}>{word.meaning}</Text></View><View style={[styles.wordPlay, playing?.id === word.id && styles.tileActive]}><Text style={[styles.helpTitle, playing?.id === word.id && styles.white, ss(16, 24)]}>▶</Text></View>
    </Pressable>
  </View>)}</View>;

  return <View style={styles.root}>
    {current && <View style={styles.toolbar}>
      {textButton(en ? '‹ All categories' : '‹ 文字の一覧', () => move(null), false, false, 'letters-library')}
      <Text style={[styles.toolbarLabel, ss(14, 22)]}>{en ? category?.en : category?.ja}</Text>
    </View>}
    <ScrollView ref={scroll} contentContainerStyle={styles.content}>
      {!current ? <>
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, ss(12, 20)]}>{en ? 'NEPALI SOUND STUDIO' : 'NEPALI · 文字と音'}</Text>
          <View style={styles.heroRow}><Text accessibilityRole="header" style={[styles.heroTitle, ss(29, 42)]}>{en ? 'See it.\nHear it. Say it.' : '文字を、\n音で覚える。'}</Text><View style={styles.heroGlyph}><Text style={[styles.heroLetter, ss(52, 74)]}>क</Text></View></View>
          <Text style={[styles.heroBody, ss(15, 25)]}>{en ? 'Tap the letters to compare their sounds on one chart. See an example word for the selected sound.' : '文字をタップして、同じ画面で聞き比べ。\n気になる音は、例単語でも確かめよう。'}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completed / data.sections.length * 100}%` }]}/></View>
          <Text style={[styles.heroBody, ss(13, 22)]}>{en ? `${completed} / ${data.sections.length} sections reviewed` : `${data.sections.length}項目中 ${completed}項目を確認済み`}</Text>
        </View>
        <View style={styles.titleRow}><Text accessibilityRole="header" style={[styles.sectionTitle, ss(20, 30)]}>{en ? 'Explore the sounds' : '音のライブラリ'}</Text><Text style={[styles.muted, ss(13, 22)]}>{en ? 'Start anywhere' : '気になる文字から'}</Text></View>
        <View style={styles.libraryGrid}>{categories.map(c => {
          const indices = data.sections.flatMap((s, i) => c.sections.includes(s.id) ? [i] : []);
          if (!indices.length) return null;
          const done = indices.filter(i => read.includes(data.sections[i].id)).length;
          return <Pressable key={c.id} testID={`letters-category-${c.id}`} accessibilityRole="button" accessibilityLabel={en ? c.en : c.ja}
            onPress={() => move(indices.find(i => !read.includes(data.sections[i].id)) ?? indices[0])}
            style={({ pressed }) => [styles.libraryCard, pressed && styles.pressed]}>
            <View style={styles.titleRow}><Text style={[styles.categoryGlyph, ss(29, 46)]}>{c.glyph}</Text><Text style={[styles.muted, ss(16, 24)]}>{done === indices.length ? '✓' : '↗'}</Text></View>
            <Text style={[styles.cardTitle, ss(17, 26)]}>{en ? c.en : c.ja}</Text>
            <Text style={[styles.muted, ss(13, 22)]}>{en ? c.subEn : c.subJa}</Text>
          </Pressable>;
        })}</View>
        <Text style={[styles.footnote, ss(13, 22)]}>{en ? 'A few sounds at a time is enough. “Reviewed” records what you have explored, not a test score.' : '一度に覚えなくて大丈夫。確認済みの印は、ここまで触れた記録です。'}</Text>
      </> : <>
        {category && category.sections.length > 1 && <View style={styles.groupTabs}>{data.sections.map((s, i) => category.sections.includes(s.id) && <Pressable key={s.id} accessibilityRole="tab" accessibilityState={{ selected: section === i }} testID={`letters-section-${s.id}`} onPress={() => move(i)} style={[styles.groupTab, section === i && styles.groupTabActive]}><Text style={[styles.groupText, section === i && styles.white, ss(14, 23)]}>{sectionName(s.id, s.title)}</Text></Pressable>)}</View>}
        <View style={styles.titleRow}><Text accessibilityRole="header" style={[styles.sectionTitle, styles.flexTitle, ss(23, 35)]}>{current.title}</Text></View>
        {current.id === 'start' && <View style={styles.helpBody}><Text style={[styles.body, ss(16, 28)]}>{current.body}</Text></View>}
        {isChart && <View style={styles.combinationPanel}>
          <View testID={isConjunct ? 'letters-conjunct-grid' : 'letters-consonant-grid'} style={styles.letterGrid}>{chartLetters.map((letter, i) => <Pressable key={letter.id} testID={isConjunct ? `letters-conjunct-${letter.id}` : `letters-consonant-${letter.id}`} accessibilityRole="button" accessibilityLabel={`${isConjunct ? (en ? 'Conjunct' : '複合文字') : (en ? 'Consonant' : '子音')} ${letter.ne}`} accessibilityState={{ selected: chartIndex === i }} onPress={() => { stop(); if (isConjunct) setConjunctIndex(i); else setRow(i); setSelected(null); }} style={[styles.letterTile, chartIndex === i && styles.tileActive]}><Text style={[styles.tileText, chartIndex === i && styles.white, ss(22, 32)]}>{letter.ne}</Text></Pressable>)}</View>
        </View>}
        {sample && <>
          <Text style={[styles.stepLabel, ss(13, 22)]}>{isCombination ? (en ? '12 FORMS · FIRST: NO VOWEL (AUDIO: k / s ONLY)' : '12通り · 先頭は母音なし（音声は k・s のみ）') : current.id === 'start' ? (en ? 'COMPARE: WITH a / WITHOUT A VOWEL' : '子音＋a ／ 母音なしを聞き比べる') : isConjunct ? (en ? '11 VOWEL FORMS' : '11通りの母音付き') : (en ? 'TAP A LETTER TO COMPARE' : '文字をタップして確かめよう')}</Text>
          <View style={[styles.soundGrid, isChart && styles.compactSoundGrid]} testID="letters-sound-chart">{samples.map((s, i) => {
            const active = playing?.id === s.id;
            if (!s.audio) return <Pressable key={s.id} testID={`letters-symbol-${s.id}`} accessibilityRole="button" accessibilityLabel={`${en ? 'Select written form' : '文字を選ぶ'}: ${s.ne}, ${s.roman}`} accessibilityState={{ selected: selectionIndex === i }} onPress={() => { stop(); setSelected(i); }} style={[styles.soundTile, isChart && styles.compactSoundTile, styles.referenceTile, selectionIndex === i && styles.soundTileSelected]}><Text style={[styles.tileText, ss(isChart ? 24 : 28, isChart ? 34 : 42)]}>{s.ne}</Text><Text style={[styles.chartRoman, styles.tileRoman, ss(isChart ? 12 : 14, isChart ? 18 : 22)]}>{s.roman}</Text><Text style={[styles.tileCue, ss(10, 16)]}>{en ? 'Text' : '文字'}</Text></Pressable>;
            return <Pressable key={s.id} testID={`letters-play-${s.id}`} accessibilityRole="button" accessibilityLabel={`${en ? 'Play sound' : '音を聞く'}: ${s.speech ?? s.ne}`} accessibilityState={{ selected: selectionIndex === i }} onPress={() => { setSelected(i); if (s.audio) play(s.id, s.audio); }} style={({ pressed }) => [styles.soundTile, isChart && styles.compactSoundTile, current.id === 'start' && styles.pairTile, selectionIndex === i && styles.soundTileSelected, active && styles.tileActive, pressed && styles.pressed]}>
              <Text style={[styles.tileText, active && styles.white, ss(isChart ? 24 : 28, isChart ? 34 : 42)]}>{s.ne}</Text>
              <Text style={[styles.chartRoman, styles.tileRoman, active && styles.white, ss(isChart ? 12 : 14, isChart ? 18 : 22)]}>{s.roman}</Text>
              <Text style={[styles.tileCue, active && styles.white, ss(11, 18)]}>{active ? '●' : '▶'}</Text>
            </Pressable>;
          })}</View>
          <View style={styles.selectionCard} testID="letters-selection">
            <View style={styles.selectionRow}><Text style={[styles.selectionGlyph, ss(26, 38)]}>{sample.ne}</Text><Text style={[styles.chartRoman, ss(15, 24)]}>{sample.roman}</Text><Text style={[styles.body, styles.selectionMeaning, ss(14, 23)]}>{sample.meaning}</Text></View>
            {current.id === 'marks' && sample.detail && <Text style={[styles.body, ss(14, 23)]}>{sample.detail}</Text>}
            {!!words?.length && exampleWords(words)}
          </View>
        </>}
        <View style={styles.reviewPanel}><Text style={[styles.body, ss(14, 24)]}>{en ? 'Listen, compare, and say it aloud. Mark this section when you have explored its sounds.' : '聞く、比べる、声に出す。ひと通り確かめたら、記録を残そう。'}</Text>{textButton(read.includes(current.id) ? (en ? 'Reviewed ✓' : '確認済み ✓') : (en ? 'Mark section as reviewed' : 'この項目を確認済みにする'), () => { void learning?.change(s => ({ ...s, lettersRead: [...new Set([...(s.lettersRead ?? []), current.id])] })); }, false, !learning?.ready)}{learning?.error && <Text style={[styles.error, ss(14, 24)]}>{en ? 'Progress could not be saved. Please retry.' : '記録を保存できませんでした。もう一度お試しください。'}</Text>}</View>
        <View testID="letters-section-navigation" style={styles.sectionNavigation}>
          {([-1, 1] as const).map(direction => {
            const index = section! + direction, inRange = index >= 0 && index < data.sections.length;
            const label = direction < 0 ? (en ? '‹ Previous' : '‹ 前へ') : (en ? 'Next ›' : '次へ ›');
            const title = inRange ? destination(index) : (en ? 'All categories' : '文字の一覧');
            return <Pressable key={direction} testID={direction < 0 ? 'letters-prev-section' : 'letters-next-section'} accessibilityRole="button" accessibilityLabel={`${label}: ${title}`} onPress={() => move(inRange ? index : null)} style={({ pressed }) => [styles.sectionLink, direction > 0 && styles.primary, pressed && styles.pressed]}>
              <Text style={[styles.muted, direction > 0 && styles.white, ss(13, 22)]}>{label}</Text>
              <Text style={[styles.cardTitle, direction > 0 && styles.white, ss(16, 26)]}>{title}</Text>
            </Pressable>;
          })}
        </View>
      </>}
    </ScrollView>
    {current && samples.length > 0 && <View style={styles.playerBar}>
      <View style={styles.playerMessage}>{playing ? <LearningSound key={playing.key} audio={playing.audio} onFinished={stop}/> : <Text style={[styles.muted, ss(13, 22)]}>{en ? '▶ marks a recording. Tap to listen again.' : '▶ のある文字・単語をタップして再生。'}</Text>}</View>
      {textButton(en ? 'Stop' : '停止', stop, false, !playing)}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7f3' }, empty: { padding: 24 },
  content: { padding: 20, paddingBottom: 48, gap: 12, maxWidth: 760, width: '100%', alignSelf: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: '#dfe8e0', backgroundColor: '#fbfcf9' },
  toolbarLabel: { color: muted, flexShrink: 1 },
  hero: { padding: 24, borderRadius: 26, backgroundColor: '#153f3b', gap: 16 },
  eyebrow: { color: '#c1ded0', fontWeight: '700', letterSpacing: 1.5 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { color: '#fffdf4', fontWeight: '700', flex: 1 },
  heroGlyph: { width: 78, minHeight: 100, borderRadius: 24, borderWidth: 1, borderColor: '#528076', alignItems: 'center', justifyContent: 'center', backgroundColor: '#29534a' },
  heroLetter: { color: '#e1edb7' }, heroBody: { color: '#d5e5dc' },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: '#40625b', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 3, backgroundColor: '#d9e8a9' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  sectionTitle: { color: ink, fontWeight: '700' }, muted: { color: muted },
  libraryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  libraryCard: { flexBasis: '45%', flexGrow: 1, padding: 17, gap: 5, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dce6dd', minWidth: 125 },
  categoryGlyph: { color: teal }, cardTitle: { color: ink, fontWeight: '700' },
  footnote: { color: muted, paddingHorizontal: 4 },
  groupTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupTab: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#e6eee7', justifyContent: 'center' },
  groupTabActive: { backgroundColor: teal }, groupText: { color: ink, fontWeight: '600' },
  flexTitle: { flex: 1, minWidth: 140 },
  helpTitle: { color: teal, fontWeight: '600' }, helpBody: { paddingHorizontal: 8, gap: 14 },
  body: { color: ink }, combinationPanel: { gap: 10 }, letterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  stepLabel: { color: muted, fontWeight: '700', letterSpacing: .5 },
  soundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  soundTile: { flexBasis: '28%', flexGrow: 1, minWidth: 80, minHeight: 72, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderRadius: 15, borderWidth: 1, borderColor: '#d5e2d6', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  compactSoundGrid: { gap: 6 },
  compactSoundTile: { flexBasis: '21%', minWidth: 72, minHeight: 60, paddingHorizontal: 6, paddingVertical: 5, gap: 4, borderRadius: 12 },
  soundTileSelected: { borderColor: teal, backgroundColor: '#e9f2e7' },
  pairTile: { flexBasis: '45%' },
  referenceTile: { backgroundColor: '#eef1ec', borderColor: '#e1e6dd' },
  tileRoman: { flexShrink: 1 },
  chartRoman: { color: teal, fontWeight: '600' }, tileCue: { color: muted, position: 'absolute', right: 8, top: 5 },
  selectionCard: { borderRadius: 18, padding: 12, backgroundColor: '#eef2e9', gap: 8 },
  selectionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, selectionGlyph: { color: teal }, selectionMeaning: { flex: 1, minWidth: 110 },
  letterTile: { minWidth: 44, minHeight: 44, paddingHorizontal: 4, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#ceddd2', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tileText: { color: ink }, tileActive: { backgroundColor: teal, borderColor: teal },
  playerBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 8, minHeight: 68, backgroundColor: '#fbfcf9', borderTopWidth: 1, borderTopColor: '#dfe8e0' },
  playerMessage: { flex: 1 },
  wordsCard: { gap: 8 },
  wordRow: { gap: 4 }, wordDivider: { borderTopWidth: 1, borderTopColor: '#cbdac5', paddingTop: 8 },
  wordButton: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 }, wordContent: { flex: 1, minWidth: 0 },
  wordTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10 },
  wordNe: { color: ink, fontWeight: '600' }, wordRoman: { color: muted },
  wordPlay: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: '#e6eee7', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: ink, fontWeight: '600', textAlign: 'center' }, primary: { backgroundColor: teal }, white: { color: '#fff' },
  disabled: { opacity: .35 }, pressed: { opacity: .78 },
  reviewPanel: { marginTop: 8, padding: 18, gap: 12, borderTopWidth: 1, borderTopColor: '#d5e0d4' }, error: { color: '#9f1239' },
  sectionNavigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  sectionLink: { flexBasis: '45%', flexGrow: 1, minWidth: 120, minHeight: 76, padding: 15, gap: 5, borderRadius: 16, backgroundColor: '#e6eee7', justifyContent: 'center' },
});
