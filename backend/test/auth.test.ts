import {test, before, after} from 'node:test'
import assert from 'node:assert/strict'
import type {Server} from 'node:http'
import {MongoMemoryReplSet} from 'mongodb-memory-server'
import mongoose from 'mongoose'
import {USER_ROLES} from '../src/constants'

let replSet: MongoMemoryReplSet
let server: Server
let base: string;

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

before(async () => {
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
        name: 'Mekanik aktif',
        email: 'aktif@example.com',
        password: 'mekanik123',
        phone: '081234567890',
        role: USER_ROLES.MEKANIK,
    })

    await User.create({
        name: 'Mekanik nonaktif',
        email: 'nonaktif@example.com',
        password: 'mekanik1234',
        phone: '081234567899',
        role: USER_ROLES.MEKANIK,
        isActive: false,
    })
})

after(async() => {
    server?.close();
    await mongoose.disconnect();
    await replSet?.stop();
})

test('login: akun nonaktif dengan password benar ditolak 403 Forbidden', async() => {
    const r = await call('POST', '/auth/login', undefined, {email: 'nonaktif@example.com', password: 'mekanik1234'})
    assert.equal(r.status, 403)
})

test('login: akun nonaktif dengan password salah tetap 401 (tidak bocor)', async() =>{
    const r = await call('POST', '/auth/login', undefined, {email: 'nonaktif@example.com', password: 'wrongpassword'})
    assert.equal(r.status, 401)
})

test('login: akun aktif dengan pass benar 200 dan accessToken', async() =>{
    const r = await call('POST', '/auth/login', undefined, {email: 'aktif@example.com', password: 'mekanik123'})
    assert.equal(r.status, 200)
    assert.ok(r.body.data.accessToken)
})

test('change-password: token baru tetap valid, token lama ditolak 401', async() => {
    const r1 = await call('POST', '/auth/login', undefined, {email: 'aktif@example.com', password: 'mekanik123'})
    assert.equal(r1.status, 200)
    const tokenA = r1.body.data.accessToken

    const r3 = await call('PUT', '/auth/change-password', tokenA, {oldPassword: 'mekanik123', newPassword: 'newpass123'})
    assert.equal(r3.status, 200)
    const tokenC = r3.body.data.accessToken

    const r4 = await call('GET', '/auth/me', tokenC)
    assert.equal(r4.status, 200, 'token baru harus valid')

    const r5 = await call('GET', '/auth/me', tokenA)
    assert.equal(r5.status, 401, 'token lama harus ditolak')

    
})