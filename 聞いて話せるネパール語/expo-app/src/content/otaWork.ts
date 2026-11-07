import * as FS from 'expo-file-system/legacy';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { Unzip, UnzipInflate } from 'fflate';
import type { AudioFile, ContentFile } from './otaModel';

// A Promise alone does not yield to touch events. Give the JS event loop a turn
// at least every small work slice, including when file APIs resolve immediately.
export function workBudget() {
  let start = Date.now();
  return async () => {
    if (Date.now() - start < 6) return;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    start = Date.now();
  };
}

export async function hashText(text: string): Promise<string> {
  const hash = sha256.create(), yieldWork = workBudget();
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + 16384, text.length);
    // Do not split a Unicode surrogate pair across UTF-8 encoder calls.
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    hash.update(text.slice(start, end)); start = end; await yieldWork();
  }
  return bytesToHex(hash.digest());
}

function decode64(text: string): Uint8Array {
  const binary = (global as any).atob(text), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encode64(bytes: Uint8Array): Promise<string> {
  const pieces: string[] = [], yieldWork = workBudget();
  // Multiples of three can be encoded independently without internal padding.
  for (let i = 0; i < bytes.length; i += 12288) {
    pieces.push((global as any).btoa(String.fromCharCode(...bytes.subarray(i, i + 12288))));
    await yieldWork();
  }
  return pieces.join('');
}

/** Stream one ZIP from disk. Never materialize a whole archive/base64 string in JS. */
export async function extractAudio(
  uri: string, archive: ContentFile, expected: Record<string, AudioFile>,
  wanted: Set<string>, destination: (sha: string) => string,
): Promise<Record<string, string>> {
  const info = await FS.getInfoAsync(uri);
  if (!info.exists || info.size !== archive.bytes) throw new Error('Audio archive size mismatch');
  const hash = sha256.create(), yieldWork = workBudget(), files: Record<string, string> = {};
  const completed: { name: string; bytes: Uint8Array }[] = [];
  const seen = new Set<string>();
  let failure: Error | undefined;
  const unzip = new Unzip(file => {
    if (!wanted.has(file.name)) {
      // fflate retains compressed chunks until start() is called. Consume and
      // discard unwanted entries too, rather than buffering the rest of a ZIP.
      file.ondata = error => { if (error) failure = error; };
      file.start(); return;
    }
    const entry = expected[file.name];
    if (!entry || seen.has(file.name) || (file.originalSize != null && file.originalSize !== entry.bytes)) {
      failure = new Error('Invalid audio entry: ' + file.name); return;
    }
    seen.add(file.name);
    const bytes = new Uint8Array(entry.bytes); let offset = 0;
    file.ondata = (error, chunk, final) => {
      if (error) { failure = error; return; }
      if (offset + chunk.length > bytes.length) { failure = new Error('Audio entry exceeds expected size'); return; }
      bytes.set(chunk, offset); offset += chunk.length;
      if (final) {
        if (offset !== bytes.length) failure = new Error('Truncated audio entry');
        else completed.push({ name: file.name, bytes });
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  for (let position = 0; position < archive.bytes; position += 32768) {
    const length = Math.min(32768, archive.bytes - position);
    const bytes = decode64(await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64, position, length }));
    if (bytes.length !== length) throw new Error('Truncated audio archive');
    hash.update(bytes); unzip.push(bytes, position + length === archive.bytes);
    if (failure) throw failure;
    await yieldWork();
    for (const entry of completed.splice(0)) {
      const digest = sha256.create();
      for (let i = 0; i < entry.bytes.length; i += 32768) { digest.update(entry.bytes.subarray(i, i + 32768)); await yieldWork(); }
      if (bytesToHex(digest.digest()) !== expected[entry.name].sha256) throw new Error('Audio entry checksum mismatch');
      const target = destination(expected[entry.name].sha256);
      await FS.writeAsStringAsync(target, await encode64(entry.bytes), { encoding: FS.EncodingType.Base64 });
      files[entry.name] = target;
    }
  }
  // Files are immutable and individually verified, but never activate the index
  // until the complete archive hash also matches. Failed staging is reusable.
  if (bytesToHex(hash.digest()) !== archive.sha256) throw new Error('Audio checksum mismatch');
  return files;
}
