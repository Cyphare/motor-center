# Dokumentasi API MotorCenter (Milestone 1)

Dokumentasi resmi seluruh *endpoint* RESTful API backend **MotorCenter** (Sistem Manajemen Bengkel Motor).

* **Base URL**: `http://localhost:8000/api`
* **Format Data**: `application/json`, kecuali faktur `application/pdf`
* **Skema Autentikasi**: `Authorization: Bearer <accessToken>`

---

## Standar Format Amplop Respons

### 1. Respons Berhasil (Success Envelope)
```json
{
  "success": true,
  "message": "Pesan deskriptif keberhasilan operasi",
  "data": { ... }
}
```

### 2. Respons Berhasil Terpaginasi (Paginated Envelope)
```json
{
  "success": true,
  "message": "Daftar data berhasil diambil",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### 3. Respons Galat (Error Envelope)
```json
{
  "success": false,
  "message": "Pesan deskripsi kesalahan sistem atau validasi",
  "errors": [
    {
      "field": "email",
      "message": "Format alamat email tidak valid"
    }
  ]
}
```

---

## 1. System Health Check

### `GET /api/health`
Memeriksa status operasional server backend dan status konektivitas basis data MongoDB live.
* **Hak Akses**: Publik (Tanpa Token).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Sistem backend MotorCenter berjalan normal",
  "data": {
    "app": "MotorCenter",
    "version": "1.0.0",
    "environment": "development",
    "status": "UP",
    "uptimeSeconds": 120,
    "timestamp": "2026-09-29T12:00:00.000Z",
    "database": {
      "status": "connected",
      "code": 1,
      "databaseName": "motorcenter_phase3",
      "host": "ac-yg3jtec-shard-00-00.d4nl6xr.mongodb.net"
    },
    "system": {
      "nodeVersion": "v24.16.0",
      "platform": "win32",
      "memoryUsageMB": {
        "rss": 73.82,
        "heapTotal": 24.78,
        "heapUsed": 22.96
      }
    }
  }
}
```

---

## 2. Autentikasi & Profil Pengguna (`/api/auth`)

### `POST /api/auth/register`
Pendaftaran mandiri akun pelanggan baru. Dilindungi oleh *rate limiter* autentikasi (`20` permintaan / `15` menit per IP).
* **Hak Akses**: Publik.
* **Request Body**:
```json
{
  "name": "Dimas Saputra",
  "email": "dimas.customer@gmail.com",
  "password": "password123",
  "phone": "081298761234"
}
```
* **Sample Response (201 Created)**:
```json
{
  "success": true,
  "message": "Pendaftaran akun berhasil",
  "data": {
    "user": {
      "_id": "674a91b2c45e89a1b2c3d4e5",
      "name": "Dimas Saputra",
      "email": "dimas.customer@gmail.com",
      "role": "pelanggan",
      "phone": "081298761234",
      "isActive": true,
      "createdAt": "2026-09-29T12:05:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### `POST /api/auth/login`
Autentikasi kredensial pengguna (email & password). Dilindungi oleh *rate limiter* autentikasi (`20` permintaan / `15` menit per IP).
* **Hak Akses**: Publik.
* **Request Body**:
```json
{
  "email": "admin@motorcenter.id",
  "password": "admin123"
}
```
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "_id": "674a91b2c45e89a1b2c3d4e0",
      "name": "Administrator MotorCenter",
      "email": "admin@motorcenter.id",
      "role": "admin",
      "phone": "081234567890",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### `GET /api/auth/me`
Mengambil data profil pengguna yang sedang login.
* **Hak Akses**: Semua peran yang terautentikasi (`Bearer Token`).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Data profil berhasil diambil",
  "data": {
    "_id": "674a91b2c45e89a1b2c3d4e0",
    "name": "Administrator MotorCenter",
    "email": "admin@motorcenter.id",
    "role": "admin",
    "phone": "081234567890",
    "isActive": true
  }
}
```

### `PUT /api/auth/me`
Memperbarui nama dan/atau nomor telepon profil pengguna yang sedang login.
* **Hak Akses**: Semua peran yang terautentikasi (`Bearer Token`).
* **Request Body**:
```json
{
  "name": "Dimas Saputra Pratama",
  "phone": "081298761235"
}
```

### `PUT /api/auth/change-password`
Mengganti kata sandi akun yang sedang login dan menaikkan `tokenVersion` pengguna sehingga seluruh token JWT sebelumnya langsung tidak berlaku (`401 Unauthorized`).
* **Hak Akses**: Semua peran yang terautentikasi (`Bearer Token`).
* **Request Body**:
```json
{
  "oldPassword": "password123",
  "newPassword": "newPassword456"
}
```

---

## 3. Manajemen Staf & Pengguna (`/api/users`)

### `POST /api/users`
Membuat akun staf internal bengkel (`admin`, `kasir`, `mekanik`, `pemilik`).
* **Hak Akses**: `admin`.
* **Request Body**:
```json
{
  "name": "Roni Wijaya",
  "email": "roni.mekanik@motorcenter.id",
  "password": "mekanik123",
  "role": "mekanik",
  "phone": "081255554444"
}
```
* **Sample Response (201 Created)**:
```json
{
  "success": true,
  "message": "Akun staf (mekanik) berhasil dibuat",
  "data": {
    "_id": "674a92c1c45e89a1b2c3d4e6",
    "name": "Roni Wijaya",
    "email": "roni.mekanik@motorcenter.id",
    "role": "mekanik",
    "phone": "081255554444",
    "isActive": true
  }
}
```

### `GET /api/users/mechanics`
Mengambil daftar mekanik aktif untuk *dropdown* penugasan servis.
* **Hak Akses**: `admin`, `kasir`.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar mekanik aktif berhasil diambil",
  "data": [
    {
      "_id": "674a91b2c45e89a1b2c3d4e2",
      "name": "Budi Santoso (Mekanik Senior)",
      "email": "budi.mekanik@motorcenter.id",
      "phone": "081234567892",
      "isActive": true
    },
    {
      "_id": "674a91b2c45e89a1b2c3d4e3",
      "name": "Joko Susilo (Mekanik CVT & Mesin)",
      "email": "joko.mekanik@motorcenter.id",
      "phone": "081234567893",
      "isActive": true
    }
  ]
}
```

### `GET /api/users`
Mengambil daftar akun pengguna bengkel secara terpaginasi dengan filter peran, status akun, dan pencarian teks.
* **Hak Akses**: `admin`, `pemilik`.
* **Query opsional**:
  * `page` (number, default: 1)
  * `limit` (number, default: 10, max: 100)
  * `role` (string: `admin`, `kasir`, `mekanik`, `pelanggan`, `pemilik`)
  * `isActive` (boolean: `true`, `false`)
  * `search` (string: mencocokkan nama, email, atau nomor telepon)
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar pengguna berhasil diambil",
  "data": [
    {
      "_id": "674a91b2c45e89a1b2c3d4e1",
      "name": "Budi Santoso",
      "email": "budi.mekanik@motorcenter.id",
      "role": "mekanik",
      "phone": "081234567892",
      "isActive": true,
      "createdAt": "2026-10-01T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /api/users/:id`
Mengambil detail profil akun pengguna berdasarkan ID dokumen MongoDB.
* **Hak Akses**: `admin`, `pemilik`.
* **Path Parameters**: `id` (hex string ObjectId).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Detail pengguna berhasil diambil",
  "data": {
    "_id": "674a91b2c45e89a1b2c3d4e1",
    "name": "Budi Santoso",
    "email": "budi.mekanik@motorcenter.id",
    "role": "mekanik",
    "phone": "081234567892",
    "isActive": true,
    "createdAt": "2026-10-01T08:00:00.000Z",
    "updatedAt": "2026-10-01T08:00:00.000Z"
  }
}
```

### `PATCH /api/users/:id/status`
Mengaktifkan atau menonaktifkan akun pengguna. Backend menolak penonaktifan akun milik sendiri maupun penonaktifan satu-satunya akun `admin` yang masih aktif (`400 Bad Request`).
* **Hak Akses**: `admin`.

---

## 4. Tiket Servis, Alur Pengerjaan, & Stok (`/api/bookings`)

### `GET /api/bookings`
Mengambil daftar tiket servis terpaginasi yang otomatis dibatasi menurut peran pengguna.
* **Query opsional**: `page`, `limit`, `status`, `bookingType`, `plateNumber`, `startDate` (`YYYY-MM-DD` WIB), `endDate` (`YYYY-MM-DD` WIB, inklusif sepanjang hari WIB `00:00:00`–`23:59:59.999` melalui batas `[startOfJakartaDay, nextJakartaDay)`).

### `GET /api/bookings/:id`
Mengambil informasi terperinci satu tiket servis lengkap dengan data relasi terpopulasi (`mechanicId`, `serviceId`, `customerId`).
* **Hak Akses**:
  * `admin`, `kasir`, `pemilik`: Bebas melihat seluruh tiket.
  * `mekanik`: Hanya dapat melihat tiket yang ditugaskan kepadanya.
  * `pelanggan`: Hanya dapat melihat tiket online miliknya sendiri.
* **Path Parameters**: `id` (hex string ObjectId).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Detail tiket servis berhasil diambil",
  "data": {
    "_id": "674a93c1c45e89a1b2c3d4e7",
    "bookingNumber": "MC-20261015-0001",
    "bookingType": "online",
    "customerName": "Dimas Anggara",
    "customerPhone": "081299998888",
    "plateNumber": "B 1234 XYZ",
    "motorModel": "Honda Vario 160",
    "complaint": "Tarikan awal bergetar dan rem depan kurang pakem",
    "status": "Dikerjakan",
    "serviceFee": 75000,
    "partsTotalCost": 45000,
    "grandTotal": 120000,
    "mechanicNotes": "Roller CVT aus, kampas rem depan diganti",
    "partsUsed": [
      {
        "_id": "674a95a1c45e89a1b2c3d4e9",
        "partId": "674a94b1c45e89a1b2c3d4e8",
        "partCode": "KAMPAS-VARIO",
        "name": "Kampas Rem Depan Vario",
        "quantity": 1,
        "price": 45000,
        "subtotal": 45000
      }
    ],
    "mechanicId": {
      "_id": "674a91b2c45e89a1b2c3d4e2",
      "name": "Budi Santoso",
      "phone": "081234567892",
      "email": "budi.mekanik@motorcenter.id"
    },
    "serviceId": {
      "_id": "674a90a1c45e89a1b2c3d4e0",
      "name": "Servis Ringan & CVT",
      "description": "Pembersihan CVT, cek kelistrikan, dan setel rem",
      "estimatedPrice": 75000,
      "estimatedDurationMinutes": 60
    },
    "customerId": {
      "_id": "674a90b1c45e89a1b2c3d4e5",
      "name": "Dimas Anggara",
      "phone": "081299998888",
      "email": "dimas.pelanggan@gmail.com"
    },
    "createdAt": "2026-10-15T02:00:00.000Z",
    "updatedAt": "2026-10-15T03:30:00.000Z"
  }
}
```

### `POST /api/bookings/online`
Pelanggan terdaftar melakukan booking servis daring. Nomor tiket `MC-YYYYMMDD-XXXX` dialokasikan secara atomik melalui koleksi `Counter` dengan mekanisme *retry* otomatis terhadap benturan indeks unik.
* **Hak Akses**: `pelanggan`.
* **Request Body**:
```json
{
  "plateNumber": "AB 1234 GA",
  "motorModel": "Honda Vario 160 ABS",
  "complaint": "Tarikan awal gredeg dan rem depan kurang pakem",
  "serviceDate": "2026-10-01T08:30:00.000Z"
}
```
* **Sample Response (201 Created)**:
```json
{
  "success": true,
  "message": "Reservasi online berhasil dibuat",
  "data": {
    "_id": "674a93a1c45e89a1b2c3d4f1",
    "bookingNumber": "MC-20260929-0001",
    "bookingType": "online",
    "customerName": "Andi Pratama",
    "customerPhone": "081234567895",
    "plateNumber": "AB 1234 GA",
    "motorModel": "Honda Vario 160 ABS",
    "complaint": "Tarikan awal gredeg dan rem depan kurang pakem",
    "status": "Antre",
    "serviceFee": 0,
    "partsTotalCost": 0,
    "grandTotal": 0,
    "partsUsed": [],
    "statusHistory": [
      {
        "status": "Antre",
        "changedAt": "2026-09-29T12:10:00.000Z",
        "notes": "Reservasi servis online berhasil dibuat oleh pelanggan"
      }
    ]
  }
}
```

### `POST /api/bookings/walk-in`
Kasir/Admin mencatat kendaraan yang datang langsung ke bengkel.
* **Hak Akses**: `admin`, `kasir`.
* **Request Body**:
```json
{
  "customerName": "Bapak Sugeng",
  "customerPhone": "081399887766",
  "plateNumber": "AB 5678 XY",
  "motorModel": "Yamaha NMAX 155",
  "complaint": "Ganti oli rutin dan cek CVT",
  "serviceFee": 45000
}
```
* **Sample Response (201 Created)**:
```json
{
  "success": true,
  "message": "Tiket servis walk-in berhasil dibuat",
  "data": {
    "_id": "674a93b2c45e89a1b2c3d4f2",
    "bookingNumber": "MC-20260929-0002",
    "bookingType": "walk-in",
    "customerName": "Bapak Sugeng",
    "customerPhone": "081399887766",
    "plateNumber": "AB 5678 XY",
    "motorModel": "Yamaha NMAX 155",
    "complaint": "Ganti oli rutin dan cek CVT",
    "status": "Antre",
    "serviceFee": 45000,
    "grandTotal": 45000
  }
}
```

### `PUT /api/bookings/:id/assign`
Menugaskan mekanik penanggung jawab ke tiket servis.
* **Hak Akses**: `admin`, `kasir`.
* **Request Body**:
```json
{
  "mechanicId": "674a91b2c45e89a1b2c3d4e2"
}
```
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Mekanik Budi Santoso berhasil ditugaskan ke tiket MC-20260929-0002",
  "data": {
    "_id": "674a93b2c45e89a1b2c3d4f2",
    "bookingNumber": "MC-20260929-0002",
    "mechanicId": "674a91b2c45e89a1b2c3d4e2"
  }
}
```

### `PUT /api/bookings/:id/status`
Memperbarui status pengerjaan tiket servis secara bertahap (`Antre` $\rightarrow$ `Diperiksa` $\rightarrow$ `Dikerjakan` $\rightarrow$ `Selesai` $\rightarrow$ `Diambil`, atau pembatalan `Antre` $\rightarrow$ `Dibatalkan`).
* **Hak Akses**: `admin`, `kasir`, `mekanik` (khusus tiket tugasnya). Pembatalan tiket (`Dibatalkan`), pelunasan/serah-terima (`Diambil`), serta penetapan/perubahan `serviceFee` dibatasi hanya untuk `admin` dan `kasir` (`mekanik` mendapat `403 Forbidden`).
* **Request Body**:
```json
{
  "status": "Dikerjakan",
  "serviceFee": 50000,
  "mechanicNotes": "Pembersihan CVT selesai, lanjut penggantian oli mesin."
}
```
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Status tiket servis berhasil diubah ke 'Dikerjakan'",
  "data": {
    "_id": "674a93b2c45e89a1b2c3d4f2",
    "bookingNumber": "MC-20260929-0002",
    "status": "Dikerjakan",
    "serviceFee": 50000,
    "mechanicNotes": "Pembersihan CVT selesai, lanjut penggantian oli mesin."
  }
}
```

### `POST /api/bookings/:id/parts`
Mekanik menambahkan suku cadang ke tiket servis. Stok gudang dan tiket diperbarui dalam satu transaksi MongoDB; jika penyimpanan tiket gagal, potongan stok dibatalkan.
* **Hak Akses**: `admin`, `kasir`, `mekanik` (tiket tugasnya).
* **Request Body**:
```json
{
  "partId": "674a91b2c45e89a1b2c3d4a1",
  "quantity": 1
}
```
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Suku cadang 'Oli Mesin Shell Advance AX7 10W-40 0.8L' (x1) berhasil ditambahkan ke tiket servis",
  "data": {
    "_id": "674a93b2c45e89a1b2c3d4f2",
    "bookingNumber": "MC-20260929-0002",
    "serviceFee": 50000,
    "partsTotalCost": 58000,
    "grandTotal": 108000,
    "partsUsed": [
      {
        "_id": "674a94f1c45e89a1b2c3d4bb",
        "partId": "674a91b2c45e89a1b2c3d4a1",
        "code": "PART-OLI-01",
        "name": "Oli Mesin Shell Advance AX7 10W-40 0.8L",
        "price": 58000,
        "quantity": 1,
        "subtotal": 58000,
        "addedAt": "2026-09-29T12:20:00.000Z"
      }
    ]
  }
}
```

### `DELETE /api/bookings/:id/parts/:partItemId`
Membatalkan pemakaian suku cadang dari tiket servis. Pengembalian stok dan perubahan tiket berada dalam satu transaksi MongoDB.
* **Hak Akses**: `admin`, `kasir`, `mekanik` (tiket tugasnya).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Suku cadang 'Oli Mesin Shell Advance AX7 10W-40 0.8L' berhasil dibatalkan dan stok dikembalikan ke gudang",
  "data": {
    "_id": "674a93b2c45e89a1b2c3d4f2",
    "bookingNumber": "MC-20260929-0002",
    "serviceFee": 50000,
    "partsTotalCost": 0,
    "grandTotal": 50000,
    "partsUsed": []
  }
}
```

---

---

## 5. Katalog Suku Cadang (`/api/parts`)

Manajemen inventaris suku cadang, stok gudang, dan ambang batas minimum (*min stock*).

### `GET /api/parts`
Mengambil daftar seluruh suku cadang aktif (atau seluruhnya termasuk nonaktif).
* **Hak Akses**: `admin`, `kasir`, `mekanik`, `pemilik`.
* **Query opsional**:
  * `includeInactive` (boolean: `true` / `false`, hanya diizinkan untuk `admin`, `kasir`, `pemilik`).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar suku cadang berhasil diambil",
  "data": [
    {
      "_id": "674a94b1c45e89a1b2c3d4e8",
      "code": "OLI-MPX2",
      "name": "Oli Mesin MPX 2 0.8L",
      "unit": "botol",
      "price": 55000,
      "stock": 48,
      "minStock": 10,
      "isActive": true
    }
  ]
}
```

### `GET /api/parts/low-stock`
Mengambil daftar suku cadang yang stoknya berada pada atau di bawah batas minimum (`stock <= minStock`). Digunakan untuk peringatan restok gudang.
* **Hak Akses**: `admin`, `pemilik`.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar stok rendah berhasil diambil",
  "data": [
    {
      "_id": "674a94b1c45e89a1b2c3d4e9",
      "code": "BUSI-CPR9",
      "name": "Busi NGK CPR9EA-9",
      "unit": "pcs",
      "price": 28000,
      "stock": 3,
      "minStock": 10,
      "isActive": true
    }
  ]
}
```

### `GET /api/parts/:id`
Mengambil detail satu suku cadang berdasarkan ID dokumen MongoDB.
* **Hak Akses**: `admin`, `kasir`, `mekanik`, `pemilik`.
* **Query opsional**: `includeInactive` (`true` / `false`, memerlukan hak akses staf).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Detail suku cadang berhasil diambil",
  "data": {
    "_id": "674a94b1c45e89a1b2c3d4e8",
    "code": "OLI-MPX2",
    "name": "Oli Mesin MPX 2 0.8L",
    "unit": "botol",
    "price": 55000,
    "stock": 48,
    "minStock": 10,
    "isActive": true
  }
}
```

### `POST /api/parts`
Menambahkan data suku cadang baru ke master inventaris.
* **Hak Akses**: `admin`, `kasir`.
* **Request Body**:
```json
{
  "code": "OLI-MPX2",
  "name": "Oli Mesin MPX 2 0.8L",
  "unit": "botol",
  "price": 55000,
  "stock": 50,
  "minStock": 10
}
```
* **Sample Response (201 Created)**:
```json
{
  "success": true,
  "message": "Suku cadang berhasil dibuat",
  "data": {
    "_id": "674a94b1c45e89a1b2c3d4e8",
    "code": "OLI-MPX2",
    "name": "Oli Mesin MPX 2 0.8L",
    "unit": "botol",
    "price": 55000,
    "stock": 50,
    "minStock": 10,
    "isActive": true
  }
}
```

### `PUT /api/parts/:id`
Memperbarui informasi suku cadang (harga, nama, satuan, stok, atau batas minimum). Field `stock` di sini **menimpa** nilai stok, sehingga hanya cocok untuk koreksi hasil *stock opname*. Untuk penerimaan barang masuk, gunakan `PATCH /api/parts/:id/restock`.
* **Hak Akses**: `admin`, `kasir`.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Suku cadang berhasil diperbarui",
  "data": {
    "_id": "674a94b1c45e89a1b2c3d4e8",
    "code": "OLI-MPX2",
    "name": "Oli Mesin MPX 2 0.8L",
    "unit": "botol",
    "price": 58000,
    "stock": 45,
    "minStock": 10,
    "isActive": true
  }
}
```

### `PATCH /api/parts/:id/restock`
Menambah stok suku cadang secara **atomik** (`$inc`) saat barang masuk dari pemasok. Karena penambahan dihitung oleh database, restock aman dijalankan bersamaan dengan pemotongan stok dari tiket servis (`POST /api/bookings/:id/parts`) tanpa ada perubahan yang hilang (*lost update*).
* **Hak Akses**: `admin`, `kasir`.
* **Request Body** (field lain ditolak):
  * `quantity` (Number, Wajib): bilangan bulat, minimal `1`. String seperti `"5"` ditolak.
  * `note` (String, Opsional): catatan restock, maksimal 200 karakter. Saat ini divalidasi tetapi belum disimpan.
```json
{
  "quantity": 20,
  "note": "Kiriman pemasok"
}
```
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Stok Oli Mesin MPX 2 0.8L berhasil ditambah sebanyak 20 botol",
  "data": {
    "_id": "674a94b1c45e89a1b2c3d4e8",
    "code": "OLI-MPX2",
    "name": "Oli Mesin MPX 2 0.8L",
    "unit": "botol",
    "price": 58000,
    "stock": 65,
    "minStock": 10,
    "isActive": true,
    "isLowStock": false
  }
}
```
* **Galat**: `400` (id atau body tidak valid), `401` (tanpa token atau token tidak valid), `403` (peran selain admin/kasir), `404` (suku cadang tidak ditemukan atau nonaktif).

### `DELETE /api/parts/:id`
Menonaktifkan suku cadang (*soft delete*) dengan mengubah `isActive: false` tanpa merusak riwayat transaksi servis masa lalu.
* **Hak Akses**: `admin`, `kasir`.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Suku cadang berhasil dinonaktifkan",
  "data": {
    "_id": "674a94b1c45e89a1b2c3d4e8",
    "code": "OLI-MPX2",
    "isActive": false
  }
}
```

---

## 6. Katalog Layanan Servis (`/api/services`)

Master data jenis jasa dan paket servis yang ditawarkan oleh bengkel motor.

### `GET /api/services`
Mengambil daftar seluruh layanan servis aktif yang tersedia untuk booking online dan walk-in.
* **Hak Akses**: Publik (Tanpa token).
* **Query opsional**:
  * `includeInactive` (boolean: `true` / `false`, memerlukan token `admin`, `kasir`, atau `pemilik`).
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar layanan berhasil diambil",
  "data": [
    {
      "_id": "674a90a1c45e89a1b2c3d4e0",
      "name": "Servis Lengkap Motor Matic",
      "description": "Pembersihan injektor, CVT, ganti oli, dan pengecekan kelistrikan",
      "estimatedPrice": 120000,
      "estimatedDurationMinutes": 90,
      "isActive": true
    }
  ]
}
```

### `GET /api/services/:id`
Mengambil informasi lengkap satu layanan servis berdasarkan ID dokumen.
* **Hak Akses**: Publik (Tanpa token). Jika `includeInactive=true`, memerlukan token staf.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Detail layanan berhasil diambil",
  "data": {
    "_id": "674a90a1c45e89a1b2c3d4e0",
    "name": "Servis Lengkap Motor Matic",
    "description": "Pembersihan injektor, CVT, ganti oli, dan pengecekan kelistrikan",
    "estimatedPrice": 120000,
    "estimatedDurationMinutes": 90,
    "isActive": true
  }
}
```

### `POST /api/services`
Menambahkan paket layanan servis baru ke dalam sistem.
* **Hak Akses**: `admin`, `kasir`.
* **Request Body**:
```json
{
  "name": "Servis Rutin Berkala",
  "description": "Pengecekan standar 10 titik dan setel rem",
  "estimatedPrice": 50000,
  "estimatedDurationMinutes": 45
}
```
* **Sample Response (201 Created)**:
```json
{
  "success": true,
  "message": "Layanan berhasil dibuat",
  "data": {
    "_id": "674a90a1c45e89a1b2c3d4e1",
    "name": "Servis Rutin Berkala",
    "description": "Pengecekan standar 10 titik dan setel rem",
    "estimatedPrice": 50000,
    "estimatedDurationMinutes": 45,
    "isActive": true
  }
}
```

### `PUT /api/services/:id`
Memperbarui informasi paket layanan servis.
* **Hak Akses**: `admin`, `kasir`.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Layanan berhasil diperbarui",
  "data": {
    "_id": "674a90a1c45e89a1b2c3d4e1",
    "name": "Servis Rutin Berkala Plus",
    "estimatedPrice": 60000,
    "isActive": true
  }
}
```

### `DELETE /api/services/:id`
Menonaktifkan paket layanan (*soft delete*, `isActive: false`).
* **Hak Akses**: `admin`, `kasir`.
* **Sample Response (200 OK)**:
```json
{
  "success": true,
  "message": "Layanan berhasil dinonaktifkan",
  "data": {
    "_id": "674a90a1c45e89a1b2c3d4e1",
    "name": "Servis Rutin Berkala Plus",
    "isActive": false
  }
}
```

## 7. Laporan, Email, dan Faktur (Fase 5)

Omzet dihitung hanya dari tiket berstatus `Diambil`, memakai `pickedUpAt` serta snapshot `serviceFee` dan `partsTotalCost`. Semua batas hari menggunakan `Asia/Jakarta` (WIB).

### `GET /api/reports/dashboard`

* **Hak Akses**: `admin`, `pemilik`.
* **Respons 200**: `data.date` (`YYYY-MM-DD` WIB), `revenueToday`, `revenueMonth`, `activeTickets` (jumlah saat ini untuk `Antre`, `Diperiksa`, `Dikerjakan`), `completedToday` (tiket yang mencapai `Selesai` hari ini), dan `lowStockParts` (part aktif dengan `stock <= minStock`).

### `GET /api/reports/revenue`

* **Hak Akses**: `admin`, `pemilik`.
* **Query opsional**: `startDate` dan `endDate` dalam format `YYYY-MM-DD`, wajib dipakai bersama dan tidak boleh terbalik. Keduanya inklusif menurut WIB. Tanpa query, rentang tanggal 1 bulan berjalan sampai hari ini.
* **Respons 200**: `data.startDate`, `endDate`, `serviceTotal`, `partsTotal`, `revenue`, dan `days`. Setiap elemen `days` berisi `date`, `serviceTotal`, `partsTotal`, `revenue`, `ticketCount`; hari tanpa transaksi tidak muncul. Rentang kosong menghasilkan total nol dan `days: []`.

### `GET /api/bookings/:id/invoice/pdf`

* **Hak Akses**: `admin`, `kasir`, `pemilik`, atau pelanggan pemilik tiket online. Mekanik dan pelanggan lain mendapat `403`.
* **Syarat**: tiket sudah `Diambil` dan memiliki `pickedUpAt`; sebelum itu respons `400`.
* **Respons 200**: stream PDF A4 dengan `Content-Type: application/pdf`. Nomor faktur memakai `bookingNumber`; isi mencakup pelanggan, kendaraan, tanggal pengambilan WIB, jasa, snapshot suku cadang, dan total. Berkas tidak disimpan di database.

### Email otomatis

Booking online mengirim konfirmasi ke email akun pelanggan. Saat tiket online menjadi `Selesai`, email kedua memuat estimasi jasa, part, dan total. Tiket walk-in tidak mengirim email. Tanpa konfigurasi SMTP, backend memakai Ethereal dan mencatat URL pratinjau; isi `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, dan `SMTP_FROM` bersama untuk pengiriman nyata. Kegagalan email dicatat setelah tiket tersimpan dan tidak mengubah respons sukses; tidak ada pengiriman ulang otomatis.

---

## 8. Ringkasan Kode Galat HTTP (HTTP Error Codes)

| Status Code | Kondisi Pemicu | Format Response Galat |
| :---: | :--- | :--- |
| **`400 Bad Request`** | Input schema Zod tidak valid, transisi status servis melompat, atau stok gudang kurang | `{"success": false, "message": "...", "errors": [...]}` |
| **`401 Unauthorized`** | Header Authorization tidak ada, format token salah, atau sesi JWT telah kedaluwarsa / dicabut | `{"success": false, "message": "Akses ditolak: Autentikasi diperlukan"}` |
| **`403 Forbidden`** | Peran (RBAC) tidak berhak (misal: Pelanggan panggil API Admin, atau Mekanik batalkan/ubah biaya jasa tiket) | `{"success": false, "message": "Akses ditolak: Peran tidak memiliki wewenang"}` |
| **`404 Not Found`** | Rute endpoint tidak ada atau dokumen ID (user, booking, part) tidak ditemukan di database | `{"success": false, "message": "Data atau sumber daya tidak ditemukan"}` |
| **`409 Conflict`** | Terjadi duplikasi data unik (misal: email atau kode part sudah pernah terdaftar di MongoDB) | `{"success": false, "message": "Data email sudah terdaftar"}` |
| **`429 Too Many Requests`** | Batas *rate limit* IP terlampaui pada endpoint API umum atau autentikasi | `{"success": false, "message": "Terlalu banyak percobaan..."}` |
| **`500 Internal Server Error`** | Galat sistem tak tertangani | `{"success": false, "message": "Terjadi kesalahan internal pada server"}` |
