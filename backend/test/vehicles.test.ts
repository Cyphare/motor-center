import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { BOOKING_TYPE, SERVICE_STATUS, USER_ROLES } from '../src/constants';

let replSet: MongoMemoryReplSet;
let server: Server;
let base: string;
let kasirToken: string;
let mekanikToken: string;
let pemilikToken: string;
let pelangganToken: string;
let pelangganId: string;
let mekanikId: string;
let BookingModel: typeof import('../src/models/booking.model').Booking;
let bookingSeq = 0;

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

const historyUrl = (plate: string) => `/vehicles/${encodeURIComponent(plate)}/history`;

/** Inserts a past ticket directly, so each test controls dates, owner, and parts. */
async function createVisit(overrides: Record<string, unknown>) {
  bookingSeq += 1;
  return BookingModel.create({
    bookingNumber: `MC-20260101-${String(bookingSeq).padStart(4, '0')}`,
    bookingType: BOOKING_TYPE.WALK_IN,
    customerName: 'Budi',
    customerPhone: '081234567890',
    motorModel: 'Honda Vario 160',
    complaint: 'Servis rutin',
    status: SERVICE_STATUS.DIAMBIL,
    serviceFee: 50000,
    partsTotalCost: 0,
    grandTotal: 50000,
    statusHistory: [],
    ...overrides,
  });
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri('motorcenter_test');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123';

  const { default: app } = await import('../src/app');
  const { ensureDatabaseConnection } = await import('../src/config/db');
  const { User } = await import('../src/models/user.model');
  BookingModel = (await import('../src/models/booking.model')).Booking;

  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  await ensureDatabaseConnection();

  await User.create({ name: 'Kasir Test', email: 'kasir@example.com', password: 'kasir123', phone: '081234567891', role: USER_ROLES.KASIR });
  await User.create({ name: 'Mekanik Test', email: 'mekanik@example.com', password: 'mekanik123', phone: '081234567892', role: USER_ROLES.MEKANIK });
  await User.create({ name: 'Pemilik Test', email: 'pemilik@example.com', password: 'pemilik123', phone: '081234567893', role: USER_ROLES.PEMILIK });
  await User.create({ name: 'Pelanggan Test', email: 'pelanggan@example.com', password: 'pelanggan123', phone: '081234567894', role: USER_ROLES.PELANGGAN });

  kasirToken = (await login('kasir@example.com', 'kasir123')).accessToken;
  const mekanik = await login('mekanik@example.com', 'mekanik123');
  mekanikToken = mekanik.accessToken;
  mekanikId = String(mekanik.user._id);
  pemilikToken = (await login('pemilik@example.com', 'pemilik123')).accessToken;
  const pelanggan = await login('pelanggan@example.com', 'pelanggan123');
  pelangganToken = pelanggan.accessToken;
  pelangganId = String(pelanggan.user._id);
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

test('kriteria SRS: tiga tiket plat AB 1234 CD, dicari "ab 1234 cd", tampil terbaru dulu beserta suku cadang', async () => {
  const partId = new mongoose.Types.ObjectId();
  await createVisit({ plateNumber: 'AB 1234 CD', serviceDate: new Date('2026-01-10'), complaint: 'Kunjungan 1' });
  await createVisit({
    plateNumber: 'AB 1234 CD',
    serviceDate: new Date('2026-05-10'),
    complaint: 'Kunjungan 2',
    mechanicId: mekanikId,
    partsUsed: [{ partId, code: 'OLI-1', name: 'Oli Mesin', price: 60000, quantity: 1, subtotal: 60000, addedAt: new Date('2026-05-10') }],
    partsTotalCost: 60000,
    grandTotal: 110000,
  });
  await createVisit({ plateNumber: 'AB 1234 CD', serviceDate: new Date('2026-09-10'), complaint: 'Kunjungan 3' });
  await createVisit({ plateNumber: 'AB 1234 CDE', serviceDate: new Date('2026-09-11'), complaint: 'Plat lain' });

  const r = await call('GET', historyUrl('ab 1234 cd'), kasirToken);
  assert.equal(r.status, 200, r.body.message);
  assert.equal(r.body.data.plateNumber, 'AB 1234 CD');
  assert.equal(r.body.data.totalVisits, 3);

  const visits = r.body.data.visits;
  assert.deepEqual(visits.map((v: { complaint: string }) => v.complaint), ['Kunjungan 3', 'Kunjungan 2', 'Kunjungan 1']);
  assert.equal(visits[1].mechanicId.name, 'Mekanik Test');
  assert.equal(visits[1].partsUsed.length, 1);
  assert.equal(visits[1].partsUsed[0].name, 'Oli Mesin');
  assert.equal(visits[1].grandTotal, 110000);
  assert.equal(visits[0].customerPhone, undefined, 'kontak pelanggan tidak ikut dikirim');
});

test('pencarian tidak peka spasi: "B1234XY" menemukan tiket "B 1234 XY" dan sebaliknya', async () => {
  await createVisit({ plateNumber: 'B 1234 XY', serviceDate: new Date('2026-03-01') });
  await createVisit({ plateNumber: 'B1234XY', serviceDate: new Date('2026-04-01') });

  const compact = await call('GET', historyUrl('B1234XY'), kasirToken);
  assert.equal(compact.status, 200, compact.body.message);
  assert.equal(compact.body.data.totalVisits, 2);

  const spaced = await call('GET', historyUrl('  b   1234 xy '), kasirToken);
  assert.equal(spaced.body.data.totalVisits, 2);
  assert.equal(spaced.body.data.plateNumber, 'B 1234 XY');
});

test('plat yang belum pernah diservis: 200 dengan daftar kosong dan pesan informatif', async () => {
  const r = await call('GET', historyUrl('Z 9999 ZZ'), kasirToken);
  assert.equal(r.status, 200, r.body.message);
  assert.equal(r.body.data.totalVisits, 0);
  assert.deepEqual(r.body.data.visits, []);
  assert.match(r.body.message, /belum tersedia/);
});

test('pelanggan hanya melihat tiket online miliknya untuk plat tersebut', async () => {
  await createVisit({ plateNumber: 'D 5555 PL', serviceDate: new Date('2026-02-01'), bookingType: BOOKING_TYPE.ONLINE, customerId: pelangganId, complaint: 'Milik pelanggan' });
  await createVisit({ plateNumber: 'D 5555 PL', serviceDate: new Date('2026-03-01'), bookingType: BOOKING_TYPE.ONLINE, customerId: new mongoose.Types.ObjectId(), complaint: 'Milik orang lain' });
  await createVisit({ plateNumber: 'D 5555 PL', serviceDate: new Date('2026-04-01'), complaint: 'Walk-in' });

  const r = await call('GET', historyUrl('D 5555 PL'), pelangganToken);
  assert.equal(r.status, 200, r.body.message);
  assert.equal(r.body.data.totalVisits, 1);
  assert.equal(r.body.data.visits[0].complaint, 'Milik pelanggan');

  const staff = await call('GET', historyUrl('D 5555 PL'), kasirToken);
  assert.equal(staff.body.data.totalVisits, 3);
});

test('otorisasi: mekanik boleh, pemilik 403, tanpa token 401', async () => {
  const mekanik = await call('GET', historyUrl('AB 1234 CD'), mekanikToken);
  assert.equal(mekanik.status, 200, mekanik.body.message);

  const pemilik = await call('GET', historyUrl('AB 1234 CD'), pemilikToken);
  assert.equal(pemilik.status, 403, pemilik.body.message);

  const anonymous = await call('GET', historyUrl('AB 1234 CD'));
  assert.equal(anonymous.status, 401, anonymous.body.message);
});

test('validasi plat: terlalu pendek atau mengandung simbol ditolak 400', async () => {
  for (const plate of ['AB', 'AB-1234-CD', 'AB.*']) {
    const r = await call('GET', historyUrl(plate), kasirToken);
    assert.equal(r.status, 400, `plat ${plate} seharusnya ditolak: ${r.body.message}`);
  }
});

test('tiket baru disimpan dengan plat yang sudah dinormalkan', async () => {
  const r = await call('POST', '/bookings/walk-in', kasirToken, {
    customerName: 'Sari', customerPhone: '081234567899', plateNumber: '  f   7777  gh ',
    motorModel: 'Yamaha NMAX', complaint: 'Rem bunyi',
  });
  assert.equal(r.status, 201, r.body.message);
  assert.equal(r.body.data.plateNumber, 'F 7777 GH');
});
