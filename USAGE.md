# MotorCenter — Complete Usage Guide

A digital management system for a motorcycle workshop ("bengkel motor"): service
ticket workflow, spare-part inventory with automatic stock deduction, service
history, role-based access, PDF invoices, and email notifications.

This monorepo has two apps:

| App         | Stack                                             | URL                     |
| ----------- | ------------------------------------------------- | ----------------------- |
| `backend/`  | Express + TypeScript + Mongoose (MongoDB)         | `http://localhost:8000` |
| `frontend/` | Next.js (App Router) + React + Tailwind + shadcn  | `http://localhost:3000` |

Package manager: **pnpm 11.x**. Runtime: **Node 20+** (tested on Node 24/26).

Related docs: [`SETUP.md`](SETUP.md) (quick setup), [`README.md`](README.md)
(project overview), [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) (full API),
[`frontend/README.md`](frontend/README.md) (frontend details).

---

## Table of contents

1. [Managing the repository](#1-managing-the-repository)
2. [Running the apps locally](#2-running-the-apps-locally)
3. [Connecting a real database](#3-connecting-a-real-database)
4. [Using the website](#4-using-the-website)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Managing the repository

### Layout

```text
bengkel-motor-6/
├── backend/          # Express API (already complete)
├── frontend/         # Next.js UI
├── API_DOCUMENTATION.md
├── README.md
├── SETUP.md          # quick setup + DB switch
└── USAGE.md          # this file
```

### Everyday git workflow

The frontend was built on `main` and committed locally but **not yet pushed**.
Check the state at any time:

```bash
git status            # what changed
git log --oneline -10 # recent history
```

Push the local commits to GitHub (first push sets the upstream):

```bash
git push -u origin main
```

Make and record your own changes:

```bash
git add <specific files>        # stage only what you mean to commit
git commit -m "feat: your message"
git push
```

Pull teammates' changes before you start work:

```bash
git pull --rebase origin main
```

### What is and isn't tracked

- **Ignored (never committed):** `backend/.env`, `frontend/.env.local`,
  `node_modules/`, build output (`frontend/.next/`, `backend/dist/`).
- **Tracked templates:** `backend/.env.example`, `frontend/.env.example`.
- **Rule:** never commit real credentials or connection strings. Keep secrets in
  the gitignored `.env` files only.

### Keeping dependencies in sync

After pulling changes that touch `package.json`, reinstall:

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

---

## 2. Running the apps locally

You need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — backend

```bash
cd backend
pnpm install
# edit backend/.env first (see section 3) — it ships with a dummy DB string
pnpm run seed     # one-time, only on an empty database
pnpm run dev      # http://localhost:8000
```

Backend scripts:

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `pnpm run dev`       | Start API with auto-reload (tsx watch)        |
| `pnpm run build`     | Compile TypeScript to `dist/`                 |
| `pnpm run start`     | Run the compiled production build             |
| `pnpm run typecheck` | Type-check only (no output)                   |
| `pnpm run seed`      | Populate demo data (empty DB only)            |
| `pnpm run dev:memory`| Run against a throwaway in-memory DB (see below) |

Health check: open `http://localhost:8000/api/health`. Look for
`data.database.status: "connected"` — if it says disconnected, your DB string
is still the placeholder or wrong (see section 3).

### Try it with a throwaway in-memory database

Want to log in and click through the app without installing MongoDB or signing
up for a cloud account? Run the dev-only in-memory launcher:

```bash
cd backend
pnpm install
pnpm run dev:memory   # http://localhost:8000
```

What it does, all in one process:

1. Boots a temporary, local MongoDB (`mongodb-memory-server`) that lives only in
   memory.
2. Points the API at that instance **without touching `backend/.env`** — the
   committed `MONGODB_URI` stays the placeholder.
3. Seeds the demo data, then starts the normal server so the seeded data is
   there for the whole session.

No MongoDB install and no cloud account are needed. On first run it downloads a
MongoDB binary once (cached for later runs). **All data is wiped when you stop
the process** (`Ctrl+C`) — it's a throwaway playground, not persistent storage.

Then start the frontend (Terminal 2 below) and log in with any of the seeded
[demo accounts](#4-using-the-website) — for example `admin@motorcenter.id` /
`admin123`.

> The first time MongoDB's URI is a random free port internally; the API itself
> still listens on `http://localhost:8000` as usual. Set `PORT` if 8000 is busy,
> e.g. `PORT=8099 pnpm run dev:memory`.

### Terminal 2 — frontend

```bash
cd frontend
pnpm install
# frontend/.env.local already points at http://localhost:8000/api
pnpm run dev      # http://localhost:3000
```

Frontend scripts:

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `pnpm run dev`     | Start the Next.js dev server          |
| `pnpm run build`   | Production build                      |
| `pnpm run start`   | Serve the production build            |
| `pnpm run lint`    | ESLint                                |
| `pnpm run test`    | Run the unit tests (vitest)           |

Then open **`http://localhost:3000`** in your browser.

> Note: these dev servers run in the foreground and keep running. Start each in
> its own terminal; stop with `Ctrl+C`.

---

## 3. Connecting a real database

By design the app ships with a **dummy placeholder** so it never points at a real
cluster by accident. In `backend/.env`:

```env
MONGODB_URI=YOUR_ATLAS_CONNECTION_STRING
```

With the placeholder in place, the server still starts and `GET /api/health`
responds, but any route that touches the database returns
`503 Database tidak tersedia` until you supply a real string.

### Option A — MongoDB Atlas (cloud, recommended)

1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. Under **Database Access**, add a database user (username + password).
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for any IP while testing).
4. Click **Connect → Drivers** and copy the connection string. It looks like:
   `mongodb+srv://user:pass@cluster.xxxx.mongodb.net/`
5. Edit `backend/.env` and replace the placeholder, keeping the
   `motorcenter_phase3` database name at the end:

   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.xxxx.mongodb.net/motorcenter_phase3
   ```

6. Seed once and start:

   ```bash
   cd backend
   pnpm run seed
   pnpm run dev
   ```

### Option B — Local MongoDB

1. Install MongoDB Community Server and make sure it's running (default port 27017).
2. In `backend/.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/motorcenter_phase3
   ```

3. Seed and run as above.

### Pointing the frontend at a different backend

If the backend is deployed somewhere else, set this in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain/api
```

Restart `pnpm run dev` after changing env files.

> **Security:** never commit real credentials. `backend/.env` is gitignored.
> Keep the committed default as the placeholder.

---

## 4. Using the website

### Log in

Open `http://localhost:3000`. Customers can **Register** a new account; staff use
seeded accounts. After seeding an empty database, these accounts exist:

| Role        | Email                         | Password       | What they do                                         |
| ----------- | ----------------------------- | -------------- | ---------------------------------------------------- |
| `admin`     | `admin@motorcenter.id`        | `admin123`     | Full access, staff management, master data           |
| `kasir`     | `kasir@motorcenter.id`        | `kasir123`     | Walk-in tickets, assign mechanic, checkout           |
| `mekanik`   | `budi.mekanik@motorcenter.id` | `mekanik123`   | Update ticket status, add/remove parts               |
| `mekanik`   | `joko.mekanik@motorcenter.id` | `mekanik123`   | Same as above                                        |
| `pemilik`   | `owner@motorcenter.id`        | `owner123`     | Revenue reports, dashboard, low-stock overview       |
| `pelanggan` | `andi.pelanggan@gmail.com`    | `pelanggan123` | Online booking, track own service                    |

After login you are routed to the area for your role automatically.

### The 5-stage service flow

Every service ticket moves forward through these stages in order:

```text
Antre → Diperiksa → Dikerjakan → Selesai → Diambil
(Queued) (Inspecting) (In progress) (Done) (Picked up)
```

### What each role does on the site

**Customer (`pelanggan`) — `/pelanggan`**
- Register and log in.
- Create an online booking ("Booking baru"): plate number, complaint, choose a service. The ticket starts at **Antre**.
- Track the live status of their motorbike through the 5 stages.
- After the ticket reaches **Diambil**, download the **PDF invoice**.

**Cashier / Admin (`kasir`, `admin`) — `/staff`**
- Create **walk-in** tickets at the counter.
- **Assign a mechanic** to a ticket.
- Advance ticket status and perform **checkout** (set **Diambil**) — only kasir/admin can set Diambil.
- Manage the **spare parts** inventory (`/staff/parts`): add parts, restock, update price.
- Manage the **services** catalog (`/staff/services`).

**Mechanic (`mekanik`) — `/mekanik`**
- See tickets assigned to them.
- Update ticket status **sequentially** (can't skip stages).
- **Add or remove spare parts** on a ticket — stock is deducted automatically when a part is added and restored when removed.

**Owner (`pemilik`) — `/owner`**
- **Dashboard** with revenue, active jobs, completed jobs, and low-stock count.
- **Revenue report** (`/owner/revenue`) with date-range filters.
- **Low-stock overview** (`/owner/low-stock`).
- **User management** (`/owner/users`, admin only): create staff, activate/deactivate accounts.

### A typical end-to-end run (try this after seeding)

1. **Customer** logs in → creates a booking → ticket appears at **Antre**.
2. **Kasir** logs in → assigns a **mekanik** to that ticket.
3. **Mekanik** logs in → moves status Diperiksa → Dikerjakan, **adds spare parts** (watch stock drop), then marks **Selesai**.
4. On **Selesai**, an **email notification** is sent (preview URL in the backend logs if no SMTP is configured).
5. **Kasir** checks out the ticket → **Diambil**.
6. **Customer** (or kasir/owner) **downloads the PDF invoice**.
7. **Owner** opens the dashboard → sees updated revenue and any low-stock alerts.

### Third-party / value-added features

- **Email notifications** on service completion (Nodemailer). Without SMTP
  settings, mail falls back to [Ethereal](https://ethereal.email) and the backend
  logs a preview link — no real email is sent. To send real email, set
  `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` together in `backend/.env`.
- **PDF invoices** (PDFKit), downloadable once a ticket is **Diambil**.

---

## 5. Troubleshooting

| Symptom                                           | Cause / fix                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `503 Database tidak tersedia` on most routes      | `MONGODB_URI` is still the placeholder or wrong — see section 3.            |
| `/api/health` shows database disconnected         | Bad connection string, IP not allowlisted in Atlas, or DB not running.      |
| Seeder refuses to run                             | It only seeds an **empty** database. Drop the data or use a fresh DB.       |
| Frontend loads but all API calls fail             | Backend not running, or `NEXT_PUBLIC_API_BASE_URL` points at the wrong URL. |
| Logged in but "forbidden" on an action            | That action is restricted to another role (RBAC working as intended).       |
| pnpm prompts about build scripts (esbuild)        | Run `pnpm approve-builds`, or the provided `pnpm-workspace.yaml` handles it. |
| Changed an `.env` file but nothing changed        | Restart the dev server — env is read at startup.                            |
