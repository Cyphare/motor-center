import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { BOOKING_TYPE, SERVICE_STATUS, USER_ROLES } from '../src/constants';

let replSet: MongoMemoryReplSet;
let server: Server;
let base: string;
let pemilikToken: string;
let adminToken: string;
let kasirToken: string;
let mekanikToken: string;
let BookingModel: typeof import('../src/models/booking.model').Booking;
let bookingSeq = 0;

const oil = { partId: new mongoose.Types.ObjectId(), code: 'OLI-1', name: 'Oli Mesin', price: 45000 };
const pad = { partId: new mongoose.Types.ObjectId(), code: 'REM-1', name: 'Kampas Rem', price: 60000 };
const plug = { partId: new mongoose.Types.ObjectId(), code: 'BUSI-1', name: 'Busi', price: 25000 };
const rutin = { serviceId: new mongoose.Types.ObjectId(), serviceName: 'Servis Rutin', serviceFee: 75000 };
const besar = { serviceId: new mongoose.Types.ObjectId(), serviceName: 'Servis Besar', serviceFee: 200000 };

async function call(method: string, path: string, token?: string) {
  const res = await fetch(base + path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  assert.equal(res.status, 200, `login ${email} gagal: ${body.message}`);
  return body.data.accessToken;
}

type PartLine = { partId: mongoose.Types.ObjectId; code: string; name: string; price: number };

/** A ticket picked up at `pickedUpAt` (UTC ISO string) with the given service and parts. */
async function createTicket(
  pickedUpAt: string,
  service: { serviceId: mongoose.Types.ObjectId; serviceName: string; serviceFee: number } | null,
  parts: Array<[PartLine, number]>,
  status: string = SERVICE_STATUS.DIAMBIL
) {
  bookingSeq += 1;
  const partsUsed = parts.map(([part, quantity]) => ({ ...part, quantity, subtotal: part.price * quantity, addedAt: new Date(pickedUpAt) }));
  const serviceFee = service?.serviceFee ?? 50000;
  const partsTotalCost = partsUsed.reduce((sum, item) => sum + item.subtotal, 0);
  return BookingModel.create({
    bookingNumber: `MC-20260301-${String(bookingSeq).padStart(4, '0')}`,
    bookingType: BOOKING_TYPE.WALK_IN,
    customerName: 'Budi',
    customerPhone: '081234567890',
    plateNumber: 'AB 1234 CD',
    motorModel: 'Honda Vario 160',
    complaint: 'Servis',
    status,
    serviceId: service?.serviceId,
    serviceName: service?.serviceName,
    serviceFee,
    partsUsed,
    partsTotalCost,
    grandTotal: serviceFee + partsTotalCost,
    serviceDate: new Date(pickedUpAt),
    pickedUpAt: status === SERVICE_STATUS.DIAMBIL ? new Date(pickedUpAt) : undefined,
    statusHistory: [],
  });
}

const topItems = (query: string, token = pemilikToken) => call('GET', `/reports/top-items${query}`, token);

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

  await User.create({ name: 'Pemilik', email: 'pemilik@example.com', password: 'pemilik123', phone: '081234567890', role: USER_ROLES.PEMILIK });
  await User.create({ name: 'Admin', email: 'admin@example.com', password: 'admin123', phone: '081234567891', role: USER_ROLES.ADMIN });
  await User.create({ name: 'Kasir', email: 'kasir@example.com', password: 'kasir123', phone: '081234567892', role: USER_ROLES.KASIR });
  await User.create({ name: 'Mekanik', email: 'mekanik@example.com', password: 'mekanik123', phone: '081234567893', role: USER_ROLES.MEKANIK });
  pemilikToken = await login('pemilik@example.com', 'pemilik123');
  adminToken = await login('admin@example.com', 'admin123');
  kasirToken = await login('kasir@example.com', 'kasir123');
  mekanikToken = await login('mekanik@example.com', 'mekanik123');

  // March 2026, counted in the main range 2026-03-01..2026-03-10
  await createTicket('2026-03-02T03:00:00Z', rutin, [[oil, 2], [plug, 1]]);
  await createTicket('2026-03-05T03:00:00Z', rutin, [[oil, 1], [pad, 1]]);
  await createTicket('2026-03-06T03:00:00Z', besar, [[pad, 2], [plug, 4]]);
  await createTicket('2026-03-07T03:00:00Z', null, [[oil, 3]]);
  // 23.30 WIB on 10 March is still inside the range
  await createTicket('2026-03-10T16:30:00Z', rutin, [[plug, 1]]);

  // Not counted: 00.30 WIB on 11 March, a Selesai ticket, and a ticket from February
  await createTicket('2026-03-10T17:30:00Z', besar, [[pad, 10]]);
  await createTicket('2026-03-08T03:00:00Z', besar, [[pad, 10]], SERVICE_STATUS.SELESAI);
  await createTicket('2026-02-20T03:00:00Z', besar, [[pad, 10]]);
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

test('kriteria SRS: urutan dan jumlah unit suku cadang sama dengan penjumlahan partsUsed tiket Diambil', async () => {
  const r = await topItems('?startDate=2026-03-01&endDate=2026-03-10');
  assert.equal(r.status, 200, r.body.message);
  const { parts, ticketCount } = r.body.data;
  assert.equal(ticketCount, 5);

  // oil 2+1+3 = 6, plug 1+4+1 = 6, pad 1+2 = 3. Oil and plug tie on units, oil wins on revenue.
  assert.deepEqual(
    parts.map((p: { code: string; quantity: number; revenue: number; ticketCount: number }) => [p.code, p.quantity, p.revenue, p.ticketCount]),
    [
      ['OLI-1', 6, 270000, 3],
      ['BUSI-1', 6, 150000, 3],
      ['REM-1', 3, 180000, 2],
    ]
  );
  assert.equal(parts[0].name, 'Oli Mesin');
  assert.equal(parts[0].partId, String(oil.partId));
});

test('layanan diurutkan berdasarkan jumlah tiket; tiket tanpa paket hanya dihitung di servicelessTickets', async () => {
  const r = await topItems('?startDate=2026-03-01&endDate=2026-03-10');
  const { services, servicelessTickets } = r.body.data;
  assert.equal(servicelessTickets, 1);
  assert.deepEqual(
    services.map((s: { name: string; ticketCount: number; revenue: number }) => [s.name, s.ticketCount, s.revenue]),
    [
      ['Servis Rutin', 3, 225000],
      ['Servis Besar', 1, 200000],
    ]
  );
  assert.equal(services[0].serviceId, String(rutin.serviceId));
});

test('limit membatasi jumlah item per daftar', async () => {
  const r = await topItems('?startDate=2026-03-01&endDate=2026-03-10&limit=1', adminToken);
  assert.equal(r.status, 200, r.body.message);
  assert.equal(r.body.data.parts.length, 1);
  assert.equal(r.body.data.services.length, 1);
  assert.equal(r.body.data.parts[0].code, 'OLI-1');
});

test('rentang tanpa tiket Diambil menghasilkan daftar kosong dan angka 0', async () => {
  const r = await topItems('?startDate=2025-01-01&endDate=2025-01-31');
  assert.equal(r.status, 200, r.body.message);
  assert.deepEqual(r.body.data.parts, []);
  assert.deepEqual(r.body.data.services, []);
  assert.equal(r.body.data.ticketCount, 0);
  assert.equal(r.body.data.servicelessTickets, 0);
});

test('tanpa tanggal memakai rentang bulan berjalan', async () => {
  const r = await topItems('');
  assert.equal(r.status, 200, r.body.message);
  assert.match(r.body.data.startDate, /^\d{4}-\d{2}-01$/);
  assert.match(r.body.data.endDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('validasi query dan otorisasi', async () => {
  for (const query of [
    '?startDate=2026-03-10&endDate=2026-03-01',
    '?startDate=2026-03-01',
    '?startDate=2026-03-01&endDate=2026-03-10&limit=0',
    '?startDate=2026-03-01&endDate=2026-03-10&limit=51',
    '?foo=bar',
  ]) {
    const r = await topItems(query);
    assert.equal(r.status, 400, `${query} seharusnya ditolak: ${r.body.message}`);
  }

  assert.equal((await topItems('', kasirToken)).status, 403);
  assert.equal((await topItems('', mekanikToken)).status, 403);
  assert.equal((await call('GET', '/reports/top-items')).status, 401);
});
