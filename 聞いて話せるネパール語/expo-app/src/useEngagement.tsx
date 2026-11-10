import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import * as MailComposer from 'expo-mail-composer';
import { useI18n, useScaleStyle, type SettingsDevelopmentTools } from '@safa/shared';
import app from '../app.json';
import { canRequestReview, inviteDue, isLandingRoute, isStudyReturnRoute, isStudyRoute, readEngagement, requestMail, type EngagementState } from './engagementPolicy';

const KEY = '@nepali_app/engagement_v1';
const COPY = {
  ko: { title: '개선 의견 보내기', body: '추가하고 싶은 학습 자료나 기능을 이메일로 알려 주세요.', mail: '이메일로 의견 보내기', later: '나중에', never: '이 안내 다시 보지 않기', error: '이메일을 열 수 없어요', errorBody: '이메일 앱 설정을 확인해 주세요. 문의: contact@safa-lang.com' },
  ja: { title: '改善リクエスト', body: '追加してほしい教材や機能を、メールで送れます。', mail: '要望をメールで送る', later: '今は閉じる', never: 'この案内を表示しない', error: 'メールを開けませんでした', errorBody: 'メールアプリの設定をご確認ください。送信先：contact@safa-lang.com' },
  en: { title: 'Help shape the app', body: 'Send a request for lessons, features or improvements by email.', mail: 'Email a request', later: 'Not now', never: 'Stop these reminders', error: 'Unable to open email', errorBody: 'Please check your email app settings. Contact: contact@safa-lang.com' },
};

export function useEngagement() {
  const { lang } = useI18n();
  const ss = useScaleStyle();
  const copy = lang === 'ko' ? COPY.ko : lang === 'en' ? COPY.en : COPY.ja;
  const [visible, setVisible] = useState(false);
  const [mailBusy, setMailBusy] = useState(false);
  const state = useRef<EngagementState | null>(null);
  const loading = useRef<Promise<EngagementState> | null>(null);
  const route = useRef<string | undefined>(undefined);
  const studyStart = useRef<number | null>(null);
  const completedStudy = useRef(false);
  const lock = useRef(false);
  const composing = useRef(false);
  const preview = useRef(false);
  const mounted = useRef(true);
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persist = useCallback(async (value: EngagementState) => {
    state.current = value;
    await AsyncStorage.setItem(KEY, JSON.stringify(value)).catch(() => {});
  }, []);
  const load = useCallback(() => {
    if (state.current) return Promise.resolve(state.current);
    if (!loading.current) loading.current = AsyncStorage.getItem(KEY).catch(() => null).then(raw => {
      const value = readEngagement(raw, Date.now()); state.current = value; return value;
    });
    return loading.current;
  }, []);

  const onRouteChanged = useCallback((name: string | undefined) => {
    const now = Date.now();
    const previous = route.current;
    if (isStudyRoute(previous) && !isStudyRoute(name) && studyStart.current !== null && now - studyStart.current >= 30_000) completedStudy.current = true;
    if (isStudyRoute(name) && !isStudyRoute(previous)) studyStart.current = now;
    if (!isStudyRoute(name)) studyStart.current = null;
    route.current = name;
    if (reviewTimer.current && previous !== name) { clearTimeout(reviewTimer.current); reviewTimer.current = null; }
    if (!isLandingRoute(name)) { setVisible(false); preview.current = false; return; }
    if (preview.current) return;
    // A conversation may return via Level before Theme. Keep its completion
    // across that intermediate screen, but never invite simply on launch/settings.
    if (!isStudyReturnRoute(name) || !completedStudy.current) return;
    if (lock.current) return;
    completedStudy.current = false;
    lock.current = true;
    void (async () => {
      let value = await load();
      if (!mounted.current || !isStudyReturnRoute(route.current) || !inviteDue(value, now)) return;
      value = { ...value, lastInvite: now };
      await persist(value);
      if (mounted.current && isStudyReturnRoute(route.current)) setVisible(true);
      // Native review only after a meaningful study visit, never at first launch,
      // never gated by sentiment or by clicking the email invitation.
      if (canRequestReview(value, now) && Platform.OS === 'ios') {
        reviewTimer.current = setTimeout(() => {
          void (async () => {
            if (!mounted.current || composing.current || !isStudyReturnRoute(route.current) || AppState.currentState !== 'active' || state.current?.disabled) return;
            try {
              if (!await StoreReview.isAvailableAsync()) return;
              if (!mounted.current || composing.current || !isStudyReturnRoute(route.current) || AppState.currentState !== 'active' || state.current?.disabled) return;
              const latest = state.current!;
              if (!canRequestReview(latest, Date.now())) return;
              await persist({ ...latest, reviewAttempts: [...latest.reviewAttempts, Date.now()] });
              if (!mounted.current || composing.current || !isStudyReturnRoute(route.current) || AppState.currentState !== 'active' || state.current?.disabled) return;
              await StoreReview.requestReview();
            } catch { /* Apple may suppress the prompt; no forced store redirect. */ }
          })();
        }, 1500);
      }
    })().finally(() => { lock.current = false; });
  }, [load, persist]);

  useEffect(() => {
    mounted.current = true;
    void load().then(value => persist(value));
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active' && isLandingRoute(route.current)) onRouteChanged(route.current);
      else if (status === 'active' && isStudyRoute(route.current)) studyStart.current = Date.now();
      else if (status !== 'active') {
        studyStart.current = null;
        completedStudy.current = false;
        if (reviewTimer.current) clearTimeout(reviewTimer.current);
      }
    });
    return () => { mounted.current = false; listener.remove(); if (reviewTimer.current) clearTimeout(reviewTimer.current); };
  }, [load, persist, onRouteChanged]);

  const email = async () => {
    if (mailBusy) return;
    composing.current = true;
    if (reviewTimer.current) clearTimeout(reviewTimer.current);
    setMailBusy(true);
    const mail = requestMail(lang, app.expo.version);
    try {
      if (await MailComposer.isAvailableAsync()) await MailComposer.composeAsync(mail);
      else await Linking.openURL(`mailto:${mail.recipients[0]}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`);
    } catch { Alert.alert(copy.error, copy.errorBody); }
    finally { composing.current = false; if (mounted.current) setMailBusy(false); }
  };
  const close = () => { setVisible(false); preview.current = false; };
  const stop = () => {
    setVisible(false);
    if (preview.current) { preview.current = false; return; }
    if (state.current) void persist({ ...state.current, disabled: true });
  };
  const developmentTools: SettingsDevelopmentTools = {
    showRequest: () => {
      if (reviewTimer.current) clearTimeout(reviewTimer.current);
      preview.current = true; setVisible(true);
    },
    showReview: async () => {
      if (reviewTimer.current) clearTimeout(reviewTimer.current);
      if (composing.current || AppState.currentState !== 'active') return 'unavailable';
      try {
        if (!await StoreReview.isAvailableAsync()) return 'unavailable';
        await StoreReview.requestReview(); return 'requested';
      } catch { return 'failed'; }
    },
  };
  const banner = visible ? <View style={styles.card}>
    <Text style={[styles.title, ss(15, 21)]}>{copy.title}</Text>
    <Text style={[styles.body, ss(13, 20)]}>{copy.body}</Text>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={mailBusy} onPress={email} style={styles.primary}><Text style={[styles.primaryText, ss(13, 19)]}>{copy.mail}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={close} style={styles.secondary}><Text style={[styles.link, ss(13, 19)]}>{copy.later}</Text></Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={stop} style={styles.optout}><Text style={[styles.muted, ss(12, 18)]}>{copy.never}</Text></Pressable>
  </View> : null;
  return { onRouteChanged, banner, developmentTools };
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#eff6ff', borderTopWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  title: { color: '#1e3a8a', fontWeight: '700' }, body: { color: '#334155', marginTop: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  primary: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, minHeight: 44 },
  primaryText: { color: '#ffffff', fontWeight: '600' }, secondary: { padding: 12, minHeight: 44 },
  link: { color: '#1e40af' }, optout: { paddingVertical: 10, alignSelf: 'flex-start', minHeight: 44 }, muted: { color: '#475569' },
});
