import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningSound } from '../LearningSound';
import type { LearningAudio, SoundSample } from '../learning';
import { prepareLetterPresentation } from '../letterPresentation';

const ink = '#183c3a', teal = '#126b60', muted = '#526c67';
const categories = [
  { id: 'start', sections: ['start'], ar: 'ابدأ هنا', subAr: 'كيف تعمل الكتابة النيبالية', glyph: 'अ', ko: '시작하기', subKo: '문자의 원리 알아보기', ja: 'はじめに', en: 'Start here', subJa: '文字のしくみを知る', subEn: 'How the script works' },
  { id: 'vowels', sections: ['vowels'], ar: 'الصوائت', subAr: '11 حرفًا · أصوات وكلمات', glyph: 'अ आ', ko: '모음', subKo: '11자 · 소리와 예시 단어', ja: '母音', en: 'Vowels', subJa: '11字 · 音と例単語', subEn: '11 letters · sounds & words' },
  { id: 'combinations', sections: ['combinations'], ar: 'صامت مع صائت', subAr: 'صامت فقط + 11 صيغة بصائت', glyph: 'कि कु', ko: '자음＋모음', subKo: '자음만＋모음 11가지', ja: '子音＋母音', en: 'Vowel combinations', subJa: '子音のみ＋母音11通り', subEn: 'Consonant only + 11 vowel forms' },
  { id: 'conjuncts', sections: ['conjuncts'], ar: 'الحروف المركّبة', subAr: '30 شكلًا مع الصوائت', glyph: 'क्ष त्र', ko: '결합 문자', subKo: '30형 · 모음과의 조합', ja: '複合文字', en: 'Conjuncts', subJa: '30形 · 母音との組み合わせ', subEn: '30 forms · vowel combinations' },
  { id: 'marks', sections: ['marks'], ar: 'العلامات', subAr: 'الأصوات الأنفية وعلامات الكتابة', glyph: 'ँ ं ।', ko: '기호', subKo: '코로 내는 소리·글자에 붙는 표시', ja: '記号', en: 'Signs', subJa: '鼻音・文字につく印', subEn: 'Nasal sounds & written signs' },
  { id: 'numbers', sections: ['numbers'], ar: 'الأعداد', subAr: '0–100 والأعداد الكبيرة', glyph: '१२३', ko: '숫자', subKo: '0~100 · 천·만·큰 수', ja: '数字', en: 'Numbers', subJa: '0〜100 · 千・万・大きな数', subEn: '0–100 · thousands & beyond' },
];

export default function LettersSoundsScreen() {
  const { LETTERS_SOUNDS: source } = useAppData(), { lang , copy: trCopy } = useI18n(), ss = useScaleStyle(), nav = useNavigation();
  const en = lang === 'en';
  const singleColumnLibrary = useWindowDimensions().width < 360 && (lang === 'ko' || lang === 'ar');
  const data = useMemo(() => source ? prepareLetterPresentation(source, lang) : undefined, [source, lang]);
  const [section, setSection] = useState<number | null>(null), [selected, setSelected] = useState<number | null>(null), [row, setRow] = useState(0), [conjunctIndex, setConjunctIndex] = useState(0);
  const [numberGroup, setNumberGroup] = useState(0), [showNumberRanges, setShowNumberRanges] = useState(false);
  const [playing, setPlaying] = useState<{ id: string; audio: LearningAudio; key: number } | null>(null);
  const scroll = useRef<ScrollView>(null), serial = useRef(0);
  const stop = useCallback(() => setPlaying(null), []);
  useLayoutEffect(() => nav.setOptions({ title: trCopy('c_2f46b1d4291b', '文字と音', 'Letters & sounds') }), [nav, en, trCopy]);
  useFocusEffect(useCallback(() => stop, [stop]));
  if (!data) return <View style={styles.empty}><Text style={ss(18, 30)}>{trCopy('c_d3bd62101acf', '文字教材を準備しています。コンテンツの更新後に開き直してください。', 'Your letters lesson is being prepared. Reopen it after the content update.')}</Text></View>;

  const current = section === null ? null : data.sections[section];
  const category = categories.find(c => current && c.sections.includes(current.id));
  const isCombination = current?.id === 'combinations';
  const isConjunct = current?.id === 'conjuncts';
  const isNumbers = current?.id === 'numbers';
  const numberValue = (s: { value?: number; id: string }) => s.value ?? Number(s.id.replace('digit-', ''));
  const numberGroups = isNumbers ? [
    ...Array.from({ length: 10 }, (_, i) => ({ id: i, label: `${i ? i * 10 + 1 : 0}–${(i + 1) * 10}`, samples: current.samples.filter(s => numberValue(s) >= (i ? i * 10 + 1 : 0) && numberValue(s) <= (i + 1) * 10) })),
    { id: 10, label: trCopy('c_b7e52eea8abe', '大きな数', 'Large numbers'), samples: current.samples.filter(s => numberValue(s) > 100) },
  ].filter(g => g.samples.length) : [];
  const conjuncts = isConjunct ? current.samples.filter(s => s.audio) : [];
  const conjunct = conjuncts[conjunctIndex] ?? conjuncts[0];
  const samples = current ? (isCombination ? data.combinations[row].samples : isConjunct ? data.conjunctCombinations?.find(r => r.consonant === conjunct?.ne)?.samples ?? (conjunct ? [conjunct] : []) : isNumbers ? (numberGroups.find(g => g.id === numberGroup) ?? numberGroups[0])?.samples ?? [] : current.samples) : [];
  const selectionIndex = selected ?? (isConjunct ? Math.max(0, samples.findIndex(s => s.examples?.length)) : 0);
  const sample = samples[selectionIndex] ?? samples[0];
  const isChart = isCombination || isConjunct;
  const chartLetters = isConjunct ? conjuncts.map(s => ({ id: s.id, ne: s.ne })) : data.combinations.map(r => ({ id: r.consonant, ne: r.consonant }));
  const chartIndex = isConjunct ? conjunctIndex : row;
  const words = sample?.examples?.slice(0, 1);
  const move = (index: number | null) => {
    stop(); setSection(index); setSelected(null); setConjunctIndex(0); setNumberGroup(0); setShowNumberRanges(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const play = (id: string, audio: LearningAudio) => setPlaying({ id, audio, key: ++serial.current });
  const textButton = (label: string, action: () => void, primary = false, disabled = false, testID?: string, accessibilityLabel = label) => <Pressable
    testID={testID} accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action}
    style={({ pressed }) => [styles.button, primary && styles.primary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, primary && styles.white, ss(15, 24)]}>{label}</Text>
  </Pressable>;
  const sectionName = (id: string, fallback: string) => ({
    conjuncts: trCopy('c_7beddace3e2b', '複合文字', 'Conjuncts'),
    marks: trCopy('c_78025118b072', '記号', 'Signs'), numbers: trCopy('c_5c7dae42562c', '数字', 'Numbers'),
  }[id] ?? fallback);
  const destination = (index: number) => {
    const target = data.sections[index], group = categories.find(c => c.sections.includes(target.id));
    const name = lang === 'ar' ? group?.ar : lang === 'ko' ? group?.ko : en ? group?.en : group?.ja;
    return group && group.sections.length > 1 ? `${name} · ${sectionName(target.id, target.title)}` : name ?? target.title;
  };
  const exampleWords = (words: SoundSample[]) => <View style={styles.wordsCard} testID="letters-example-words"><Text style={[styles.muted, ss(12, 20)]}>{trCopy('c_2cf567a2c0ef', '例単語', 'EXAMPLE WORD')}</Text>{words.map((word, i) => <View key={word.id} style={[styles.wordRow, i > 0 && styles.wordDivider]}>
    <Pressable testID={`letters-play-word-${i}`} accessibilityRole="button" accessibilityLabel={`${lang === 'ar' ? 'استمع إلى الكلمة' : lang === 'ko' ? '단어 듣기' : en ? 'Play word' : '単語を聞く'}: ${word.ne}`} onPress={() => play(word.id, word.audio)} style={({ pressed }) => [styles.wordButton, pressed && styles.pressed]}>
      <View style={styles.wordContent}><View style={styles.wordTitleRow}><Text style={[styles.wordNe, ss(23, 35)]}>{word.ne}</Text><Text style={[styles.wordRoman, ss(14, 23)]}>{word.roman}</Text></View><Text style={[styles.body, ss(14, 23)]}>{word.meaning}</Text></View><View style={[styles.wordPlay, playing?.id === word.id && styles.tileActive]}><Text style={[styles.helpTitle, playing?.id === word.id && styles.white, ss(16, 24)]}>▶</Text></View>
    </Pressable>
  </View>)}</View>;

  return <View style={styles.root}>
    {current && <View style={styles.toolbar}>
      {textButton(trCopy('c_30e43efdc9e9', '‹ 文字の一覧', '‹ All categories'), () => move(null), false, false, 'letters-library')}
      <Text style={[styles.toolbarLabel, ss(14, 22)]}>{lang === 'ar' ? category?.ar : lang === 'ko' ? category?.ko : en ? category?.en : category?.ja}</Text>
    </View>}
    <ScrollView ref={scroll} contentContainerStyle={styles.content}>
      {!current ? <>
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, ss(12, 20)]}>{trCopy('c_3ca02de192bd', 'NEPALI · 文字と音', 'NEPALI SOUND STUDIO')}</Text>
          <View style={styles.heroRow}><Text accessibilityRole="header" style={[styles.heroTitle, ss(29, 42)]}>{trCopy('c_e11331844148', '文字を、\n音で覚える。', 'See it.\nHear it. Say it.')}</Text>{!singleColumnLibrary && <View style={styles.heroGlyph}><Text style={[styles.heroLetter, ss(52, 74)]}>क</Text></View>}</View>
          <Text style={[styles.heroBody, ss(15, 25)]}>{trCopy('c_4dd03e596b08', '文字をタップして、同じ画面で聞き比べ。\n気になる音は、例単語でも確かめよう。', 'Tap the letters to compare their sounds on one chart. See an example word for the selected sound.')}</Text>
        </View>
        <View style={styles.titleRow}><Text accessibilityRole="header" style={[styles.sectionTitle, ss(20, 30)]}>{trCopy('c_1c99a80d3bc4', '音のライブラリ', 'Explore the sounds')}</Text><Text style={[styles.muted, ss(13, 22)]}>{trCopy('c_91874a118b4a', '気になる文字から', 'Start anywhere')}</Text></View>
        <View style={styles.libraryGrid}>{categories.map(c => {
          const indices = data.sections.flatMap((s, i) => c.sections.includes(s.id) ? [i] : []);
          if (!indices.length) return null;
          return <Pressable key={c.id} testID={`letters-category-${c.id}`} accessibilityRole="button" accessibilityLabel={lang === 'ar' ? c.ar : lang === 'ko' ? c.ko : en ? c.en : c.ja}
            onPress={() => move(indices[0])}
            style={({ pressed }) => [styles.libraryCard, singleColumnLibrary && { flexBasis: '100%' }, pressed && styles.pressed]}>
            <View style={styles.titleRow}><Text style={[styles.categoryGlyph, ss(29, 46)]}>{c.glyph}</Text><Text style={[styles.muted, ss(16, 24)]}>↗</Text></View>
            <Text style={[styles.cardTitle, ss(17, 26)]}>{lang === 'ar' ? c.ar : lang === 'ko' ? c.ko : en ? c.en : c.ja}</Text>
            <Text style={[styles.muted, ss(13, 22)]}>{lang === 'ar' ? c.subAr : lang === 'ko' ? c.subKo : en ? c.subEn : c.subJa}</Text>
          </Pressable>;
        })}</View>
      </> : <>
        {category && category.sections.length > 1 && <View style={styles.groupTabs}>{data.sections.map((s, i) => category.sections.includes(s.id) && <Pressable key={s.id} accessibilityRole="tab" accessibilityState={{ selected: section === i }} testID={`letters-section-${s.id}`} onPress={() => move(i)} style={[styles.groupTab, section === i && styles.groupTabActive]}><Text style={[styles.groupText, section === i && styles.white, ss(14, 23)]}>{sectionName(s.id, s.title)}</Text></Pressable>)}</View>}
        <View style={styles.titleRow}><Text accessibilityRole="header" style={[styles.sectionTitle, styles.flexTitle, ss(23, 35)]}>{current.title}</Text></View>
        {current.id === 'start' && <View style={styles.helpBody}><Text style={[styles.body, ss(16, 28)]}>{current.body}</Text></View>}
        {isNumbers && <View style={styles.numberNavigation}>
          {textButton(lang === 'ar' ? '›' : '‹', () => { stop(); setSelected(null); setNumberGroup(Math.max(0, numberGroup - 1)); setShowNumberRanges(false); }, false, numberGroup === 0, 'letters-number-prev', trCopy('numbersPrev', '前の数字のまとまり', 'Previous number group'))}
          <Pressable testID="letters-number-chooser" accessibilityRole="button" accessibilityState={{ expanded: showNumberRanges }} onPress={() => setShowNumberRanges(v => !v)} style={styles.numberChooser}><Text style={[styles.rangeText, ss(15, 24)]}>{numberGroups.find(g => g.id === numberGroup)?.label} {showNumberRanges ? '▴' : '▾'}</Text></Pressable>
          {textButton(lang === 'ar' ? '‹' : '›', () => { stop(); setSelected(null); setNumberGroup(Math.min(numberGroups.length - 1, numberGroup + 1)); setShowNumberRanges(false); }, false, numberGroup === numberGroups.length - 1, 'letters-number-next', trCopy('numbersNext', '次の数字のまとまり', 'Next number group'))}
        </View>}
        {isNumbers && showNumberRanges && <View style={styles.numberRanges} testID="letters-number-ranges">{numberGroups.map(g => <Pressable key={g.id} testID={`letters-number-range-${g.id}`} accessibilityRole="button" accessibilityLabel={g.label} accessibilityState={{ selected: numberGroup === g.id }} onPress={() => { stop(); setSelected(null); setNumberGroup(g.id); setShowNumberRanges(false); }} style={[styles.numberRange, numberGroup === g.id && styles.tileActive]}><Text style={[styles.rangeText, numberGroup === g.id && styles.white, ss(14, 22)]}>{g.label}</Text></Pressable>)}</View>}
        {isChart && <View style={styles.combinationPanel}>
          <View testID={isConjunct ? 'letters-conjunct-grid' : 'letters-consonant-grid'} style={styles.letterGrid}>{chartLetters.map((letter, i) => <Pressable key={letter.id} testID={isConjunct ? `letters-conjunct-${letter.id}` : `letters-consonant-${letter.id}`} accessibilityRole="button" accessibilityLabel={`${isConjunct ? (trCopy('c_110bd970bb4f', '複合文字', 'Conjunct')) : (trCopy('c_f7ae5439c9df', '子音', 'Consonant'))} ${letter.ne}`} accessibilityState={{ selected: chartIndex === i }} onPress={() => { stop(); if (isConjunct) setConjunctIndex(i); else setRow(i); setSelected(null); }} style={[styles.letterTile, chartIndex === i && styles.tileActive]}><Text style={[styles.tileText, chartIndex === i && styles.white, ss(22, 32)]}>{letter.ne}</Text></Pressable>)}</View>
        </View>}
        {sample && <>
          <Text style={[styles.stepLabel, ss(13, 22)]}>{isNumbers ? (trCopy('c_de9187178a2a', '数字をタップして読み方を聞こう', 'TAP A NUMBER TO HEAR ITS NAME')) : isCombination ? (trCopy('c_1a76eaaec24c', '12通り · 先頭は母音なし（音声は k・s のみ）', '12 FORMS · FIRST: NO VOWEL (AUDIO: k / s ONLY)')) : current.id === 'start' ? (trCopy('c_dd260c9ff1fb', '子音＋a ／ 母音なしを聞き比べる', 'COMPARE: WITH a / WITHOUT A VOWEL')) : isConjunct ? (trCopy('c_5cc06dafae4b', '11通りの母音付き', '11 VOWEL FORMS')) : (trCopy('c_957d0f61920b', '文字をタップして確かめよう', 'TAP A LETTER TO COMPARE'))}</Text>
          <View style={[styles.soundGrid, isChart && styles.compactSoundGrid]} testID="letters-sound-chart">{samples.map((s, i) => {
            const active = playing?.id === s.id;
            if (isNumbers) return <Pressable key={s.id} testID={`letters-play-${s.id}`} accessibilityRole="button" accessibilityLabel={`${s.meaning}: ${s.speech}, ${s.roman}`} accessibilityState={{ selected: selectionIndex === i, disabled: !s.audio }} disabled={!s.audio} onPress={() => { setSelected(i); if (s.audio) play(s.id, s.audio); }} style={({ pressed }) => [styles.numberTile, active && styles.tileActive, pressed && styles.pressed]}>
              <View style={styles.numberTop}><Text style={[styles.chartRoman, active && styles.white, ss(16, 24)]}>{s.ne}</Text><Text style={[styles.muted, active && styles.white, ss(12, 20)]}>{numberValue(s).toLocaleString('en-US')} {active ? '●' : '▶'}</Text></View>
              <Text style={[styles.numberWord, active && styles.white, ss(20, 29)]}>{s.speech}</Text>
              <Text style={[styles.chartRoman, active && styles.white, ss(13, 21)]}>{s.roman}</Text>
            </Pressable>;
            if (!s.audio) return <Pressable key={s.id} testID={`letters-symbol-${s.id}`} accessibilityRole="button" accessibilityLabel={`${trCopy('c_361e9322db89', '文字を選ぶ', 'Select written form')}: ${s.ne}, ${s.roman}`} accessibilityState={{ selected: selectionIndex === i }} onPress={() => { stop(); setSelected(i); }} style={[styles.soundTile, isChart && styles.compactSoundTile, styles.referenceTile, selectionIndex === i && styles.soundTileSelected]}><Text style={[styles.tileText, ss(isChart ? 24 : 28, isChart ? 34 : 42)]}>{s.ne}</Text><Text style={[styles.chartRoman, styles.tileRoman, ss(isChart ? 12 : 14, isChart ? 18 : 22)]}>{s.roman}</Text><Text style={[styles.tileCue, ss(10, 16)]}>{trCopy('c_b9b20f15dc57', '文字', 'Text')}</Text></Pressable>;
            return <Pressable key={s.id} testID={`letters-play-${s.id}`} accessibilityRole="button" accessibilityLabel={`${trCopy('c_afb671b91dfe', '音を聞く', 'Play sound')}: ${s.speech ?? s.ne}`} accessibilityState={{ selected: selectionIndex === i }} onPress={() => { setSelected(i); if (s.audio) play(s.id, s.audio); }} style={({ pressed }) => [styles.soundTile, isChart && styles.compactSoundTile, current.id === 'start' && styles.pairTile, selectionIndex === i && styles.soundTileSelected, active && styles.tileActive, pressed && styles.pressed]}>
              <Text style={[styles.tileText, active && styles.white, ss(isChart ? 24 : 28, isChart ? 34 : 42)]}>{s.ne}</Text>
              <Text style={[styles.chartRoman, styles.tileRoman, active && styles.white, ss(isChart ? 12 : 14, isChart ? 18 : 22)]}>{s.roman}</Text>
              <Text style={[styles.tileCue, active && styles.white, ss(11, 18)]}>{active ? '●' : '▶'}</Text>
            </Pressable>;
          })}</View>
          {!isNumbers && <View style={styles.selectionCard} testID="letters-selection">
            <View style={styles.selectionRow}><Text style={[styles.selectionGlyph, ss(26, 38)]}>{sample.ne}</Text><Text style={[styles.chartRoman, ss(15, 24)]}>{sample.roman}</Text><Text style={[styles.body, styles.selectionMeaning, ss(14, 23)]}>{sample.meaning}</Text></View>
            {current.id === 'marks' && sample.detail && <Text style={[styles.body, ss(14, 23)]}>{sample.detail}</Text>}
            {!!words?.length && exampleWords(words)}
          </View>}
        </>}
        {isNumbers && <View style={styles.helpBody}><Text style={[styles.body, ss(14, 24)]}>{current.body}</Text></View>}
        <View testID="letters-section-navigation" style={styles.sectionNavigation}>
          {([-1, 1] as const).map(direction => {
            const index = section! + direction, inRange = index >= 0 && index < data.sections.length;
            const label = direction < 0 ? (trCopy('c_2802a51539c9', '‹ 前へ', '‹ Previous')) : (trCopy('c_82d99d2c9e4c', '次へ ›', 'Next ›'));
            const title = inRange ? destination(index) : (trCopy('c_c349cd02f1ad', '文字の一覧', 'All categories'));
            return <Pressable key={direction} testID={direction < 0 ? 'letters-prev-section' : 'letters-next-section'} accessibilityRole="button" accessibilityLabel={`${label}: ${title}`} onPress={() => move(inRange ? index : null)} style={({ pressed }) => [styles.sectionLink, direction > 0 && styles.primary, pressed && styles.pressed]}>
              <Text style={[styles.muted, direction > 0 && styles.white, ss(13, 22)]}>{label}</Text>
              <Text style={[styles.cardTitle, direction > 0 && styles.white, ss(16, 26)]}>{title}</Text>
            </Pressable>;
          })}
        </View>
      </>}
    </ScrollView>
    {current && samples.length > 0 && <View style={styles.playerBar}>
      <View style={styles.playerMessage}>{playing ? <LearningSound key={playing.key} audio={playing.audio} onFinished={stop}/> : <Text style={[styles.muted, ss(13, 22)]}>{trCopy('c_6df7faf395a9', '▶ のある文字・単語をタップして再生。', '▶ marks a recording. Tap to listen again.')}</Text>}</View>
      {textButton(trCopy('c_ec7502ce7fde', '停止', 'Stop'), stop, false, !playing)}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  sectionTitle: { color: ink, fontWeight: '700' }, muted: { color: muted },
  libraryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  libraryCard: { flexBasis: '45%', flexGrow: 1, padding: 17, gap: 5, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dce6dd', minWidth: 125 },
  categoryGlyph: { color: teal }, cardTitle: { color: ink, fontWeight: '700' },
  groupTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupTab: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#e6eee7', justifyContent: 'center' },
  groupTabActive: { backgroundColor: teal }, groupText: { color: ink, fontWeight: '600' },
  flexTitle: { flex: 1, minWidth: 140 },
  helpTitle: { color: teal, fontWeight: '600' }, helpBody: { paddingHorizontal: 8, gap: 14 },
  body: { color: ink }, combinationPanel: { gap: 10 }, letterGrid: { direction: 'ltr', flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  stepLabel: { color: muted, fontWeight: '700', letterSpacing: .5 },
  soundGrid: { direction: 'ltr', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numberNavigation: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberChooser: { flex: 1, minHeight: 48, borderRadius: 12, padding: 10, backgroundColor: '#e6eee7', alignItems: 'center', justifyContent: 'center' },
  numberRanges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  numberRange: { minWidth: 72, minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#e6eee7', justifyContent: 'center', alignItems: 'center' },
  rangeText: { color: ink, fontWeight: '600' },
  numberTile: { flexBasis: '45%', flexGrow: 1, minWidth: 125, padding: 12, gap: 3, borderRadius: 15, borderWidth: 1, borderColor: '#d5e2d6', backgroundColor: '#fff' },
  numberTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 8 },
  numberWord: { color: ink, fontWeight: '600' },
  soundTile: { flexBasis: '28%', flexGrow: 1, minWidth: 80, minHeight: 72, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderRadius: 15, borderWidth: 1, borderColor: '#d5e2d6', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  compactSoundGrid: { gap: 6 },
  compactSoundTile: { flexBasis: '21%', minWidth: 72, minHeight: 60, paddingHorizontal: 6, paddingVertical: 5, gap: 4, borderRadius: 12 },
  soundTileSelected: { borderColor: teal, backgroundColor: '#e9f2e7' },
  pairTile: { flexBasis: '45%' },
  referenceTile: { backgroundColor: '#eef1ec', borderColor: '#e1e6dd' },
  tileRoman: { flexShrink: 1 },
  chartRoman: { color: teal, fontWeight: '600' }, tileCue: { color: muted, position: 'absolute', right: 8, top: 5 },
  selectionCard: { borderRadius: 18, padding: 12, backgroundColor: '#eef2e9', gap: 8 },
  selectionRow: { direction: 'ltr', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, selectionGlyph: { color: teal }, selectionMeaning: { flex: 1, minWidth: 110 },
  letterTile: { minWidth: 44, minHeight: 44, paddingHorizontal: 4, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#ceddd2', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tileText: { color: ink }, tileActive: { backgroundColor: teal, borderColor: teal },
  playerBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 8, minHeight: 68, backgroundColor: '#fbfcf9', borderTopWidth: 1, borderTopColor: '#dfe8e0' },
  playerMessage: { flex: 1 },
  wordsCard: { gap: 8 },
  wordRow: { gap: 4 }, wordDivider: { borderTopWidth: 1, borderTopColor: '#cbdac5', paddingTop: 8 },
  wordButton: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 }, wordContent: { flex: 1, minWidth: 0 },
  wordTitleRow: { direction: 'ltr', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10 },
  wordNe: { color: ink, fontWeight: '600' }, wordRoman: { color: muted },
  wordPlay: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: '#e6eee7', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: ink, fontWeight: '600', textAlign: 'center' }, primary: { backgroundColor: teal }, white: { color: '#fff' },
  disabled: { opacity: .35 }, pressed: { opacity: .78 },
  sectionNavigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  sectionLink: { flexBasis: '45%', flexGrow: 1, minWidth: 120, minHeight: 76, padding: 15, gap: 5, borderRadius: 16, backgroundColor: '#e6eee7', justifyContent: 'center' },
});
