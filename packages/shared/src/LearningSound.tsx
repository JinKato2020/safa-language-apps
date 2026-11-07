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
  const {lang}=useI18n(), ss=useScaleStyle();
  useEffect(()=>{let active=true; void resolve(audio).then(value=>{if(active){setSource(value);setError(!value);}}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[resolve,audio]);
  if(error) return <Text style={[{color:'#9f1239'},ss(14,24)]}>{lang==='en'?'Audio is unavailable. Tap the sample to retry.':'音声を開けませんでした。もう一度サンプルを押してください。'}</Text>;
  return source ? <Playback source={source} onFinished={onFinished}/> : <Text style={ss(14,24)}>{lang==='en'?'Preparing audio…':'音声を準備しています…'}</Text>;
}
function Playback({ source, onFinished }: {source: AudioSource; onFinished?: () => void}) {
  const player=useAudioPlayer(source), status=useAudioPlayerStatus(player), started=useRef(false);
  const {lang}=useI18n(),ss=useScaleStyle();
  useEffect(()=>{if(status.isLoaded&&!started.current){started.current=true;player.play();}},[status.isLoaded,player]);
  useEffect(()=>{if(status.didJustFinish)onFinished?.();},[status.didJustFinish,onFinished]);
  return <Text style={[{color:'#0f766e'},ss(14,24)]}>{status.playing?(lang==='en'?'Playing…':'再生中…'):!status.isLoaded?(lang==='en'?'Loading audio…':'音声を読み込み中…'):(lang==='en'?'Tap a sample to listen again.':'サンプルを押すと、もう一度聞けます。')}</Text>;
}
