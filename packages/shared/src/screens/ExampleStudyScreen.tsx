import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { learningStyles as s } from '../LearningLaunch';
import { guidedSentence } from '../guidedPractice';
import { getL1 } from '../l1';
import type { RootStackParamList } from '../types';

export default function ExampleStudyScreen() {
  const data=useAppData(),{lang}=useI18n(),ss=useScaleStyle(),en=lang==='en';
  const nav=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {themeId,startIndex}=useRoute<RouteProp<RootStackParamList,'Practice'>>().params;
  const examples=data.getGrammarExamples(themeId),[index,setIndex]=useState(startIndex??0),[error,setError]=useState(false);
  const ex=examples[index],source=data.audio.nepaliGrammarAudio[`${themeId}-${index+1}`];
  const player=useAudioPlayer(source??null),status=useAudioPlayerStatus(player);
  useFocusEffect(useCallback(()=>()=>{try{player.pause();}catch{}},[player]));
  useLayoutEffect(()=>nav.setOptions({title:en?'Examples & audio':'例題と音声'}),[nav,en]);
  if(!ex)return <Text>{en?'No examples available.':'例題を準備しています。'}</Text>;
  const detail=guidedSentence(data,{mode:'grammar',themeId,index,ne:ex.ne});
  const l1=getL1(data.nativeLang),roman=l1.romanizeSentenceWithDict?.(ex.ne,w=>detail.words.find(x=>x.text===w)?.roman)??l1.romanizeSentence?.(ex.ne);
  return <ScrollView contentContainerStyle={{padding:20,gap:16,maxWidth:760,width:'100%',alignSelf:'center'}}>
    <Text style={[s.badge,ss(15,25)]}>{data.GRAMMAR_THEMES.find(t=>t.id===themeId)?.name} · {index+1} / {examples.length}</Text>
    <View style={[s.card,s.green]}><Text style={[s.title,ss(28,42)]}>{ex.ne}</Text><Text style={[s.body,ss(17,27)]}>{roman}</Text><Text style={[s.greenText,ss(20,32)]}>{ex.jp}</Text></View>
    <Pressable accessibilityRole="button" disabled={!source||!status.isLoaded} style={s.primary} onPress={async()=>{try{setError(false);await player.seekTo(0);player.play();}catch{setError(true);}}}><Text style={[s.primaryText,ss(17,26)]}>{source?(en?'Listen in Nepali':'ネパール語を聞く'):(en?'Audio is preparing…':'音声を準備しています…')}</Text></Pressable>
    {error&&<Text style={[s.error,ss(16,25)]}>{en?'Please try playing again.':'もう一度、再生をお試しください。'}</Text>}
    <View style={{flexDirection:'row',gap:12}}>{[-1,1].map(d=><Pressable key={d} accessibilityRole="button" disabled={index+d<0||index+d>=examples.length} style={[s.secondary,{flex:1,opacity:index+d<0||index+d>=examples.length ? .4 : 1}]} onPress={()=>{player.pause();setIndex(index+d);}}><Text style={[s.link,ss(16,25)]}>{d<0?(en?'Previous':'前の例題'):(en?'Next':'次の例題')}</Text></Pressable>)}</View>
    <Text accessibilityRole="header" style={[s.title,ss(20,30)]}>{en?'Words in this example':'この例題のことば'}</Text>
    {detail.words.map((w,i)=><View key={i} style={{padding:12,backgroundColor:i%2?'#f5f3ff':'#f0fdfa',borderRadius:12,gap:4}}><Text style={[s.title,ss(21,32)]}>{w.text} · {w.roman}</Text><Text style={[s.body,ss(17,28)]}>{w.meaning}</Text></View>)}
  </ScrollView>;
}
