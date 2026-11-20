import { readFile } from 'node:fs/promises';
import { validateAnnouncement } from './protocol.mjs';

const url = 'https://safa-nepali-notices.safa-co-official.workers.dev/v1/admin/announcements';
const [, , mode, file] = process.argv;

try {
  if (!['--preview', '--publish', '--status'].includes(mode)) {
    throw Error('Use --preview FILE, --publish FILE, or --status');
  }
  const message = mode !== '--status'
    ? validateAnnouncement(JSON.parse(file ? await readFile(file, 'utf8') : process.env.NEPALI_ANNOUNCEMENT_JSON ?? ''))
    : null;
  if (mode === '--preview') {
    console.log(JSON.stringify(message, null, 2));
  } else {
    const secret = process.env.NEPALI_NOTICE_ADMIN_TOKEN;
    if (!secret) throw Error('NEPALI_NOTICE_ADMIN_TOKEN is required');
    const response = await fetch(url, {
      method: message ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: message ? JSON.stringify(message) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw Error('HTTP ' + response.status + (error?.error ? ' · ' + error.error : ''));
    }
    console.log(JSON.stringify(await response.json(), null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
