import type { GrammarThemeMeta } from './types';

/** Pack labels are shared by the list, reader, practice and listening screens. */
export function grammarThemeLabel(themes: GrammarThemeMeta[], id: number, fallback: string): string {
  return themes.find(theme => theme.id === id)?.name || fallback;
}

export function withoutThemePrefix(label: string): string {
  return label.replace(
    /^(?:テーマ|Theme|테마|الموضوع)\s*[0-9٠-٩۰-۹]+\s*(?:[（(]([^）)]+)[）)])?\s*[｜|:：]\s*/i,
    (_, appendix: string | undefined) => appendix ? `${appendix}｜` : '',
  );
}
