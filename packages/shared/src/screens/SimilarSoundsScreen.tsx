import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LearningSound } from '../LearningSound';
import type { LearningAudio } from '../learning';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { dictionaryTranslation } from '../nepaliDictionary';
import { useScaleStyle } from '../SettingsContext';

export default function SimilarSoundsScreen() {
  const { NEPALI_DICTIONARY, LETTERS_SOUNDS, similarSounds } = useAppData();
  const { t, lang } = useI18n();
  const ss = useScaleStyle();
  const entries = useMemo(() => new Map(NEPALI_DICTIONARY?.entries.map(entry => [entry.ne, entry])), [NEPALI_DICTIONARY]);
  const syllables = useMemo(() => new Map(LETTERS_SOUNDS?.combinations.flatMap(row => row.samples.map(sample => [sample.ne, sample] as const))), [LETTERS_SOUNDS]);
  const [playing, setPlaying] = useState<{ pair: string; word: string; request: number; audio: LearningAudio }>();
  const stop = useCallback(() => setPlaying(undefined), []);
  useFocusEffect(useCallback(() => stop, [stop]));
  if (!similarSounds) return null;

  function soundButton(word: string, id: string, source?: 'syllable', compact = false) {
    const wordEntry = source === 'syllable' ? undefined : entries.get(word);
    const entry = source === 'syllable' ? syllables.get(word) : wordEntry;
    const audio = entry?.audio;
    const meaning = wordEntry?.senses[0] && dictionaryTranslation(wordEntry.senses[0], lang);
    return <Pressable key={word} testID={`similar-sound-${id}-${word}`} accessibilityRole="button"
      accessibilityLabel={`${t('practice.playAudio')} · ${word}${meaning ? ` · ${meaning}` : ''}`}
      accessibilityState={{ disabled: !entry?.audio }} disabled={!entry?.audio}
      onPress={() => audio && setPlaying(current => ({ pair: id, word, audio, request: (current?.request ?? 0) + 1 }))}
      style={({ pressed }) => [styles.word, compact && styles.sample, (pressed || (playing?.pair === id && playing.word === word)) && styles.active]}>
      <Text style={[styles.heading, ss(22, 32)]}>{word}</Text>
      <Text style={[styles.body, ss(14, 22)]}>{entry?.roman}</Text>
      {meaning && <Text style={[styles.body, ss(14, 22)]}>{meaning}</Text>}
      {entry?.audio && <Text accessible={false} style={[styles.play, ss(14, 22)]}>▶</Text>}
    </Pressable>;
  }
  function playback(id: string) {
    return playing?.pair === id
      ? <LearningSound key={`${playing.word}-${playing.request}`} audio={playing.audio} onFinished={stop}/>
      : null;
  }

  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.intro}>
      <Text accessibilityRole="header" style={[styles.heading, ss(25, 37)]}>{similarSounds.heading[lang]}</Text>
      <Text style={[styles.body, ss(15, 24)]}>{similarSounds.instructions[lang]}</Text>
    </View>
    {similarSounds.groups.map(group => <View key={group.id} testID={`sound-group-${group.id}`} style={styles.group}>
      <Text accessibilityRole="header" style={[styles.heading, ss(20, 29)]}>{group.title[lang]}</Text>
      <Text style={[styles.body, ss(15, 24)]}>{group.hint[lang]}</Text>
      {group.exampleWord && soundButton(group.exampleWord, group.id, undefined, true)}
      {playback(group.id)}
      {group.pairs.map(({ source, contrast, first, second }) => {
        const words = [first, second];
        const id = words.join('-');
        return <View key={id} testID={`similar-pair-${id}`} style={styles.pair}>
          <Text style={[styles.heading, ss(16, 24)]}>{contrast}</Text>
          <View style={styles.words}>
            {words.map(word => soundButton(word, id, source))}
          </View>
          {playback(id)}
        </View>;
      })}
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { padding: 20, paddingBottom: 44, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  intro: { padding: 20, borderRadius: 22, backgroundColor: '#e3ebf5', gap: 6 },
  heading: { color: '#173758', fontWeight: '700' },
  body: { color: '#304b61' },
  group: { gap: 8, marginTop: 10 },
  pair: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#dce4ed', backgroundColor: '#fff', gap: 8 },
  words: { flexDirection: 'row', direction: 'ltr', gap: 8 },
  word: { flex: 1, minWidth: 0, padding: 11, borderRadius: 12, backgroundColor: '#f3f5f8', borderWidth: 1, borderColor: '#dce4ed' },
  active: { backgroundColor: '#e0f3ec', borderColor: '#599b85' },
  sample: { flex: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  play: { color: '#126b60', marginTop: 3 },
});
