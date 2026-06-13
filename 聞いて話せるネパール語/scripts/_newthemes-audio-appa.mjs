// App A 新テーマ(2/14/15)の音声を確定声で生成。
//  ne(目標,同梱)=Azure Hemkala / ja(pack)=Neural2-B+SSML / en(pack)=Neural2-F+SSML。
//  本文: ne=examples.json.ne, ja=examples.json.jp, en=overlays/en.json examplesL1。
//  SSMLピンポイント: scripts/_newthemes_ssml.json (ja/en)。
//  usage: node scripts/_newthemes-audio-appa.mjs <ne|ja|en|all>
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');     // 聞いて話せるネパール語
const REPO = path.resolve(ROOT, '..');
const env = {}; for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
// App A の .env に Azure鍵が無い場合は App B(聞いて話せる日本語)の .env からフォールバック取得。
const envB = {}; try { for (const l of fs.readFileSync(path.join(REPO, '聞いて話せる日本語/.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/); if (m) envB[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch {}
const GKEY = env.VITE_GOOGLE_TTS_API_KEY, AKEY = env.AZURE_SPEECH_KEY || envB.AZURE_SPEECH_KEY, AREG = env.AZURE_SPEECH_REGION || envB.AZURE_SPEECH_REGION;
const GEP = 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + GKEY;
const AEP = `https://${AREG}.tts.speech.microsoft.com/cognitiveservices/v1`;
const THEMES = [2, 14, 15], LEVELS = [1, 2, 3];
const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'expo-app/data/examples.json'), 'utf8'));
const ovEn = JSON.parse(fs.readFileSync(path.join(ROOT, 'expo-app/data/overlays/en.json'), 'utf8'));
const _ssmlPath = path.join(ROOT, 'scripts/_newthemes_ssml.json');
const ssml = fs.existsSync(_ssmlPath) ? JSON.parse(fs.readFileSync(_ssmlPath, 'utf8')) : { ja: {}, en: {} };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function buildSsmlBody(text, lang) {
  const picks = (ssml[lang] || {})[text];
  let s = esc(text);
  if (picks && picks.length) for (const p of picks) { const w = esc(p.word); s = s.split(w).join(`<sub alias="${esc(p.reading)}">${w}</sub>`); }
  return { body: s, hasPicks: !!(picks && picks.length) };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const GVOICE = { ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' }, en: { languageCode: 'en-US', name: 'en-US-Neural2-F' } };
async function gSyn(text, lang) {
  const { body, hasPicks } = buildSsmlBody(text, lang);
  const input = hasPicks ? { ssml: `<speak>${body}</speak>` } : { text };
  for (let a = 1; a <= 6; a++) {
    try {
      const r = await fetch(GEP, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input, voice: GVOICE[lang], audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 } }) });
      if (r.status === 429) { await sleep(3000 * a); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
      return Buffer.from((await r.json()).audioContent, 'base64');
    } catch (e) { if (a < 6) await sleep(2500 * a); else throw e; }
  }
}
async function aSyn(text) {
  const x = `<speak version="1.0" xml:lang="ne-NP"><voice name="ne-NP-HemkalaNeural"><prosody rate="-5%">${esc(text)}</prosody></voice></speak>`;
  for (let a = 1; a <= 6; a++) {
    try {
      const r = await fetch(AEP, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': AKEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'safa-tts' }, body: x });
      if (r.status === 429) { await sleep(3000 * a); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (a < 6) await sleep(2500 * a); else throw e; }
  }
}
// 統一レイアウト: 聞いて話せるネパール語/audio/<lang>/conv (本スクリプトは会話=convのみ生成)。
function dirOf(lang) {
  return path.join(ROOT, 'audio', lang, 'conv');
}
function itemsFor(lang) {
  const out = [];
  for (const t of THEMES) for (const lv of LEVELS) {
    const k = `${t}-${lv}`;
    const arr = lang === 'ne' ? ex[k].map(e => e.ne) : lang === 'ja' ? ex[k].map(e => e.jp) : ovEn.examplesL1[k];
    arr.forEach((text, i) => out.push({ id: `${k}-${i + 1}`, text }));
  }
  return out;
}
async function runLang(lang) {
  const dir = dirOf(lang); fs.mkdirSync(dir, { recursive: true });
  const items = itemsFor(lang);
  let ok = 0, fail = 0, n = 0;
  const CONC = lang === 'ne' ? 4 : 5;
  const q = [...items];
  async function worker() {
    while (q.length) {
      const it = q.pop();
      try { const b = lang === 'ne' ? await aSyn(it.text) : await gSyn(it.text, lang); fs.writeFileSync(path.join(dir, it.id + '.mp3'), b); ok++; }
      catch (e) { fail++; console.error('\nFAIL', lang, it.id, e.message); }
      if (++n % 30 === 0) process.stdout.write(`\r${lang}: ${n}/${items.length} (ok${ok} fail${fail})`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, () => worker()));
  console.log(`\n${lang} 完了: ${ok}成功 / ${fail}失敗 / 計${items.length}`);
}
const target = process.argv[2] || 'all';
const langs = target === 'all' ? ['ne', 'ja', 'en'] : [target];
for (const l of langs) await runLang(l);
console.log('App A 新テーマ音声 完了:', langs.join(','));
