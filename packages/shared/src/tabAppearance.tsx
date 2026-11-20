import { Image, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './Text';
import type { TabDesign } from './SettingsContext';

export type StudyTab = 'home' | 'puzzle' | 'listening' | 'composition' | 'settings';
export const tabCardRadius = 12;

const tones = {
  puzzle: { accent: '#6545A6', soft: '#F0EAFB', edge: '#D8CBF1' },
  listening: { accent: '#17685A', soft: '#E4F2EB', edge: '#C5DFD3' },
  composition: { accent: '#215A93', soft: '#E8F0FA', edge: '#CEDFF3' },
  settings: { accent: '#365E60', soft: '#E6F0EE', edge: '#CDDCD8' },
};

const forest = {
  accent: '#CAE4A6',
  onAccent: '#172A21',
  soft: '#314C3E',
  edge: '#547361',
  page: '#132620',
  surface: '#213A2F',
  ink: '#E9F2E9',
  muted: '#BFD0C4',
  line: '#426052',
  masthead: '#20382F',
  mastInk: '#E9F2E9',
  mastMuted: '#BFD0C4',
  mastAccent: '#CAE4A6',
  mastEdge: '#405E50',
  unread: '#FF7585',
  danger: '#FFC0C9',
  nav: '#192E26',
  dark: true,
};

export function tabPalette(tab: StudyTab, design: TabDesign) {
  if (design === 'forest') return forest;
  const tone = tones[tab === 'home' ? 'settings' : tab];
  return {
    ...tone,
    onAccent: '#FFFFFF',
    page: '#FAF8F4',
    surface: '#FFFFFF',
    ink: '#202D2C',
    muted: '#465856',
    line: '#DBE1DD',
    masthead: tone.soft,
    mastInk: '#1A2B2C',
    mastMuted: '#3B5050',
    mastAccent: tone.accent,
    mastEdge: tone.edge,
    unread: '#C4253E',
    danger: '#9F1239',
    nav: '#FFFFFF',
    dark: false,
  };
}

export type TabPalette = ReturnType<typeof tabPalette>;

export function TabMastheadFrame({ palette, children, compact = false, expand = false, testID = 'tab-masthead' }: {
  palette: TabPalette; children: ReactNode; compact?: boolean; expand?: boolean; testID?: string;
}) {
  return <View testID={testID} style={[styles.masthead, compact && styles.compact, expand && styles.expand, {
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
  expand: { flexGrow: 1 },
  copy: { paddingHorizontal: 18, paddingVertical: 16, gap: 5 },
  accent: { width: 26, height: 3, borderRadius: 3, marginBottom: 5 },
  title: { fontSize: 29, lineHeight: 37, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 22 },
  art: { width: '100%', maxHeight: 210 },
  image: { width: '100%', height: '100%' },
});
