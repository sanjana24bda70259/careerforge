import '../config/env.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import auth from './auth.js';
import { User } from '../models/User.js';

const databaseName = `careerforge_test_auth_${process.pid}_${Date.now()}`;
let server, origin;
before(async () => {
  process.env.JWT_SECRET = 'auth-test-only';
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
  await User.init();
  const app = express(); app.use(express.json()); app.use(auth);
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName && databaseName.startsWith('careerforge_test_auth_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
async function post(path, body) {
  const response = await fetch(`${origin}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
test('registration and login normalize email and safely reject malformed credentials', async () => {
  const created = await post('register', { email: '  Learner@Example.test ', password: 'sample-pass-123', name: 'Test learner' });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.user.email, 'learner@example.test');
  const signedIn = await post('login', { email: ' LEARNER@example.test ', password: 'sample-pass-123' });
  assert.equal(signedIn.status, 200);
  assert.equal(signedIn.body.data.user.id, created.body.data.user.id);
  assert.equal((await post('register', { email: 'Learner@example.test', password: 'sample-pass-123' })).status, 409);
  for (const path of ['register', 'login']) {
    for (const body of [{}, { email: 123, password: 'sample-pass-123' }, { email: ['a@example.test'], password: 'sample-pass-123' }, { email: 'learner@example.test', password: { value: 'bad' } }]) assert.equal((await post(path, body)).status, 400);
  }
  assert.equal((await post('register', { email: 'name@example.test', password: 'sample-pass-123', name: {} })).status, 400);
  assert.equal((await post('login', { email: 'learner@example.test', password: 'wrong-password' })).status, 401);
  const competing = await Promise.all([1, 2].map(() => post('register', { email: 'race@example.test', password: 'sample-pass-123' })));
  assert.deepEqual(competing.map(result => result.status).sort(), [201, 409]);
});
