import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningSound } from '../LearningSound';
import { dictionaryKey, dictionaryPos, dictionaryTranslation, indexDictionary, searchDictionary, type NepaliDictionaryEntry } from '../nepaliDictionary';
import { textDirection } from '../textDirection';
import { withoutThemePrefix } from '../themeLabels';

const EMPTY: NepaliDictionaryEntry[] = [];
export default function NepaliDictionaryScreen() {
  const data=useAppData(), {lang, copy: trCopy }=useI18n(), nav=useNavigation<any>(), ss=useScaleStyle(), en=lang==='en';
  const [query,setQuery]=useState(''), [category,setCategory]=useState<number>(), [selected,setSelected]=useState<string>(), [playing,setPlaying]=useState<{id:string;key:number}>();
  const [filters,setFilters]=useState(false);
  const rtl=lang==='ar', inputDirection=textDirection(query)??(rtl?'rtl':'ltr');
  const entries=data.NEPALI_DICTIONARY?.entries??EMPTY;
  const index=useMemo(()=>indexDictionary(entries),[entries]);
  const results=useMemo(()=>searchDictionary(index,query,category),[index, query, category]);
  const stop=useCallback(()=>setPlaying(undefined),[]);
  useFocusEffect(useCallback(()=>()=>stop(),[stop]));
  useLayoutEffect(()=>nav.setOptions({title:trCopy('c_b4a9b4f2903e', 'ネパール語辞書', 'Nepali dictionary')}),[nav,en, trCopy]);
  const search=(value:string)=>{setQuery(value);setSelected(undefined);stop();};
  const toggle=(id:string)=>{setSelected(old=>old===id?undefined:id);stop();};
  const button=(label:string,onPress:()=>void,testID?:string)=> <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.button}><Text style={[s.buttonText,ss(14,22)]}>{label}</Text></Pressable>;
  const renderItem=({item:e}:{item:NepaliDictionaryEntry})=>{
    const open=selected===e.id, matchedForm=query.trim() && dictionaryKey(e.ne)!==dictionaryKey(query) && e.forms.some(f=>dictionaryKey(f)===dictionaryKey(query));
    return <View style={[s.entry,open&&s.open]}>
      <Pressable testID={`dictionary-entry-${e.id}`} accessibilityRole="button" accessibilityState={{expanded:open}} accessibilityLabel={`${e.ne}, ${e.senses.map(v=>dictionaryTranslation(v,lang)).join('; ')}`} onPress={()=>toggle(e.id)} style={[s.entryTop,rtl&&s.rtlRow]}>
        <View style={{flex:1,gap:4}}>
          {matchedForm&&<Text style={[s.formMatch,ss(12,20)]}>{query.trim()} → {trCopy('c_090b19410db3', '基本形', 'Base form')}</Text>}
          <Text style={[s.word,ss(25,36)]}>{e.ne}</Text>
          <Text style={[s.roman,ss(14,22)]}>{e.roman}</Text>
          {!open&&<Text style={[s.gloss,ss(16,25)]}>{e.senses.map(v=>dictionaryTranslation(v,lang)).join(' / ')}</Text>}
        </View>
        <Text style={[s.expand,ss(23,30)]}>{open?'−':'+'}</Text>
      </Pressable>
      {open&&<View testID="dictionary-detail" style={s.detail}>
        {e.audio&&button(playing?.id===e.id?(trCopy('c_ec7502ce7fde', '停止', 'Stop')):(trCopy('c_537af8ab23b2', '発音を聞く', 'Listen')),()=>setPlaying(old=>old?.id===e.id?undefined:{id:e.id,key:Date.now()}),'dictionary-listen')}
        {playing?.id===e.id&&e.audio&&<LearningSound key={playing.key} audio={e.audio} onFinished={stop}/>}
        {e.senses.map((sense,i)=><View key={i} style={s.sense}>
          <Text style={[s.pos,ss(12,20)]}>{e.senses.length>1?`${i+1} · `:''}{dictionaryPos[sense.pos]?.[lang==='ar'?3:lang==='ko'?2:en?1:0]??sense.pos}</Text>
          <Text style={[s.gloss,ss(18,28)]}>{dictionaryTranslation(sense,lang)}</Text>
          <Text style={[s.secondary,ss(13,22)]}>{en?sense.ja:sense.en}</Text>
        </View>)}
        {e.note&&<View style={s.note}><Text style={[s.noteTitle,ss(13,22)]}>{trCopy('c_b7b76e361eaf', '使い分けのポイント', 'How to use it')}</Text><Text style={[s.gloss,ss(15,25)]}>{dictionaryTranslation(e.note,lang)}</Text></View>}
        {e.examples.map((example,i)=><View key={i} style={[s.example,rtl&&s.rtlExample]}><Text style={[s.pos,ss(12,20)]}>{lang==='ar'?'مثال':lang==='ko'?'예문':en?'Example':'用例'}</Text><Text style={[s.word,ss(20,32)]}>{example.ne}</Text><Text style={[s.gloss,ss(15,25)]}>{dictionaryTranslation(example,lang)}</Text></View>)}
        {!!e.forms.length&&<View style={{gap:6}}><Text style={[s.pos,ss(12,20)]}>{trCopy('c_f63eedef6503', 'これらの形でも検索できます', 'Also found under these forms')}</Text><Text style={[s.gloss,ss(16,27)]}>{e.forms.join(' · ')}</Text></View>}
        {!!e.themes.length&&<View style={{gap:8}}><Text style={[s.pos,ss(12,20)]}>{trCopy('c_f6f7dcd6958a', '教材で確認', 'In your lessons')}</Text>{e.themes.map(id=>{const theme=data.GRAMMAR_THEMES.find(t=>t.id===id);return theme? <View key={id}>{button(`${id}. ${withoutThemePrefix(theme.name)} →`,()=>{stop();nav.navigate('GrammarGuide',{themeId:id,title:theme.name});})}</View>:null;})}</View>}
      </View>}
    </View>;
  };
  return <View style={s.page}>
    <View style={s.searchArea}>
      <Text style={[s.hint,ss(13,22)]}>{trCopy('c_83237b1f08fc', 'ネパール語・ローマ字・日本語・英語で検索', 'Search Nepali, romanization, English or Japanese.')}</Text>
      <View style={[s.searchRow,rtl&&s.rtlRow]}><TextInput testID="dictionary-search" accessibilityLabel={trCopy('c_ce749f20b982', '辞書を検索', 'Search dictionary')} value={query} onChangeText={search} placeholder={trCopy('c_04904c289eec', 'ghar / 家 / गर्छु', 'ghar / house / गर्छु')} placeholderTextColor="#657777" autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={[s.input,ss(18,28),{writingDirection:inputDirection,textAlign:inputDirection==='rtl'?'right':'left'}]}/>{query.length>0&&button(trCopy('c_192b504b979f', '消去', 'Clear'),()=>search(''),'dictionary-clear')}</View>
      <View style={[s.filterRow,rtl&&s.rtlRow]}>
        <Text testID="dictionary-count" accessibilityLiveRegion="polite" style={[s.hint,ss(12,20)]}>{trCopy('c_3ec230bb4da9', `${results.length}語`, `${results.length} ${results.length===1?'entry':'entries'}`, {p0: results.length, p1: results.length===1?'entry':'entries'})}</Text>
        <Pressable testID="dictionary-filters" accessibilityRole="button" accessibilityState={{expanded:filters}} onPress={()=>setFilters(v=>!v)} style={s.filterButton}><Text style={[s.buttonText,ss(13,21)]}>{category?(data.CONTENT_NAMES?.categories?.[category]??data.WORD_CATEGORIES.find(c=>c.id===category)?.name):(trCopy('c_be6e7716be36', 'カテゴリ', 'Categories'))} {filters?'−':'＋'}</Text></Pressable>
      </View>
      {filters&&<ScrollView style={{maxHeight:220}} contentContainerStyle={s.categories} keyboardShouldPersistTaps="handled">
        {[{id:0,name:trCopy('c_dfbfeb7e694a', 'すべて', 'All')},...data.WORD_CATEGORIES.map(c=>({id:c.id,name:data.CONTENT_NAMES?.categories?.[c.id]??c.name}))].map(c=><Pressable key={c.id} testID={`dictionary-category-${c.id}`} accessibilityRole="button" accessibilityState={{selected:(category??0)===c.id}} onPress={()=>{setCategory(c.id||undefined);setSelected(undefined);setFilters(false);stop();}} style={[s.chip,(category??0)===c.id&&s.chipOn]}><Text style={[{color:(category??0)===c.id?'#fff':'#345651'},ss(13,20)]}>{c.name}</Text></Pressable>)}
      </ScrollView>}
    </View>
    <FlatList key={`${query}:${category}`} data={results} keyExtractor={e=>e.id} renderItem={renderItem} extraData={{selected,playing,lang}} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" initialNumToRender={12} maxToRenderPerBatch={12} windowSize={7} contentContainerStyle={s.list}
      ListEmptyComponent={<View style={s.empty}><Text style={[s.word,ss(18,28)]}>{trCopy('c_ee7cc6c2e277', '一致することばがありません', 'No matching word yet')}</Text><Text style={[s.hint,ss(14,24)]}>{trCopy('c_c30cd3616a93', '短い語や基本形で試すか、カテゴリを「すべて」にしてください。初学者向けの語を収録しています。', 'Try a shorter word or clear the category filter. This is a beginner dictionary.')}</Text></View>}/>
  </View>;
}
const s=StyleSheet.create({
  rtlRow:{direction:'ltr',flexDirection:'row-reverse'},rtlExample:{paddingLeft:0,borderLeftWidth:0,paddingRight:12,borderRightWidth:3,borderRightColor:'#72B6A5'},
  page:{flex:1,backgroundColor:'#F2F5F3'},searchArea:{padding:16,paddingBottom:8,gap:10,backgroundColor:'#F8FAF9'},
  hint:{color:'#52666C'},searchRow:{flexDirection:'row',alignItems:'center',gap:8},input:{flex:1,minWidth:0,minHeight:52,borderWidth:1,borderColor:'#A5BDB5',borderRadius:14,paddingHorizontal:14,paddingVertical:10,color:'#123039',backgroundColor:'#fff'},
  filterRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},filterButton:{minHeight:44,padding:10,borderRadius:10,backgroundColor:'#E3EDE8',flexShrink:1,justifyContent:'center'},categories:{gap:8,paddingVertical:3,flexDirection:'row',flexWrap:'wrap'},chip:{minHeight:44,maxWidth:'100%',borderRadius:22,paddingHorizontal:15,paddingVertical:11,backgroundColor:'#E3EDE8',justifyContent:'center'},chipOn:{backgroundColor:'#176858'},
  list:{padding:16,paddingTop:8,gap:10,paddingBottom:40},entry:{borderRadius:18,backgroundColor:'#fff',borderWidth:1,borderColor:'#DCE5E0',overflow:'hidden'},open:{borderColor:'#57A994'},entryTop:{padding:17,flexDirection:'row',gap:12,alignItems:'center'},
  word:{fontWeight:'700',color:'#123039'},roman:{color:'#4C706B'},gloss:{color:'#203F46'},secondary:{color:'#607574'},expand:{color:'#176858'},formMatch:{color:'#176858',fontWeight:'700'},
  detail:{padding:17,paddingTop:0,gap:18},button:{minHeight:44,backgroundColor:'#E1F2EC',borderRadius:12,padding:12,justifyContent:'center'},buttonText:{color:'#115849',fontWeight:'600'},sense:{gap:4},pos:{color:'#53716B',fontWeight:'600'},note:{gap:5,backgroundColor:'#E9F3F6',borderRadius:14,padding:14},noteTitle:{color:'#24586B',fontWeight:'700'},example:{gap:4,paddingLeft:12,borderLeftWidth:3,borderLeftColor:'#72B6A5'},empty:{paddingVertical:24,gap:10},
});
