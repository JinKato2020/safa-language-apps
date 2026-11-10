import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import { Text } from './Text';
import { useI18n } from './i18n';
import { useScaleStyle } from './SettingsContext';
import type { LearningAudio } from './learning';

export type LearningAudioResolver = (audio: LearningAudio) => Promise<AudioSource | null>;
const Resolver = createContext<LearningAudioResolver>(async () => null);
export const useLearningAudioResolver = () => useContext(Resolver);
export function LearningAudioProvider({ resolve, children }: {resolve: LearningAudioResolver; children: ReactNode}) {
  return <Resolver.Provider value={resolve}>{children}</Resolver.Provider>;
}
// Mount only the selected clip: ten samples never create ten simultaneous players.
export function LearningSound({ audio, onFinished }: { audio: LearningAudio; onFinished?: () => void }) {
  const resolve = useContext(Resolver), [source,setSource] = useState<AudioSource | null>(null), [error,setError] = useState(false);
  const {lang, copy: trCopy }=useI18n(), ss=useScaleStyle();
  useEffect(()=>{let active=true; void resolve(audio).then(value=>{if(active){setSource(value);setError(!value);}}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[resolve, audio]);
  if(error) return <Text style={[{color:'#9f1239'},ss(14,24)]}>{trCopy('c_b4c7255430d7', '音声を開けませんでした。もう一度サンプルを押してください。', 'Audio is unavailable. Tap the sample to retry.')}</Text>;
  return source ? <Playback source={source} onFinished={onFinished}/> : <Text style={ss(14,24)}>{trCopy('c_7fcd2c5691d2', '音声を準備しています…', 'Preparing audio…')}</Text>;
}
function Playback({ source, onFinished }: {source: AudioSource; onFinished?: () => void}) {
  const player=useAudioPlayer(source), status=useAudioPlayerStatus(player), started=useRef(false);
  const {lang, copy: trCopy }=useI18n(),ss=useScaleStyle();
  useEffect(()=>{if(status.isLoaded&&!started.current){started.current=true;player.play();}},[status.isLoaded, player]);
  useEffect(()=>{if(status.didJustFinish)onFinished?.();},[status.didJustFinish, onFinished]);
  return <Text style={[{color:'#0f766e'},ss(14,24)]}>{status.playing?(trCopy('c_6f54eda780ed', '再生中…', 'Playing…')):!status.isLoaded?(trCopy('c_04a1e0267203', '音声を読み込み中…', 'Loading audio…')):(trCopy('c_58945ad9d47e', 'サンプルを押すと、もう一度聞けます。', 'Tap a sample to listen again.'))}</Text>;
}
