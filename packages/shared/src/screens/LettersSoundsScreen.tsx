import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningSound } from '../LearningSound';
import type { LetterSample } from '../learning';

const ink='#163d45', teal='#0f766e';
export default function LettersSoundsScreen() {
  const { LETTERS_SOUNDS: data }=useAppData(), learning=useLearning(), {lang}=useI18n(), ss=useScaleStyle(), nav=useNavigation();
  const en=lang==='en', [section,setSection]=useState(0), [row,setRow]=useState(0), [playing,setPlaying]=useState<{sample:LetterSample;key:number}|null>(null);
  const scroll=useRef<ScrollView>(null), serial=useRef(0);
  useLayoutEffect(()=>nav.setOptions({title:en?'Letters & sounds':'文字と音'}),[nav,en]);
  useFocusEffect(useCallback(()=>()=>setPlaying(null),[]));
  if(!data)return <View style={{padding:24}}><Text style={ss(18,30)}>{en?'The letters lesson is being prepared. Please reopen it after the content update.':'文字教材を準備しています。コンテンツの更新後に開き直してください。'}</Text></View>;
  const current=data.sections[section], read=learning?.state.lettersRead??[];
  const move=(index:number)=>{setPlaying(null);setSection(index);scroll.current?.scrollTo({y:0,animated:false});};
  const button=(label:string,fn:()=>void,selected=false)=><Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={fn} style={{padding:14,minHeight:48,borderRadius:14,backgroundColor:selected?teal:'#e6efec'}}><Text style={[{color:selected?'white':ink,fontWeight:'700'},ss(16,26)]}>{label}</Text></Pressable>;
  const cards=(samples:LetterSample[])=>samples.map((sample,i)=><View key={sample.id} style={{backgroundColor:i%2?'#eef2ff':'#ecfdf5',borderRadius:18,padding:18,gap:8}}>
    <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:16}}><Text style={[{color:ink,fontWeight:'600'},ss(40,64)]}>{sample.ne}</Text><Text style={[{color:teal},ss(22,34)]}>{sample.roman}</Text></View>
    <Text style={[{color:ink,fontWeight:'600'},ss(18,30)]}>{sample.meaning}</Text>
    {!!sample.detail&&<Text style={[{color:'#425a63'},ss(16,28)]}>{sample.detail}</Text>}
    {sample.audio&&button(en?`Listen: ${sample.speech??sample.ne}`:`聞く：${sample.speech??sample.ne}`,()=>setPlaying({sample,key:++serial.current}))}
    {playing?.sample.id===sample.id&&sample.audio&&<LearningSound key={playing.key} audio={sample.audio}/>}
  </View>);
  return <View style={{flex:1,backgroundColor:'#f5f8f6'}}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}} contentContainerStyle={{padding:12,gap:8}}>{data.sections.map((s,i)=><View key={s.id}>{button(`${read.includes(s.id)?'✓ ':''}${i+1}. ${s.title}`,()=>move(i),i===section)}</View>)}</ScrollView>
    <ScrollView ref={scroll} contentContainerStyle={{padding:20,paddingBottom:48,gap:16,maxWidth:760,width:'100%',alignSelf:'center'}}>
      <Text style={[{color:teal,fontWeight:'700'},ss(14,24)]}>{section+1} / {data.sections.length} · {en?'EXPLORE THE SCRIPT':'形と音を、少しずつ'}</Text>
      <Text accessibilityRole="header" style={[{color:ink,fontWeight:'700'},ss(27,40)]}>{current.title}</Text>
      <Text style={[{color:'#344e57'},ss(18,31)]}>{current.body}</Text>
      {cards(current.samples)}
      {current.id==='combinations'&&<>
        <Text style={[{color:teal,fontWeight:'700'},ss(18,30)]}>{en?'Choose a consonant — then compare its 11 forms.':'子音を1つ選んで、11通りの形を見比べよう。'}</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{data.combinations.map((r,i)=><View key={r.consonant}>{button(r.consonant,()=>{setPlaying(null);setRow(i);},row===i)}</View>)}</View>
        {cards(data.combinations[row].samples)}
      </>}
      <Text style={[{color:'#52666c'},ss(14,24)]}>{en?'Readings are guides. Audio uses the same Nepali voice as the app. Compare sounds and mouth position; you do not need to memorise everything at once.':'ローマ字は読みの目印です。音声はアプリと同じネパール語音声。口の形と音を確かめながら、少しずつ進めよう。'}</Text>
      {learning?.ready&&button(read.includes(current.id)?(en?'Reviewed ✓':'確認済み ✓'):(en?'Mark as reviewed':'ここまで確認した'),()=>{void learning.change(s=>({...s,lettersRead:[...new Set([...(s.lettersRead??[]),current.id])]}));},read.includes(current.id))}
      {learning?.error&&<Text style={[{color:'#9f1239'},ss(16,26)]}>{en?'Progress could not be saved. Please retry.':'記録を保存できませんでした。もう一度お試しください。'}</Text>}
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{section>0&&button(en?'Previous section':'前の項目',()=>move(section-1))}{section<data.sections.length-1&&button(en?'Next section →':'次の項目へ →',()=>move(section+1),true)}</View>
      {section===data.sections.length-1&&button(en?'Back to home':'ホームに戻る',()=>nav.goBack(),true)}
    </ScrollView>
  </View>;
}
