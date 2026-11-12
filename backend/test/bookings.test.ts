import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { USER_ROLES, SERVICE_STATUS } from '../src/constants';

let replSet: MongoMemoryReplSet;
let server: Server;
let base: string;
let inactiveServiceId: string;
let activeServiceId: string;
let pelangganToken: string;
let mekanikToken: string;
let mekanikId: string;
let kasirToken: string;


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
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;

  await ensureDatabaseConnection();
  await User.create({ name: 'Pelanggan Test', email: 'pelanggan@example.com', password: 'pelanggan123', phone: '081234567890', role: USER_ROLES.PELANGGAN });
  await User.create({ name: 'Kasir Test', email: 'kasir@example.com', password: 'kasir123', phone: '081234567891', role: USER_ROLES.KASIR });
  const kasir = (await login('kasir@example.com', 'kasir123'));
  kasirToken = kasir.accessToken;
  mekanikId =  (await User.create({ name: 'Mekanik Test', email: 'mekanik@example.com', password: 'mekanik123', phone: '081234567892', role: USER_ROLES.MEKANIK }))._id.toString();
  await Part.create({ code: 'P001', name: 'Oli Mesin', price: 50000, stock: 10, minStock: 1, unit: 'liter' });
  
  const serviceActive = await Service.create({ name: 'Servis Rutin', description: 'Servis rutin kendaraan', estimatedPrice: 200000, estimatedDurationMinutes: 60, isActive: true}); 
  activeServiceId = serviceActive._id.toString();
  const serviceInactive = await Service.create({ name: 'Servis Berat', description: 'Servis berat kendaraan', estimatedPrice: 500000, estimatedDurationMinutes: 120, isActive: false});
  inactiveServiceId = serviceInactive._id.toString();
  const pelanggan = (await login('pelanggan@example.com', 'pelanggan123'));
  const mekanik = (await login('mekanik@example.com', 'mekanik123'));
  mekanikToken = mekanik.accessToken;
  pelangganToken = pelanggan.accessToken;
});

const baseBody = {
    plateNumber: 'B 1234 ABC',
    motorModel: 'Yamaha NMAX',
    complaint: 'Mesin berisik',
  };

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

test('booking online: layanan nonaktif', async () => {
    const r = await call('POST', '/bookings/online', pelangganToken, {...baseBody, serviceId: inactiveServiceId});
    assert.equal(r.status, 404, `booking layanan nonaktif gagal: ${r.body.message}`);
})

test('booking online: serviceId yang tidak ada ditolak 404', async () => {
    const r = await call('POST', '/bookings/online', pelangganToken, {...baseBody, serviceId: new mongoose.Types.ObjectId().toString()});
    assert.equal(r.status, 404, `booking dengan serviceId yang tidak ada gagal: ${r.body.message}`);
})

test('booking online: layanan aktif berhasil 201, status antre', async () => {
    const r = await call('POST', '/bookings/online', pelangganToken, {...baseBody, serviceId: activeServiceId});
    assert.equal(r.status, 201, `booking layanan aktif gagal: ${r.body.message}`);
    assert.match(r.body.data.bookingNumber, /^MC-\d{8}-\d{4}$/)
    assert.equal(r.body.data.status, SERVICE_STATUS.ANTRE, `status booking layanan aktif bukan antre: ${r.body.data.status}`);
})

test('batal dari Diperiksa: stok dikembalikan, partsUsed kosong', async () => {
  // 1. kasir: POST /bookings/walk-in (dengan mechanicId)        → bookingId
  const r1 = await call('POST', '/bookings/walk-in', kasirToken, {customerName: 'Budi', customerPhone: '081234567890', ...baseBody, serviceId: activeServiceId, mechanicId: mekanikId});
  assert.equal(r1.status, 201, `booking walk-in gagal: ${r1.body.message}`);
  // 2. mekanik: PUT /bookings/:id/status { status: 'Diperiksa' }
  const bookingId = r1.body.data._id;
  const r2 = await call('PUT', `/bookings/${bookingId}/status`, mekanikToken, {status: SERVICE_STATUS.DIPERIKSA });
  assert.equal(r2.status, 200, `update status ke Diperiksa gagal: ${r2.body.message}`);
  // 3. mekanik: POST /bookings/:id/parts (pakai 3 unit)          → stok part turun 3
  const r3 = await call('POST', `/bookings/${bookingId}/parts`, mekanikToken, {partId: (await mongoose.model('Part').findOne({code: 'P001'}))._id.toString(), quantity: 3});
  assert.equal(r3.status, 200, `tambah part ke booking gagal: ${r3.body.message}`);
  const partAfter = await mongoose.model('Part').findOne({code: 'P001'});
  assert.equal(partAfter.stock, 7, `stok part tidak berkurang setelah digunakan: ${partAfter.stock}`);
  // 4. kasir: PUT /bookings/:id/status { status: 'Dibatalkan' }  → 200
  const r4 = await call('PUT', `/bookings/${bookingId}/status`, kasirToken, {status: SERVICE_STATUS.DIBATALKAN });
  assert.equal(r4.status, 200, `update status ke Dibatalkan gagal: ${r4.body.message}`);
  // 5. assert: stok kembali ke awal, data.partsUsed.length === 0, data.grandTotal sesuai
  const partAfterCancel = await mongoose.model('Part').findOne({code: 'P001'});
  assert.equal(partAfterCancel.stock, 10, `stok part tidak kembali setelah dibatalkan: ${partAfterCancel.stock}`);
  const bookingAfterCancel = await mongoose.model('Booking').findById(bookingId);
  assert.equal(bookingAfterCancel.partsUsed.length, 0, `partsUsed tidak kosong setelah dibatalkan: ${bookingAfterCancel.partsUsed.length}`);
  assert.equal(bookingAfterCancel.grandTotal, bookingAfterCancel.serviceFee, `grandTotal tidak sesuai setelah dibatalkan: ${bookingAfterCancel.grandTotal}`);

});

test('batal dari Dikerjakan ditolak 400', async () => { 
  const r1 = await call('POST', '/bookings/walk-in', kasirToken, {
    customerName: 'Budi', customerPhone: '081234567890', ...baseBody, serviceId: activeServiceId, mechanicId: mekanikId
  });
  assert.equal(r1.status, 201, `booking walk-in gagal: ${r1.body.message}`);
  const bookingId = r1.body.data._id;
  const r2 = await call('PUT', `/bookings/${bookingId}/status`, mekanikToken, {status: SERVICE_STATUS.DIPERIKSA });
  assert.equal(r2.status, 200, `update status ke Diperiksa gagal: ${r2.body.message}`);
  const r3 = await call('PUT', `/bookings/${bookingId}/status`, mekanikToken, {status: SERVICE_STATUS.DIKERJAKAN });
  assert.equal(r3.status, 200, `update status ke Dikerjakan gagal: ${r3.body.message}`);
  const r4 = await call('PUT', `/bookings/${bookingId}/status`, kasirToken, {status: SERVICE_STATUS.DIBATALKAN });
  assert.equal(r4.status, 400, `update status ke Dibatalkan seharusnya gagal: ${r4.body.message}`);
});
 

test('mekanik tidak bisa membatalkan: 403', async () => { 
  const r1 = await call('POST', '/bookings/walk-in', kasirToken, {
    customerName: 'Budi', customerPhone: '081234567890', ...baseBody, serviceId: activeServiceId, mechanicId: mekanikId
  });
  assert.equal(r1.status, 201, `booking walk-in gagal: ${r1.body.message}`);
  const bookingId = r1.body.data._id;
  const r2 = await call('PUT', `/bookings/${bookingId}/status`, mekanikToken, {status: SERVICE_STATUS.DIBATALKAN });
  assert.equal(r2.status, 403, `mekanik seharusnya tidak bisa membatalkan booking: ${r2.body.message}`);
});