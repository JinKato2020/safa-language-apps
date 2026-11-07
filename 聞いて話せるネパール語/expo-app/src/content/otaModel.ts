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
  if (overlay.learningPathV3) {
    const p=overlay.learningPathV3;
    if (!Array.isArray(p.steps) || p.steps.length!==core.grammarThemes.length || !p.exercises) throw new Error('Missing grammar practice');
    for (const theme of core.grammarThemes) {
      const step=p.steps.find((s: any)=>s.guideThemeId===theme.id);
      if (step?.items?.length!==20 || new Set(step.items.map((r: any)=>r.exerciseId)).size!==20) throw new Error('Missing practice theme');
      for (const ref of step.items) {
        const e=p.exercises[ref.exerciseId],q=e?.selection;
        if (!e || e.ne!==ref.ne || !e.jp || !Array.isArray(e.words) || !e.words.length || !e.words.every((w: any)=>w.text&&w.roman&&w.meaning)) throw new Error('Invalid practice words');
        if (!q || !Number.isInteger(q.wordIndex) || !e.words[q.wordIndex] || !q.rule || !q.prompt || !Array.isArray(q.options) || q.options.length!==3 || new Set(q.options.map((o: any)=>o.form)).size!==3 || q.options.filter((o: any)=>o.form===(q.answer??e.words[q.wordIndex].text)).length!==1) throw new Error('Invalid form exercise');
        if ((q.prefix??'')+(q.answer??e.words[q.wordIndex].text)!==e.words[q.wordIndex].text) throw new Error('Invalid cloze reconstruction');
        if (!Array.isArray(e.meaningChoices) || new Set(e.meaningChoices).size!==e.meaningChoices.length || !e.meaningChoices.includes(e.jp) || e.meaningChoices.length<2) throw new Error('Invalid meaning exercise');
        assertFile(e.audio);
      }
    }
  }
  if (overlay.lettersSounds) {
    const l=overlay.lettersSounds;
    if (!Array.isArray(l.sections) || !l.sections.length || !Array.isArray(l.combinations) || l.combinations.length!==33) throw new Error('Invalid letters course');
    for (const row of l.combinations) if (!row.consonant || !Array.isArray(row.samples) || row.samples.length!==11) throw new Error('Incomplete vowel combinations');
    for (const section of l.sections) if (!section.id || !section.title || !section.body || !Array.isArray(section.samples)) throw new Error('Invalid letters section');
    for (const s of [...l.sections.flatMap((b: any)=>b.samples),...l.combinations.flatMap((r: any)=>r.samples)]) {
      if (!s.id || !s.ne || !s.roman || !s.meaning || (s.speech && !s.audio)) throw new Error('Invalid letter sample');
      if (s.audio) assertFile(s.audio);
    }
  }
}
