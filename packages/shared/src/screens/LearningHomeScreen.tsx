import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeHero, useHeroImage } from '../heroImages';
import { Text } from '../Text';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningLaunch, learningStyles as styles } from '../LearningLaunch';

export default function LearningHomeScreen() {
  const nav=useNavigation<any>(), {lang}=useI18n(), ss=useScaleStyle(), {top}=useSafeAreaInsets();
  const hero=useHeroImage('grammar'), en=lang==='en';
  const modes=[
    ['GrammarTab',en?'Understand the grammar':'文法を理解する',en?'Patterns, explanations and practice':'文の型・解説・例題'],
    ['ConversationTab',en?'Say it in Nepali':'ネパール語で言ってみる',en?'Short sentences for everyday situations':'場面別の瞬間作文'],
    ['ListeningTab',en?'Listen and repeat':'聞いて繰り返す',en?'Review familiar sentences with audio':'学んだ文を音声で復習'],
    ['VocabularyTab',en?'Build your vocabulary':'単語を増やす',en?'Cards and illustrated audio posters':'単語カードと音声付きポスター'],
  ];
  return <ScrollView style={{marginTop:top}} contentContainerStyle={{padding:20,paddingBottom:32,maxWidth:760,width:'100%',alignSelf:'center'}}>
    {hero!=null && <ModeHero source={hero} />}
    <View style={{flexDirection:'row',alignItems:'center',gap:12,marginTop:16}}>
      <Text accessibilityRole="header" style={[styles.title,ss(24,34),{flex:1}]}>{en?'A little Nepali, every day':'今日は5文から'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={en?'Settings':'設定'} style={styles.secondary} onPress={()=>nav.navigate('SettingsMain')}><Text style={[styles.link,ss(16,24)]}>{en?'Settings':'設定'}</Text></Pressable>
    </View>
    <LearningLaunch />
    <Text accessibilityRole="header" style={[styles.title,ss(20,30),{marginTop:12}]}>{en?'Choose how to practise':'好きな練習から始める'}</Text>
    {modes.map(([route,title,body],i)=><Pressable key={route} accessibilityRole="button" style={[styles.card,i%2===1 && styles.green]} onPress={()=>nav.navigate(route)}>
      <Text style={[styles.title,ss(18,28)]}>{title} →</Text><Text style={[styles.body,ss(15,24)]}>{body}</Text>
    </Pressable>)}
  </ScrollView>;
}
