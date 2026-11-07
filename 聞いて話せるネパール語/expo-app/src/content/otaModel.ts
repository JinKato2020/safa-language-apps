import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export type ContentFile = { sha256: string; bytes: number; url: string };
export type AudioFile = { sha256: string; md5: string; bytes: number };
export type AudioArchive = { version: number; zip: ContentFile; files: Record<string, AudioFile>; delta?: { base: number; zip: ContentFile } };
export type ContentManifest = { schema: 1; version: number; core: ContentFile; audio: AudioArchive; languages: Record<string, { overlay: ContentFile; guides: Record<string, ContentFile>; audio: AudioArchive }> };
export const contentHash = (value: string | Uint8Array) => bytesToHex(sha256(value));
export function assertFile(file: ContentFile) {
  if (!file || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.bytes) || file.bytes < 1 || !/^https:\/\//.test(file.url)) throw new Error('Invalid content file');
}
export function validateManifest(m: ContentManifest, lang: string): void {
  if (m?.schema !== 1 || !Number.isSafeInteger(m.version) || !m.languages?.[lang]) throw new Error('Unsupported content manifest');
  for (const file of textFiles(m, lang)) assertFile(file);
  for (const archive of [m.audio,m.languages[lang].audio]) {
    assertFile(archive.zip);
    if (!Number.isInteger(archive.version) || !Object.keys(archive.files).length) throw new Error('Missing audio index');
    for (const [name,file] of Object.entries(archive.files)) if (!/^\d+(?:-\d+){1,2}\.mp3$/.test(name) || !/^[a-f0-9]{64}$/.test(file.sha256) || !/^[a-f0-9]{32}$/.test(file.md5) || !Number.isSafeInteger(file.bytes) || file.bytes < 1) throw new Error('Invalid audio entry');
    if (archive.delta) assertFile(archive.delta.zip);
  }
}
export function textFiles(m: ContentManifest, lang: string): ContentFile[] {
  const l=m.languages[lang]; return [m.core,l.overlay,...Object.values(l.guides)];
}
export function validateContent(core: any, overlay: any, lang: string) {
  if (overlay.l1 !== lang || !Array.isArray(core.themes) || !core.themes.length || !Array.isArray(core.grammarThemes)) throw new Error('Invalid content language/structure');
  for (const [ne,l1] of [['examplesNe','examplesL1'],['grammarNe','grammarL1'],['wordsNe','wordsL1']]) {
    if (!core[ne] || !overlay[l1]) throw new Error('Missing content section');
    for (const [id,rows] of Object.entries(core[ne]) as [string,any][]) if (!Array.isArray(rows) || !Array.isArray(overlay[l1][id]) || rows.length !== overlay[l1][id].length || !rows.every((s: any,i: number)=>typeof s==='string' && s && typeof overlay[l1][id][i]==='string' && overlay[l1][id][i])) throw new Error('Content/translation mismatch: '+id);
  }
  for (const theme of core.grammarThemes) if (!Array.isArray(overlay.grammarGuide?.[theme.id]) || !overlay.grammarThemeNames?.[theme.id]) throw new Error('Missing grammar guide');
}
