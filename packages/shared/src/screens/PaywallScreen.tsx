// ペイウォール(購入画面)。ロックされたテーマをタップすると表示する。
//  - 純粋UI: useEntitlement() から価格/購入/復元を受け取るだけ(課金ライブラリ非依存)。
//  - 文言はこの画面内で ja/en/ne を自前に保持(i18n JSON 非依存=App B/C に副作用なし)。
//  - 価格は RC offering 由来の priceString、無ければフォールバック ¥980。
//  - 「購入を復元」必須(Apple 3.1.1)。busy 中はスピナー。
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEntitlement } from '../entitlement';
import { useI18n } from '../i18n';
import { useTokens } from '../design';

const FALLBACK_PRICE = '¥980';

type Copy = {
  title: string;
  lead: string;
  bullets: string[];
  buy: string;
  restore: string;
  close: string;
  owned: string;
  priceNote: string;
};

const COPY: Record<string, Copy> = {
  ja: {
    title: '全テーマを解放',
    lead: 'テーマ5まで無料でお試しいただけます。買い切りで全テーマ(会話・文法・聞き流し・単語)をロック解除。',
    bullets: ['全テーマを永久に解放', '一度の購入で追加課金なし', '同じApple IDの端末で復元可能'],
    buy: '購入する',
    restore: '購入を復元',
    close: '閉じる',
    owned: 'ご購入ありがとうございます。全テーマが解放されています。',
    priceNote: '買い切り(非消耗型)',
  },
  en: {
    title: 'Unlock all themes',
    lead: 'Themes 1–5 are free to try. Unlock all themes (conversation, grammar, listening, vocabulary) with a one-time purchase.',
    bullets: ['Unlock all themes forever', 'One-time purchase, no subscription', 'Restorable on devices with the same Apple ID'],
    buy: 'Purchase',
    restore: 'Restore purchase',
    close: 'Close',
    owned: 'Thank you. All themes are unlocked.',
    priceNote: 'One-time purchase (non-consumable)',
  },
  ne: {
    title: 'सबै विषय खोल्नुहोस्',
    lead: 'विषय ५ सम्म निःशुल्क प्रयास गर्न सकिन्छ। एक पटकको किनमेलले सबै विषय (कुराकानी, व्याकरण, सुनाइ, शब्दावली) खोल्नुहोस्।',
    bullets: ['सबै विषय सधैंका लागि खोल्ने', 'एक पटक किन्दा थप शुल्क छैन', 'उही Apple ID भएका यन्त्रमा पुनःप्राप्ति सम्भव'],
    buy: 'किन्नुहोस्',
    restore: 'किनमेल पुनःप्राप्ति',
    close: 'बन्द गर्नुहोस्',
    owned: 'धन्यवाद। सबै विषय खुला छन्।',
    priceNote: 'एक पटकको किनमेल (गैर-उपभोग्य)',
  },
};

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const { lang } = useI18n();
  const { colors, spacing, radius, fontSize } = useTokens();
  const ent = useEntitlement();
  const c = COPY[lang] ?? COPY.ja;
  const price = ent.priceString || FALLBACK_PRICE;

  const close = () => { try { navigation.goBack(); } catch {} };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { padding: spacing.lg }]}
    >
      <Text style={[styles.title, { color: colors.ink, marginBottom: spacing.md }]}>{c.title}</Text>
      <Text style={[styles.lead, { color: colors.ink2, marginBottom: spacing.lg }]}>{c.lead}</Text>

      <View style={{ marginBottom: spacing.lg }}>
        {c.bullets.map((b, i) => (
          <View key={i} style={[styles.bulletRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.check, { color: colors.success }]}>✓</Text>
            <Text style={[styles.bulletText, { color: colors.ink2 }]}>{b}</Text>
          </View>
        ))}
      </View>

      {ent.isPro ? (
        <View style={[styles.ownedBox, { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }]}>
          <Text style={[styles.ownedText, { color: colors.primaryDark }]}>{c.owned}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.priceRow, { marginBottom: spacing.md }]}>
            <Text style={[styles.price, { color: colors.ink }]}>{price}</Text>
            <Text style={[styles.priceNote, { color: colors.mute, fontSize: fontSize.small }]}>{c.priceNote}</Text>
          </View>

          <Pressable
            disabled={ent.busy}
            onPress={() => { ent.purchase(); }}
            style={({ pressed }) => [
              styles.buyBtn,
              { backgroundColor: colors.primary, borderRadius: radius.md, opacity: ent.busy ? 0.7 : pressed ? 0.88 : 1 },
            ]}
          >
            {ent.busy
              ? <ActivityIndicator color={colors.onPrimary} />
              : <Text style={[styles.buyText, { color: colors.onPrimary }]}>{c.buy}</Text>}
          </Pressable>

          <Pressable disabled={ent.busy} onPress={() => { ent.restore(); }} hitSlop={8} style={[styles.linkBtn, { marginTop: spacing.md }]}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{c.restore}</Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={close} hitSlop={8} style={[styles.linkBtn, { marginTop: spacing.lg }]}>
        <Text style={[styles.linkText, { color: colors.mute }]}>{c.close}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, maxWidth: 560, width: '100%', alignSelf: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  lead: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  check: { fontSize: 15, fontWeight: '800', marginTop: 1 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  priceRow: { alignItems: 'center' },
  price: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  priceNote: { marginTop: 2 },
  ownedBox: {},
  ownedText: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  buyBtn: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  buyText: { fontSize: 17, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
