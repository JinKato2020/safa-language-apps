import {
  announcementId, languages, validExpoToken, validateAnnouncement,
} from './protocol.mjs';

const minute = 60_000;
const day = 1_440 * minute;
const json = (data, status = 200) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const rebind = (db, sql, ...args) => db.prepare(sql).bind(...args);

class InvalidRequest extends Error {}

async function readJson(request) {
  if (!request.body) throw new InvalidRequest('Expected JSON');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 24_000) {
      await reader.cancel();
      throw new InvalidRequest('Request is too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  try { return JSON.parse(text + decoder.decode()); }
  catch { throw new InvalidRequest('Invalid JSON'); }
}

const hash = async text => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
async function authorized(request, secret) {
  if (!secret) return false;
  const [provided, expected] = await Promise.all([
    hash(request.headers.get('Authorization') ?? ''), hash('Bearer ' + secret),
  ]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= provided[i] ^ expected[i];
  return difference === 0;
}

async function subscriptions(request, env) {
  const secret = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization') ?? '')?.[1];
  if (!secret) return json({ error: 'Unauthorized' }, 401);
  const installation = Array.from(await hash(secret), byte => byte.toString(16).padStart(2, '0')).join('');
  const db = env.DB;
  if (request.method === 'DELETE') {
    await rebind(db, 'DELETE FROM subscriptions WHERE installation = ?', installation).run();
    return new Response(null, { status: 204 });
  }
  const body = await readJson(request);
  if (!validExpoToken(body?.token) || !languages.includes(body?.lang)) {
    throw new InvalidRequest('Invalid subscription');
  }
  if (!env.EXPO_ACCESS_TOKEN) return json({ error: 'Push service is not configured' }, 503);
  const now = Date.now();
  await db.batch([
    rebind(db, 'DELETE FROM subscriptions WHERE token = ? AND installation <> ?', body.token, installation),
    rebind(db, `INSERT INTO subscriptions(installation, token, lang, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(installation) DO UPDATE SET token = excluded.token, lang = excluded.lang, updated_at = excluded.updated_at
      WHERE subscriptions.token <> excluded.token OR subscriptions.lang <> excluded.lang OR subscriptions.updated_at < ?`,
    installation, body.token, body.lang, now, now - day),
  ]);
  return new Response(null, { status: 204 });
}

async function listAnnouncements(request, db) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const lang = url.searchParams.get('lang');
  if (id && !announcementId.test(id)) throw new InvalidRequest('Invalid announcement ID');
  const rows = id
    ? await rebind(db, 'SELECT id, translations, published_at FROM announcements WHERE id = ?', id).all()
    : await db.prepare('SELECT id, translations, published_at FROM announcements ORDER BY published_at DESC, id LIMIT 50').all();
  const response = json({ items: rows.results.map(row => {
    const translations = JSON.parse(row.translations);
    const { title, body } = translations[languages.includes(lang) ? lang : 'ja'];
    return { id: row.id, publishedAt: row.published_at, title, body };
  }) });
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

async function admin(request, env) {
  if (!await authorized(request, env.ADMIN_TOKEN)) return json({ error: 'Unauthorized' }, 401);
  if (request.method === 'GET') {
    const results = await env.DB.prepare(`SELECT id, state, accepted, rejected, last_error, published_at
      FROM announcements ORDER BY published_at DESC LIMIT 50`).all();
    return json({ items: results.results });
  }
  const body = await readJson(request);
  let message;
  try { message = validateAnnouncement(body); }
  catch (error) { throw new InvalidRequest(error.message); }
  if (message.push && !env.EXPO_ACCESS_TOKEN) return json({ error: 'Push service is not configured' }, 503);
  const { meta } = await rebind(env.DB, `INSERT OR IGNORE INTO announcements(id, translations, published_at, state, audience_end)
    VALUES (?, ?, ?, ?, COALESCE((SELECT MAX(seq) FROM subscriptions), 0))`,
  message.id, JSON.stringify(message.translations), Date.now(), message.push ? 'queued' : 'article').run();
  if (!meta.changes) return json({ error: 'This announcement ID already exists' }, 409);
  return json({ id: message.id, state: message.push ? 'queued' : 'article' }, 201);
}

async function expo(env, method, body) {
  const response = await fetch('https://exp.host/--/api/v2/push/' + method, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.EXPO_ACCESS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error('Expo HTTP ' + response.status);
  const result = await response.json();
  if (!result.data) throw new Error('Invalid Expo response');
  return result.data;
}

async function sendBatch(env, now) {
  const db = env.DB;
  const job = await rebind(db, `UPDATE announcements SET lease_until = ?
    WHERE id = (SELECT id FROM announcements WHERE state = 'queued' AND lease_until <= ? ORDER BY published_at LIMIT 1)
    RETURNING id, translations, published_at, cursor, audience_end`, now + 2 * minute, now).first();
  if (!job) return false;
  const stop = (state, reason = null) => rebind(db, 'UPDATE announcements SET state = ?, last_error = COALESCE(?, last_error) WHERE id = ?', state, reason, job.id).run();
  if (job.published_at < now - day) {
    await stop('expired', 'The delivery window has ended');
    return true;
  }
  const { results: devices } = await rebind(db, `SELECT seq, token, lang FROM subscriptions
    WHERE seq > ? AND seq <= ? ORDER BY seq LIMIT 100`, job.cursor, job.audience_end).all();
  if (!devices.length) {
    await stop('accepted');
    return true;
  }
  const translations = JSON.parse(job.translations);
  try {
    const tickets = await expo(env, 'send', devices.map(({ token, lang }) => {
      const { title, pushBody } = translations[lang];
      return { to: token, title, body: pushBody, channelId: 'announcements',
        sound: 'default', ttl: 86_400, data: { announcementId: job.id } };
    }));
    if (!Array.isArray(tickets) || tickets.length !== devices.length) throw new Error('Invalid ticket count');
    if (tickets.some(t => t.details?.error === 'InvalidCredentials' || t.details?.error === 'MismatchSenderId')) {
      // Continue processing valid tickets. Record the credential failure for the operator.
      await rebind(db, 'UPDATE announcements SET last_error = ? WHERE id = ?', 'Some deliveries failed provider credential checks', job.id).run();
    }
    const accepted = [];
    const dead = [];
    for (const [i, ticket] of tickets.entries()) {
      if (ticket.status === 'ok' && typeof ticket.id === 'string') {
        accepted.push([ticket.id, devices[i].token]);
      } else if (ticket.details?.error === 'DeviceNotRegistered') {
        dead.push(devices[i].token);
      }
    }
    await db.batch([
      rebind(db, `INSERT OR IGNORE INTO receipts(ticket, announcement, token, due_at, expires_at)
        SELECT json_extract(value,'$[0]'), ?, json_extract(value,'$[1]'), ?, ? FROM json_each(?)`,
      job.id, now + 15 * minute, now + day, JSON.stringify(accepted)),
      rebind(db, 'DELETE FROM subscriptions WHERE token IN (SELECT value FROM json_each(?))', JSON.stringify(dead)),
      rebind(db, `UPDATE announcements SET cursor = ?, lease_until = 0,
        accepted = accepted + ?, rejected = rejected + ? WHERE id = ?`,
      devices.at(-1).seq, accepted.length, devices.length - accepted.length, job.id),
    ]);
    return true;
  } catch (error) {
    const reason = /^Expo HTTP \d{3}$/.test(error.message) ? error.message : 'Push gateway or storage error';
    await rebind(db, 'UPDATE announcements SET lease_until = ?, last_error = ? WHERE id = ?', now + 5 * minute, reason, job.id).run();
    return false;
  }
}

async function checkReceipts(env, now) {
  const db = env.DB;
  await rebind(db, 'DELETE FROM receipts WHERE expires_at <= ?', now).run();
  const { results } = await rebind(db, 'SELECT ticket, announcement, token FROM receipts WHERE due_at <= ? ORDER BY due_at LIMIT 300', now).all();
  if (!results.length) return;
  const receipts = await expo(env, 'getReceipts', { ids: results.map(r => r.ticket) });
  const delivered = [];
  const pending = [];
  const dead = [];
  const failures = new Map();
  for (const row of results) {
    const receipt = receipts[row.ticket];
    (receipt ? delivered : pending).push(row.ticket);
    if (receipt?.status === 'error') {
      if (receipt.details?.error === 'DeviceNotRegistered') {
        dead.push(row.token);
      }
      const error = String(receipt.details?.error ?? '');
      failures.set(row.announcement, [(failures.get(row.announcement)?.[0] ?? 0) + 1, /^[A-Za-z]+$/.test(error) ? error.slice(0, 80) : 'DeliveryError']);
    }
  }
  await db.batch([
    rebind(db, 'DELETE FROM receipts WHERE ticket IN (SELECT value FROM json_each(?))', JSON.stringify(delivered)),
    rebind(db, 'UPDATE receipts SET due_at = ? WHERE ticket IN (SELECT value FROM json_each(?))', now + 15 * minute, JSON.stringify(pending)),
    rebind(db, 'DELETE FROM subscriptions WHERE token IN (SELECT value FROM json_each(?))', JSON.stringify(dead)),
    rebind(db, `WITH failures AS (
        SELECT key AS id, json_extract(value,'$[0]') AS count, json_extract(value,'$[1]') AS error FROM json_each(?)
      )
      UPDATE announcements SET accepted = accepted - failures.count, rejected = rejected + failures.count, last_error = failures.error
      FROM failures WHERE announcements.id = failures.id`, JSON.stringify(Object.fromEntries(failures))),
  ]);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path === '/v1/announcements' && request.method === 'GET') return await listAnnouncements(request, env.DB);
      if (path === '/v1/subscription' && ['PUT', 'DELETE'].includes(request.method)) {
        const address = request.headers.get('CF-Connecting-IP');
        if (address && env.REGISTRATION_LIMIT && !(await env.REGISTRATION_LIMIT.limit({ key: address })).success) {
          return json({ error: 'Retry later' }, 429);
        }
        return await subscriptions(request, env);
      }
      if (path === '/v1/admin/announcements' && ['GET', 'POST'].includes(request.method)) return await admin(request, env);
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      if (error instanceof InvalidRequest) return json({ error: error.message }, 400);
      return json({ error: 'Service unavailable' }, 503);
    }
  },
  async scheduled(event, env) {
    if (!env.EXPO_ACCESS_TOKEN) return;
    const now = event.scheduledTime;
    for (let i = 0; i < 3 && await sendBatch(env, now); i++) { /* Up to 300 devices per minute. */ }
    await checkReceipts(env, now);
  },
};
