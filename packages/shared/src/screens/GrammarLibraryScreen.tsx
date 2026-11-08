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
  const { lang } = useI18n(), ss = useScaleStyle(), en = lang === 'en';
  useLayoutEffect(() => nav.setOptions({ title: en ? 'Grammar lessons' : '文法教材' }), [nav, en]);
  const lessons = themes.map((theme, index) => ({ ...theme, index })).filter(theme => guide?.[String(theme.id)]?.length);
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.intro}>
      <Text style={[styles.eyebrow, ss(12, 21)]}>GRAMMAR · STEP BY STEP</Text>
      <Text accessibilityRole="header" style={[styles.title, ss(26, 38)]}>{en ? 'Understand how\nNepali works.' : '文のしくみを、\nひとつずつ。'}</Text>
      <Text style={[styles.body, ss(15, 26)]}>{en ? 'Read the rules, explore forms and words, then practise in small steps. Each lesson also has a cultural break.' : 'ルールを読み、活用や語彙を確かめ、少しずつ練習。ネパールを感じる一休みも。'}</Text>
      <View style={styles.tags}>{(en ? ['Core rules', 'Forms & words', 'Practice', 'Take a break'] : ['基本ルール', '活用・語彙', '練習問題', '一休み']).map(label => <View key={label} style={styles.tag}><Text style={[styles.tagText, ss(13, 22)]}>{label}</Text></View>)}</View>
    </View>
    <Text style={[styles.caption, ss(14, 24)]}>{en ? 'Choose a lesson' : '学ぶテーマを選ぶ'}</Text>
    {lessons.map(theme => {
      const locked = isLockedAt(ent, theme.index);
      return <Pressable key={theme.id} testID={`grammar-lesson-${theme.id}`} accessibilityRole="button" accessibilityLabel={theme.name}
        onPress={() => locked ? nav.navigate('Paywall') : nav.navigate('GrammarGuide', { themeId: theme.id, title: theme.name })}
        style={({ pressed }) => [styles.lesson, locked && styles.locked, pressed && styles.pressed]}>
        <View style={styles.lessonText}><Text style={[styles.lessonTitle, ss(17, 28)]}>{theme.name}</Text><Text style={[styles.caption, ss(13, 22)]}>{en ? 'Open lesson' : '教材を読む'}</Text></View>
        {locked ? <LockBadge/> : <Text style={[styles.arrow, ss(22, 30)]}>›</Text>}
      </Pressable>;
    })}
    {!lessons.length && <Text style={[styles.body, ss(16, 28)]}>{en ? 'Lessons will appear after the content update.' : 'コンテンツ更新後に教材を表示します。'}</Text>}
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
