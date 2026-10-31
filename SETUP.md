# MotorCenter — Setup & Run

This monorepo has two apps:

- `backend/` — Express + TypeScript + Mongoose REST API (runs on `http://localhost:8000`, API base `/api`).
- `frontend/` — Next.js (App Router) UI (runs on `http://localhost:3000`).

Package manager: **pnpm 11.x** (Node 20+).

---

## ⚠️ Database: dummy by default — how to connect a real one

By design, the app ships with a **placeholder** MongoDB connection string so it
never points at a real cluster out of the box. In `backend/.env`:

```env
MONGODB_URI=YOUR_ATLAS_CONNECTION_STRING
```

`YOUR_ATLAS_CONNECTION_STRING` is a **dummy placeholder, not a working database**.
The server starts, but any route that needs the database returns `503 Database
tidak tersedia` until you supply a real connection string. `GET /api/health`
still responds and reports the database status.

### Switch to a real MongoDB Atlas database

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas), add a
   database user, and allow your IP under Network Access.
2. Copy the cluster's connection string and edit `backend/.env`, replacing the
   placeholder with your real string (keep the `motorcenter_phase3` database name):

   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.xxxx.mongodb.net/motorcenter_phase3
   ```

   Replace `user`, `pass`, and `cluster.xxxx` with your own values.
3. Seed the database **once** (it only populates an empty database and refuses a
   populated one) and start the API:

   ```bash
   cd backend
   pnpm install
   pnpm run seed
   pnpm run dev
   ```

> **Never commit real credentials.** `backend/.env` and `frontend/.env.local`
> are gitignored. Only the `*.env.example` templates are tracked. The default
> `backend/.env` MONGODB_URI must stay the placeholder — do **not** change the
> app default to an in-memory database.

---

## 1. Backend

```bash
cd backend
pnpm install
# edit .env (see the database section above)
pnpm run seed    # one-time, only on an empty database
pnpm run dev     # http://localhost:8000  (API at /api, health at /api/health)
```

Useful scripts: `pnpm run typecheck` (tsc --noEmit), `pnpm run build`, `pnpm run start`.

Email: if no SMTP variables are set in `backend/.env`, outgoing mail falls back
to [Ethereal](https://ethereal.email) and the server logs a preview URL — no
real email is sent.

## 2. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local     # PowerShell: Copy-Item .env.example .env.local
pnpm run dev                   # http://localhost:3000
```

Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` if the backend is not at
`http://localhost:8000/api`. See [`frontend/README.md`](frontend/README.md) for
the full command list, role map, and seeded accounts.

## 3. Seeded accounts

After `pnpm run seed` (backend), log in with any of:

| Role      | Email                         | Password       |
| --------- | ----------------------------- | -------------- |
| admin     | `admin@motorcenter.id`        | `admin123`     |
| kasir     | `kasir@motorcenter.id`        | `kasir123`     |
| mekanik   | `budi.mekanik@motorcenter.id` | `mekanik123`   |
| mekanik   | `joko.mekanik@motorcenter.id` | `mekanik123`   |
| pemilik   | `owner@motorcenter.id`        | `owner123`     |
| pelanggan | `andi.pelanggan@gmail.com`    | `pelanggan123` |
