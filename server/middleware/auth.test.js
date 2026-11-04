import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth } from './auth.js';

const originalFind = User.findById;
const originalSecret = process.env.JWT_SECRET;
beforeEach(() => { process.env.JWT_SECRET = 'test-only-session-secret'; });
afterEach(() => {
  User.findById = originalFind;
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});
async function authenticate(token) {
  const result = { req: { headers: token ? { authorization: `Bearer ${token}` } : {} } };
  const res = {
    status(value) { result.status = value; return this; },
    json(value) { result.body = value; return this; }
  };
  await requireAuth(result.req, res, error => { result.next = true; result.error = error; });
  return result;
}
const token = options => jwt.sign({ sub: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET, options);

test('missing, expired and invalid tokens are rejected', async () => {
  for (const value of [undefined, 'invalid', token({ expiresIn: -1 })]) {
    assert.equal((await authenticate(value)).status, 401);
  }
});
test('valid session survives requests and uses the current account', async () => {
  User.findById = async () => ({ id: 'user-1' });
  const result = await authenticate(token({ expiresIn: '1h' }));
  assert.equal(result.next, true);
  assert.equal(result.req.user.id, 'user-1');
  assert.equal(result.error, undefined);
});
test('deleted account is rejected', async () => {
  User.findById = async () => null;
  assert.equal((await authenticate(token())).status, 401);
});
test('database errors reach the server error handler instead of logging users out', async () => {
  const failure = new Error('database disconnected');
  User.findById = async () => { throw failure; };
  const result = await authenticate(token());
  assert.equal(result.status, undefined);
  assert.equal(result.next, true);
  assert.equal(result.error, failure);
});
