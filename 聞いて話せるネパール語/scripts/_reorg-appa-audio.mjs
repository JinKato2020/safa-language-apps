// App A 音声を 聞いて話せるネパール語/audio/<lang>/{conv,gram}/ に統一(move)。
//  ne(対象,同梱)=expo-app/assets/audio/{nepali,nepali-grammar} → audio/ne/{conv,gram}
//  ja/en(母語pack)=packs-nepali/audio/{ja,en} を id形式で分割 (T-L-i=conv / T-i=gram)
//  会話id=theme-level-index(3部), 文法id=theme-index(2部)。
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');     // 聞いて話せるネパール語
const REPO = path.resolve(ROOT, '..');                                            // シリーズ root
const AUDIO = path.join(ROOT, 'audio');
const mk = d => fs.mkdirSync(d, { recursive: true });
const isConv = f => f.replace(/\.mp3$/, '').split('-').length === 3; // T-L-i
function moveAll(srcDir, dstConv, dstGram, splitById) {
  if (!fs.existsSync(srcDir)) { console.log('  (skip, no src)', srcDir); return [0, 0]; }
  let c = 0, g = 0;
  for (const f of fs.readdirSync(srcDir)) {
    if (!f.endsWith('.mp3')) continue;
    const toGram = splitById ? !isConv(f) : false;
    const dst = path.join(toGram ? dstGram : dstConv, f);
    fs.renameSync(path.join(srcDir, f), dst);
    if (toGram) g++; else c++;
  }
  return [c, g];
}
for (const lang of ['ne', 'ja', 'en']) for (const m of ['conv', 'gram']) mk(path.join(AUDIO, lang, m));
// ne: 同梱(assets)から。conv と gram は別ディレクトリなので splitById 不要。
const [neC] = moveAll(path.join(ROOT, 'expo-app/assets/audio/nepali'), path.join(AUDIO, 'ne/conv'), path.join(AUDIO, 'ne/gram'), false);
const [, neGtmp] = [0, 0];
const neG = (() => { let g = 0; const src = path.join(ROOT, 'expo-app/assets/audio/nepali-grammar'); if (fs.existsSync(src)) for (const f of fs.readdirSync(src)) if (f.endsWith('.mp3')) { fs.renameSync(path.join(src, f), path.join(AUDIO, 'ne/gram', f)); g++; } return g; })();
// ja/en: pack(混在)を id形式で分割。
const [jaC, jaG] = moveAll(path.join(REPO, 'packs-nepali/audio/ja'), path.join(AUDIO, 'ja/conv'), path.join(AUDIO, 'ja/gram'), true);
const [enC, enG] = moveAll(path.join(REPO, 'packs-nepali/audio/en'), path.join(AUDIO, 'en/conv'), path.join(AUDIO, 'en/gram'), true);
console.log(`ne: conv ${neC} / gram ${neG}`);
console.log(`ja: conv ${jaC} / gram ${jaG}`);
console.log(`en: conv ${enC} / gram ${enG}`);
console.log('期待: ne conv1800/gram600, ja conv1800/gram600, en conv1800/gram600');
