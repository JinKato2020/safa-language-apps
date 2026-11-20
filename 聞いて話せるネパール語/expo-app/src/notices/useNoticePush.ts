import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytesAsync } from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import app from '../../app.json';
import { announcementId, noticesConfigured, updateSubscription, type NoticeLanguage } from './noticeApi';

const key = 'nepali_notices_installation_v1';
const preference = '@nepali_app/notices_push_v1';
const nativeSupport = Constants.expoConfig?.extra?.nepaliNoticePushPlatforms;
export const supportsNoticePush = noticesConfigured && (
  (Platform.OS === 'ios' && nativeSupport?.ios === true) || (Platform.OS === 'android' && nativeSupport?.android === true)
);
const notificationId = (notification: Notifications.Notification) => {
  const id = notification.request.content.data?.announcementId;
  return typeof id === 'string' && announcementId.test(id) ? id : null;
};
if (supportsNoticePush) {
  Notifications.setNotificationHandler({
    handleNotification: async notification => {
      const announce = !!notificationId(notification);
      return { shouldPlaySound: announce, shouldSetBadge: false, shouldShowBanner: announce, shouldShowList: announce };
    },
  });
}

async function installationKey() {
  const existing = await SecureStore.getItemAsync(key);
  if (existing) return existing;
  const bytes = await getRandomBytesAsync(32);
  const secret = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(key, secret);
  return secret;
}

const isAllowed = (permission: Notifications.NotificationPermissionsStatus) => permission.granted
  || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

type Status = 'off' | 'on' | 'permission' | 'problem';

export function useNoticePush(lang: NoticeLanguage, open: (id: string) => void, refresh: () => void) {
  const [status, setStatus] = useState<Status>('off');
  const [busy, setBusy] = useState(false);
  const [wantsPush, setWantsPush] = useState(false);
  const actionPending = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const activeLang = useRef(lang);
  activeLang.current = lang;
  const latestRegistration = useRef<{ token: string; lang: NoticeLanguage; when: number } | null>(null);

  const synchronize = useCallback((enabled?: boolean, requestPermission = false) => {
    if (!supportsNoticePush) return Promise.resolve();
    const run = queue.current.catch(() => {}).then(async () => {
      try {
        if (enabled !== undefined) await AsyncStorage.setItem(preference, enabled ? 'on' : 'off');
        const wants = (await AsyncStorage.getItem(preference)) === 'on';
        setWantsPush(wants);
        const existing = await SecureStore.getItemAsync(key);
        if (!wants) {
          if (existing) {
            await updateSubscription(existing);
            await SecureStore.deleteItemAsync(key);
          }
          latestRegistration.current = null;
          setStatus('off');
          return;
        }
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('announcements', {
            name: 'Announcements', importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        let permission = await Notifications.getPermissionsAsync();
        if (requestPermission && !isAllowed(permission) && permission.canAskAgain) {
          permission = await Notifications.requestPermissionsAsync();
        }
        if (!isAllowed(permission)) {
          if (existing) {
            await updateSubscription(existing);
            await SecureStore.deleteItemAsync(key);
          }
          latestRegistration.current = null;
          setStatus('permission');
          return;
        }
        const previous = latestRegistration.current;
        const lang = activeLang.current;
        if (existing && previous?.lang === lang && Date.now() - previous.when < 6 * 3_600_000) {
          setStatus('on');
          return;
        }
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: app.expo.extra.eas.projectId });
        await updateSubscription(existing ?? await installationKey(), { token, lang });
        latestRegistration.current = { token, lang, when: Date.now() };
        setStatus('on');
      } catch {
        setStatus('problem');
      }
    });
    queue.current = run;
    return run;
  }, []);

  useEffect(() => { void synchronize(); }, [lang, synchronize]);
  useEffect(() => {
    if (!supportsNoticePush) return;
    let alive = true;
    const handled = new Set<string>();
    const onResponse = (response: Notifications.NotificationResponse | null) => {
      if (!alive || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const id = notificationId(response.notification);
      const requestId = response.notification.request.identifier;
      if (!id || handled.has(requestId)) return;
      if (handled.size >= 30) handled.clear();
      handled.add(requestId);
      open(id);
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    const appState = AppState.addEventListener('change', state => { if (state === 'active') void synchronize(); });
    const token = Notifications.addPushTokenListener(() => { latestRegistration.current = null; void synchronize(); });
    const response = Notifications.addNotificationResponseReceivedListener(onResponse);
    const receive = Notifications.addNotificationReceivedListener(notification => { if (notificationId(notification)) refresh(); });
    void Notifications.getLastNotificationResponseAsync().then(onResponse).catch(() => {});
    return () => {
      alive = false;
      appState.remove();
      token.remove();
      response.remove();
      receive.remove();
    };
  }, [open, refresh, synchronize]);

  const change = useCallback((enabled: boolean) => {
    if (actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    void synchronize(enabled, enabled).finally(() => {
      actionPending.current = false;
      setBusy(false);
    });
  }, [synchronize]);
  return { status, wantsPush, busy, change };
}
