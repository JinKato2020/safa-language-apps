import { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useGrammarGuide } from '../grammarGuide';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { useEntitlement, isLockedAt, LockBadge } from '../entitlement';
import type { RootStackParamList } from '../types';

export default function GrammarLibraryScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList, 'GrammarLibrary'>>();
  const { GRAMMAR_THEMES: themes } = useAppData(), guide = useGrammarGuide(), ent = useEntitlement();
  const { lang , copy: trCopy } = useI18n(), ss = useScaleStyle(), en = lang === 'en';
  useLayoutEffect(() => nav.setOptions({ title: trCopy('c_034f7e81b14c', '文法教材', 'Grammar lessons') }), [nav, en, trCopy]);
  const lessons = themes.map((theme, index) => ({ ...theme, index })).filter(theme => guide?.[String(theme.id)]?.length);
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.intro}>
      <Text style={[styles.eyebrow, ss(12, 21)]}>GRAMMAR · STEP BY STEP</Text>
      <Text accessibilityRole="header" style={[styles.title, ss(26, 38)]}>{trCopy('c_77822b6bb059', '文のしくみを、\nひとつずつ。', 'Understand how\nNepali works.')}</Text>
      <Text style={[styles.body, ss(15, 26)]}>{trCopy('c_57078f0e85cd', 'ルールを読み、活用や語彙を確かめ、少しずつ練習。ネパールを感じる一休みも。', 'Read the rules, explore forms and words, then practise in small steps. Each lesson also has a cultural break.')}</Text>
      <View style={styles.tags}>{(lang === 'ko' ? ['기본 규칙', '활용·어휘', '연습 문제', '잠깐 쉬어가기'] : en ? ['Core rules', 'Forms & words', 'Practice', 'Take a break'] : ['基本ルール', '活用・語彙', '練習問題', '一休み']).map(label => <View key={label} style={styles.tag}><Text style={[styles.tagText, ss(13, 22)]}>{label}</Text></View>)}</View>
    </View>
    <Text style={[styles.caption, ss(14, 24)]}>{trCopy('c_454f5414215f', '学ぶテーマを選ぶ', 'Choose a lesson')}</Text>
    {lessons.map(theme => {
      const locked = isLockedAt(ent, theme.index);
      return <Pressable key={theme.id} testID={`grammar-lesson-${theme.id}`} accessibilityRole="button" accessibilityLabel={theme.name}
        onPress={() => locked ? nav.navigate('Paywall') : nav.navigate('GrammarGuide', { themeId: theme.id, title: theme.name })}
        style={({ pressed }) => [styles.lesson, locked && styles.locked, pressed && styles.pressed]}>
        <View style={styles.lessonText}><Text style={[styles.lessonTitle, ss(17, 28)]}>{theme.name}</Text><Text style={[styles.caption, ss(13, 22)]}>{trCopy('c_7daadc316ca4', '教材を読む', 'Open lesson')}</Text></View>
        {locked ? <LockBadge/> : <Text style={[styles.arrow, ss(22, 30)]}>›</Text>}
      </Pressable>;
    })}
    {!lessons.length && <Text style={[styles.body, ss(16, 28)]}>{trCopy('c_6b4ebd5dd6e2', 'コンテンツ更新後に教材を表示します。', 'Lessons will appear after the content update.')}</Text>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { padding: 20, paddingBottom: 44, gap: 12, maxWidth: 760, width: '100%', alignSelf: 'center' },
  intro: { padding: 22, borderRadius: 24, backgroundColor: '#e3ebf5', gap: 12 },
  eyebrow: { color: '#445f83', letterSpacing: 1, fontWeight: '700' },
  title: { color: '#173758', fontWeight: '700' }, body: { color: '#304b61' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#ffffffb0' }, tagText: { color: '#264c70' },
  caption: { color: '#56697b' }, lesson: { minHeight: 78, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#dce4ed', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonText: { flex: 1, gap: 5 }, lessonTitle: { color: '#193b59', fontWeight: '600' }, arrow: { color: '#3c658b' },
  locked: { opacity: .55 }, pressed: { opacity: .78 },
});
