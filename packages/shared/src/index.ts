// @safa/shared パブリック API
// アプリ側からは `import { ... } from '@safa/shared'` で取得する。

// ── プロバイダー (root で組み合わせる) ──
export { I18nProvider, useI18n, type Lang } from './i18n';
export {
  SettingsProvider, useSettings, useScaleFont, useScaleStyle, useGlobalScaleStyle, useFontScale,
  FONT_DELTA,
  type Direction, type NepaliRepeat, type ListenSpeed, type GapMode, type ThemeMode, type FontMode,
  type SettingsDefaults,
} from './SettingsContext';
export {
  AppDataProvider, useAppData,
  type AppData, type AudioBundle, type VocabEntry,
  type GrammarVocab, type GrammarVocabEntry, type GrammarVocabContext,
  type JpReading, type JpReadingEntry,
} from './AppDataContext';

// ── UI ヘルパー ──
export { Text } from './Text';
export { ModalDropdown, type DropdownItem } from './ModalDropdown';
export { colors, spacing, radius } from './theme';
export { toRomaji, sentenceToRomaji } from './transliterate';
export { getL1, L1_REGISTRY, type L1Config, type L1Code } from './l1';

// ── 共有デザインシステム (継続/成長/バッジ等の props駆動部品。単一ソース・JLPTへは subtree 共有) ──
// spacing/radius/fontSize は衝突回避のため再公開しない。各部品内部で useTokens() が供給する。
export {
  DesignThemeProvider, useTokens,
  Card, StatRow, StreakWeek, StreakCalendar, GrowthBars, BadgeGrid,
  lightPalette, darkPalette,
  useDailyProgress, todayStr, addDays, lastNDays,
  type Palette, type Scheme, type DesignTokens,
  type Stat, type WeekDay, type CalDay, type BadgeItem, type DailyProgress,
} from './design';

// ── 型 ──
export type {
  Mode, ThemeMeta, LevelMeta, Example, WordCategoryMeta, Word, GrammarThemeMeta,
  RootStackParamList, RootTabParamList,
} from './types';

// ── 課金エンタイトルメント (アプリ側が value を注入。未注入なら全開放=後方互換) ──
export {
  EntitlementProvider, useEntitlement, isLockedAt, LockBadge,
  type Entitlement,
} from './entitlement';

// ── 文法「教材」(ルール解説。アプリ側が母語別データを注入。未注入=非表示) ──
export {
  GrammarGuideProvider, useGrammarGuide,
  type GuideBlock, type GrammarGuideData, type GrammarGuideByLang,
} from './grammarGuide';

// ── AppShell (Provider 群で包んでマウントする) ──
export { AppShell, type AppShellProps } from './AppShell';

// ── 画面 (個別利用する場合のみ。通常は AppShell 経由) ──
export { default as HomeScreen } from './screens/HomeScreen';
export { default as ListenSourceScreen } from './screens/ListenSourceScreen';
export { default as ThemeScreen } from './screens/ThemeScreen';
export { default as LevelScreen } from './screens/LevelScreen';
export { default as PracticeScreen } from './screens/PracticeScreen';
export { default as ListeningScreen } from './screens/ListeningScreen';
export { default as VocabCategoryScreen } from './screens/VocabCategoryScreen';
export { default as VocabDirectionScreen } from './screens/VocabDirectionScreen';
export { default as FlashcardScreen } from './screens/FlashcardScreen';
export { default as SettingsScreen } from './screens/SettingsScreen';
export { default as PaywallScreen } from './screens/PaywallScreen';
export { default as GrammarGuideScreen } from './screens/GrammarGuideScreen';
