import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { USER_ROLES } from '../src/constants';

let replSet: MongoMemoryReplSet;
let server: Server;
let base: string;
let adminToken: string;
let kasirToken: string;
let mekanikToken: string;
let PartModel: typeof import('../src/models/part.model').Part;
let StockMovementModel: typeof import('../src/models/stockMovement.model').StockMovement;

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

async function login(email: string, password: string): Promise<string> {
  const r = await call('POST', '/auth/login', undefined, { email, password });
  assert.equal(r.status, 200, `login ${email} gagal: ${r.body.message}`);
  return r.body.data.accessToken;
}

async function createPart(code: string, stock = 10, minStock = 2): Promise<string> {
  const part = await PartModel.create({ code, name: `Part ${code}`, price: 10000, stock, minStock, unit: 'pcs' });
  return part._id.toString();
}

async function stockOf(partId: string): Promise<number> {
  const part = await PartModel.findById(partId).lean();
  assert.ok(part, `part ${partId} tidak ada di database`);
  return part.stock;
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri('motorcenter_test');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123';

  const { default: app } = await import('../src/app');
  const { ensureDatabaseConnection } = await import('../src/config/db');
  const { User } = await import('../src/models/user.model');
  PartModel = (await import('../src/models/part.model')).Part;
  StockMovementModel = (await import('../src/models/stockMovement.model')).StockMovement;

  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  await ensureDatabaseConnection();

  await User.create({ name: 'Admin Test', email: 'admin@example.com', password: 'admin123', phone: '081234567890', role: USER_ROLES.ADMIN });
  await User.create({ name: 'Kasir Test', email: 'kasir@example.com', password: 'kasir123', phone: '081234567891', role: USER_ROLES.KASIR });
  await User.create({ name: 'Mekanik Test', email: 'mekanik@example.com', password: 'mekanik123', phone: '081234567892', role: USER_ROLES.MEKANIK });

  adminToken = await login('admin@example.com', 'admin123');
  kasirToken = await login('kasir@example.com', 'kasir123');
  mekanikToken = await login('mekanik@example.com', 'mekanik123');
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

// --- FR-ADM-06: stock opname correction through PUT /parts/:id ---

test('koreksi stok lewat PUT mencatat mutasi adjust dengan selisihnya', async () => {
  const partId = await createPart('ADJ-1', 10);

  const r = await call('PUT', `/parts/${partId}`, kasirToken, { stock: 7, price: 12000 });
  assert.equal(r.status, 200, r.body.message);
  assert.equal(r.body.data.stock, 7);
  assert.equal(r.body.data.price, 12000);
  assert.equal(await stockOf(partId), 7);

  const movements = await StockMovementModel.find({ partId }).lean();
  assert.equal(movements.length, 1);
  assert.equal(movements[0].type, 'adjust');
  assert.equal(movements[0].quantity, -3);
  assert.equal(movements[0].stockAfter, 7);
});

test('PUT tanpa perubahan stok tidak mencatat mutasi', async () => {
  const partId = await createPart('ADJ-2', 10);

  const r1 = await call('PUT', `/parts/${partId}`, kasirToken, { name: 'Nama Baru' });
  assert.equal(r1.status, 200, r1.body.message);
  const r2 = await call('PUT', `/parts/${partId}`, kasirToken, { stock: 10 });
  assert.equal(r2.status, 200, r2.body.message);

  assert.equal(await StockMovementModel.countDocuments({ partId }), 0);
});

test('PUT ke suku cadang yang tidak ada mengembalikan 404', async () => {
  const r = await call('PUT', `/parts/${new mongoose.Types.ObjectId()}`, kasirToken, { stock: 5 });
  assert.equal(r.status, 404, r.body.message);
});

// --- FR-ADM-06: GET /parts/:id/movements ---

test('riwayat mutasi: urut terbaru dulu, memuat pengguna, sesuai kriteria SRS (restock 5 lalu koreksi -2)', async () => {
  const partId = await createPart('MOV-1', 10);
  const r1 = await call('PATCH', `/parts/${partId}/restock`, kasirToken, { quantity: 5, note: 'Kiriman pemasok' });
  assert.equal(r1.status, 200, r1.body.message);
  const r2 = await call('PUT', `/parts/${partId}`, kasirToken, { stock: 13 });
  assert.equal(r2.status, 200, r2.body.message);

  const r = await call('GET', `/parts/${partId}/movements`, kasirToken);
  assert.equal(r.status, 200, r.body.message);
  assert.equal(r.body.pagination.total, 2);
  const [latest, first] = r.body.data;
  assert.equal(latest.type, 'adjust');
  assert.equal(latest.quantity, -2);
  assert.equal(latest.stockAfter, 13);
  assert.equal(first.type, 'restock');
  assert.equal(first.quantity, 5);
  assert.equal(first.stockAfter, 15);
  assert.equal(first.note, 'Kiriman pemasok');
  assert.equal(first.userId.name, 'Kasir Test');
});

test('riwayat mutasi: filter jenis dan rentang tanggal', async () => {
  const partId = await createPart('MOV-2', 10);
  await call('PATCH', `/parts/${partId}/restock`, kasirToken, { quantity: 1 });
  await call('PUT', `/parts/${partId}`, kasirToken, { stock: 5 });

  const byType = await call('GET', `/parts/${partId}/movements?type=restock`, adminToken);
  assert.equal(byType.status, 200, byType.body.message);
  assert.equal(byType.body.data.length, 1);
  assert.equal(byType.body.data[0].type, 'restock');

  const past = await call('GET', `/parts/${partId}/movements?startDate=2020-01-01&endDate=2020-01-31`, adminToken);
  assert.equal(past.status, 200, past.body.message);
  assert.equal(past.body.data.length, 0);
});

test('riwayat mutasi: validasi dan otorisasi', async () => {
  const partId = await createPart('MOV-3', 10);

  const mekanik = await call('GET', `/parts/${partId}/movements`, mekanikToken);
  assert.equal(mekanik.status, 403, mekanik.body.message);

  const badType = await call('GET', `/parts/${partId}/movements?type=hilang`, kasirToken);
  assert.equal(badType.status, 400, badType.body.message);

  const reversed = await call('GET', `/parts/${partId}/movements?startDate=2026-02-01&endDate=2026-01-01`, kasirToken);
  assert.equal(reversed.status, 400, reversed.body.message);

  const unknown = await call('GET', `/parts/${new mongoose.Types.ObjectId()}/movements`, kasirToken);
  assert.equal(unknown.status, 404, unknown.body.message);
});
