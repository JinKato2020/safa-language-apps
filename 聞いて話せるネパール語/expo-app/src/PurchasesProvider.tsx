// App A の RevenueCat 実装。shared の EntitlementProvider に value を注入する。
//  ID契約(厳守): ASC製品ID = com.safa.nepali.jp.unlock_all
//               Entitlement識別子 = all_themes / Offering識別子 = default
//  APIキーは app.json の expo.extra.revenueCatApiKeyIos から読む(空ならRCを初期化せず未所持扱い)。
//  安全動作: キー空 / 初期化失敗 / 取得失敗でもクラッシュせず isPro=false で通常起動(審査スクショ用)。
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';
import { EntitlementProvider, type Entitlement } from '@safa/shared';

const ENTITLEMENT_ID = 'all_themes';
const OFFERING_ID = 'default';
const FREE_THEMES = 5;

const API_KEY_IOS: string = ((Constants.expoConfig?.extra as any)?.revenueCatApiKeyIos as string) || '';

// 現状 App A は iOS のみ(Android 廃止)。iOS かつキーがある時だけ RC を使う。
function isActive(info: CustomerInfo | null | undefined): boolean {
  return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [priceString, setPriceString] = useState<string | undefined>(undefined);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [busy, setBusy] = useState(false);

  const usable = Platform.OS === 'ios' && !!API_KEY_IOS;

  useEffect(() => {
    if (!usable) return; // キー未設定 → RC 無効・isPro=false のまま通常動作
    let alive = true;
    try {
      Purchases.configure({ apiKey: API_KEY_IOS });
    } catch {
      // 二重 configure(Fast Refresh 等)や初期化失敗は無視して続行(未所持扱い)
    }
    (async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        if (alive) setIsPro(isActive(info));
      } catch {}
      try {
        const offerings = await Purchases.getOfferings();
        const off = offerings.all?.[OFFERING_ID] ?? offerings.current ?? null;
        if (alive && off) {
          setOffering(off);
          const pkg = off.availablePackages?.[0];
          if (pkg?.product?.priceString) setPriceString(pkg.product.priceString);
        }
      } catch {}
    })();

    const listener = (info: CustomerInfo) => setIsPro(isActive(info));
    let remove = () => {};
    try {
      Purchases.addCustomerInfoUpdateListener(listener);
      remove = () => { try { Purchases.removeCustomerInfoUpdateListener(listener); } catch {} };
    } catch {}
    return () => { alive = false; remove(); };
  }, [usable]);

  const purchase = useCallback(async () => {
    if (!usable) return;
    setBusy(true);
    try {
      let off = offering;
      if (!off) {
        const offerings = await Purchases.getOfferings();
        off = offerings.all?.[OFFERING_ID] ?? offerings.current ?? null;
      }
      const pkg = off?.availablePackages?.[0];
      if (!pkg) return;
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setIsPro(isActive(customerInfo));
    } catch (e: any) {
      // ユーザーキャンセルは無視。それ以外も握りつぶして未所持のまま(クラッシュさせない)。
    } finally {
      setBusy(false);
    }
  }, [usable, offering]);

  const restore = useCallback(async () => {
    if (!usable) return;
    setBusy(true);
    try {
      const info = await Purchases.restorePurchases();
      setIsPro(isActive(info));
    } catch {} finally {
      setBusy(false);
    }
  }, [usable]);

  const value: Entitlement = { isPro, freeThemes: FREE_THEMES, priceString, purchase, restore, busy };
  return <EntitlementProvider value={value}>{children}</EntitlementProvider>;
}
