// 文法モードの「教材(ルール解説)」データ。アプリ側が母語別データを注入する。
// 未注入(App B/C)や未対応言語では教材ボタンを出さない=影響なし。
import { createContext, useContext, type ReactNode } from 'react';
import { useAppData } from './AppDataContext';
import type { GuidePresentation } from './grammarPresentation';

// アプリが描画する構造化ブロック
export type GuideBlock = (
  | { type: 'goal'; text: string }
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
) & { presentation?: GuidePresentation };

// テーマid("1".."30") → ブロック列
export type GrammarGuideData = Record<string, GuideBlock[]>;
// 母語(L1)別。例: { ja: {...} }。未対応言語は教材ボタン非表示。
export type GrammarGuideByLang = Record<string, GrammarGuideData>;

const GrammarGuideContext = createContext<GrammarGuideByLang | null>(null);

export function GrammarGuideProvider({ value, children }: { value?: GrammarGuideByLang | null; children: ReactNode }) {
  return <GrammarGuideContext.Provider value={value ?? null}>{children}</GrammarGuideContext.Provider>;
}

// 文法教材データ(無ければ null = 教材ボタン非表示)。
// v2: OTA配信。composeがoverlay.grammarGuideをL1解決してAppData.GRAMMAR_GUIDEに載せる。
export function useGrammarGuide(): GrammarGuideData | null {
  const d = useAppData();
  return ((d as { GRAMMAR_GUIDE?: GrammarGuideData | null }).GRAMMAR_GUIDE) ?? null;
}
