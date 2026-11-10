import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useLearning } from '../LearningContext';
import { useLearningAudioResolver } from '../LearningSound';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { learningStyles as styles } from '../LearningLaunch';
import { learningCopy } from '../learningCopy';
import { guidedSentence } from '../guidedPractice';
import { practiceTaskKey, seededRandom, shuffle } from '../practicePool';
import { rateStudy, resolveStudy, studyKey, stepSignature } from '../learning';
import type { RootStackParamList } from '../types';

export default function GuidedPracticeScreen() {
  const data=useAppData(),learning=useLearning()!,{lang, copy: trCopy }=useI18n(),ss=useScaleStyle(),en=lang==='en';
  const nav=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {studySession:session}=useRoute<RouteProp<RootStackParamList,'Practice'>>().params;
  const items=session?.items??[],copy=learningCopy(lang),resolver=useLearningAudioResolver();
  const [position,setPosition]=useState(session?.position??0),[stage,setStage]=useState(0),[answered,setAnswered]=useState<string[]>(session?.answered??[]);
  const [choice,setChoice]=useState(''),[revealed,setRevealed]=useState(false),[order,setOrder]=useState<number[]>([]),[checked,setChecked]=useState(false);
  const [finished,setFinished]=useState(false),[saving,setSaving]=useState(false),[source,setSource]=useState<AudioSource|null>(null),[audioError,setAudioError]=useState(false),[audioAttempt,setAudioAttempt]=useState(0);
  const busy=useRef(false),scroll=useRef<ScrollView>(null),current=items[position];
  const valid=items.length>0&&items.every(r=>resolveStudy(data,r));
  const ex=current&&resolveStudy(data,current);
  const detail=useMemo(()=>valid&&current?guidedSentence(data,current,session?.choiceSeed):null,[data, current, valid, session?.choiceSeed]);
  const clip=current?.exerciseId?data.LEARNING_PATH?.exercises?.[current.exerciseId]?.audio:undefined;
  const legacyKey=current?(current.mode==='grammar'?`${current.themeId}-${current.index+1}`:`${current.themeId}-${current.levelId??1}-${current.index+1}`):'';
  const legacySource=current?.mode==='grammar'?data.audio.nepaliGrammarAudio[legacyKey]:data.audio.nepaliAudio[legacyKey];
  const player=useAudioPlayer(source),status=useAudioPlayerStatus(player);
  useFocusEffect(useCallback(()=>()=>{try{player.pause();}catch{}},[player]));
  useEffect(()=>{let active=true;setSource(null);setAudioError(false);if(clip)void resolver(clip).then(s=>{if(active){setSource(s);setAudioError(!s);}}).catch(()=>{if(active)setAudioError(true);});else{setSource(legacySource??null);setAudioError(!legacySource);}return()=>{active=false;};},[clip, legacySource, resolver, audioAttempt]);
  useLayoutEffect(()=>nav.setOptions({title:trCopy('c_3c0a78eaf9ec', 'ステップ練習', 'Step-by-step practice')}),[nav,en, trCopy]);
  useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[stage, position]);
  useEffect(()=>{if(!learning.ready||!valid||finished||!current||!session)return;void learning.change(s=>({...s,resume:{item:current,session:{...session,position,answered}}}));},[learning.ready, learning.change, valid, finished, current, session, position, answered]);
  const button=(text:string,action:()=>void,primary=false,disabled=false)=><Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} style={[primary?styles.primary:styles.secondary,disabled&&{opacity:.5}]} onPress={action}><Text style={[primary?styles.primaryText:styles.link,ss(16,25)]}>{text}</Text></Pressable>;
  const advance=(next:number)=>{player.pause();setStage(next);setChoice('');setRevealed(false);setChecked(false);};
  const play=async()=>{try{setAudioError(false);await player.seekTo(0);player.play();}catch{setAudioError(true);}};
  async function confirm(){
    if(!learning.ready||busy.current||!current||!valid||!session)return;
    busy.current=true;setSaving(true);
    const nextAnswered=[...new Set([...answered,practiceTaskKey(session,current,position)])],nextPosition=items.findIndex((r,i)=>!nextAnswered.includes(practiceTaskKey(session,r,i))),complete=nextPosition<0;
    const saved=await learning.change(s=>{
      const next=rateStudy(s,current,'supported',Date.now());
      next.resume=complete?undefined:{item:items[nextPosition],session:{...session,position:nextPosition,answered:nextAnswered}};
      if(complete&&session.kind==='course'&&session.stepId)next.completed={...next.completed,[session.stepId]:stepSignature(items)};
      return next;
    });
    busy.current=false;setSaving(false);if(!saved)return;
    player.pause();setAnswered(nextAnswered);
    if(complete)setFinished(true);else{setPosition(nextPosition);advance(session.questionStages?.[nextPosition]??0);setOrder([]);}
  }
  if(!valid||!ex||!detail)return <View style={{padding:20,gap:16}}><Text style={ss(18,28)}>{copy.unavailable}</Text>{button(copy.back,()=>nav.goBack())}</View>;
  const pathStep=session?.stepId?data.LEARNING_PATH?.steps.find(s=>s.id===session.stepId):undefined;
  if(finished)return <ScrollView contentContainerStyle={{padding:24,gap:18,maxWidth:760,width:'100%',alignSelf:'center'}}>
    <Text style={[styles.badge,ss(14,24)]}>{trCopy('c_b286272ce6b0', '小さな一歩が、積み重なった', 'ONE SMALL STEP FORWARD')}</Text>
    <Text accessibilityRole="header" style={[styles.title,ss(26,37)]}>{trCopy('c_bec8791687cf', '今回の練習が終わりました', 'Practice set complete')}</Text>
    <View style={[styles.card,styles.green]}><Text style={[styles.greenText,ss(36,45)]}>{items.length} {lang==='ar'?(session?.questionStages?'سؤالًا':'جملة'):lang==='ko'?(session?.questionStages?'문제':'문장'):en?(session?.questionStages?'questions':'sentences'):(session?.questionStages?'問':'文')}</Text><Text style={[styles.body,ss(17,28)]}>{trCopy('c_6a83b7789cf0', '文の意味と語順を、見本と一緒に確認しました。ここまでの学習を保存しました。', 'You explored meanings and word order with support. Your progress is saved.')}</Text></View>
    <Text style={[styles.body,ss(16,27)]}>{trCopy('c_ce184a96a4c9', '明日もう一度確かめよう。見本つきでの学習を記録しています。自力で話せるかは、別の段階です。', 'Try again tomorrow. This records supported practice, not independent speaking ability.')}</Text>
    {button(trCopy('c_670866586f58', 'もとの画面に戻る', 'Back to the previous screen'),()=>nav.goBack(),true)}
  </ScrollView>;
  const labels=lang==='ar'?['التحضير','① اختيار الصيغة','② اختيار المعنى','③ ترتيب الكلمات']:lang==='ko'?['준비','① 형태 선택','② 뜻 선택','③ 어순 퍼즐']:en?['Preparation','① Choose a form','② Choose a meaning','③ Word order']:['準備','① 形を選ぶ','② 意味を選ぶ','③ 語順パズル'];
  const active=stage<=1?0:stage-1,conj=detail.conjugation;
  const solved=stage===2?revealed||choice===conj?.target.text:stage===3?revealed||choice===ex.jp:revealed||(checked&&order.map(i=>detail.words[i].text).join(' ')===detail.words.map(w=>w.text).join(' '));
  const roman=detail.words.map(w=>w.roman).join(' ');
  const options=shuffle(detail.words.map((_,i)=>i),seededRandom((session?.choiceSeed??0)+position*31+17));
  const taskStage=session?.questionStages?.[position];
  const confirmLabel=saving?copy.saving:(trCopy('c_48bfd636b422', '確認した・次へ', 'Confirmed — next'));
  return <ScrollView ref={scroll} contentContainerStyle={{padding:20,paddingBottom:40,gap:16,maxWidth:760,width:'100%',alignSelf:'center'}}>
    <Text style={[styles.badge,ss(14,22)]}>{pathStep?.title??(trCopy('c_c00db8b91458', '見本つき練習', 'Supported practice'))} · {position+1} / {items.length}</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{labels.map((label,i)=><View key={label} style={{flexBasis:'45%',flexGrow:1,gap:5}}><View style={{height:4,borderRadius:4,backgroundColor:i<=active?'#0f766e':'#e2e8f0'}}/><Text style={[{color:i===active?'#0f766e':'#64748b',fontWeight:i===active?'700':'400'},ss(13,21)]}>{label}</Text></View>)}</View>
    <Text accessibilityRole="header" style={[styles.title,ss(25,36)]}>{stage===0?(trCopy('c_7cc990e663e0', 'まず、ことばを知ろう', 'Meet the words')):stage===1?(trCopy('c_f3e7fb5991ef', '見本とルールを確認しよう', 'Check the model and rule')):labels[active]}</Text>
    {stage!==3&&stage!==0&&<Text style={[styles.body,ss(18,29)]}>{ex.jp}</Text>}
    {stage===0&&<>
      <Text style={[styles.body,ss(15,25)]}>{trCopy('c_08531347d828', 'この練習で使うことばです。今すぐ暗記しなくても大丈夫。', 'These are the words you will use. No memorising test yet.')}</Text>
      {detail.words.map((w,i)=><View key={i} style={{backgroundColor:i%2?'#f5f3ff':'#ecfdf5',borderRadius:14,padding:16,gap:5}}><Text style={[styles.title,ss(25,36)]}>{w.text}</Text><Text style={[styles.body,ss(16,25)]}>{w.roman}</Text><Text style={[styles.greenText,ss(17,28)]}>{w.meaning}</Text></View>)}
      {button(trCopy('c_49a6583a1dec', '見本へ進む', 'See the model'),()=>advance(1),true)}
    </>}
    {stage>=1&&<>
      {(stage!==4||revealed)&&!(taskStage&&stage===1)&&<View style={[styles.card,styles.green,{marginVertical:0}]}><Text style={[styles.title,ss(28,42)]}>{stage===2&&!solved?detail.parts.map((p,i)=>i===conj?.target.index?(conj.prefix??'')+'＿＿＿':p).join(''):ex.ne}</Text>{(stage!==2||solved)&&<Text style={[styles.body,ss(17,27)]}>{roman}</Text>}</View>}
      {audioError?button(trCopy('c_d0c4cd12c81e', '音声を再読み込み', 'Retry audio'),()=>setAudioAttempt(n=>n+1)):button(status.playing?(trCopy('c_825f889cbcd1', 'もう一度聞く', 'Play again')):(trCopy('c_32b033022694', 'ネパール語を聞く', 'Listen in Nepali')),play,false,!source||!status.isLoaded)}
    </>}
    {stage===1&&<>
      {conj&&<View style={[styles.card,styles.violet]}><Text style={[styles.badge,ss(17,27)]}>{conj.family}</Text>{conj.forms.map(f=><Text key={f.form} style={[styles.body,ss(19,30)]}>{f.subject} → {f.form} · {f.roman}</Text>)}<Text style={[styles.body,ss(15,25)]}>{conj.prompt??(trCopy('c_e8f51b54b883', '「何者か・どこにいるか・普段のことか」で、使う形の仲間が変わります。', 'The meaning of the sentence tells you which family of forms to use.'))}</Text></View>}
      {button(taskStage===4?(trCopy('c_8c1e984b35a3', '語順パズルへ', 'Start the word-order puzzle')):taskStage===3?(trCopy('c_9013d2cfe869', '意味を選んでみる', 'Choose the meaning')):conj?(trCopy('c_54fb1dfd9c3e', '形を選んでみる', 'Choose the form')):(trCopy('c_9013d2cfe869', '意味を選んでみる', 'Choose the meaning')),()=>advance(taskStage??(conj?2:3)),true)}
    </>}
    {stage===2&&conj&&<>
      <Text style={[styles.body,ss(17,28)]}>{conj.prompt??(trCopy('c_9c781a92b6a5', `この文の「${conj.subject}」に合う形を選ぼう。`, `Choose the form for ${conj.subject} in this sentence.`, {p0: conj.subject}))}</Text>
      {!solved&&conj.choices.map(f=>button(f.form+(f.roman?' · '+f.roman:''),()=>setChoice(f.form)))}
      {!solved&&choice&&<Text style={[styles.body,ss(16,26)]}>{trCopy('c_1786c8de5623', '訳とルールを、もう一度確かめよう。', 'Check the translation and the rule again.')}</Text>}
      {solved&&<Text style={[styles.greenText,ss(16,27)]}>{conj.family}</Text>}
      {solved?(taskStage?button(confirmLabel,confirm,true,saving||!learning.ready):button(trCopy('c_a70f9dda4e2e', '次は、意味を選ぶ', 'Next: choose the meaning'),()=>advance(3),true)):button(trCopy('c_6b7a92ff717e', '見本を確認する', 'Check the model'),()=>setRevealed(true))}
    </>}
    {stage===3&&<>
      <Text style={[styles.body,ss(17,28)]}>{trCopy('c_cb8009d97963', 'このネパール語は、どんな意味？', 'What does the Nepali sentence mean?')}</Text>
      {!solved&&detail.meaningChoices.map(text=>button(text,()=>setChoice(text)))}
      {!solved&&choice&&<Text style={[styles.body,ss(16,26)]}>{trCopy('c_46ca8fb4d174', 'だれのことか、どこか、何を伝える文かを確かめよう。', 'Look at who, where and what the words tell you.')}</Text>}
      {solved?<><Text style={[styles.greenText,ss(20,32)]}>{ex.jp}</Text>{taskStage?button(confirmLabel,confirm,true,saving||!learning.ready):button(trCopy('c_5b56f2ba1714', '次は、語順パズル', 'Next: word-order puzzle'),()=>advance(4),true)}</>:button(trCopy('c_59db74e5a130', '意味を見て確かめる', 'Show the meaning'),()=>setRevealed(true))}
    </>}
    {stage===4&&<>
      <Text style={[styles.body,ss(16,27)]}>{trCopy('c_1c4aa22eb3b7', '語を押して、見本の基本語順を作ろう。ネパール語では、ほかの語順が使える場合もあります。', 'Tap the words to rebuild the model’s basic order. Other orders can also be valid in Nepali.')}</Text>
      <View style={[styles.card,styles.violet]}><Text style={[styles.title,ss(25,39)]}>{order.length?order.map(i=>detail.words[i].text).join(' '):(trCopy('c_9ad449a68c06', 'ここに文ができます', 'Your sentence appears here'))}</Text></View>
      {!solved&&<><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{options.map(i=><Pressable key={i} accessibilityRole="button" accessibilityLabel={detail.words[i].text} disabled={order.includes(i)} style={[styles.secondary,{maxWidth:'100%',opacity:order.includes(i) ? .35 : 1}]} onPress={()=>{setOrder([...order,i]);setChecked(false);}}><Text style={[styles.title,ss(22,33)]}>{detail.words[i].text}</Text><Text style={[styles.body,ss(14,23)]}>{detail.words[i].roman} · {detail.words[i].meaning}</Text></Pressable>)}</View>
        {button(trCopy('c_2aff53aa7143', '最後の語を戻す', 'Undo last word'),()=>{setOrder(order.slice(0,-1));setChecked(false);},false,!order.length)}
        {button(trCopy('c_2dbc30b3fecf', '並びを確かめる', 'Check the order'),()=>setChecked(true),true,order.length!==detail.words.length)}
        {checked&&<Text style={[styles.body,ss(16,26)]}>{trCopy('c_2eb097829fe8', '見本と並びを比べてみよう。ここでは見本の語順を確認します。', 'Compare with the model. This checks its order, not every possible sentence.')}</Text>}
        {button(trCopy('c_09ebee13aa6f', '見本を見て確かめる', 'Show the model'),()=>setRevealed(true))}</>}
      {solved&&<><Text style={[styles.greenText,ss(18,29)]}>{trCopy('c_554e4af5dcbc', '文ができました。意味と一緒に、もう一度読もう。', 'The sentence is complete. Read it with its meaning.')}</Text>{button(confirmLabel,confirm,true,saving||!learning.ready)}</>}
    </>}
    {stage>0&&button(trCopy('c_2d73e708a39f', '単語とルールのヒント', 'Words & rule hints'),()=>advance(0),false,saving)}
    {learning.error&&<Text style={[styles.error,ss(16,26)]}>{copy.error}</Text>}
  </ScrollView>;
}
