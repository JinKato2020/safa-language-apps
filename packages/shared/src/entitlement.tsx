// 課金エンタイトルメント(RC非依存の純粋Context)。
//  - shared はこの Context の「形」だけを定義し、実装(RevenueCat 等)はアプリ側が value を注入する。
//  - Provider を使わないアプリ(App B/C)は DEFAULT(全開放)が返るため、一切ロックされない=後方互換。
//  - 画面側は useEntitlement() と isLockedAt() だけを使い、課金ライブラリに依存しない。
import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type Entitlement = {
  /** 全テーマ解放済みか(買い切り所持)。 */
  isPro: boolean;
  /** 無料で開放する先頭テーマ数(表示番号1..freeThemes が無料)。 */
  freeThemes: number;
  /** ストアから取得した価格表示文字列(例 "¥980")。取得前/不可は undefined。 */
  priceString?: string;
  /** 購入を開始する(buy)。 */
  purchase: () => Promise<void>;
  /** 購入を復元する(Apple 3.1.1)。 */
  restore: () => Promise<void>;
  /** 購入/復元の処理中。 */
  busy: boolean;
};

// 既定値: 全開放(isPro:true / freeThemes:Infinity)。
//  Provider を使わないアプリでは isLockedAt() が常に false を返し、ロックが発生しない。
const DEFAULT_ENTITLEMENT: Entitlement = {
  isPro: true,
  freeThemes: Infinity,
  priceString: undefined,
  purchase: async () => {},
  restore: async () => {},
  busy: false,
};

const EntitlementContext = createContext<Entitlement>(DEFAULT_ENTITLEMENT);

/** value(アプリ側で算出したエンタイトルメント)をそのまま流すだけの Provider。 */
export function EntitlementProvider({ value, children }: { value: Entitlement; children: ReactNode }) {
  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): Entitlement {
  return useContext(EntitlementContext);
}

/** 一覧の index0(0始まり=表示番号-1)がロック対象か。isPro か freeThemes 以内なら false。 */
export function isLockedAt(ent: Entitlement, index0: number): boolean {
  return !ent.isPro && index0 >= ent.freeThemes;
}

/** 一覧カードに重ねる 🔒 バッジ(右端中央・タップは透過)。各一覧で使い回す。 */
export function LockBadge({ size = 16 }: { size?: number }) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.pill}>
        <Text style={[styles.icon, { fontSize: size }]}>🔒</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 10, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pill: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(100,116,139,0.14)', alignItems: 'center', justifyContent: 'center' },
  icon: { color: '#64748b', opacity: 0.9 },
});
