// 文法モードの「教材(ルール解説)」データ。アプリ側が母語別データを注入する。
// 未注入(App B/C)や未対応言語では教材ボタンを出さない=影響なし。
import { createContext, useContext, type ReactNode } from 'react';
import { useI18n } from './i18n';

// アプリが描画する構造化ブロック
export type GuideBlock =
  | { type: 'goal'; text: string }
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

// テーマid("1".."30") → ブロック列
export type GrammarGuideData = Record<string, GuideBlock[]>;
// 母語(L1)別。例: { ja: {...} }。未対応言語は教材ボタン非表示。
export type GrammarGuideByLang = Record<string, GrammarGuideData>;

const GrammarGuideContext = createContext<GrammarGuideByLang | null>(null);

export function GrammarGuideProvider({ value, children }: { value?: GrammarGuideByLang | null; children: ReactNode }) {
  return <GrammarGuideContext.Provider value={value ?? null}>{children}</GrammarGuideContext.Provider>;
}

// 現在のUI言語に対応する教材データ(無ければ null = 教材ボタン非表示)。
export function useGrammarGuide(): GrammarGuideData | null {
  const byLang = useContext(GrammarGuideContext);
  const { lang } = useI18n();
  if (!byLang) return null;
  return byLang[lang] ?? null;
}
