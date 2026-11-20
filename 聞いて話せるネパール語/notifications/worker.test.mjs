import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from './worker.mjs';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return {
    prepare: sql => ({ bind: (...args) => prepared(sql, args), ...prepared(sql, []) }),
    batch: (statements) => {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  function prepared(sql, args) {
    const query = sqlite.prepare(sql);
    return {
      first: () => query.get(...args),
      all: () => ({ results: query.all(...args) }),
      run: () => ({ meta: query.run(...args) }),
    };
  }
}

test('only operators publish, device opt-out takes effect, and pushes use the saved language', async t => {
  const env = { DB: database(), ADMIN_TOKEN: 'admin-test', EXPO_ACCESS_TOKEN: 'expo-test' };
  const http = (path, method = 'GET', secret, body) => worker.fetch(new Request('https://test.example/v1/' + path, {
    method,
    headers: secret ? { Authorization: 'Bearer ' + secret } : {},
    body: body ? JSON.stringify(body) : undefined,
  }), env);
  const translations = Object.fromEntries(['ja', 'en', 'ko', 'ar'].map(lang => [lang, {
    title: lang + ' title', body: lang + ' article', pushBody: lang + ' push',
  }]));
  const message = { id: 'first-announcement', push: true, translations };
  assert.equal((await http('admin/announcements', 'POST', undefined, message)).status, 401);
  assert.equal((await http('admin/announcements', 'POST', env.ADMIN_TOKEN, { ...message, translations: {} })).status, 400);
  const first = 'a'.repeat(64);
  const second = 'b'.repeat(64);
  const late = 'c'.repeat(64);
  const token = 'ExponentPushToken[first_device]';
  assert.equal((await http('subscription', 'PUT', first, { token, lang: 'ja' })).status, 204);
  assert.equal((await http('subscription', 'PUT', first, { token, lang: 'ko' })).status, 204);
  assert.equal((await http('subscription', 'PUT', second, { token: 'ExpoPushToken[second_device]', lang: 'en' })).status, 204);
  assert.equal((await http('admin/announcements', 'POST', env.ADMIN_TOKEN, message)).status, 201);
  assert.equal((await http('admin/announcements', 'POST', env.ADMIN_TOKEN, message)).status, 409);
  assert.equal((await http('subscription', 'PUT', late, { token: 'ExpoPushToken[late_device]', lang: 'ja' })).status, 204);
  assert.equal((await http('subscription', 'DELETE', second)).status, 204);
  const inbox = await (await http('announcements?lang=ar&id=first-announcement')).json();
  assert.equal(inbox.items[0].body, 'ar article');
  assert.equal(inbox.items[0].id, message.id);
  assert.equal('pushBody' in inbox.items[0], false);

  const outbound = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer ' + env.EXPO_ACCESS_TOKEN);
    const body = JSON.parse(init.body);
    outbound.push({ url, body });
    return Response.json({ data: url.endsWith('/send')
      ? [{ id: 'ticket-one', status: 'ok' }]
      : { 'ticket-one': { status: 'error', details: { error: 'DeviceNotRegistered' } } } });
  });
  const now = Date.now();
  await worker.scheduled({ scheduledTime: now }, env);
  assert.deepEqual(outbound[0].body.map(({ to, title, body, data }) => ({ to, title, body, data })), [
    { to: token, title: 'ko title', body: 'ko push', data: { announcementId: message.id } },
  ]);
  assert.equal(outbound.length, 1);
  let status = await (await http('admin/announcements', 'GET', env.ADMIN_TOKEN)).json();
  assert.equal(status.items[0].state, 'accepted');
  assert.equal(status.items[0].accepted, 1);
  await worker.scheduled({ scheduledTime: now + 16 * 60_000 }, env);
  status = await (await http('admin/announcements', 'GET', env.ADMIN_TOKEN)).json();
  assert.equal(status.items[0].accepted, 0);
  assert.equal(status.items[0].rejected, 1);
  assert.equal(env.DB.prepare('SELECT COUNT(*) AS count FROM subscriptions').first().count, 1);
});
