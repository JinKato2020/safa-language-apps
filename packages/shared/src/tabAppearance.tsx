import { Image, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';
import type { TabDesign } from './SettingsContext';

export type StudyTab = 'home' | 'puzzle' | 'listening' | 'composition' | 'settings';
export const tabCardRadius = 12;

const tones = {
  puzzle: { accent: '#6545A6', soft: '#F0EAFB', edge: '#D8CBF1', dark: '#251C39', light: '#DCCAFF' },
  listening: { accent: '#17685A', soft: '#E4F2EB', edge: '#C5DFD3', dark: '#102E2D', light: '#A9E7CF' },
  composition: { accent: '#215A93', soft: '#E8F0FA', edge: '#CEDFF3', dark: '#10263D', light: '#B9DAFF' },
  settings: { accent: '#365E60', soft: '#E6F0EE', edge: '#CDDCD8', dark: '#192D35', light: '#BFE0DF' },
};

export const tabDesignOptions = ['minimal', 'blueprint', 'classic'] as const;

export const tabDesignSwatches: Record<TabDesign, readonly [string, string, string]> = {
  minimal: ['#FAF8F4', '#E6F0EE', '#365E60'],
  blueprint: ['#EEF3F9', '#192D35', '#BFE0DF'],
  classic: ['#FFFFFF', '#E4E4E7', '#27272A'],
};

export function tabPalette(design: TabDesign, tab: StudyTab) {
  if (design === 'classic') return undefined;
  const tone = tones[tab === 'home' ? 'settings' : tab];
  const blueprint = design === 'blueprint';
  return {
    ...tone,
    page: blueprint ? '#EEF3F9' : '#FAF8F4',
    surface: '#FFFFFF',
    ink: blueprint ? '#1B2D46' : '#202D2C',
    muted: blueprint ? '#435A74' : '#465856',
    line: blueprint ? '#CAD8E8' : '#DBE1DD',
    masthead: blueprint ? tone.dark : tone.soft,
    mastInk: blueprint ? '#FAFCFF' : '#1A2B2C',
    mastMuted: blueprint ? '#D5E5F3' : '#3B5050',
    mastAccent: blueprint ? tone.light : tone.accent,
    mastEdge: blueprint ? tone.dark : tone.edge,
  };
}

export type TabPalette = NonNullable<ReturnType<typeof tabPalette>>;

export function TabMastheadFrame({ palette, children, compact = false, testID = 'tab-masthead' }: {
  palette: TabPalette; children: ReactNode; compact?: boolean; testID?: string;
}) {
  return <View testID={testID} style={[styles.masthead, compact && styles.compact, {
    backgroundColor: palette.masthead, borderColor: palette.mastEdge,
  }]}>{children}</View>;
}

export function TabMasthead({ title, description, palette, image }: {
  title: string; description: string; palette: TabPalette; image?: number | null;
}) {
  const art = image == null ? undefined : Image.resolveAssetSource(image);
  return <TabMastheadFrame palette={palette}>
    <View style={styles.copy}>
      <View accessible={false} style={[styles.accent, { backgroundColor: palette.mastAccent }]} />
      <Text accessibilityRole="header" style={[styles.title, { color: palette.mastInk }]}>{title}</Text>
      <Text style={[styles.description, { color: palette.mastMuted }]}>{description}</Text>
    </View>
    {image != null && art && art.width > 0 && art.height > 0 && <View style={[styles.art, { aspectRatio: art.width / art.height }]}>
      <Image source={image} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.image} />
    </View>}
  </TabMastheadFrame>;
}

const styles = StyleSheet.create({
  masthead: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 14 },
  compact: { marginBottom: 0 },
  copy: { paddingHorizontal: 18, paddingVertical: 16, gap: 5 },
  accent: { width: 26, height: 3, borderRadius: 3, marginBottom: 5 },
  title: { fontSize: 29, lineHeight: 37, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 22 },
  art: { width: '100%', maxHeight: 210 },
  image: { width: '100%', height: '100%' },
});
