// Production OTA work, real ZIP/hash algorithms. Desktop timing is not iPhone timing.
const fs = require('fs'), path = require('path'), vm = require('vm'), ts = require('typescript');
const assert = require('assert/strict'), crypto = require('crypto'), { performance } = require('perf_hooks');
const { zipSync } = require('fflate');
const dir = path.resolve(__dirname, '../expo-app/src/content');
function load(name, req, globals = {}) {
  const m = { exports: {} }, source = fs.readFileSync(path.join(dir, name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + js + '})', { console, Uint8Array, Date, setTimeout, clearTimeout, global: { atob, btoa }, ...globals })(req, m, m.exports);
  return m.exports;
}
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function schedulerChecks() {
  let now = 0, id = 0, calls = 0, active = true, fail = false;
  const timers = new Map();
  const schedule = load('otaSchedule', require, {
    Date: { now: () => now },
    setTimeout: (cb, ms) => { timers.set(++id, { cb, at: now + ms }); return id; },
    clearTimeout: n => timers.delete(n),
  });
  const advance = async ms => {
    now += ms;
    for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.cb(); }
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  const task = schedule.scheduleContentUpdates(async () => { calls++; if (fail) throw Error('offline'); }, () => active);
  await advance(1499); assert.equal(calls, 0);
  await advance(1); assert.equal(calls, 1);
  await advance(60 * 60_000); assert.equal(calls, 1, 'no periodic checks during study');
  task.foreground(); await advance(1500); assert.equal(calls, 2);
  task.foreground(); await advance(5 * 60_000); assert.equal(calls, 2, 'recent foreground skips check');
  await advance(30 * 60_000); fail = true; task.foreground(); await advance(1500); assert.equal(calls, 3);
  await advance(60_000); assert.equal(calls, 4, 'failed check retries');
  active = false; await advance(60_000); assert.equal(calls, 4, 'no work in background');
  active = true; fail = false; task.foreground(); await advance(1500); assert.equal(calls, 5);
  task.stop(); await advance(60 * 60_000); task.foreground(); await advance(1500); assert.equal(calls, 5);
}
async function main() {
  await schedulerChecks();
  const entries = {}, expected = {}, written = new Map();
  for (let i = 0; i < 2328; i++) {
    const name = `${i + 1}-1.mp3`, bytes = crypto.randomBytes(17000);
    entries[name] = bytes; expected[name] = { bytes: bytes.length, sha256: sha(bytes) };
  }
  const zip = zipSync(entries, { level: 0 });
  const archive = { sha256: sha(zip), bytes: zip.length, url: 'https://example.test/audio.zip' };
  let maxRead = 0, diskReads = 0;
  const disk = {
    EncodingType: { Base64: 'base64' },
    getInfoAsync: async () => ({ exists: true, size: zip.length }),
    readAsStringAsync: async (_, opts) => {
      assert(Number.isInteger(opts.length), 'archive reads must be bounded');
      maxRead = Math.max(maxRead, opts.length); diskReads++;
      return Buffer.from(zip.subarray(opts.position, opts.position + opts.length)).toString('base64');
    },
    writeAsStringAsync: async (uri, encoded) => written.set(uri, Buffer.from(encoded, 'base64')),
  };
  const work = load('otaWork', n => n === 'expo-file-system/legacy' ? disk : require(n));
  const b64 = Buffer.from(zip).toString('base64'), before = performance.now();
  // Exact 2.1.12 conversion, included as a repeatable baseline.
  const oldBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const oldBlockingMs = performance.now() - before; assert.equal(sha(oldBytes), archive.sha256);
  let last = performance.now(), maxEventLoopGapMs = 0, heartbeats = 0;
  const heartbeat = setInterval(() => { const now = performance.now(); maxEventLoopGapMs = Math.max(maxEventLoopGapMs, now - last); last = now; heartbeats++; }, 5);
  const start = performance.now();
  const result = await work.extractAudio('archive.zip', archive, expected, new Set(Object.keys(expected)), hash => 'audio/' + hash);
  await new Promise(resolve => setTimeout(resolve, 10)); clearInterval(heartbeat);
  const streamingMs = performance.now() - start;
  assert.equal(Object.keys(result).length, 2328); assert.equal(maxRead, 32768); assert(heartbeats > 20);
  for (const [name, uri] of Object.entries(result)) assert.deepEqual(written.get(uri), entries[name]);
  assert(maxEventLoopGapMs < 250, `Unexpected long JS stall: ${maxEventLoopGapMs}ms`);
  await assert.rejects(work.extractAudio('archive.zip', { ...archive, sha256: '0'.repeat(64) }, expected, new Set(), x => x), /checksum/);
  await assert.rejects(work.extractAudio('archive.zip', archive, { ...expected, '1-1.mp3': { ...expected['1-1.mp3'], sha256: '0'.repeat(64) } }, new Set(['1-1.mp3']), x => x), /checksum/);
  const text = 'ネパール語 नमस्ते 😀'.repeat(90000);
  assert.equal(await work.hashText(text), sha(text), 'incremental UTF-8 hashing preserves surrogate pairs');
  // Exercise DEFLATE and streaming boundaries too; downloaded audio can use either method.
  const smallZip = zipSync({ '1-1.mp3': entries['1-1.mp3'] });
  const smallDisk = { ...disk, getInfoAsync: async () => ({ exists: true, size: smallZip.length }), readAsStringAsync: async (_, o) => Buffer.from(smallZip.subarray(o.position, o.position + o.length)).toString('base64') };
  const smallWork = load('otaWork', n => n === 'expo-file-system/legacy' ? smallDisk : require(n));
  await smallWork.extractAudio('deflate.zip', { ...archive, bytes: smallZip.length, sha256: sha(smallZip) }, expected, new Set(['1-1.mp3']), x => x);
  const report = { scope: 'Desktop Node; actual production OTA functions with in-memory filesystem, not native iPhone timing', files: 2328, archiveBytes: zip.length, oldBlockingDecodeMs: Math.round(oldBlockingMs), newMaximumEventLoopGapMs: Math.round(maxEventLoopGapMs), newTotalStreamingMs: Math.round(streamingMs), maxArchiveReadBytes: maxRead, diskReads, heartbeats, scheduler: 'launch/eligible foreground only; no study polling; retry/background/stop passed', checksums: 'full archive, per-file, UTF-8 and DEFLATE passed' };
  console.log(JSON.stringify(report, null, 2));
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
