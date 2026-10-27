// 各モード(タブ)着地画面のヒーロー画像。
// App A のみ heroImages を注入 → 未注入の App B/C はヒーロー非表示(無影響)。
// キー = モード名(conversation / grammar / listening / vocabulary など)。値 = require(...) の asset 番号。
import { createContext, useContext, type ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { spacing } from './theme';

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

// Size the frame independently of Image's intrinsic asset dimensions. A static
// require() supplies both width and height, so width + aspectRatio on Image alone
// can retain the asset's native height and crop the panorama on narrow screens.
export function ModeHero({ source }: { source: number }) {
  const { width, height } = Image.resolveAssetSource(source);
  return (
    <View style={[styles.frame, { aspectRatio: width / height }]}>
      <Image
        source={source}
        style={styles.image}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: spacing.lg },
  image: { width: '100%', height: '100%' },
});
