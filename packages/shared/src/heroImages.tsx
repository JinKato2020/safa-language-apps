// 各モード(タブ)着地画面のヒーロー画像。
// App A のみ heroImages を注入 → 未注入の App B/C はヒーロー非表示(無影響)。
// キー = モード名(conversation / grammar / listening / vocabulary など)。値 = require(...) の asset 番号。
import { createContext, useContext, type ReactNode } from 'react';

export type HeroImages = Record<string, number | undefined>;

const HeroImagesContext = createContext<HeroImages | null>(null);

export function HeroImagesProvider({ value, children }: { value?: HeroImages | null; children: ReactNode }) {
  return <HeroImagesContext.Provider value={value ?? null}>{children}</HeroImagesContext.Provider>;
}

// モードキーに対応するヒーロー画像(asset番号)を返す。無ければ null。
export function useHeroImage(key: string | null | undefined): number | null {
  const m = useContext(HeroImagesContext);
  if (!m || !key) return null;
  return m[key] ?? null;
}
