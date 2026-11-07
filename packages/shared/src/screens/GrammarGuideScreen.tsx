// 文法モードの「教材」表示画面。構造化ブロック(goal/h/p/note/table)をネイティブ描画する。
// RootStack に登録(ヘッダー非表示)のため、自前のトップバー(✕+タイトル)を描く。
import { Fragment, useEffect, useRef, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Image, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../theme';
import type { RootStackParamList } from '../types';
import { useScaleStyle, useGlobalScaleStyle } from '../SettingsContext';
import { useI18n } from '../i18n';
import { partitionLesson, readingGroups, readingCopy, examplePreview, type ReadingPart, type ReadingGroup } from '../grammarReading';
import { useGrammarGuide, useGrammarGuideImageResolver, type GuideBlock, type GuideImage } from '../grammarGuide';
import { guidePalette, guideStep, type GuidePresentation } from '../grammarPresentation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GrammarGuide'>;
type R = RouteProp<RootStackParamList, 'GrammarGuide'>;

// **太字** を反映して描画する簡易リッチテキスト。
function Rich({ text, style, emphasisColor, heading = false }: { text: string; style?: any; emphasisColor?: string; heading?: boolean }) {
  const parts = text.split('**');
  return (
    <Text style={style} accessibilityRole={heading ? 'header' : undefined}>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Text key={i} style={[styles.bold, emphasisColor && { color: emphasisColor }]}>{p}</Text> : <Fragment key={i}>{p}</Fragment>
      )}
    </Text>
  );
}

function Table({ headers, rows, ss, presentation }: { headers: string[]; rows: string[][]; ss: ReturnType<typeof useScaleStyle>; presentation?: GuidePresentation }) {
  const palette = guidePalette(presentation?.tone);
  const { width, fontScale } = useWindowDimensions();
  const scaleStyle = useGlobalScaleStyle();
  // Use the actual measured container (including accordion padding) and both
  // app/OS font scaling. Phones get labelled rows rather than squeezed columns.
  const [measured, setMeasured] = useState<number | null>(null);
  const effectiveWidth = (measured ?? Math.min(width - 48, 712)) / (fontScale * scaleStyle(16).fontSize / 16);
  const stacked = effectiveWidth / Math.max(headers.length, 1) < 145;
  const wordTable = headers.length === 3 && ['読み', 'Reading'].includes(headers[1]);
  if (stacked) return <View onLayout={e => setMeasured(e.nativeEvent.layout.width)} style={styles.tableStack}>
    {rows.map((row, ri) => {
      const rowPalette = guidePalette(presentation?.rowTones?.[ri]) ?? palette;
      return <View key={ri} style={[styles.tableRecord, rowPalette && { backgroundColor: rowPalette.soft, borderColor: rowPalette.line }]}>
        {wordTable ? <>
          <Rich text={row[0]} style={[styles.bold, ss(20, 32), rowPalette && { color: rowPalette.ink }]} />
          <Rich text={row[1]} style={[styles.recordLabel, ss(14, 23)]} />
          <Rich text={row[2]} style={[styles.cell, ss(16, 27), rowPalette && { color: rowPalette.ink }]} />
        </> : headers.map((header, ci) => <View key={ci} style={styles.recordField}>
          <Rich text={header} style={[styles.recordLabel, ss(13, 20), rowPalette && { color: rowPalette.ink }]} />
          <Rich text={row[ci] ?? ''} style={[styles.cell, ss(16, 26), ci === 0 && styles.bold, rowPalette && { color: rowPalette.ink }]} emphasisColor={rowPalette?.accent} />
        </View>)}
      </View>;
    })}
  </View>;
  return (
    <View onLayout={e => setMeasured(e.nativeEvent.layout.width)} style={[styles.table, palette && { borderColor: palette.line, borderRadius: 10 }]}>
      <View style={[styles.tr, styles.trHead, palette && { backgroundColor: palette.soft }]}>
        {headers.map((h, i) => (
          <View key={i} style={styles.td}>
            <Rich text={h} style={[styles.cellHead, ss(14, 22), palette && { color: palette.ink }]} emphasisColor={palette?.accent} />
          </View>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={[styles.tr, ri % 2 === 1 && styles.trAlt, palette && { backgroundColor: (guidePalette(presentation?.rowTones?.[ri]) ?? palette).soft, borderTopColor: palette.line }]}>
          {r.map((c, ci) => (
            <View key={ci} style={styles.td}>
              <Rich text={c} style={[styles.cell, ss(16, 26), palette && { color: (guidePalette(presentation?.rowTones?.[ri]) ?? palette).ink }]} emphasisColor={(guidePalette(presentation?.rowTones?.[ri]) ?? palette)?.accent} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function CultureImage({ media, ss }: { media: GuideImage; ss: ReturnType<typeof useScaleStyle> }) {
  const resolve = useGrammarGuideImageResolver();
  const [source, setSource] = useState<ImageSourcePropType | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setSource(null); setFailed(false);
    resolve(media).then(value => { if (active) setSource(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [resolve, media.uri, media.sha256]);
  const ratio = Number.isFinite(media.width / media.height) && media.width > 0 && media.height > 0 ? media.width / media.height : 1.5;
  return <View style={styles.cultureFigure}>
    {source && !failed ? <View style={[styles.cultureImageFrame, { aspectRatio: ratio }]}>
      <Image source={source} style={styles.cultureImage} resizeMode="contain" accessible accessibilityLabel={media.alt} onError={() => setFailed(true)} />
    </View> : <Text style={[styles.cultureAlt, ss(13, 21)]}>{media.alt}</Text>}
    <Text style={[styles.cultureCaption, ss(12, 19)]}>{media.caption}</Text>
  </View>;
}

// Contiguous culture blocks share one card. Older apps still read their h/p text.
function LessonBlocks({ blocks, ss }: { blocks: GuideBlock[]; ss: ReturnType<typeof useScaleStyle> }) {
  const output = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.lessonSupplement?.kind !== 'culture') { output.push(<Block key={i} b={b} ss={ss} />); continue; }
    const start = i, group = [b];
    while (blocks[i + 1]?.lessonSupplement?.kind === 'culture' && blocks[i + 1]?.lessonSupplement?.id === b.lessonSupplement.id) group.push(blocks[++i]);
    const palette = guidePalette('violet')!;
    output.push(<View key={start} style={[styles.cultureCard, { backgroundColor: palette.soft, borderColor: palette.line }]}>
      {group.map((part, j) => part.image ? <CultureImage key={j} media={part.image} ss={ss} /> : part.type !== 'table' ?
        <Rich key={j} text={part.text} heading={part.type === 'h'} style={[part.type === 'h' ? styles.cultureTitle : styles.cultureBody, part.type === 'h' ? ss(18, 29) : ss(16, 27), { color: palette.ink }]} emphasisColor={palette.accent} /> : null)}
    </View>);
  }
  return <>{output}</>;
}

function Block({ b, ss }: { b: GuideBlock; ss: ReturnType<typeof useScaleStyle> }) {
  if (b.image) return <CultureImage media={b.image} ss={ss} />;
  const palette = guidePalette(b.presentation?.tone);
  if (b.type === 'goal') {
    return (
      <View style={[styles.goal, palette && { backgroundColor: palette.soft, borderLeftColor: palette.accent, borderRadius: 12, borderLeftWidth: 5 }]}>
        <Rich text={b.text} style={[styles.goalText, palette ? ss(15, 24) : ss(14, 21), palette && { color: palette.ink }]} emphasisColor={palette?.accent} />
      </View>
    );
  }
  if (b.type === 'h') {
    return <Rich heading text={b.text} style={[styles.h, ss(18, 29), palette && { color: palette.ink, backgroundColor: palette.soft, borderRadius: 8, padding: 12 }]} emphasisColor={palette?.accent} />;
  }
  if (b.type === 'note') {
    if (palette) {
      return <View style={[styles.lessonCard, { backgroundColor: palette.soft, borderColor: palette.line, borderLeftColor: palette.accent }]}>
        <Rich text={b.text} style={[styles.cardText, ss(14, 23), { color: palette.ink }]} emphasisColor={palette.accent} />
      </View>;
    }
    return (
      <View style={styles.note}>
        <Text style={[styles.noteMark, ss(14)]}></Text>
        <Rich text={b.text} style={[styles.noteText, ss(13, 20)]} />
      </View>
    );
  }
  if (b.type === 'table') {
    return <Table headers={b.headers} rows={b.rows} ss={ss} presentation={b.presentation} />;
  }
  if (palette) {
    if (b.presentation?.role === 'plain') {
      return <Rich text={b.text} style={[styles.p, ss(16, 27)]} emphasisColor={palette.accent} />;
    }
    const step = b.presentation?.role === 'step' ? guideStep(b.text) : null;
    if (step) {
      return <View style={[styles.lessonStep, { backgroundColor: palette.soft, borderColor: palette.line }]}>
        <View style={[styles.stepBadge, { backgroundColor: palette.accent }]}><Text style={[styles.stepNumber, ss(14, 20)]}>{step.number}</Text></View>
        <Rich text={step.text} style={[styles.stepBody, ss(16, 27), { color: palette.ink }]} emphasisColor={palette.accent} />
      </View>;
    }
    const join = b.presentation?.join;
    const isExample = b.presentation?.role === 'example';
    return <View style={[styles.lessonCard, { backgroundColor: palette.soft, borderColor: palette.line, borderLeftColor: palette.accent },
      join && join !== 'start' && { borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: 0 },
      join && join !== 'end' && { borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, paddingBottom: 6 }]}>
      <Rich text={b.text} style={[isExample ? styles.exampleText : styles.cardText, isExample ? ss(20, 32) : ss(16, 27), { color: palette.ink }]} emphasisColor={palette.accent} />
    </View>;
  }
  return <Rich text={b.text} style={[styles.p, ss(16, 27)]} />;
}

function ReadingAccordion({ group, example, ss, copy }: { group: ReadingGroup; example: boolean; ss: ReturnType<typeof useScaleStyle>; copy: ReturnType<typeof readingCopy> }) {
  const [open, setOpen] = useState(false);
  const preview = example ? examplePreview(group) : '';
  return <View style={styles.accordion}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.accordionButton}>
      <View style={styles.accordionHeading}>
        <Rich text={group.title} style={[styles.bold, ss(16, 26), styles.flexText]} />
        <Text style={[styles.actionText, ss(13, 21)]}>{open ? copy.hide : copy.open} {open ? '−' : '+'}</Text>
      </View>
      {!open && !!preview && <Text style={[styles.previewText, ss(18, 29)]}>{preview}</Text>}
      {!open && !!group.subtitle && <Text style={[styles.p, ss(15, 25)]}>{group.subtitle}</Text>}
    </Pressable>
    {open && <View style={styles.accordionBody}><LessonBlocks blocks={group.blocks} ss={ss} /></View>}
  </View>;
}

export default function GrammarGuideScreen() {
  const nav = useNavigation<Nav>();
  const { themeId, title, studySession } = useRoute<R>().params;
  const ss = useScaleStyle();
  const insets = useSafeAreaInsets();
  const { lang } = useI18n();
  const copy = readingCopy(lang);
  const [part, setPart] = useState<ReadingPart>('rules');
  const scroll = useRef<ScrollView>(null);
  const guide = useGrammarGuide();
  const blocks: GuideBlock[] = (guide && guide[String(themeId)]) || [];
  const sections = partitionLesson(blocks);
  const parts = (Object.keys(sections) as ReadingPart[]).filter(key => sections[key].length > 0);
  const selected = parts.includes(part) ? part : 'rules';
  const groups = readingGroups(sections[selected], copy.extra);
  const choose = (next: ReadingPart) => { setPart(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  useEffect(() => { setPart('rules'); scroll.current?.scrollTo({ y: 0, animated: false }); }, [themeId, lang]);

  return (
    <View style={styles.root}>
      <View style={[styles.topbar, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={() => nav.goBack()} style={styles.iconBtn}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.topTitle, ss(16, 25)]}>{title}</Text>
      </View>
      {parts.length > 1 && <View style={styles.partTabs}>{parts.map(key => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: selected === key }} onPress={() => choose(key)} style={[styles.partTab, selected === key && styles.partTabSelected]}>
        <Text style={[styles.partTabText, ss(14, 22), selected === key && styles.partTabTextSelected]}>{copy[key]}{key === 'examples' ? ` (${readingGroups(sections.examples, copy.extra).length})` : ''}</Text>
      </Pressable>)}</View>}
      <ScrollView ref={scroll} contentContainerStyle={styles.container}>
        {blocks.length === 0 ? (
          <Text style={[styles.p, ss(16, 27)]}>{copy.empty}</Text>
        ) : (
          <View key={`${themeId}-${lang}-${selected}`}>
            {selected === 'reference' || selected === 'examples' ? <>
              <Text style={[styles.p, ss(15, 25)]}>{selected === 'examples' ? copy.examplesHint : copy.referenceHint}</Text>
              {groups.map((group, i) => <ReadingAccordion key={i} group={group} example={selected === 'examples'} copy={copy} ss={ss} />)}
            </> : <LessonBlocks blocks={sections[selected]} ss={ss} />}
            {selected === 'rules' && sections.reference.length > 0 && <Pressable accessibilityRole="button" onPress={() => choose('reference')} style={styles.secondaryAction}><Text style={[styles.actionText, ss(16, 25)]}>{copy.next} →</Text></Pressable>}
            <Pressable accessibilityRole="button" onPress={() => nav.navigate('Practice', { themeId, mode: 'grammar', examplesOnly: true, challenge: false })} style={styles.practiceAction}><Text style={[styles.practiceText, ss(16, 25)]}>{copy.practice} →</Text></Pressable>
            {studySession && <Pressable accessibilityRole="button" onPress={() => nav.replace('Practice', { themeId, mode: 'grammar', studySession, challenge: false })} style={styles.secondaryAction}><Text style={[styles.actionText, ss(16, 25)]}>{lang === 'en' ? 'Start step practice' : 'ステップ練習へ'} →</Text></Pressable>}
          </View>
        )}
        <View style={{ height: spacing.xxl + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableStack: { width: '100%', marginBottom: 16 },
  tableRecord: { padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 12 },
  recordField: { marginBottom: 10 },
  recordLabel: { color: colors.inkMute, marginBottom: 3, fontWeight: '600' },
  partTabs: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 8, gap: 6, backgroundColor: colors.surface },
  partTab: { flexBasis: '47%', flexGrow: 1, minHeight: 44, justifyContent: 'center', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  partTabSelected: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  partTabText: { textAlign: 'center', color: '#1e3a8a', fontWeight: '600' },
  partTabTextSelected: { color: '#ffffff' },
  accordion: { borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  accordionButton: { padding: 14, minHeight: 52, backgroundColor: '#eff6ff' },
  accordionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flexText: { flex: 1, minWidth: 0 },
  accordionBody: { padding: 14 },
  previewText: { color: '#064e3b', marginTop: 8 },
  actionText: { color: '#1e3a8a', fontWeight: '600' },
  secondaryAction: { minHeight: 48, padding: 14, backgroundColor: '#eff6ff', borderRadius: 12, marginTop: 20 },
  practiceAction: { minHeight: 48, padding: 14, backgroundColor: '#1e3a8a', borderRadius: 12, marginTop: 16 },
  practiceText: { color: '#ffffff', fontWeight: '700', textAlign: 'center' },
  cultureCard: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 20, marginBottom: 24, overflow: 'hidden' },
  cultureTitle: { fontWeight: '700', marginBottom: 12 },
  cultureBody: { marginBottom: 12 },
  cultureFigure: { width: '100%', marginBottom: 14 },
  cultureImageFrame: { width: '100%', overflow: 'hidden', borderRadius: 12, backgroundColor: '#ede9f5' },
  cultureImage: { width: '100%', height: '100%' },
  cultureCaption: { color: '#635376', marginTop: 6 },
  cultureAlt: { color: '#635376' },
  lessonCard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 10, padding: 14, marginBottom: 12 },
  exampleText: { fontSize: 18, lineHeight: 29, fontWeight: '600' },
  cardText: { fontSize: 14, lineHeight: 23 },
  lessonStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  stepBadge: { minWidth: 28, minHeight: 28, paddingHorizontal: 5, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stepNumber: { color: '#ffffff', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  stepBody: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 22 },
  root: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  close: { fontSize: 20, color: colors.inkMute },
  topTitle: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '700', color: colors.ink },
  container: { padding: spacing.lg, maxWidth: 760, width: '100%', alignSelf: 'center' },
  goal: {
    backgroundColor: colors.bgSoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentJa,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  goalText: { fontSize: 14, color: colors.ink, lineHeight: 21, fontWeight: '600' },
  h: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  p: { fontSize: 14, color: colors.inkMute, lineHeight: 22, marginBottom: spacing.sm },
  bold: { fontWeight: '700', color: colors.ink },
  note: {
    flexDirection: 'row',
    backgroundColor: '#fff8e1',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  noteMark: { fontSize: 14 },
  noteText: { flex: 1, fontSize: 13, color: '#7a5a00', lineHeight: 20 },
  table: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line },
  trHead: { borderTopWidth: 0, backgroundColor: colors.bgSoft },
  trAlt: { backgroundColor: colors.bgSoft },
  td: { flex: 1, minWidth: 0, paddingVertical: 10, paddingHorizontal: 10, borderLeftWidth: 1, borderLeftColor: colors.line, justifyContent: 'center' },
  cellHead: { fontSize: 12, fontWeight: '700', color: colors.ink, lineHeight: 17 },
  cell: { fontSize: 12, color: colors.ink, lineHeight: 17 },
});
