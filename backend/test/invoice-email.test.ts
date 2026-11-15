import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { SERVICE_STATUS, USER_ROLES } from '../src/constants';

let replSet: MongoMemoryReplSet;
let server: Server;
let base: string;
let kasirToken: string;
let mekanikToken: string;
let mekanikId: string;
let pelangganToken: string;
let serviceId: string;
let partId: string;
let testOutbox: typeof import('../src/services/mail.service').testOutbox;
let loadInvoiceData: typeof import('../src/services/pdf.service').loadInvoiceData;
let BookingModel: typeof import('../src/models/booking.model').Booking;

async function call(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  return {
    status: res.status,
    contentType: res.headers.get('content-type') ?? '',
    body: isJson ? await res.json() : null,
    raw: isJson ? null : Buffer.from(await res.arrayBuffer()),
  };
}

async function login(email: string, password: string) {
  const r = await call('POST', '/auth/login', undefined, { email, password });
  assert.equal(r.status, 200, `login ${email} gagal`);
  return r.body.data as { user: { _id: string }; accessToken: string };
}

const mailsFor = (bookingNumber: string, subjectStart: string) =>
  testOutbox.filter((mail) => mail.subject.startsWith(subjectStart) && mail.subject.includes(bookingNumber));

async function runWorkflow(until: 'Selesai' | 'Diambil', complaint = 'Rem depan bunyi') {
  const created = await call('POST', '/bookings/online', pelangganToken, {
    plateNumber: 'AB 1234 CD', motorModel: 'Honda Vario 160', complaint, serviceId,
  });
  assert.equal(created.status, 201, created.body?.message);
  const id = created.body.data._id;
  const bookingNumber = created.body.data.bookingNumber;

  const steps: Array<[string, string, string, unknown]> = [
    ['PUT', `/bookings/${id}/assign`, kasirToken, { mechanicId: mekanikId }],
    ['PUT', `/bookings/${id}/status`, mekanikToken, { status: SERVICE_STATUS.DIPERIKSA }],
    ['POST', `/bookings/${id}/parts`, mekanikToken, { partId, quantity: 2 }],
    ['PUT', `/bookings/${id}/status`, mekanikToken, { status: SERVICE_STATUS.DIKERJAKAN }],
    ['PUT', `/bookings/${id}/status`, mekanikToken, { status: SERVICE_STATUS.SELESAI, mechanicNotes: 'Kampas <rem> diganti' }],
  ];
  if (until === 'Diambil') steps.push(['PUT', `/bookings/${id}/status`, kasirToken, { status: SERVICE_STATUS.DIAMBIL }]);
  for (const [method, path, token, body] of steps) {
    const r = await call(method, path, token, body);
    assert.equal(r.status, 200, `${method} ${path} gagal: ${r.body?.message}`);
  }
  return { id, bookingNumber };
}

before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri('motorcenter_test');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123';

  const { default: app } = await import('../src/app');
  const { ensureDatabaseConnection } = await import('../src/config/db');
  const { User } = await import('../src/models/user.model');
  const { Service } = await import('../src/models/service.model');
  const { Part } = await import('../src/models/part.model');
  testOutbox = (await import('../src/services/mail.service')).testOutbox;
  loadInvoiceData = (await import('../src/services/pdf.service')).loadInvoiceData;
  BookingModel = (await import('../src/models/booking.model')).Booking;

  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  await ensureDatabaseConnection();

  await User.create({ name: 'Siti Kasir', email: 'kasir@example.com', password: 'kasir123', phone: '081234567891', role: USER_ROLES.KASIR });
  await User.create({ name: 'Budi Mekanik', email: 'mekanik@example.com', password: 'mekanik123', phone: '081234567892', role: USER_ROLES.MEKANIK });
  await User.create({ name: 'Andi <Pelanggan>', email: 'pelanggan@example.com', password: 'pelanggan123', phone: '081234567893', role: USER_ROLES.PELANGGAN });
  serviceId = String((await Service.create({ name: 'Servis Rutin', description: 'Servis berkala', estimatedPrice: 75000, estimatedDurationMinutes: 60 }))._id);
  partId = String((await Part.create({ code: 'OLI-1', name: 'Oli Mesin', price: 45000, stock: 50, minStock: 1, unit: 'botol' }))._id);

  kasirToken = (await login('kasir@example.com', 'kasir123')).accessToken;
  const mekanik = await login('mekanik@example.com', 'mekanik123');
  mekanikToken = mekanik.accessToken;
  mekanikId = String(mekanik.user._id);
  pelangganToken = (await login('pelanggan@example.com', 'pelanggan123')).accessToken;
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

// --- Booking emails (FR-CUST-01 confirmation, FR-CUST-05 ready for pickup) ---

test('email konfirmasi booking: HTML dan teks, data tiket lengkap, input pengguna di-escape', async () => {
  const r = await call('POST', '/bookings/online', pelangganToken, {
    plateNumber: 'AB 9999 XY', motorModel: 'Yamaha NMAX', complaint: 'Bunyi <script>alert(1)</script>', serviceId,
  });
  assert.equal(r.status, 201, r.body.message);
  const [mail] = mailsFor(r.body.data.bookingNumber, 'Konfirmasi booking');
  assert.ok(mail, 'email konfirmasi tidak terkirim');
  assert.equal(mail.to, 'pelanggan@example.com');

  assert.ok(mail.html?.includes(r.body.data.bookingNumber));
  assert.ok(mail.html?.includes('Servis Rutin'));
  assert.ok(mail.html?.includes('Rp 75.000'));
  assert.ok(mail.html?.includes('Andi &lt;Pelanggan&gt;'));
  assert.ok(mail.html?.includes('&lt;script&gt;'));
  assert.ok(!mail.html?.includes('<script>'), 'HTML dari input pengguna tidak boleh lolos');
  assert.ok(mail.text.includes('AB 9999 XY'));
});

test('email siap diambil (FR-CUST-05): HTML berisi rincian jasa, suku cadang, total, dan jam operasional', async () => {
  const { bookingNumber } = await runWorkflow('Selesai');
  const mails = mailsFor(bookingNumber, 'Motor siap diambil');
  assert.equal(mails.length, 1);
  const [mail] = mails;

  assert.ok(mail.html?.includes('Jasa servis - Servis Rutin'));
  assert.ok(mail.html?.includes('Oli Mesin'));
  assert.ok(mail.html?.includes('Rp 90.000'), 'subtotal suku cadang 2 x 45.000');
  assert.ok(mail.html?.includes('Rp 165.000'), 'total 75.000 + 90.000');
  assert.ok(mail.html?.includes('Senin-Sabtu, 08.00-17.00 WIB'));
  assert.ok(mail.html?.includes('Kampas &lt;rem&gt; diganti'));
  assert.ok(mail.text.includes('Total: Rp 165.000'));
  assert.ok(mail.text.includes('Oli Mesin x2'));
});

test('faktur PDF: data faktur memuat nama kasir yang mencatat Diambil, mekanik, dan rincian baris', async () => {
  const { id, bookingNumber } = await runWorkflow('Diambil');
  const booking = await BookingModel.findById(id);
  assert.ok(booking);

  const data = await loadInvoiceData(booking);
  assert.equal(data.invoiceNumber, bookingNumber);
  assert.equal(data.cashierName, 'Siti Kasir');
  assert.equal(data.mechanicName, 'Budi Mekanik');
  assert.equal(data.rows.length, 2);
  assert.deepEqual(data.rows[1], { description: 'Oli Mesin (OLI-1)', quantity: 2, unitPrice: 45000, subtotal: 90000 });
  assert.equal(data.grandTotal, 165000);
  assert.match(data.pickedUpAt, /WIB$/);
});

test('faktur PDF: pemilik tiket mengunduh file PDF yang valid', async () => {
  const { id } = await runWorkflow('Diambil');
  const r = await call('GET', `/bookings/${id}/invoice/pdf`, pelangganToken);
  assert.equal(r.status, 200);
  assert.match(r.contentType, /application\/pdf/);
  assert.ok(r.raw && r.raw.subarray(0, 5).toString() === '%PDF-', 'isi respons bukan PDF');
  assert.ok(r.raw.length > 3000, 'PDF berisi logo dan tabel, tidak mungkin sekecil ini');

  const kasir = await call('GET', `/bookings/${id}/invoice/pdf`, kasirToken);
  assert.equal(kasir.status, 200);
});

test('faktur PDF: tiket yang belum Diambil ditolak 400', async () => {
  const { id } = await runWorkflow('Selesai');
  const r = await call('GET', `/bookings/${id}/invoice/pdf`, pelangganToken);
  assert.equal(r.status, 400, r.body?.message);
});
