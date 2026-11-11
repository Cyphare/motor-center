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
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;

  await ensureDatabaseConnection();
  await User.create({ name: 'Pelanggan Test', email: 'pelanggan@example.com', password: 'pelanggan123', phone: '081234567890', role: USER_ROLES.PELANGGAN });
  const serviceActive = await Service.create({ name: 'Servis Rutin', description: 'Servis rutin kendaraan', estimatedPrice: 200000, estimatedDurationMinutes: 60, isActive: true}); 
  activeServiceId = serviceActive._id.toString();
  const serviceInactive = await Service.create({ name: 'Servis Berat', description: 'Servis berat kendaraan', estimatedPrice: 500000, estimatedDurationMinutes: 120, isActive: false});
  inactiveServiceId = serviceInactive._id.toString();
  const pelanggan = (await login('pelanggan@example.com', 'pelanggan123'));
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

