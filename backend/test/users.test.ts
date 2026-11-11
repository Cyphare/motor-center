import {test, before, after} from 'node:test'
import assert from 'node:assert/strict'
import type {Server} from 'node:http'
import {MongoMemoryReplSet} from 'mongodb-memory-server'
import mongoose from 'mongoose'
import {USER_ROLES} from '../src/constants'

let replSet: MongoMemoryReplSet
let server: Server
let base: string;
let adminToken: string;
let kasirToken: string;
let kasirId: string;
let adminId: string;


async function call(method: string, path: string, token?: string, body?: unknown) {
    const res = await fetch(base + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

async function login(email: string, password: string) {
  const r = await call('POST', '/auth/login', undefined, { email, password });
  assert.equal(r.status, 200, `login ${email} gagal: ${r.body.message}`);
  return r.body.data as { user: { _id: string }; accessToken: string };
}

before(async () =>{
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = replSet.getUri('motorcenter_test');
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-123';

    const {default: app} = await import('../src/app');
    const {ensureDatabaseConnection} = await import('../src/config/db');
    const {User} = await import('../src/models/user.model');

    server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${(server.address() as any).port}/api`;

    await ensureDatabaseConnection();

    await User.create({
        name: 'Kasir Aktif',
        email: 'kasir@example.com',
        password: 'kasir123',
        phone: '081234567891',
        role: USER_ROLES.KASIR,
    })
    await User.create({
        name: 'Admin Aktif',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '081234567892',
        role: USER_ROLES.ADMIN,
    })

    const admin = (await login('admin@example.com', 'admin123'))
    const kasir= (await login('kasir@example.com', 'kasir123'))
    adminToken = admin.accessToken;
    kasirToken = kasir.accessToken;
    kasirId = String(kasir.user._id);
    adminId = String(admin.user._id);


})

after(async() =>{
    server?.close();
    await mongoose.disconnect();
    await replSet?.stop();
})

test('nonaktifkan staf: token lamanya ditolak 401', async() =>{
    const r1 = await call('PATCH', `/users/${kasirId}/status`, adminToken, {isActive: false});
    assert.equal(r1.status, 200, `nonaktifkan staf gagal: ${r1.body.message}`);

    const r2 = await call('GET', '/auth/me', kasirToken);
    assert.equal(r2.status, 401, `token lama staf masih diterima: ${r2.body.message}`);
})

test('aktifkan lagi: token lama tetap ditolak, login ulang berhasil', async() =>{
    const r = await call('PATCH', `/users/${kasirId}/status`, adminToken, {isActive: true});
    assert.equal(r.status, 200, `aktifkan staf gagal: ${r.body.message}`);

    const r2 = await call('GET', '/auth/me', kasirToken);
    assert.equal(r2.status, 401, `token lama staf masih diterima: ${r2.body.message}`);

    const r3 = await call('POST', '/auth/login', undefined, {email: 'kasir@example.com', password: 'kasir123'});
    assert.equal(r3.status, 200, `login ulang gagal: ${r3.body.message}`);
    const newKasirToken = r3.body.data.accessToken;

    const r4 = await call('GET', '/auth/me', newKasirToken);
    assert.equal(r4.status, 200, `token baru staf ditolak: ${r4.body.message}`);
})

test('admin tidak bisa menonaktifkan dirinya sendiri', async() =>{
    const r = await call('PATCH', `/users/${adminId}/status`, adminToken, {isActive: false});
    assert.equal(r.status, 400, `admin bisa menonaktifkan dirinya sendiri: ${r.body.message}`);
})