// App A 新テーマ大改定の再公開: ja/en の overlay(本文+辞書) と audio(新文) を版+1。
//  overlays/{l1}.json を packs-nepali/overlay-{l1}-v{N+1}.json に minify出力、packs-nepali/audio/{l1} を audio-{l1}-v{M+1}.zip(STORED) に再zip、catalog更新。
import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url'; import path from 'node:path';
import { zipSync } from 'fflate';
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'expo-app');
const repoRoot = path.resolve(appDir, '..', '..');                 // 聞いて話せるシリーズ
const overlaysDir = path.join(appDir, 'data', 'overlays');
const packsDir = path.join(repoRoot, 'packs-nepali');
const catalogPath = path.join(packsDir, 'catalog.json');
const RAW = 'https://raw.githubusercontent.com/JinKato2020/safa-language-apps/refs/heads/experiment/bangla/packs-nepali';
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
function bumpOverlay(l1, v) {
  const op = path.join(overlaysDir, `${l1}.json`);
  const o = JSON.parse(readFileSync(op, 'utf8'));
  o.version = v;
  writeFileSync(op, JSON.stringify(o, null, 2), 'utf8');
  const name = `overlay-${l1}-v${v}.json`;
  writeFileSync(path.join(packsDir, name), JSON.stringify(o), 'utf8');
  return { name, size: statSync(path.join(packsDir, name)).size };
}
// 音声ソースは統一レイアウト 聞いて話せるネパール語/audio/<lang>/{conv,gram}。conv+gram を1zipにフラット格納。
const audioRoot = path.join(repoRoot, '聞いて話せるネパール語', 'audio');
function rezip(l1, v) {
  const ent = {}; let n = 0;
  for (const mode of ['conv', 'gram']) {
    const dir = path.join(audioRoot, l1, mode);
    for (const f of readdirSync(dir)) if (f.endsWith('.mp3')) { ent[f] = new Uint8Array(readFileSync(path.join(dir, f))); n++; }
  }
  const name = `audio-${l1}-v${v}.zip`;
  const buf = zipSync(ent, { level: 0 });
  writeFileSync(path.join(packsDir, name), buf);
  return { name, bytes: buf.length, n };
}
for (const l1 of ['ja', 'en']) {
  const e = catalog.packs.find(p => p.l1 === l1);
  const newOver = (e.version ?? 1) + 1, newAudio = (e.audioVersion ?? 1) + 1;
  const o = bumpOverlay(l1, newOver);
  const a = rezip(l1, newAudio);
  e.version = newOver; e.url = `${RAW}/${o.name}`; e.sizeBytes = o.size;
  e.audioVersion = newAudio; e.audioZip = `${RAW}/${a.name}`; e.audioZipBytes = a.bytes;
  console.log(`${l1}: overlay v${newOver}(${(o.size / 1048576).toFixed(2)}MB) / audio v${newAudio}(${a.n}files ${(a.bytes / 1048576).toFixed(1)}MB)`);
}
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('App A catalog.json 更新完了 (ja/en overlay+audio 版+1)');
