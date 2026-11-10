import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { USER_ROLES, SERVICE_STATUS } from '../src/constants';

let replSet: MongoMemoryReplSet;
let server: Server;
let base: string;
let kasirToken: string;
let mekanikToken: string;
let mekanikId: string;
let partId: string;
let inactivePartId: string;
let PartModel: typeof import('../src/models/part.model').Part;
let BookingModel: typeof import('../src/models/booking.model').Booking;

const restockUrl = (id: string) => `/parts/${id}/restock`;

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

async function stockOf(id: string): Promise<number> {
  const part = await PartModel.findById(id).lean();
  assert.ok(part, `part ${id} tidak ada di database`);
  return part.stock;
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  // Harus di-set SEBELUM import app/model, karena env.ts membaca process.env saat di-import.
  process.env.MONGODB_URI = replSet.getUri('motorcenter_test');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123';

  const { default: app } = await import('../src/app');
  const { ensureDatabaseConnection } = await import('../src/config/db');
  const { User } = await import('../src/models/user.model');
  PartModel = (await import('../src/models/part.model')).Part;
  BookingModel = (await import('../src/models/booking.model')).Booking;

  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;

  // Koneksi DB di app.ts dibuat lazily oleh middleware per request; model dipakai langsung di sini.
  await ensureDatabaseConnection();

  await User.create({ name: 'Kasir Test', email: 'kasir@example.com', password: 'kasir123', phone: '081234567890', role: USER_ROLES.KASIR });
  await User.create({ name: 'Mekanik Test', email: 'mekanik@example.com', password: 'mekanik123', phone: '081234567891', role: USER_ROLES.MEKANIK });

  const part = await PartModel.create({ code: 'OLI001', name: 'Oli', stock: 10, minStock: 5, price: 50000, unit: 'liter' });
  partId = String(part._id);

  const inactivePart = await PartModel.create({ code: 'OLI002', name: 'Oli Lama', stock: 10, minStock: 5, price: 40000, unit: 'liter', isActive: false });
  inactivePartId = String(inactivePart._id);

  kasirToken = (await login('kasir@example.com', 'kasir123')).accessToken;
  const mekanik = await login('mekanik@example.com', 'mekanik123');
  mekanikToken = mekanik.accessToken;
  mekanikId = String(mekanik.user._id);
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

test('sanity: health check', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.status, 200);
});

test('kasir restock menambah stok sebesar quantity', async () => {
  const before = await stockOf(partId);

  const r = await call('PATCH', restockUrl(partId), kasirToken, { quantity: 5 });

  assert.equal(r.status, 200);
  assert.equal(r.body.data.stock, before + 5, 'respons harus berisi stok terbaru');
  assert.equal(await stockOf(partId), before + 5, 'stok di database harus bertambah, bukan ditimpa');
});

test('mekanik ditolak (403) dan stok tidak berubah', async () => {
  const before = await stockOf(partId);
  const r = await call('PATCH', restockUrl(partId), mekanikToken, { quantity: 5 });
  assert.equal(r.status, 403);
  assert.equal(await stockOf(partId), before);
});

test('tanpa token / token tidak valid ditolak (401)', async () => {
  const noToken = await call('PATCH', restockUrl(partId), undefined, { quantity: 5 });
  assert.equal(noToken.status, 401);

  const badToken = await call('PATCH', restockUrl(partId), 'invalid-token', { quantity: 5 });
  assert.equal(badToken.status, 401);
});

test('quantity tidak valid ditolak (400) dan stok tidak berubah', async () => {
  const before = await stockOf(partId);
  for (const quantity of [0, -5, 1.5, '5', null]) {
    const r = await call('PATCH', restockUrl(partId), kasirToken, { quantity });
    assert.equal(r.status, 400, `quantity=${JSON.stringify(quantity)} seharusnya ditolak`);
  }
  const missing = await call('PATCH', restockUrl(partId), kasirToken, {});
  assert.equal(missing.status, 400, 'quantity kosong seharusnya ditolak');
  assert.equal(await stockOf(partId), before);
});

test('field asing ditolak (400) oleh .strict()', async () => {
  const before = await stockOf(partId);
  const r = await call('PATCH', restockUrl(partId), kasirToken, { quantity: 5, stock: 999 });
  assert.equal(r.status, 400);
  assert.equal(await stockOf(partId), before);
});

test('id dengan format salah ditolak (400), bukan CastError 500', async () => {
  const r = await call('PATCH', restockUrl('abc'), kasirToken, { quantity: 5 });
  assert.equal(r.status, 400);
});

test('part nonaktif ditolak (404) dan stok tidak berubah', async () => {
  const before = await stockOf(inactivePartId);
  const r = await call('PATCH', restockUrl(inactivePartId), kasirToken, { quantity: 5 });
  assert.equal(r.status, 404);
  // Pastikan 404 berasal dari controller, bukan dari notFound.middleware (route salah).
  assert.match(r.body.message, /Suku cadang tidak ditemukan/);
  assert.equal(await stockOf(inactivePartId), before);
});

test('part yang tidak ada ditolak (404)', async () => {
  const unknownId = String(new mongoose.Types.ObjectId());
  const r = await call('PATCH', restockUrl(unknownId), kasirToken, { quantity: 5 });
  assert.equal(r.status, 404);
  assert.match(r.body.message, /Suku cadang tidak ditemukan/);
});

test('konkurensi: restock dan pemakaian di tiket tidak saling menimpa (no lost update)', async () => {
  const RESTOCKS = 10;
  const USAGES = 5;

  // Satu tiket per pemakaian, agar yang diuji adalah perebutan dokumen Part, bukan dokumen Booking.
  const bookings = await Promise.all(
    Array.from({ length: USAGES }, (_, i) =>
      BookingModel.create({
        bookingNumber: `MC-TEST-${String(i + 1).padStart(4, '0')}`,
        customerName: `Pelanggan ${i + 1}`,
        customerPhone: '081200000000',
        plateNumber: `AB ${1000 + i} XY`,
        motorModel: 'Vario 160',
        complaint: 'Ganti oli',
        mechanicId: new mongoose.Types.ObjectId(mekanikId),
        status: SERVICE_STATUS.DIKERJAKAN,
      })
    )
  );

  const before = await stockOf(partId);

  const results = await Promise.all([
    ...Array.from({ length: RESTOCKS }, () =>
      call('PATCH', restockUrl(partId), kasirToken, { quantity: 1 })
    ),
    ...bookings.map((b) =>
      call('POST', `/bookings/${b._id}/parts`, mekanikToken, { partId, quantity: 1 })
    ),
  ]);

  for (const r of results) assert.equal(r.status, 200, r.body.message);
  assert.equal(await stockOf(partId), before + RESTOCKS - USAGES);
});
