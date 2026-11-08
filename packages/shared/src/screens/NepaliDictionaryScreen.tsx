import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Text } from '../Text';
import { useAppData } from '../AppDataContext';
import { useI18n } from '../i18n';
import { useScaleStyle } from '../SettingsContext';
import { LearningSound } from '../LearningSound';
import { dictionaryKey, dictionaryPos, indexDictionary, searchDictionary, type NepaliDictionaryEntry } from '../nepaliDictionary';

const EMPTY: NepaliDictionaryEntry[] = [];
export default function NepaliDictionaryScreen() {
  const data=useAppData(), {lang}=useI18n(), nav=useNavigation<any>(), ss=useScaleStyle(), en=lang==='en';
  const [query,setQuery]=useState(''), [category,setCategory]=useState<number>(), [selected,setSelected]=useState<string>(), [playing,setPlaying]=useState<{id:string;key:number}>();
  const [filters,setFilters]=useState(false);
  const entries=data.NEPALI_DICTIONARY?.entries??EMPTY;
  const index=useMemo(()=>indexDictionary(entries),[entries]);
  const results=useMemo(()=>searchDictionary(index,query,category),[index,query,category]);
  const stop=useCallback(()=>setPlaying(undefined),[]);
  useFocusEffect(useCallback(()=>()=>stop(),[stop]));
  useLayoutEffect(()=>nav.setOptions({title:en?'Nepali dictionary':'ネパール語辞書'}),[nav,en]);
  const search=(value:string)=>{setQuery(value);setSelected(undefined);stop();};
  const toggle=(id:string)=>{setSelected(old=>old===id?undefined:id);stop();};
  const button=(label:string,onPress:()=>void,testID?:string)=> <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.button}><Text style={[s.buttonText,ss(14,22)]}>{label}</Text></Pressable>;
  const renderItem=({item:e}:{item:NepaliDictionaryEntry})=>{
    const open=selected===e.id, matchedForm=query.trim() && dictionaryKey(e.ne)!==dictionaryKey(query) && e.forms.some(f=>dictionaryKey(f)===dictionaryKey(query));
    return <View style={[s.entry,open&&s.open]}>
      <Pressable testID={`dictionary-entry-${e.id}`} accessibilityRole="button" accessibilityState={{expanded:open}} accessibilityLabel={`${e.ne}, ${e.senses.map(v=>en?v.en:v.ja).join('; ')}`} onPress={()=>toggle(e.id)} style={s.entryTop}>
        <View style={{flex:1,gap:4}}>
          {matchedForm&&<Text style={[s.formMatch,ss(12,20)]}>{query.trim()} → {en?'Base form':'基本形'}</Text>}
          <Text style={[s.word,ss(25,36)]}>{e.ne}</Text>
          <Text style={[s.roman,ss(14,22)]}>{e.roman}</Text>
          {!open&&<Text style={[s.gloss,ss(16,25)]}>{e.senses.map(v=>en?v.en:v.ja).join(' / ')}</Text>}
        </View>
        <Text style={[s.expand,ss(23,30)]}>{open?'−':'+'}</Text>
      </Pressable>
      {open&&<View testID="dictionary-detail" style={s.detail}>
        {e.audio&&button(playing?.id===e.id?(en?'Stop':'停止'):(en?'Listen':'発音を聞く'),()=>setPlaying(old=>old?.id===e.id?undefined:{id:e.id,key:Date.now()}),'dictionary-listen')}
        {playing?.id===e.id&&e.audio&&<LearningSound key={playing.key} audio={e.audio} onFinished={stop}/>}
        {e.senses.map((sense,i)=><View key={i} style={s.sense}>
          <Text style={[s.pos,ss(12,20)]}>{e.senses.length>1?`${i+1} · `:''}{dictionaryPos[sense.pos]?.[en?1:0]??sense.pos}</Text>
          <Text style={[s.gloss,ss(18,28)]}>{en?sense.en:sense.ja}</Text>
          <Text style={[s.secondary,ss(13,22)]}>{en?sense.ja:sense.en}</Text>
        </View>)}
        {e.note&&<View style={s.note}><Text style={[s.noteTitle,ss(13,22)]}>{en?'How to use it':'使い分けのポイント'}</Text><Text style={[s.gloss,ss(15,25)]}>{en?e.note.en:e.note.ja}</Text></View>}
        {e.examples.map((example,i)=><View key={i} style={s.example}><Text style={[s.pos,ss(12,20)]}>{en?'Example':'用例'}</Text><Text style={[s.word,ss(20,32)]}>{example.ne}</Text><Text style={[s.gloss,ss(15,25)]}>{en?example.en:example.ja}</Text></View>)}
        {!!e.forms.length&&<View style={{gap:6}}><Text style={[s.pos,ss(12,20)]}>{en?'Also found under these forms':'これらの形でも検索できます'}</Text><Text style={[s.gloss,ss(16,27)]}>{e.forms.join(' · ')}</Text></View>}
        {!!e.themes.length&&<View style={{gap:8}}><Text style={[s.pos,ss(12,20)]}>{en?'In your lessons':'教材で確認'}</Text>{e.themes.map(id=>{const theme=data.GRAMMAR_THEMES.find(t=>t.id===id);return theme? <View key={id}>{button(`${id}. ${theme.name} →`,()=>{stop();nav.navigate('GrammarGuide',{themeId:id,title:theme.name});})}</View>:null;})}</View>}
      </View>}
    </View>;
  };
  return <View style={s.page}>
    <View style={s.searchArea}>
      <Text style={[s.hint,ss(13,22)]}>{en?'Search Nepali, romanization, English or Japanese.':'ネパール語・ローマ字・日本語・英語で検索'}</Text>
      <View style={s.searchRow}><TextInput testID="dictionary-search" accessibilityLabel={en?'Search dictionary':'辞書を検索'} value={query} onChangeText={search} placeholder={en?'ghar / house / गर्छु':'ghar / 家 / गर्छु'} placeholderTextColor="#657777" autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={[s.input,ss(18,28)]}/>{query.length>0&&button(en?'Clear':'消去',()=>search(''),'dictionary-clear')}</View>
      <View style={s.filterRow}>
        <Text testID="dictionary-count" accessibilityLiveRegion="polite" style={[s.hint,ss(12,20)]}>{en?`${results.length} ${results.length===1?'entry':'entries'}`:`${results.length}語`}</Text>
        <Pressable testID="dictionary-filters" accessibilityRole="button" accessibilityState={{expanded:filters}} onPress={()=>setFilters(v=>!v)} style={s.filterButton}><Text style={[s.buttonText,ss(13,21)]}>{category?(data.CONTENT_NAMES?.categories?.[category]??data.WORD_CATEGORIES.find(c=>c.id===category)?.name):(en?'Categories':'カテゴリ')} {filters?'−':'＋'}</Text></Pressable>
      </View>
      {filters&&<ScrollView style={{maxHeight:220}} contentContainerStyle={s.categories} keyboardShouldPersistTaps="handled">
        {[{id:0,name:en?'All':'すべて'},...data.WORD_CATEGORIES.map(c=>({id:c.id,name:data.CONTENT_NAMES?.categories?.[c.id]??c.name}))].map(c=><Pressable key={c.id} testID={`dictionary-category-${c.id}`} accessibilityRole="button" accessibilityState={{selected:(category??0)===c.id}} onPress={()=>{setCategory(c.id||undefined);setSelected(undefined);setFilters(false);stop();}} style={[s.chip,(category??0)===c.id&&s.chipOn]}><Text style={[{color:(category??0)===c.id?'#fff':'#345651'},ss(13,20)]}>{c.name}</Text></Pressable>)}
      </ScrollView>}
    </View>
    <FlatList key={`${query}:${category}`} data={results} keyExtractor={e=>e.id} renderItem={renderItem} extraData={{selected,playing,en}} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" initialNumToRender={12} maxToRenderPerBatch={12} windowSize={7} contentContainerStyle={s.list}
      ListEmptyComponent={<View style={s.empty}><Text style={[s.word,ss(18,28)]}>{en?'No matching word yet':'一致することばがありません'}</Text><Text style={[s.hint,ss(14,24)]}>{en?'Try a shorter word or clear the category filter. This is a beginner dictionary.':'短い語や基本形で試すか、カテゴリを「すべて」にしてください。初学者向けの語を収録しています。'}</Text></View>}/>
  </View>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:'#F2F5F3'},searchArea:{padding:16,paddingBottom:8,gap:10,backgroundColor:'#F8FAF9'},
  hint:{color:'#52666C'},searchRow:{flexDirection:'row',alignItems:'center',gap:8},input:{flex:1,minWidth:0,minHeight:52,borderWidth:1,borderColor:'#A5BDB5',borderRadius:14,paddingHorizontal:14,paddingVertical:10,color:'#123039',backgroundColor:'#fff'},
  filterRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},filterButton:{minHeight:44,padding:10,borderRadius:10,backgroundColor:'#E3EDE8',flexShrink:1,justifyContent:'center'},categories:{gap:8,paddingVertical:3,flexDirection:'row',flexWrap:'wrap'},chip:{minHeight:44,maxWidth:'100%',borderRadius:22,paddingHorizontal:15,paddingVertical:11,backgroundColor:'#E3EDE8',justifyContent:'center'},chipOn:{backgroundColor:'#176858'},
  list:{padding:16,paddingTop:8,gap:10,paddingBottom:40},entry:{borderRadius:18,backgroundColor:'#fff',borderWidth:1,borderColor:'#DCE5E0',overflow:'hidden'},open:{borderColor:'#57A994'},entryTop:{padding:17,flexDirection:'row',gap:12,alignItems:'center'},
  word:{fontWeight:'700',color:'#123039'},roman:{color:'#4C706B'},gloss:{color:'#203F46'},secondary:{color:'#607574'},expand:{color:'#176858'},formMatch:{color:'#176858',fontWeight:'700'},
  detail:{padding:17,paddingTop:0,gap:18},button:{minHeight:44,backgroundColor:'#E1F2EC',borderRadius:12,padding:12,justifyContent:'center'},buttonText:{color:'#115849',fontWeight:'600'},sense:{gap:4},pos:{color:'#53716B',fontWeight:'600'},note:{gap:5,backgroundColor:'#E9F3F6',borderRadius:14,padding:14},noteTitle:{color:'#24586B',fontWeight:'700'},example:{gap:4,paddingLeft:12,borderLeftWidth:3,borderLeftColor:'#72B6A5'},empty:{paddingVertical:24,gap:10},
});
