// A small semantic palette, selectable by downloaded lesson data.
// Missing/unknown metadata retains the existing reader appearance.
export const guidePalettes = {
  blue:   { accent: '#2563eb', ink: '#1e3a8a', soft: '#eff6ff', line: '#bfdbfe' },
  green:  { accent: '#047857', ink: '#064e3b', soft: '#ecfdf5', line: '#a7f3d0' },
  violet: { accent: '#7c3aed', ink: '#4c1d95', soft: '#f5f3ff', line: '#ddd6fe' },
  rose:   { accent: '#be123c', ink: '#881337', soft: '#fff1f2', line: '#fecdd3' },
  teal:   { accent: '#0f766e', ink: '#134e4a', soft: '#f0fdfa', line: '#99f6e4' },
} as const;

export type GuideTone = keyof typeof guidePalettes;
export type GuidePresentation = {
  tone: GuideTone;
  role?: 'plain' | 'body' | 'example' | 'reading' | 'translation' | 'step';
  join?: 'start' | 'middle' | 'end';
  rowTones?: GuideTone[];
};

export function guidePalette(tone: unknown) {
  return typeof tone === 'string' && Object.prototype.hasOwnProperty.call(guidePalettes, tone)
    ? guidePalettes[tone as GuideTone] : undefined;
}

export function guideStep(text: string): { number: string; text: string } | null {
  const match = text.match(/^\*\*([1-9]\d?)\*\*\s+(.+)$/s);
  return match ? { number: match[1], text: match[2] } : null;
}
