import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { api } from './api.js';
import { endSession, saveSession, SESSION_ENDED, TOKEN_KEY, USER_KEY } from './session.js';

const originalFetch = globalThis.fetch;
let ended;
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  globalThis.window = new EventTarget();
  ended = 0;
  window.addEventListener(SESSION_ENDED, () => ended++);
  saveSession({ token: 'current-token', user: { id: 'user-1' } });
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.localStorage;
  delete globalThis.window;
});
const json = (status, payload) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

test('restores a valid session using the saved bearer token', async () => {
  fetch = async (url, options) => {
    assert.equal(url, '/api/auth/me');
    assert.equal(options.headers.Authorization, 'Bearer current-token');
    return json(200, { success: true, data: { user: { id: 'user-1' } } });
  };
  assert.deepEqual(await api.me(), { user: { id: 'user-1' } });
  assert.equal(ended, 0);
});

test('protected 401 clears credentials and immediately notifies the UI, even for non-JSON responses', async () => {
  fetch = async () => new Response('Unauthorized', { status: 401 });
  await assert.rejects(api.dashboard(), /sign in again/);
  assert.equal(localStorage.getItem(TOKEN_KEY), null);
  assert.equal(localStorage.getItem(USER_KEY), null);
  assert.equal(ended, 1);
});

test('missing token removes an orphaned profile and notifies the UI', async () => {
  localStorage.removeItem(TOKEN_KEY);
  fetch = async () => json(401, { success: false });
  await assert.rejects(api.todayPlan(), /sign in again/);
  assert.equal(localStorage.getItem(USER_KEY), null);
  assert.equal(ended, 1);
});

test('a delayed 401 from a previous session cannot erase a new login', async () => {
  let resolve;
  fetch = () => new Promise(done => { resolve = done; });
  const pending = api.dashboard();
  saveSession({ token: 'new-token', user: { id: 'user-2' } });
  resolve(json(401, { success: false }));
  await assert.rejects(pending, /sign in again/);
  assert.equal(localStorage.getItem(TOKEN_KEY), 'new-token');
  assert.equal(ended, 0);
});

test('incorrect login credentials do not invalidate an existing session', async () => {
  fetch = async (_, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return json(401, { success: false, message: 'Email or password is incorrect.' });
  };
  await assert.rejects(api.login({ email: 'test@example.com', password: 'incorrect' }), /Email or password/);
  assert.equal(localStorage.getItem(TOKEN_KEY), 'current-token');
  assert.equal(ended, 0);
});

test('temporary API failures preserve credentials for retry', async () => {
  for (const status of [500, 503]) {
    fetch = async () => json(status, { success: false, message: 'Temporary failure' });
    await assert.rejects(api.me(), /Temporary failure/);
    assert.equal(localStorage.getItem(TOKEN_KEY), 'current-token');
  }
  fetch = async () => { throw new Error('offline'); };
  await assert.rejects(api.me(), /Cannot reach/);
  assert.equal(localStorage.getItem(TOKEN_KEY), 'current-token');
  assert.equal(ended, 0);
});

test('malformed cached profile does not prevent session invalidation', () => {
  localStorage.setItem(USER_KEY, '{broken');
  endSession();
  assert.equal(localStorage.getItem(USER_KEY), null);
  assert.equal(ended, 1);
});

test('proxy outages and rate limits have readable messages and preserve login', async () => {
  for (const status of [500, 502, 503, 504, 429]) {
    fetch = async () => new Response('', { status });
    await assert.rejects(api.me(), status === 429 ? /Too many requests/ : /API is unavailable/);
    assert.equal(localStorage.getItem(TOKEN_KEY), 'current-token');
    assert.equal(ended, 0);
  }
});
