// 聞いて話せるネパール語 のエントリ。
// UI / ナビゲーション / 画面は @safa/shared に集約。
// 初回用の教材を同梱。変更された教材・音声をハッシュ検証付きOTAで自動更新。

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppShell,
  I18nProvider,
  SettingsProvider,
  AppDataProvider,
  SettingsDevelopmentProvider,
  GrammarGuideImageProvider,
  LearningAudioProvider,
  useI18n,
} from '@safa/shared';

import ja from './src/i18n/ja.json';
import ne from './src/i18n/ne.json';
import en from './src/i18n/en.json';
import { bundledContent, cachedContent, syncContent, type ContentSnapshot } from './src/content/ota';
import { scheduleContentUpdates } from './src/content/otaSchedule';
import { PurchasesProvider } from './src/PurchasesProvider';
import { resolveGuideImage } from './src/guideImageCache';
import { resolveLearningAudio } from './src/learningAudioCache';
import { useEngagement } from './src/useEngagement';

// 文法「教材」(ルール解説)・文法テーマ名はOTA配信(overlayパック経由)。本体にバンドルしない。
const headerIconSource = require('./assets/icon.png');
// 各モード(タブ)着地画面のヒーロー画像。
const HERO_IMAGES = {
  conversation: require('./assets/hero/conversation.jpg'),
  grammar: require('./assets/hero/grammar.jpg'),
  listening: require('./assets/hero/listening.jpg'),
  vocabulary: require('./assets/hero/vocabulary.jpg'),
};

// 日英の教材をOTAから供給。ne表示では日本語教材を使う。
function LearningAppShell() {
  const engagement = useEngagement();
  return <SettingsDevelopmentProvider value={engagement.developmentTools}><AppShell learningStorageKey="@nepali_app/learning_v1" headerIconSource={headerIconSource} progressStorageKey="@nepali_app/progress_v1" tabs={['home', 'puzzle', 'listening', 'composition']} heroImages={HERO_IMAGES} hideModeHeaders onRouteChanged={engagement.onRouteChanged} mainScreenAccessory={<>{engagement.banner}<ContentStatus /></>} /></SettingsDevelopmentProvider>;
}

const toPackLang = (lang: string) => (lang === 'en' ? 'en' : 'ja');

// 初回の母語選択。並び順は全アプリ共通(English優先)。App A の母語は ja / en の2つ。
const LANG_OPTIONS = [
  { code: 'en', native: 'English', sub: 'English' },
  { code: 'ja', native: '日本語', sub: 'Japanese' },
];
const L1_CHOSEN_KEY = '@nepali_app/l1_chosen_v1';

// Content is available immediately; validated OTA updates are prepared in the background.
const OtaStatus = createContext<'preparing'|'ready'|'pending'|'offline'>('preparing');
const sessionContent: Record<string, ContentSnapshot> = {};
function ContentStatus() {
  const status=useContext(OtaStatus), {lang}=useI18n();
  if(status==='ready')return null;
  const copy=lang==='en'?{preparing:'Preparing audio automatically…',pending:'New content is ready for your next launch.',offline:'Saved lessons are available. Audio updates will retry when connected.'}:{preparing:'音声を自動で準備しています…',pending:'更新の準備ができました。次回起動時に反映します。',offline:'保存済みの教材で学習できます。接続後に自動で更新を再試行します。'};
  return <View style={{paddingHorizontal:16,paddingVertical:8,backgroundColor:'#eff6ff'}}><Text style={{fontSize:13,lineHeight:20,color:'#1e3a8a'}}>{copy[status]}</Text></View>;
}
function PackGate({children}:{children:ReactNode}) {
  const {lang}=useI18n(), packLang=toPackLang(lang);
  const [shown,setShown]=useState<{lang:string;snapshot:ContentSnapshot}>(()=>({lang:packLang,snapshot:bundledContent(packLang)}));
  const [status,setStatus]=useState<'preparing'|'ready'|'pending'|'offline'>('preparing');
  useEffect(()=>{
    let alive=true;
    let updates:ReturnType<typeof scheduleContentUpdates>|undefined;
    let current=sessionContent[packLang]??bundledContent(packLang);
    const show=(snapshot:ContentSnapshot)=>{current=snapshot;sessionContent[packLang]=snapshot;if(alive)setShown(previous=>previous.lang===packLang&&previous.snapshot===snapshot?previous:{lang:packLang,snapshot});};
    const refresh=async()=>{
      try{
        const next=await syncContent(packLang);
        if(!alive)return;
        // Same text version: attach prepared audio. Changed lessons wait for a new launch.
        if(next.version===current.version){show(next);setStatus('ready');}
        else setStatus('pending');
      }catch(error){if(alive)setStatus('offline');throw error;}
    };
    const start=async()=>{
      setStatus('preparing');
      if(!sessionContent[packLang]){const cached=await cachedContent(packLang);if(!alive)return;if(cached)current=cached;}
      if(!alive)return;show(current);
      if(Object.keys(current.data.audio.nepaliAudio).length)setStatus('ready');
      updates=scheduleContentUpdates(refresh,()=>AppState.currentState!=='background'&&AppState.currentState!=='inactive');
    };
    void start();
    const sub=AppState.addEventListener('change',value=>{if(value==='active')updates?.foreground();});
    return()=>{alive=false;sub.remove();updates?.stop();};
  },[packLang]);
  const visible=shown.lang===packLang?shown.snapshot:bundledContent(packLang);
  return <OtaStatus.Provider value={status}><AppDataProvider data={visible.data}>{children}</AppDataProvider></OtaStatus.Provider>;
}

// 母語選択画面 (初回のみ)。日英とも教材をすぐ開き、音声を自動準備。
function LanguageSelect({ onSelect }: { onSelect: (l: string) => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 19, fontWeight: '700', color: '#18181b', marginBottom: 32 }}>Select your language</Text>
      {LANG_OPTIONS.map(o => (
        <Pressable
          key={o.code}
          onPress={() => onSelect(o.code)}
          style={{ width: 248, paddingVertical: 16, borderRadius: 12, backgroundColor: '#2563eb', marginBottom: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{o.native}</Text>
          <Text style={{ color: '#dbeafe', fontSize: 12, marginTop: 2 }}>{o.sub}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// 初回のみ母語選択画面を出す。選択済みなら素通り。
function FirstRunGate({ children }: { children: ReactNode }) {
  const { setLang } = useI18n();
  const [checked, setChecked] = useState(false);
  const [needSelect, setNeedSelect] = useState(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(L1_CHOSEN_KEY)
      .then(v => { if (alive) { setNeedSelect(!v); setChecked(true); } })
      .catch(() => { if (alive) { setNeedSelect(true); setChecked(true); } });
    return () => { alive = false; };
  }, []);
  if (!checked) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (needSelect) {
    return (
      <LanguageSelect onSelect={(l) => {
        setLang(l);
        AsyncStorage.setItem(L1_CHOSEN_KEY, l).catch(() => {});
        setNeedSelect(false);
      }} />
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    // PurchasesProvider は最外側(RC 初期化を1回だけ・言語/パック切替で再マウントしない)。
    // 未注入のアプリ(App B/C)では shared 既定=全開放。App A はここで買い切り判定を注入する。
    <GrammarGuideImageProvider resolve={resolveGuideImage}>
    <LearningAudioProvider resolve={resolveLearningAudio}>
    <PurchasesProvider>
      <I18nProvider
        translations={{ ja, ne, en }}
        fallbackLang="ja"
        selectableLangs={['en', 'ja']}
        storageKey="@nepali_app/lang_v1"
      >
        <SettingsProvider
          defaults={{ practiceDirection: 'ja2ne', listenDirection: 'ja2ne' }}
          storageKey="@nepali_app/settings_v2"
        >
          <FirstRunGate>
            <PackGate>
              <LearningAppShell />
            </PackGate>
          </FirstRunGate>
        </SettingsProvider>
      </I18nProvider>
    </PurchasesProvider>
    </LearningAudioProvider>
    </GrammarGuideImageProvider>
  );
}
