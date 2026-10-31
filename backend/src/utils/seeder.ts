import { connectDatabase, disconnectDatabase } from '../config/db';
import { User } from '../models/user.model';
import { Service } from '../models/service.model';
import { Part } from '../models/part.model';
import { Booking } from '../models/booking.model';
import { BOOKING_TYPE, SERVICE_STATUS, USER_ROLES } from '../constants';
import { jakartaDate, previousJakartaDay } from './jakartaDate';

const defaultUsers = [
  {
    name: 'Administrator MotorCenter',
    email: 'admin@motorcenter.id',
    password: 'admin123',
    role: USER_ROLES.ADMIN,
    phone: '081234567890',
  },
  {
    name: 'Siti Kasir',
    email: 'kasir@motorcenter.id',
    password: 'kasir123',
    role: USER_ROLES.KASIR,
    phone: '081234567891',
  },
  {
    name: 'Budi Santoso (Mekanik Senior)',
    email: 'budi.mekanik@motorcenter.id',
    password: 'mekanik123',
    role: USER_ROLES.MEKANIK,
    phone: '081234567892',
  },
  {
    name: 'Joko Susilo (Mekanik CVT & Mesin)',
    email: 'joko.mekanik@motorcenter.id',
    password: 'mekanik123',
    role: USER_ROLES.MEKANIK,
    phone: '081234567893',
  },
  {
    name: 'Pak Hendra (Pemilik Bengkel)',
    email: 'owner@motorcenter.id',
    password: 'owner123',
    role: USER_ROLES.PEMILIK,
    phone: '081234567894',
  },
  {
    name: 'Andi Pratama (Pelanggan Setia)',
    email: 'andi.pelanggan@gmail.com',
    password: 'pelanggan123',
    role: USER_ROLES.PELANGGAN,
    phone: '081234567895',
  },
];

const defaultServices = [
  {
    name: 'Servis Ringan',
    description: 'Pembersihan filter udara, penyetelan celah katup, pelumasan engsel kabel, dan pengecekan umum.',
    estimatedPrice: 65000,
    estimatedDurationMinutes: 45,
    isActive: true,
  },
  {
    name: 'Ganti Oli & Tune Up',
    description: 'Penggantian oli mesin & gardan, pengecekan busi, serta kalibrasi putaran stasioner mesin.',
    estimatedPrice: 85000,
    estimatedDurationMinutes: 60,
    isActive: true,
  },
  {
    name: 'Servis CVT Lengkap',
    description: 'Bongkar dan bersihkan komponen puli depan/belakang, roller, v-belt, serta pemberian grease khusus CVT.',
    estimatedPrice: 75000,
    estimatedDurationMinutes: 50,
    isActive: true,
  },
  {
    name: 'Servis Sistem Injeksi (Throttle Body)',
    description: 'Pembersihan injektor dengan cairan ultrasonic cleaner dan reset sensor ECU.',
    estimatedPrice: 90000,
    estimatedDurationMinutes: 60,
    isActive: true,
  },
  {
    name: 'Overhaul / Turun Mesin',
    description: 'Bongkar mesin total untuk perbaikan kruk as, ganti seher/piston, skir klep, dan ganti packing.',
    estimatedPrice: 350000,
    estimatedDurationMinutes: 240,
    isActive: true,
  },
];

const defaultParts = [
  {
    code: 'PART-OLI-01',
    name: 'Oli Mesin Shell Advance AX7 10W-40 0.8L',
    stock: 25,
    minStock: 5,
    price: 58000,
    unit: 'botol',
    isActive: true,
  },
  {
    code: 'PART-OLI-02',
    name: 'Oli Gardan / Transmisi Matic 120ml',
    stock: 20,
    minStock: 5,
    price: 18000,
    unit: 'botol',
    isActive: true,
  },
  {
    code: 'PART-BUSI-01',
    name: 'Busi Standar NGK CPR9EA-9',
    stock: 30,
    minStock: 5,
    price: 25000,
    unit: 'pcs',
    isActive: true,
  },
  {
    code: 'PART-REM-01',
    name: 'Kampas Rem Cakram Depan Honda Genuine',
    stock: 15,
    minStock: 3,
    price: 45000,
    unit: 'set',
    isActive: true,
  },
  {
    code: 'PART-REM-02',
    name: 'Kampas Rem Tromol Belakang',
    stock: 2, // Low stock demo!
    minStock: 5,
    price: 40000,
    unit: 'set',
    isActive: true,
  },
  {
    code: 'PART-CVT-01',
    name: 'V-Belt Matic Honda Beat/Vario',
    stock: 8,
    minStock: 2,
    price: 125000,
    unit: 'pcs',
    isActive: true,
  },
  {
    code: 'PART-CVT-02',
    name: 'Roller CVT Set (6 Pcs)',
    stock: 3, // Low stock demo!
    minStock: 5,
    price: 65000,
    unit: 'set',
    isActive: true,
  },
];

export const assertEmptyDatabase = async (): Promise<void> => {
  const counts = await Promise.all([
    User.countDocuments(), Service.countDocuments(), Part.countDocuments(), Booking.countDocuments(),
  ]);
  if (counts.some((count) => count > 0)) {
    throw new Error('Seeder hanya boleh dijalankan pada database kosong; data yang ada tidak diubah');
  }
};

/**
 * Menjalankan proses seeding pada koneksi database yang sudah aktif.
 * Dipakai ulang oleh seeder CLI (seedDatabase) maupun launcher in-memory,
 * tanpa membuka/menutup koneksi atau memanggil process.exit.
 */
export const populateDatabase = async () => {
  await assertEmptyDatabase();

  const createdUsers: Record<string, any> = {};
    for (const userData of defaultUsers) {
      const user = await User.create(userData);
      createdUsers[user.email] = user;
    }

    const createdServices = await Service.insertMany(defaultServices);
    const createdParts = await Part.insertMany(defaultParts);

    const now = new Date();
    const today = jakartaDate(now);
    const yesterday = previousJakartaDay(today);
    const yesterdayNoon = new Date(`${yesterday}T12:00:00+07:00`);
    const prefix = `MC-${today.replaceAll('-', '')}-`;

    const sampleBookings = [
      // Tiket 1: Online Booking (Status: Antre)
      {
        bookingNumber: `${prefix}0001`,
        bookingType: BOOKING_TYPE.ONLINE,
        customerId: createdUsers['andi.pelanggan@gmail.com']._id,
        customerName: createdUsers['andi.pelanggan@gmail.com'].name,
        customerPhone: createdUsers['andi.pelanggan@gmail.com'].phone,
        plateNumber: 'AB 1234 GA',
        motorModel: 'Honda Vario 160 ABS',
        complaint: 'Tarikan awal gredeg dan rem depan kurang pakem',
        serviceId: createdServices[2]._id, // Servis CVT Lengkap
        serviceName: createdServices[2].name,
        status: SERVICE_STATUS.ANTRE,
        serviceFee: createdServices[2].estimatedPrice,
        partsTotalCost: 0,
        grandTotal: createdServices[2].estimatedPrice,
        serviceDate: now,
        statusHistory: [
          {
            status: SERVICE_STATUS.ANTRE,
            changedBy: createdUsers['andi.pelanggan@gmail.com']._id,
            changedAt: now,
            notes: 'Reservasi daring dibuat oleh pelanggan',
          },
        ],
      },
      // Tiket 2: Walk-in Kasir (Status: Dikerjakan, oleh Mekanik Budi)
      {
        bookingNumber: `${prefix}0002`,
        bookingType: BOOKING_TYPE.WALK_IN,
        customerName: 'Bapak Rahmat Hidayat',
        customerPhone: '081298765432',
        plateNumber: 'B 4567 KZZ',
        motorModel: 'Yamaha Aerox 155',
        complaint: 'Ganti oli mesin berkala dan cek kelistrikan',
        serviceId: createdServices[1]._id, // Ganti Oli & Tune Up
        serviceName: createdServices[1].name,
        mechanicId: createdUsers['budi.mekanik@motorcenter.id']._id,
        status: SERVICE_STATUS.DIKERJAKAN,
        mechanicNotes: 'Oli lama sudah dikuras habis, sekarang sedang proses penuangan oli baru dan pembersihan filter udara',
        serviceFee: 50000,
        partsUsed: [
          {
            partId: createdParts[0]._id, // Oli Shell Advance
            code: createdParts[0].code,
            name: createdParts[0].name,
            price: createdParts[0].price,
            quantity: 1,
            subtotal: createdParts[0].price,
            addedAt: now,
          },
        ],
        partsTotalCost: createdParts[0].price,
        grandTotal: 50000 + createdParts[0].price,
        serviceDate: now,
        statusHistory: [
          {
            status: SERVICE_STATUS.ANTRE,
            changedBy: createdUsers['kasir@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 3600000),
            notes: 'Order walk-in dicatat kasir',
          },
          {
            status: SERVICE_STATUS.DIPERIKSA,
            changedBy: createdUsers['budi.mekanik@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 2400000),
            notes: 'Inspeksi awal oleh mekanik Budi',
          },
          {
            status: SERVICE_STATUS.DIKERJAKAN,
            changedBy: createdUsers['budi.mekanik@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 1200000),
            notes: 'Pengerjaan penggantian oli dan tune up',
          },
        ],
      },
      // Tiket 3: Walk-in Kasir (Status: Selesai, siap diambil)
      {
        bookingNumber: `${prefix}0003`,
        bookingType: BOOKING_TYPE.WALK_IN,
        customerName: 'Ibu Ratna Dewi',
        customerPhone: '081388776655',
        plateNumber: 'D 3344 XYZ',
        motorModel: 'Honda Beat Street',
        complaint: 'V-Belt retak dan bunyi berisik di bagian transmisi CVT',
        serviceId: createdServices[2]._id, // Servis CVT
        serviceName: createdServices[2].name,
        mechanicId: createdUsers['joko.mekanik@motorcenter.id']._id,
        status: SERVICE_STATUS.SELESAI,
        mechanicNotes: 'V-Belt lama telah diganti dengan part orisinil, puli telah dibersihkan dan dilumasi grease CVT',
        serviceFee: 75000,
        partsUsed: [
          {
            partId: createdParts[5]._id, // V-Belt Matic
            code: createdParts[5].code,
            name: createdParts[5].name,
            price: createdParts[5].price,
            quantity: 1,
            subtotal: createdParts[5].price,
            addedAt: new Date(now.getTime() - 7200000),
          },
        ],
        partsTotalCost: createdParts[5].price,
        grandTotal: 75000 + createdParts[5].price,
        serviceDate: now,
        completedAt: new Date(now.getTime() - 1800000),
        statusHistory: [
          {
            status: SERVICE_STATUS.ANTRE,
            changedBy: createdUsers['kasir@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 10800000),
          },
          {
            status: SERVICE_STATUS.DIPERIKSA,
            changedBy: createdUsers['joko.mekanik@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 9000000),
          },
          {
            status: SERVICE_STATUS.DIKERJAKAN,
            changedBy: createdUsers['joko.mekanik@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 7200000),
          },
          {
            status: SERVICE_STATUS.SELESAI,
            changedBy: createdUsers['joko.mekanik@motorcenter.id']._id,
            changedAt: new Date(now.getTime() - 1800000),
            notes: 'Servis rampung, motor siap diambil pelanggan',
          },
        ],
      },
      // Tiket 4: Servis Kemarin (Status: Diambil & Lunas)
      {
        bookingNumber: `MC-${yesterday.replaceAll('-', '')}-0001`,
        bookingType: BOOKING_TYPE.WALK_IN,
        customerName: 'Mas Dimas',
        customerPhone: '081512345678',
        plateNumber: 'H 9988 AA',
        motorModel: 'Yamaha Jupiter Z',
        complaint: 'Ganti kampas rem depan cakram',
        serviceId: createdServices[0]._id, // Servis Ringan
        serviceName: createdServices[0].name,
        mechanicId: createdUsers['budi.mekanik@motorcenter.id']._id,
        status: SERVICE_STATUS.DIAMBIL,
        mechanicNotes: 'Kampas rem depan baru terpasang sempurna dan minyak rem telah dikuras',
        serviceFee: 35000,
        partsUsed: [
          {
            partId: createdParts[3]._id, // Kampas Rem Depan
            code: createdParts[3].code,
            name: createdParts[3].name,
            price: createdParts[3].price,
            quantity: 1,
            subtotal: createdParts[3].price,
            addedAt: yesterdayNoon,
          },
        ],
        partsTotalCost: createdParts[3].price,
        grandTotal: 35000 + createdParts[3].price,
        serviceDate: yesterdayNoon,
        completedAt: new Date(yesterdayNoon.getTime() + 3600000),
        pickedUpAt: new Date(yesterdayNoon.getTime() + 7200000),
        statusHistory: [
          {
            status: SERVICE_STATUS.ANTRE,
            changedBy: createdUsers['kasir@motorcenter.id']._id,
            changedAt: yesterdayNoon,
          },
          {
            status: SERVICE_STATUS.SELESAI,
            changedBy: createdUsers['budi.mekanik@motorcenter.id']._id,
            changedAt: new Date(yesterdayNoon.getTime() + 3600000),
          },
          {
            status: SERVICE_STATUS.DIAMBIL,
            changedBy: createdUsers['kasir@motorcenter.id']._id,
            changedAt: new Date(yesterdayNoon.getTime() + 7200000),
            notes: 'Pelanggan telah membayar tunai dan mengambil motor',
          },
        ],
      },
    ];

    await Booking.insertMany(sampleBookings);

    console.log('\n[seeder] Database seeding completed successfully.');
    console.log('---------------------------------------------------------------------------------');
    console.log('| Role        | Email                         | Password       | Status  |');
    console.log('---------------------------------------------------------------------------------');
    console.log('| Admin       | admin@motorcenter.id          | admin123       | Active  |');
    console.log('| Kasir       | kasir@motorcenter.id          | kasir123       | Active  |');
    console.log('| Mekanik 1   | budi.mekanik@motorcenter.id   | mekanik123     | Active  |');
    console.log('| Mekanik 2   | joko.mekanik@motorcenter.id   | mekanik123     | Active  |');
    console.log('| Pemilik     | owner@motorcenter.id          | owner123       | Active  |');
    console.log('| Pelanggan   | andi.pelanggan@gmail.com      | pelanggan123   | Active  |');
    console.log('---------------------------------------------------------------------------------');
    console.log(`[seeder] Generated: 6 users, ${createdServices.length} services, ${createdParts.length} parts, ${sampleBookings.length} bookings.\n`);
};

export const seedDatabase = async () => {
  try {
    console.log('\n======================================================');
    console.log('[seeder] Starting database seeder for MotorCenter...');
    const connection = await connectDatabase();
    if (!connection) throw new Error('Koneksi database gagal; seeder tidak dijalankan');
    await populateDatabase();
    await disconnectDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('[seeder] Seeding failed:', error.message);
    await disconnectDatabase();
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
