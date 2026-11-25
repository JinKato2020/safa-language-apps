import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LearningSound } from '../LearningSound';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { dictionaryTranslation } from '../nepaliDictionary';
import { useScaleStyle } from '../SettingsContext';

const pairs = [
  { label: 'k / kh', words: ['काम', 'खाम'], hint: 'breath' },
  { label: 't / th', words: ['ताल', 'थाल'], hint: 'breath' },
  { label: 'p / b', words: ['पानी', 'बानी'], hint: 'voicing' },
] as const;

export default function SimilarSoundsScreen() {
  const { NEPALI_DICTIONARY } = useAppData();
  const { t, lang } = useI18n();
  const ss = useScaleStyle();
  const entries = useMemo(() => new Map(NEPALI_DICTIONARY?.entries.map(entry => [entry.ne, entry])), [NEPALI_DICTIONARY]);
  const [playing, setPlaying] = useState<{ word: string; request: number }>();
  const activeAudio = playing ? entries.get(playing.word)?.audio : undefined;
  const stop = useCallback(() => setPlaying(undefined), []);
  useFocusEffect(useCallback(() => stop, [stop]));

  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.intro}>
      <Text accessibilityRole="header" style={[styles.heading, ss(25, 37)]}>{t('similarSounds.heading')}</Text>
      <Text style={[styles.body, ss(15, 24)]}>{t('similarSounds.instructions')}</Text>
    </View>
    {pairs.map(({ label, words, hint }) => <View key={label} style={styles.pair}>
      <Text accessibilityRole="header" style={[styles.heading, ss(19, 28)]}>{label}</Text>
      <Text style={[styles.body, ss(14, 23)]}>{t(`similarSounds.${hint}`)}</Text>
      <View style={styles.words}>
        {words.map(word => {
          const entry = entries.get(word);
          const meaning = entry?.senses[0] && dictionaryTranslation(entry.senses[0], lang);
          return <Pressable key={word} testID={`similar-sound-${word}`} accessibilityRole="button"
            accessibilityLabel={`${t('practice.playAudio')} · ${word}${meaning ? ` · ${meaning}` : ''}`}
            accessibilityState={{ disabled: !entry?.audio }} disabled={!entry?.audio}
            onPress={() => setPlaying(current => ({ word, request: (current?.request ?? 0) + 1 }))}
            style={({ pressed }) => [styles.word, (pressed || playing?.word === word) && styles.active]}>
            <Text style={[styles.heading, ss(22, 32)]}>{word}</Text>
            <Text style={[styles.body, ss(14, 22)]}>{entry?.roman}</Text>
            {meaning && <Text style={[styles.body, ss(14, 22)]}>{meaning}</Text>}
            {entry?.audio && <Text accessible={false} style={[styles.play, ss(14, 22)]}>▶</Text>}
          </Pressable>;
        })}
      </View>
      {playing && activeAudio && words.some(word => word === playing.word) &&
        <LearningSound key={`${playing.word}-${playing.request}`} audio={activeAudio} onFinished={stop}/>}
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { padding: 20, paddingBottom: 44, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  intro: { padding: 20, borderRadius: 22, backgroundColor: '#e3ebf5', gap: 6 },
  heading: { color: '#173758', fontWeight: '700' },
  body: { color: '#304b61' },
  pair: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#dce4ed', backgroundColor: '#fff', gap: 8 },
  words: { flexDirection: 'row', direction: 'ltr', gap: 8 },
  word: { flex: 1, minWidth: 0, padding: 11, borderRadius: 12, backgroundColor: '#f3f5f8', borderWidth: 1, borderColor: '#dce4ed' },
  active: { backgroundColor: '#e0f3ec', borderColor: '#599b85' },
  play: { color: '#126b60', marginTop: 3 },
});
