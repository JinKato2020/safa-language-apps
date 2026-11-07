import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningSound } from '../LearningSound';
import type { LearningAudio } from '../learning';

const ink = '#183c3a', teal = '#126b60', muted = '#526c67';
const categories = [
  { id: 'start', sections: ['start'], glyph: 'अ', ja: 'はじめに', en: 'Start here', subJa: '文字のしくみを知る', subEn: 'How the script works' },
  { id: 'vowels', sections: ['vowels'], glyph: 'अ आ', ja: '母音', en: 'Vowels', subJa: '11字 · 音と例単語', subEn: '11 letters · sounds & words' },
  { id: 'consonants', sections: ['velar', 'affricate', 'retroflex', 'dental', 'labial', 'other'], glyph: 'क ख', ja: '子音', en: 'Consonants', subJa: '33字 · 6つの仲間', subEn: '33 letters · 6 groups' },
  { id: 'combinations', sections: ['combinations'], glyph: 'कि कु', ja: '子音＋母音', en: 'Vowel combinations', subJa: '33 × 11 通りの表', subEn: '33 × 11 forms' },
  { id: 'conjuncts', sections: ['conjuncts'], glyph: 'क्ष ज्ञ', ja: '複合文字', en: 'Conjuncts', subJa: '30形 · 音から単語へ', subEn: '30 forms · from sounds to words' },
  { id: 'marks', sections: ['marks', 'numbers'], glyph: 'ँ १२', ja: '記号・数字', en: 'Signs & digits', subJa: '鼻に響く音と数字', subEn: 'Nasal sounds & numbers' },
];

export default function LettersSoundsScreen() {
  const { LETTERS_SOUNDS: data } = useAppData(), learning = useLearning(), { lang } = useI18n(), ss = useScaleStyle(), nav = useNavigation();
  const en = lang === 'en';
  const [section, setSection] = useState<number | null>(null), [selected, setSelected] = useState(0), [row, setRow] = useState(0);
  const [showGrid, setShowGrid] = useState(false), [showHelp, setShowHelp] = useState(false);
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
  const samples = current ? (isCombination ? data.combinations[row].samples : current.samples.filter(s => s.audio)) : [];
  const sample = samples[selected] ?? samples[0];
  const move = (index: number | null) => {
    stop(); setSection(index); setSelected(0); setShowGrid(false); setShowHelp(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const choose = (index: number) => { stop(); setSelected(index); setShowGrid(false); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const play = (id: string, audio: LearningAudio) => setPlaying({ id, audio, key: ++serial.current });
  const textButton = (label: string, action: () => void, primary = false, disabled = false, testID?: string) => <Pressable
    testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action}
    style={({ pressed }) => [styles.button, primary && styles.primary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, primary && styles.white, ss(15, 24)]}>{label}</Text>
  </Pressable>;
  const soundStatus = (id: string) => playing?.id === id ? <View style={styles.soundStatus}>
    <View style={{ flex: 1 }}><LearningSound key={playing.key} audio={playing.audio} onFinished={stop}/></View>
    {textButton(en ? 'Stop' : '停止', stop)}
  </View> : null;
  const sectionName = (id: string, fallback: string) => ({
    velar: en ? 'क group' : 'क の仲間', affricate: en ? 'च group' : 'च の仲間', retroflex: en ? 'ट group' : 'ट の仲間',
    dental: en ? 'त group' : 'त の仲間', labial: en ? 'प group' : 'प の仲間', other: en ? 'य–ह' : 'य〜ह',
    marks: en ? 'Signs' : '記号', numbers: en ? 'Digits' : '数字',
  }[id] ?? fallback);

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
          <Text style={[styles.heroBody, ss(15, 25)]}>{en ? 'Choose a letter. Hear its sound, then discover it in two real words.' : '文字を選んで、まず音を。\n2つの単語で、使われ方まで確かめよう。'}</Text>
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
        <Text accessibilityRole="header" style={[styles.sectionTitle, ss(23, 35)]}>{current.title}</Text>
        {current.id !== 'start' && <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHelp }} onPress={() => setShowHelp(v => !v)} style={styles.helpToggle}>
          <Text style={[styles.helpTitle, ss(15, 25)]}>{en ? 'How to read these sounds' : '読み方のヒント'}</Text><Text style={[styles.helpTitle, ss(20, 26)]}>{showHelp ? '−' : '+'}</Text>
        </Pressable>}
        {(showHelp || current.id === 'start') && <View style={styles.helpBody}><Text style={[styles.body, ss(16, 28)]}>{current.body}</Text>{current.samples.filter(s => !s.audio).map(s => <Text key={s.id} style={[styles.body, ss(16, 28)]}>{s.ne} · {s.meaning}{s.detail ? '\n' + s.detail : ''}</Text>)}</View>}
        {isCombination && <View style={styles.combinationPanel}>
          <Text style={[styles.stepLabel, ss(13, 22)]}>{en ? '1 · Choose a consonant' : '1 · 子音を選ぶ'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.strip}>{data.combinations.map((r, i) => <Pressable key={r.consonant} accessibilityRole="button" accessibilityLabel={`${en ? 'Consonant' : '子音'} ${r.consonant}`} accessibilityState={{ selected: row === i }} onPress={() => { stop(); setRow(i); setSelected(0); }} style={[styles.letterTile, row === i && styles.tileActive]}><Text style={[styles.tileText, row === i && styles.white, ss(24, 38)]}>{r.consonant}</Text></Pressable>)}</ScrollView>
          <Text style={[styles.stepLabel, ss(13, 22)]}>{en ? '2 · Compare the vowel forms below' : '2 · 下で母音の形を聞き比べる'}</Text>
        </View>}
        {sample && <>
          <View style={styles.titleRow}><Text style={[styles.counter, ss(14, 23)]}>{String(selected + 1).padStart(2, '0')} <Text style={styles.muted}>/ {samples.length}</Text></Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: showGrid }} onPress={() => setShowGrid(v => !v)} style={styles.selectButton}><Text style={[styles.helpTitle, ss(14, 24)]}>{showGrid ? (en ? 'Close letter list' : '文字の一覧を閉じる') : (en ? 'Choose a letter ▦' : '文字を選ぶ ▦')}</Text></Pressable></View>
          {showGrid && <View style={styles.letterGrid}>{samples.map((s, i) => <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`${en ? 'Choose' : '選ぶ'} ${s.ne}`} accessibilityState={{ selected: selected === i }} onPress={() => choose(i)} style={[styles.letterTile, selected === i && styles.tileActive]}><Text style={[styles.tileText, selected === i && styles.white, ss(25, 40)]}>{s.ne}</Text></Pressable>)}</View>}
          <View style={styles.soundCard} testID="letters-sound-card">
            <Text style={[styles.stepLabel, ss(12, 21)]}>{en ? '01 / HEAR THE SOUND' : '01 / まず、文字の音'}</Text>
            <View style={styles.glyphRow}><Text style={[styles.bigLetter, ss(62, 88)]}>{sample.ne}</Text><View style={styles.reading}><Text style={[styles.roman, ss(24, 36)]}>{sample.roman}</Text><Text style={[styles.body, ss(15, 26)]}>{sample.meaning}</Text></View></View>
            {!!sample.detail && <Text style={[styles.detail, ss(14, 25)]}>{sample.detail}</Text>}
            {sample.audio && <Pressable testID="letters-play-sound" accessibilityRole="button" accessibilityLabel={`${en ? 'Play sound' : '音を聞く'}: ${sample.speech ?? sample.ne}`} onPress={() => play(sample.id, sample.audio!)} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}><View style={styles.playIcon}><Text style={[styles.white, ss(19, 28)]}>▶</Text></View><Text style={[styles.playLabel, ss(17, 27)]}>{en ? 'Hear the sound' : '音を聞く'}</Text><Text style={[styles.playHint, ss(13, 22)]}>{en ? 'Tap to replay' : '何度でも'}</Text></Pressable>}
            {soundStatus(sample.id)}
          </View>
          {!!sample.examples?.length && <View style={styles.wordsCard}>
            <Text style={[styles.stepLabel, ss(12, 21)]}>{en ? '02 / HEAR IT IN WORDS' : '02 / 単語で、音を確かめる'}</Text>
            {sample.examples.map((word, i) => <View key={word.id} style={[styles.wordRow, i > 0 && styles.wordDivider]}>
              <Pressable testID={`letters-play-word-${i}`} accessibilityRole="button" accessibilityLabel={`${en ? 'Play word' : '単語を聞く'}: ${word.ne}`} onPress={() => play(word.id, word.audio)} style={({ pressed }) => [styles.wordButton, pressed && styles.pressed]}>
                <View style={styles.wordContent}><Text style={[styles.wordNe, ss(26, 42)]}>{word.ne}</Text><Text style={[styles.wordRoman, ss(15, 24)]}>{word.roman}</Text><Text style={[styles.body, ss(16, 27)]}>{word.meaning}</Text></View><View style={styles.wordPlay}><Text style={[styles.helpTitle, ss(19, 28)]}>▶</Text></View>
              </Pressable>
              {soundStatus(word.id)}
            </View>)}
          </View>}
          <View style={styles.pageControls}><View style={styles.controlHalf}>{textButton(en ? '‹ Previous letter' : '‹ 前の文字', () => choose(selected - 1), false, selected === 0, 'letters-previous')}</View><View style={styles.controlHalf}>{textButton(en ? 'Next letter ›' : '次の文字 ›', () => choose(selected + 1), true, selected >= samples.length - 1, 'letters-next')}</View></View>
        </>}
        <View style={styles.reviewPanel}><Text style={[styles.body, ss(14, 24)]}>{en ? 'Listen, compare, and say it aloud. Mark this section when you have explored its sounds.' : '聞く、比べる、声に出す。ひと通り確かめたら、記録を残そう。'}</Text>{textButton(read.includes(current.id) ? (en ? 'Reviewed ✓' : '確認済み ✓') : (en ? 'Mark section as reviewed' : 'この項目を確認済みにする'), () => { void learning?.change(s => ({ ...s, lettersRead: [...new Set([...(s.lettersRead ?? []), current.id])] })); }, false, !learning?.ready)}{learning?.error && <Text style={[styles.error, ss(14, 24)]}>{en ? 'Progress could not be saved. Please retry.' : '記録を保存できませんでした。もう一度お試しください。'}</Text>}</View>
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7f3' }, empty: { padding: 24 },
  content: { padding: 20, paddingBottom: 48, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
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
  helpToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#e8efe6', borderRadius: 13 },
  helpTitle: { color: teal, fontWeight: '600' }, helpBody: { paddingHorizontal: 8, gap: 14 },
  body: { color: ink }, combinationPanel: { gap: 10 }, strip: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  stepLabel: { color: muted, fontWeight: '700', letterSpacing: .5 },
  counter: { color: teal, fontWeight: '700' },
  selectButton: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: '#edf2eb', borderRadius: 18 },
  letterTile: { minWidth: 50, minHeight: 56, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 13, borderWidth: 1, borderColor: '#ceddd2', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tileText: { color: ink }, tileActive: { backgroundColor: teal, borderColor: teal },
  soundCard: { padding: 22, borderRadius: 24, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d5e2d6', gap: 16 },
  glyphRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  bigLetter: { color: ink }, reading: { flex: 1, minWidth: 130, gap: 3 }, roman: { color: teal },
  detail: { color: muted, borderTopWidth: 1, borderTopColor: '#e7ece6', paddingTop: 12 },
  playButton: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, backgroundColor: teal, minHeight: 60 },
  playIcon: { width: 32, alignItems: 'center' }, playLabel: { color: '#fff', fontWeight: '700', flex: 1, minWidth: 100 }, playHint: { color: '#d6eee3' },
  soundStatus: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 8 },
  wordsCard: { padding: 20, borderRadius: 24, backgroundColor: '#eaf0e3', gap: 12 },
  wordRow: { gap: 4 }, wordDivider: { borderTopWidth: 1, borderTopColor: '#cbdac5', paddingTop: 12 },
  wordButton: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 }, wordContent: { flex: 1, minWidth: 0, gap: 2 },
  wordNe: { color: ink, fontWeight: '600' }, wordRoman: { color: muted },
  wordPlay: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pageControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, controlHalf: { flex: 1, minWidth: 115 },
  button: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: '#e6eee7', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: ink, fontWeight: '600', textAlign: 'center' }, primary: { backgroundColor: teal }, white: { color: '#fff' },
  disabled: { opacity: .35 }, pressed: { opacity: .78 },
  reviewPanel: { marginTop: 8, padding: 18, gap: 12, borderTopWidth: 1, borderTopColor: '#d5e0d4' }, error: { color: '#9f1239' },
});
