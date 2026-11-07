import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { useLearning } from '../LearningContext';
import { learningCopy } from '../learningCopy';
import { learningStyles as styles } from '../LearningLaunch';
import { practiceParams, resolveStudy, reviewItems, stepSignature, type StudySession } from '../learning';
import { grammarThemeLabel } from '../themeLabels';
import type { RootStackParamList } from '../types';

export default function LearningPathScreen() {
  const data=useAppData(), learning=useLearning(), {lang}=useI18n(), ss=useScaleStyle(), copy=learningCopy(lang);
  const nav=useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [introOpen,setIntroOpen]=useState(false), [now,setNow]=useState(Date.now);
  useFocusEffect(useCallback(()=>{setNow(Date.now());},[]));
  useLayoutEffect(()=>{nav.setOptions({title:copy.path});},[nav,copy.path]);
  if(!learning || !data.LEARNING_PATH) return <Text>{copy.unavailable}</Text>;
  const path=data.LEARNING_PATH, {state,ready}=learning;
  const next=path.steps.find(s=>state.completed[s.id]!==stepSignature(s.items));
  const due=reviewItems(state,data,now);
  const resume=state.resume && resolveStudy(data,state.resume.item)?state.resume:undefined;
  return <ScrollView contentContainerStyle={{padding:20,paddingBottom:40,maxWidth:760,width:'100%',alignSelf:'center'}}>
    <Text accessibilityRole="header" style={[styles.title,ss(24,34)]}>{path.title}</Text>
    <Text style={[styles.body,ss(16,26)]}>{path.description}</Text>
    {!ready && !learning.error && <Text style={ss(16,26)}>{copy.loading}</Text>}
    {learning.error && <View style={styles.card}><Text style={[styles.error,ss(16,26)]}>{copy.error}</Text><Pressable accessibilityRole="button" style={styles.secondary} onPress={learning.retry}><Text style={[styles.link,ss(16,24)]}>{copy.retry}</Text></Pressable></View>}
    {ready && resume && <Pressable accessibilityRole="button" style={[styles.secondary,{marginTop:16}]} onPress={()=>nav.navigate('Practice',practiceParams(resume.item,resume.session))}><Text style={[styles.link,ss(16,24)]}>{copy.resume} →</Text></Pressable>}
    <View style={[styles.card,styles.violet]}>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:introOpen}} onPress={()=>setIntroOpen(!introOpen)} style={{minHeight:48,justifyContent:'center'}}><Text style={[styles.badge,ss(18,28)]}>{copy.intro} {introOpen?'−':'＋'}</Text></Pressable>
      {introOpen && <>{path.intro.map((block,i)=><View key={i} style={{gap:6,marginBottom:12}}><Text style={[styles.title,ss(17,27)]}>{block.title}</Text><Text style={[styles.body,ss(16,27)]}>{block.body}</Text></View>)}
        {ready && !state.introRead && <Pressable accessibilityRole="button" style={styles.primary} onPress={async()=>{if(await learning.change(s=>({...s,introRead:true})))setIntroOpen(false);}}><Text style={[styles.primaryText,ss(16,24)]}>{copy.introDone}</Text></Pressable>}
      </>}
    </View>
    {path.steps.map((step,i)=>{
      const done=state.completed[step.id]===stepSignature(step.items), valid=step.items.every(r=>resolveStudy(data,r));
      const session:StudySession={kind:'course',items:step.items,stepId:step.id};
      const guideTitle=step.guideThemeId?grammarThemeLabel(data.GRAMMAR_THEMES,step.guideThemeId,String(step.guideThemeId)):undefined;
      return <View key={step.id} style={[styles.card,done && styles.green]}>
        <Text style={[styles.badge,ss(14,22)]}>{String(i+1).padStart(2,'0')} · {done?copy.completed:next?.id===step.id?copy.next:copy.session}</Text>
        <Text accessibilityRole="header" style={[styles.title,ss(20,29)]}>{step.title}</Text>
        <Text style={[styles.body,ss(16,26)]}>{step.goal}</Text>
        {guideTitle && <Text style={[styles.body,ss(14,23)]}>{guideTitle}</Text>}
        {valid && step.guideThemeId && <Pressable accessibilityRole="button" style={styles.secondary} onPress={()=>nav.navigate('GrammarGuide',{themeId:step.guideThemeId!,title:guideTitle!,studySession:session})}><Text style={[styles.link,ss(16,24)]}>{copy.guide} →</Text></Pressable>}
        {ready && valid && <Pressable accessibilityRole="button" style={styles.primary} onPress={()=>nav.navigate('Practice',practiceParams(step.items[0],session))}><Text style={[styles.primaryText,ss(16,24)]}>{copy.practice} →</Text></Pressable>}
        {!valid && <Text style={[styles.body,ss(16,26)]}>{copy.unavailable}</Text>}
      </View>;
    })}
    <View style={[styles.card,styles.green]}>
      <Text accessibilityRole="header" style={[styles.greenText,ss(20,29)]}>{copy.due}</Text>
      <Text style={[styles.body,ss(16,26)]}>{due.length?`${due.length} / 5`:copy.none}</Text>
      {ready && due.length>0 && <Pressable accessibilityRole="button" style={styles.primary} onPress={()=>nav.navigate('Practice',practiceParams(due[0],{kind:'review',items:due}))}><Text style={[styles.primaryText,ss(16,24)]}>{copy.review} →</Text></Pressable>}
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={()=>setNow(Date.now())}><Text style={[styles.link,ss(16,24)]}>{copy.refresh}</Text></Pressable>
      <Text style={[styles.body,ss(14,23)]}>{copy.progressNote}</Text>
    </View>
  </ScrollView>;
}
