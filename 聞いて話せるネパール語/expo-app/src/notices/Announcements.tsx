import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeTile, Text, useI18n } from '@safa/shared';
import { getNotices, noticesConfigured, parseNotices, toNoticeLanguage, type Notice } from './noticeApi';
import { supportsNoticePush, useNoticePush } from './useNoticePush';

const readKey = '@nepali_app/notices_read_v1';
const cacheKey = (lang: string) => '@nepali_app/notices_cache_v1/' + lang;

const translations = {
  ja: { title: 'お知らせ', unread: '未読あり', close: '閉じる', back: '一覧へ', empty: 'お知らせはまだありません。', failed: 'お知らせを読み込めませんでした。', missing: 'このお知らせは表示できません。', retry: '再読み込み', push: 'プッシュ通知', permission: '端末の設定で、このアプリの通知を許可してください。', openSettings: '端末の設定を開く', problem: '通知の設定を同期できませんでした。', retryPush: '通知設定を再試行' },
  en: { title: 'Announcements', unread: 'Unread announcements', close: 'Close', back: 'All announcements', empty: 'No announcements yet.', failed: 'Could not load announcements.', missing: 'This announcement is unavailable.', retry: 'Retry', push: 'Push notifications', permission: 'Allow notifications for this app in your device settings.', openSettings: 'Open device settings', problem: 'Could not sync your notification setting.', retryPush: 'Retry notification setup' },
  ko: { title: '공지사항', unread: '읽지 않은 공지사항 있음', close: '닫기', back: '목록으로', empty: '아직 공지사항이 없어요.', failed: '공지사항을 불러오지 못했어요.', missing: '이 공지사항을 볼 수 없어요.', retry: '다시 불러오기', push: '푸시 알림', permission: '기기 설정에서 이 앱의 알림을 허용해 주세요.', openSettings: '기기 설정 열기', problem: '알림 설정을 동기화하지 못했어요.', retryPush: '알림 설정 다시 시도' },
  ar: { title: 'الإعلانات', unread: 'هناك إعلانات غير مقروءة', close: 'إغلاق', back: 'كل الإعلانات', empty: 'لا توجد إعلانات بعد.', failed: 'تعذّر تحميل الإعلانات.', missing: 'هذا الإعلان غير متاح.', retry: 'إعادة المحاولة', push: 'الإشعارات الفورية', permission: 'اسمح بإشعارات هذا التطبيق في إعدادات جهازك.', openSettings: 'فتح إعدادات الجهاز', problem: 'تعذّرت مزامنة إعداد الإشعارات.', retryPush: 'إعادة ضبط الإشعارات' },
};

export function useAnnouncements() {
  const { lang: uiLanguage } = useI18n();
  const lang = toNoticeLanguage(uiLanguage);
  const copy = translations[lang];
  const languageRef = useRef(lang);
  languageRef.current = lang;
  const [list, setList] = useState<{ lang: string; items: Notice[] } | null>(null);
  const [read, setRead] = useState<Set<string> | null>(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ lang: string; item: Notice } | null>(null);
  const [listStatus, setListStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [detailStatus, setDetailStatus] = useState<'loading' | 'missing' | 'error'>('loading');
  const [detailRetry, setDetailRetry] = useState(0);
  const listRequest = useRef(0);
  const items = list?.lang === lang ? list.items : [];
  const article = items.find(item => item.id === selected)
    ?? (detail?.lang === lang && detail.item.id === selected ? detail.item : undefined);

  const refresh = useCallback(() => {
    if (!noticesConfigured) return;
    const requestedLang = languageRef.current;
    const generation = ++listRequest.current;
    void getNotices(requestedLang).then(items => {
      if (languageRef.current !== requestedLang || listRequest.current !== generation) return;
      setList({ lang: requestedLang, items });
      setListStatus('ready');
      void AsyncStorage.setItem(cacheKey(requestedLang), JSON.stringify(items)).catch(() => {});
    }).catch(() => {
      if (languageRef.current === requestedLang && listRequest.current === generation) setListStatus('error');
    });
  }, []);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(readKey).then(raw => {
      const ids: unknown = JSON.parse(raw ?? '[]');
      if (!Array.isArray(ids)) throw Error('Invalid reading history');
      if (active) setRead(new Set(ids.filter((id): id is string => typeof id === 'string')));
    }).catch(() => { if (active) setRead(new Set()); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!noticesConfigured) return;
    let active = true;
    setListStatus('loading');
    void AsyncStorage.getItem(cacheKey(lang)).then(raw => {
      if (!raw || !active) return;
      const items = parseNotices(JSON.parse(raw));
      setList(current => current?.lang === lang ? current : { lang, items });
    }).catch(() => {});
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { active = false; listRequest.current++; listener.remove(); };
  }, [lang, refresh]);

  const open = useCallback((id?: string) => {
    setSelected(id ?? null);
    setVisible(true);
    refresh();
  }, [refresh]);
  const push = useNoticePush(lang, open, refresh);

  const articleId = article?.id;
  useEffect(() => {
    if (!visible || !articleId || !read || read.has(articleId)) return;
    const next = new Set([...read, articleId].slice(-256));
    setRead(next);
    void AsyncStorage.setItem(readKey, JSON.stringify([...next])).catch(() => {});
  }, [visible, articleId, read]);

  useEffect(() => {
    if (!selected || !visible || articleId) return;
    let active = true;
    setDetailStatus('loading');
    void getNotices(lang, selected).then(([item]) => {
      if (!active) return;
      if (item) setDetail({ lang, item });
      else setDetailStatus('missing');
    }).catch(() => { if (active) setDetailStatus('error'); });
    return () => { active = false; };
  }, [selected, lang, articleId, visible, detailRetry]);

  const close = () => { setVisible(false); setSelected(null); };
  const rtl = lang === 'ar';
  const formatDate = (value: number) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(value);
  const hasUnread = !!read && items.some(item => !read.has(item.id));
  const button = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" style={styles.action} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
  const card = <HomeTile id="home-announcements" title={lang === 'en' ? 'Notices' : copy.title} kind="announcement"
    onPress={() => open()} unreadLabel={hasUnread ? copy.unread : undefined} />;
  const modal = <Modal visible={visible} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, rtl && styles.rtl]}>
        <Text accessibilityRole="header" style={styles.title}>{copy.title}</Text>
        {button(copy.close, close)}
      </View>
      <ScrollView key={selected ?? 'list'} contentContainerStyle={styles.content}>
        {selected ? <>
          {button(copy.back, () => setSelected(null))}
          {article ? <View style={styles.entry}>
            <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
            <Text accessibilityRole="header" style={styles.title}>{article.title}</Text>
            <Text style={styles.body}>{article.body}</Text>
          </View> : detailStatus === 'loading' ? <ActivityIndicator color="#126b60" /> : <>
            <Text style={styles.body}>{detailStatus === 'missing' ? copy.missing : copy.failed}</Text>
            {button(copy.retry, () => setDetailRetry(value => value + 1))}
          </>}
        </> : <>
          {supportsNoticePush && <View style={styles.entry}>
            <View style={[styles.setting, rtl && styles.rtl]}>
              <Text style={styles.label}>{copy.push}</Text>
              <Switch accessibilityLabel={copy.push} value={push.wantsPush} disabled={push.busy}
                onValueChange={push.change} trackColor={{ false: '#bfcac5', true: '#126b60' }} />
            </View>
            {push.status === 'permission' && <>
              <Text style={styles.body}>{copy.permission}</Text>
              {button(copy.openSettings, () => { void Linking.openSettings().catch(() => {}); })}
            </>}
            {push.status === 'problem' && <>
              <Text style={styles.body}>{copy.problem}</Text>
              {button(copy.retryPush, () => push.change(push.wantsPush))}
            </>}
          </View>}
          {items.map(item => {
            const unread = !!read && !read.has(item.id);
            return <Pressable key={item.id} testID={`announcement-${item.id}`} style={styles.entry} accessibilityRole="button"
              accessibilityLabel={unread ? item.title + ' · ' + copy.unread : item.title} onPress={() => setSelected(item.id)}>
              <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
              <View style={[styles.setting, rtl && styles.rtl]}>
                <Text style={styles.label}>{item.title}</Text>
                {unread && <View style={styles.dot} />}
              </View>
            </Pressable>;
          })}
          {listStatus === 'error' ? <>
            <Text style={styles.body}>{copy.failed}</Text>
            {button(copy.retry, refresh)}
          </> : items.length === 0 && (listStatus === 'loading' && noticesConfigured
            ? <ActivityIndicator color="#126b60" /> : <Text style={styles.body}>{copy.empty}</Text>)}
        </>}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
  return { card, modal };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F4' },
  header: { flexDirection: 'row', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center', justifyContent: 'space-between' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 16, paddingBottom: 36, gap: 10 },
  entry: { padding: 16, borderRadius: 14, gap: 8, backgroundColor: '#fff', borderColor: '#DBE5DE', borderWidth: 1 },
  title: { flexShrink: 1, fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#123039' },
  date: { color: '#52666C', fontSize: 13, lineHeight: 19 },
  label: { flex: 1, fontSize: 16, lineHeight: 23, fontWeight: '600', color: '#123039' },
  body: { color: '#36514E', fontSize: 16, lineHeight: 25 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rtl: { direction: 'rtl' },
  action: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '700', color: '#126B60' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#C4253E' },
});
