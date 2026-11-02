/**
 * Dev-only launcher: jalankan MotorCenter dengan MongoDB in-memory sementara.
 *
 * Alur:
 *   1. Boot satu instance replica-set mongod in-memory (MongoMemoryReplSet)
 *      agar transaksi multi-dokumen (tambah/hapus suku cadang) didukung penuh.
 *   2. Set process.env.MONGODB_URI ke URI instance tersebut SEBELUM modul
 *      aplikasi (yang membaca env lewat src/config/env.ts) di-import.
 *      dotenv.config() tidak menimpa variabel yang sudah ada, sehingga nilai
 *      ini menang atas placeholder di backend/.env.
 *   3. Seed database kosong memakai seeder yang sudah ada.
 *   4. Start server aplikasi (src/server.ts) yang terhubung ke instance
 *      mongod yang SAMA, sehingga data hasil seeding tetap tersedia selama
 *      proses berjalan.
 *
 * Data disimpan di memori dan hilang begitu proses dihentikan. Tidak ada
 * perubahan pada backend/.env dan tidak perlu instalasi MongoDB / akun cloud.
 *
 * Catatan: file ini TIDAK boleh di-import oleh kode produksi.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const bootstrap = async () => {
  console.log('\n======================================================');
  console.log('[dev:memory] Menyiapkan MongoDB replica-set in-memory sementara...');

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, dbName: 'motorcenter' },
  });
  const uri = replSet.getUri('motorcenter');

  // Harus diset sebelum modul apa pun yang meng-import src/config/env.ts.
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';

  console.log(`[dev:memory] MongoDB in-memory siap di: ${uri}`);

  // Pastikan mongod dihentikan saat proses berakhir.
  const stopMongod = async () => {
    try {
      await replSet.stop();
      console.log('[dev:memory] MongoDB in-memory dihentikan.');
    } catch (error: any) {
      console.error('[dev:memory] Gagal menghentikan MongoDB in-memory:', error?.message ?? error);
    }
  };
  process.on('exit', () => {
    // best-effort; stop() bersifat async tetapi mongod child-process akan
    // dibersihkan oleh library saat proses induk keluar.
    void replSet.stop();
  });
  process.on('SIGINT', async () => {
    await stopMongod();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await stopMongod();
    process.exit(0);
  });

  // Import dinamis AGAR env.ts terbaca dengan MONGODB_URI yang sudah diset.
  const { connectDatabase, disconnectDatabase } = await import('../config/db');
  const { populateDatabase } = await import('../utils/seeder');

  console.log('[dev:memory] Menyemai (seed) database kosong...');
  const connection = await connectDatabase();
  if (!connection) {
    throw new Error('Koneksi ke MongoDB in-memory gagal; seeding dibatalkan');
  }
  await populateDatabase();
  // Tutup koneksi seeding; server akan membuka koneksi baru ke URI yang sama.
  await disconnectDatabase();

  console.log('[dev:memory] Seeding selesai. Menjalankan server aplikasi...');

  // Start server aplikasi; server.ts memanggil connectDatabase() lagi ke
  // instance mongod yang sama (MONGODB_URI tidak berubah).
  await import('../server');
};

bootstrap().catch((error) => {
  console.error('[dev:memory] Gagal menjalankan launcher in-memory:', error);
  process.exit(1);
});
