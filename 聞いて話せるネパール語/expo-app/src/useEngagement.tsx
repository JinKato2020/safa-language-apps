import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import * as MailComposer from 'expo-mail-composer';
import { useI18n, useScaleStyle, type SettingsDevelopmentTools } from '@safa/shared';
import app from '../app.json';
import { canRequestReview, inviteDue, isLandingRoute, isStudyRoute, readEngagement, requestMail, type EngagementState } from './engagementPolicy';

const KEY = '@nepali_app/engagement_v1';
const COPY = {
  ja: { title: '改善リクエスト', body: '追加してほしい教材や機能を、メールで送れます。', mail: '要望をメールで送る', later: '今は閉じる', never: 'この案内を表示しない', error: 'メールを開けませんでした', errorBody: 'メールアプリの設定をご確認ください。送信先：contact@safa-lang.com' },
  en: { title: 'Help shape the app', body: 'Send a request for lessons, features or improvements by email.', mail: 'Email a request', later: 'Not now', never: 'Stop these reminders', error: 'Unable to open email', errorBody: 'Please check your email app settings. Contact: contact@safa-lang.com' },
};

export function useEngagement() {
  const { lang } = useI18n();
  const ss = useScaleStyle();
  const copy = lang === 'en' ? COPY.en : COPY.ja;
  const [visible, setVisible] = useState(false);
  const [mailBusy, setMailBusy] = useState(false);
  const [developmentEnabled, setDevelopmentEnabled] = useState(typeof __DEV__ !== 'undefined' && __DEV__);
  const state = useRef<EngagementState | null>(null);
  const loading = useRef<Promise<EngagementState> | null>(null);
  const route = useRef<string | undefined>(undefined);
  const studyStart = useRef<number | null>(null);
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
    const completedStudy = isStudyRoute(route.current) && isLandingRoute(name) && studyStart.current !== null && now - studyStart.current >= 30_000;
    if (isStudyRoute(name) && !isStudyRoute(route.current)) studyStart.current = now;
    if (!isStudyRoute(name)) studyStart.current = null;
    route.current = name;
    if (reviewTimer.current) { clearTimeout(reviewTimer.current); reviewTimer.current = null; }
    if (!isLandingRoute(name)) { setVisible(false); preview.current = false; return; }
    if (preview.current) return;
    if (lock.current) return;
    lock.current = true;
    void (async () => {
      let value = await load();
      if (!mounted.current || !isLandingRoute(route.current) || value.disabled) return;
      if (inviteDue(value, now)) {
        value = { ...value, lastInvite: now };
        await persist(value);
        if (mounted.current && isLandingRoute(route.current)) setVisible(true);
      } else if (value.lastInvite === 0) {
        // Persist first use even when no invitation is due yet.
        await persist(value);
      }
      // Native review only after a meaningful study visit, never at first launch,
      // never gated by sentiment or by clicking the email invitation.
      const lastAttempt = Math.max(0, ...value.reviewAttempts);
      if (completedStudy && value.lastInvite > lastAttempt && canRequestReview(value, now) && Platform.OS === 'ios') {
        reviewTimer.current = setTimeout(() => {
          void (async () => {
            if (!mounted.current || composing.current || !isLandingRoute(route.current) || AppState.currentState !== 'active' || state.current?.disabled) return;
            try {
              if (!await StoreReview.isAvailableAsync()) return;
              if (!mounted.current || composing.current || !isLandingRoute(route.current) || AppState.currentState !== 'active' || state.current?.disabled) return;
              const latest = state.current!;
              if (!canRequestReview(latest, Date.now())) return;
              await persist({ ...latest, reviewAttempts: [...latest.reviewAttempts, Date.now()] });
              if (!mounted.current || composing.current || !isLandingRoute(route.current) || AppState.currentState !== 'active' || state.current?.disabled) return;
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
    // SDK54 iOS isAvailableAsync is false specifically for TestFlight receipts.
    // Fail closed: errors never expose development tools in App Store builds.
    if (Platform.OS === 'ios' && !(typeof __DEV__ !== 'undefined' && __DEV__)) {
      void StoreReview.isAvailableAsync().then(available => { if (mounted.current) setDevelopmentEnabled(!available); }).catch(() => {});
    }
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active' && isLandingRoute(route.current)) onRouteChanged(route.current);
      else if (status !== 'active') {
        studyStart.current = null;
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
  const developmentTools: SettingsDevelopmentTools | null = developmentEnabled ? {
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
  } : null;
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
