// 文法モードの「教材」表示画面。構造化ブロック(goal/h/p/note/table)をネイティブ描画する。
// RootStack に登録(ヘッダー非表示)のため、自前のトップバー(✕+タイトル)を描く。
import { Fragment, useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Image, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../theme';
import type { RootStackParamList } from '../types';
import { useScaleStyle } from '../SettingsContext';
import { useGrammarGuide, useGrammarGuideImageResolver, type GuideBlock, type GuideImage } from '../grammarGuide';
import { guidePalette, guideStep, type GuidePresentation } from '../grammarPresentation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GrammarGuide'>;
type R = RouteProp<RootStackParamList, 'GrammarGuide'>;

// **太字** を反映して描画する簡易リッチテキスト。
function Rich({ text, style, emphasisColor }: { text: string; style?: any; emphasisColor?: string }) {
  const parts = text.split('**');
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Text key={i} style={[styles.bold, emphasisColor && { color: emphasisColor }]}>{p}</Text> : <Fragment key={i}>{p}</Fragment>
      )}
    </Text>
  );
}

function Table({ headers, rows, ss, presentation }: { headers: string[]; rows: string[][]; ss: ReturnType<typeof useScaleStyle>; presentation?: GuidePresentation }) {
  const palette = guidePalette(presentation?.tone);
  return (
    <View style={[styles.table, palette && { borderColor: palette.line, borderRadius: 10 }]}>
      <View style={[styles.tr, styles.trHead, palette && { backgroundColor: palette.soft }]}>
        {headers.map((h, i) => (
          <View key={i} style={styles.td}>
            <Rich text={h} style={[styles.cellHead, ss(12, 17), palette && { color: palette.ink }]} emphasisColor={palette?.accent} />
          </View>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={[styles.tr, ri % 2 === 1 && styles.trAlt, palette && { backgroundColor: (guidePalette(presentation?.rowTones?.[ri]) ?? palette).soft, borderTopColor: palette.line }]}>
          {r.map((c, ci) => (
            <View key={ci} style={styles.td}>
              <Rich text={c} style={[styles.cell, ss(12, 17), palette && { color: (guidePalette(presentation?.rowTones?.[ri]) ?? palette).ink }]} emphasisColor={(guidePalette(presentation?.rowTones?.[ri]) ?? palette)?.accent} />
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
        <Rich key={j} text={part.text} style={[part.type === 'h' ? styles.cultureTitle : styles.cultureBody, part.type === 'h' ? ss(17, 26) : ss(15, 25), { color: palette.ink }]} emphasisColor={palette.accent} /> : null)}
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
    return <Rich text={b.text} style={[styles.h, ss(16, 23), palette && { color: palette.ink, backgroundColor: palette.soft, borderRadius: 8, padding: 12 }]} emphasisColor={palette?.accent} />;
  }
  if (b.type === 'note') {
    if (palette) {
      return <View style={[styles.lessonCard, { backgroundColor: palette.soft, borderColor: palette.line, borderLeftColor: palette.accent }]}>
        <Rich text={b.text} style={[styles.cardText, ss(14, 23), { color: palette.ink }]} emphasisColor={palette.accent} />
      </View>;
    }
    return (
      <View style={styles.note}>
        <Text style={[styles.noteMark, ss(14)]}>⚠️ </Text>
        <Rich text={b.text} style={[styles.noteText, ss(13, 20)]} />
      </View>
    );
  }
  if (b.type === 'table') {
    return <Table headers={b.headers} rows={b.rows} ss={ss} presentation={b.presentation} />;
  }
  if (palette) {
    if (b.presentation?.role === 'plain') {
      return <Rich text={b.text} style={[styles.p, ss(14, 22)]} emphasisColor={palette.accent} />;
    }
    const step = b.presentation?.role === 'step' ? guideStep(b.text) : null;
    if (step) {
      return <View style={[styles.lessonStep, { backgroundColor: palette.soft, borderColor: palette.line }]}>
        <View style={[styles.stepBadge, { backgroundColor: palette.accent }]}><Text style={[styles.stepNumber, ss(14, 20)]}>{step.number}</Text></View>
        <Rich text={step.text} style={[styles.stepBody, ss(14, 22), { color: palette.ink }]} emphasisColor={palette.accent} />
      </View>;
    }
    const join = b.presentation?.join;
    const isExample = b.presentation?.role === 'example';
    return <View style={[styles.lessonCard, { backgroundColor: palette.soft, borderColor: palette.line, borderLeftColor: palette.accent },
      join && join !== 'start' && { borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: 0 },
      join && join !== 'end' && { borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, paddingBottom: 6 }]}>
      <Rich text={b.text} style={[isExample ? styles.exampleText : styles.cardText, isExample ? ss(18, 29) : ss(14, 23), { color: palette.ink }]} emphasisColor={palette.accent} />
    </View>;
  }
  return <Rich text={b.text} style={[styles.p, ss(14, 22)]} />;
}

export default function GrammarGuideScreen() {
  const nav = useNavigation<Nav>();
  const { themeId, title } = useRoute<R>().params;
  const ss = useScaleStyle();
  const insets = useSafeAreaInsets();
  const guide = useGrammarGuide();
  const blocks: GuideBlock[] = (guide && guide[String(themeId)]) || [];

  return (
    <View style={styles.root}>
      <View style={[styles.topbar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => nav.goBack()} style={styles.iconBtn} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={[styles.topTitle, ss(16)]} numberOfLines={1}>{title}</Text>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {blocks.length === 0 ? (
          <Text style={[styles.p, ss(14, 22)]}>準備中</Text>
        ) : (
          <LessonBlocks blocks={blocks} ss={ss} />
        )}
        <View style={{ height: spacing.xxl + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  close: { fontSize: 20, color: colors.inkMute },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.ink },
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
  td: { flex: 1, paddingVertical: 7, paddingHorizontal: 8, borderLeftWidth: 1, borderLeftColor: colors.line, justifyContent: 'center' },
  cellHead: { fontSize: 12, fontWeight: '700', color: colors.ink, lineHeight: 17 },
  cell: { fontSize: 12, color: colors.ink, lineHeight: 17 },
});
