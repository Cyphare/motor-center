import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env';

// Optional DNS override for local development. Some Windows setups make Node
// read 127.0.0.1 as its DNS server, which breaks the SRV lookup that
// mongodb+srv:// URIs need ("querySrv ECONNREFUSED"). Set DNS_SERVERS in .env
// (comma-separated, e.g. 8.8.8.8,1.1.1.1) to force public resolvers.
const dnsServers = process.env.DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean);
if (dnsServers?.length) {
  dns.setServers(dnsServers);
}

export interface DatabaseStatus {
  status: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown';
  code: number;
  databaseName?: string;
  host?: string;
}

/**
 * Mengambil status koneksi Mongoose saat ini
 */
export const getDatabaseStatus = (): DatabaseStatus => {
  const readyState = mongoose.connection.readyState;
  const statusMap: Record<number, DatabaseStatus['status']> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: statusMap[readyState] || 'unknown',
    code: readyState,
    databaseName: mongoose.connection.name,
    host: mongoose.connection.host,
  };
};

/**
 * Menghubungkan Mongoose ke MongoDB
 */
let listenersRegistered = false;

export const connectDatabase = async (): Promise<typeof mongoose | null> => {
  try {
    if (!listenersRegistered) {
      mongoose.connection.on('connected', () => {
        console.log(`[MongoDB] Berhasil terhubung ke database: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
      });

      mongoose.connection.on('error', (err) => {
        console.error(`[MongoDB] Kesalahan koneksi:`, err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn(`[MongoDB] Koneksi terputus.`);
      });
      listenersRegistered = true;
    }

    console.log(`[MongoDB] Menghubungkan ke MongoDB...`);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    return conn;
  } catch (error: any) {
    console.error(`[MongoDB] Gagal menghubungkan ke MongoDB:`, error.message);
    console.warn(`[MongoDB] Server tetap berjalan. Health check akan melaporkan status disconnected hingga koneksi pulih.`);
    return null;
  }
};

let pendingConnection: Promise<typeof mongoose | null> | undefined;

export const ensureDatabaseConnection = (): Promise<typeof mongoose | null> => {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  return pendingConnection ??= connectDatabase().finally(() => { pendingConnection = undefined; });
};

/**
 * Menutup koneksi Mongoose dengan aman saat graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log(`[MongoDB] Koneksi database berhasil ditutup secara aman.`);
    }
  } catch (error: any) {
    console.error(`[MongoDB] Galat saat menutup koneksi:`, error.message);
  }
};
