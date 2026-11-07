import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from './Text';
import { useLearning } from './LearningContext';
import { useAppData } from './AppDataContext';
import { useI18n } from './i18n';
import { useScaleStyle } from './SettingsContext';
import { learningCopy } from './learningCopy';
import { practiceParams, resolveStudy, reviewItems, stepSignature } from './learning';
import type { RootStackParamList } from './types';

export function LearningLaunch() {
  const learning = useLearning(), data = useAppData(), { lang } = useI18n(), ss = useScaleStyle();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => { setNow(Date.now()); }, []));
  if (!learning || !data.LEARNING_PATH) return null;
  const copy = learningCopy(lang), { state, ready } = learning;
  const steps = data.LEARNING_PATH.steps;
  const completed = steps.filter(s => state.completed[s.id] === stepSignature(s.items)).length;
  const resume = state.resume && resolveStudy(data, state.resume.item) ? state.resume : undefined;
  const due = reviewItems(state, data, now);
  return <View style={learningStyles.card}>
    <Text accessibilityRole="header" style={[learningStyles.title, ss(18,27)]}>{data.LEARNING_PATH.title}</Text>
    <Text style={[learningStyles.body, ss(14,22)]}>{completed} / {steps.length} {copy.doneCount} · {copy.saved}</Text>
    <Pressable accessibilityRole="button" style={learningStyles.primary} onPress={() => nav.navigate('LearningPath')}>
      <Text style={[learningStyles.primaryText, ss(16,24)]}>{completed ? copy.path : copy.start} →</Text>
    </Pressable>
    {ready && resume && <Pressable accessibilityRole="button" style={learningStyles.secondary} onPress={() => nav.navigate('Practice', practiceParams(resume.item, resume.session))}>
      <Text style={[learningStyles.link, ss(16,24)]}>{copy.resume} →</Text>
    </Pressable>}
    {ready && due.length > 0 && <Pressable accessibilityRole="button" style={learningStyles.secondary} onPress={() => nav.navigate('Practice', practiceParams(due[0], { kind: 'review', items: due }))}>
      <Text style={[learningStyles.link, ss(16,24)]}>{copy.review} ({due.length}) →</Text>
    </Pressable>}
    {learning.error && <Text style={[learningStyles.error,ss(14,22)]}>{copy.error}</Text>}
  </View>;
}

export const learningStyles = StyleSheet.create({
  card: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, marginVertical: 12 },
  title: { color: '#1e3a8a', fontWeight: '700' }, body: { color: '#334155' },
  primary: { backgroundColor: '#1e3a8a', borderRadius: 10, padding: 12, minHeight: 48, justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  secondary: { borderColor: '#94a3b8', borderWidth: 1, backgroundColor: '#fff', borderRadius: 10, minHeight: 48, padding: 12, justifyContent: 'center' },
  link: { color: '#1e40af', fontWeight: '600', textAlign: 'center' }, error: { color: '#9f1239' },
  green: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }, greenText: { color: '#065f46', fontWeight: '700' },
  violet: { backgroundColor: '#f5f3ff', borderColor: '#c4b5fd' }, badge: { color: '#5b21b6', fontWeight: '700' },
});
