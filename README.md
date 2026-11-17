Youtube Video: https://youtu.be/MfMxCs4JlWo

PPT Drive: https://drive.google.com/drive/folders/1AApbFFGgeA69C4ra4VOAgacreHNaFTA7?usp=sharing

# MotorCenter - Motorcycle Workshop & Inventory Management System

Final Project for **Web Application Development (Pengembangan Aplikasi Web - TKIF262402)**  
**Full-Stack Web Application (Express REST API & Next.js App Router)**  
Department of Electrical Engineering and Information Technology, Faculty of Engineering, Universitas Gadjah Mada.

Project is deployed in two places:
- Back-end: Railway
- Front-end: Vercel (https://motor-center-six.vercel.app/)

---

## Team Members (Group 6)

| No. | Student Name | Student ID (NIM) |
| :---: | :--- | :---: |
| 1. | **Arnold Gavrael Bonardo Situmorang** | `24/539797/TK/59872` |
| 2. | **Muhammad Fachry Alfareeza** | `24/540199/TK/59922` |
| 3. | **Raditya Azhar Ananta** | `24/539913/TK/59881` |
| 4. | **Wahyu Fajrin Adiputra** | `24/538042/TK/59664` |

---

## Problem Background & Scope (Case US1)

Traditional motorcycle workshops handle dozens of vehicles daily using paper queue logs and manual stock tracking. This creates three critical bottlenecks:
1. **Lack of Service Visibility for Customers**: Customers have to call repeatedly or wait indefinitely at the shop just to know if their motorcycle is ready.
2. **Untracked Spare Part Usage & Stockouts**: Parts used during repairs are not automatically deducted at the point of service, causing unexpected inventory shortages.
3. **Lost Maintenance Records**: Paper logs get lost or damaged over time, leaving mechanics without historical service data for returning vehicles.

**MotorCenter** digitizes and connects the entire workshop workflow into a unified full-stack platform:
* **5-Stage Sequential Service Flow + Cancellation**:
  $$\text{Antre (Queued)} \longrightarrow \text{Diperiksa (Inspecting)} \longrightarrow \text{Dikerjakan (In Progress)} \longrightarrow \text{Selesai (Completed)} \longrightarrow \text{Diambil (Picked Up)}$$
  Tickets can also transition to `Dibatalkan` from `Antre` or `Diperiksa` (by `admin`/`kasir`, returning installed parts to stock), and customers (`pelanggan`) can self-cancel their own `online` bookings while still in `Antre`.
* **Atomic Spare Part Inventory & Audit Ledger**: Transactional stock deduction when parts are added to tickets, rollback on part removal or ticket cancellation, atomic `$inc` restocking, stock opname corrections (`adjust`), a complete `StockMovement` ledger (`restock`, `usage`, `return`, `adjust`), and low-stock email alerts to active `pemilik` and `admin`.
* **Vehicle Service History**: Plate-normalized maintenance history (`GET /api/vehicles/:plateNumber/history`) and customer "Motor Saya" tracking so vehicle records persist across visits.
* **Role-Based Access Control & Web Portals (5 Distinct Roles)**: Granular backend RBAC and dedicated Next.js portals across `admin`, `kasir` (cashier), `mekanik` (mechanic), `pemilik` (owner), and `pelanggan` (customer), with 15-second live polling and a drag-and-drop Kanban workshop board.
* **Added-Value Services (Rubric G6)**: Automated HTML + plain-text email notifications (online booking confirmation, `Selesai` pickup notice, and low-stock alerts via Nodemailer with Ethereal preview fallback) and branded A4 PDF invoices (`FAKTUR SERVIS` via PDFKit with logo letterhead, cashier/mechanic attribution, and itemized breakdown).

---

## Tech Stack & Architecture

### Backend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | **Express.js (v4.x)** | Modular RESTful API server |
| **Language** | **TypeScript (v5.x)** | Strict type-safety across models, services, and handlers |
| **Runtime** | **Node.js (>=20.x, tested on v24.x)** | V8 JavaScript runtime |
| **Database** | **MongoDB Atlas & Mongoose (v8.x)** | Cloud NoSQL database with replica set transactions (`mongodb-memory-server` for `dev:memory` & tests) |
| **Password Security** | **bcryptjs** | Salt rounds 10 one-way hashing (Rubric BE4) |
| **API Auth & RBAC** | **JSON Web Tokens (JWT)** | Stateless Bearer token authorization with `tokenVersion` rotation (Rubric BE5) |
| **HTTP Security** | **Helmet & express-rate-limit** | Security headers and IP rate limiting on API & authentication routes |
| **Request Validation** | **Zod (v4.x)** | Schema-based validation for body, query params, and URL params (aligned across backend & frontend) |
| **PDF Invoicing** | **PDFKit** | Dynamic generation of branded A4 itemized receipt invoices (Rubric G6) |
| **Email Notifications**| **Nodemailer** | Booking confirmation, completion notices, and low-stock alerts with Ethereal fallback (Rubric G6) |
| **Testing** | **Node.js Test Runner (`node --test` + `tsx`)** | Integration and unit test suites against in-memory MongoDB replica sets |

### Frontend
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (16.4.x, App Router) & React (19.3.x)** | Role-scoped portals, public service catalog, and client route guards |
| **Styling & UI** | **Tailwind CSS (v4) & shadcn/ui (Radix UI)** | Responsive mobile/desktop UI with dark/light theme support (`next-themes`) & toasts (`sonner`) |
| **Data & Forms** | **TanStack React Query (v5), Axios, React Hook Form & Zod** | 15-second auto-refresh polling, API client, and shared schema validation |
| **Interactive Board** | **`@dnd-kit/core` & Lucide React** | Drag-and-drop staff workshop Kanban board (`FE2` / `FE4`) |
| **Testing** | **Vitest (v5.x) & Testing Library** | Component, hook, and domain helper unit tests (`jsdom`) |

* **Package Manager**: **`pnpm` (`11.x`, `>=9.x` supported)** with workspace lockfiles (`lockfileVersion: 9.0`).

---

## Directory Structure

```text
motor-center/
├── backend/
│   ├── assets/
│   │   └── logo.png                # Workshop logo embedded in PDF invoice letterhead
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               # Database connection lifecycle & optional DNS override
│   │   │   ├── env.ts              # Environment validation schema
│   │   │   └── workshop.ts         # Workshop identity settings for invoices & emails
│   │   ├── constants/
│   │   │   └── index.ts            # Status codes, roles, and workflow transitions
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts  # Auth, profile, and password handlers
│   │   │   ├── booking.controller.ts # Ticket lifecycle, cancellation, PDF, & stock handlers
│   │   │   ├── health.controller.ts # Server health & database status
│   │   │   ├── part.controller.ts  # Spare parts, restock, & movement history handlers
│   │   │   ├── report.controller.ts# Dashboard, revenue, & top-items analytics handlers
│   │   │   ├── service.controller.ts # Service catalog handlers
│   │   │   ├── user.controller.ts  # Staff management handlers
│   │   │   └── vehicle.controller.ts # Plate-normalized vehicle service history handler
│   │   ├── dev/
│   │   │   └── inMemory.ts         # Pre-seeded in-memory MongoDB replica-set launcher
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # JWT verification middleware
│   │   │   ├── error.middleware.ts # Global error handling middleware
│   │   │   ├── notFound.middleware.ts # 404 route handler
│   │   │   ├── rateLimit.middleware.ts # API & auth endpoint rate limiters
│   │   │   ├── rbac.middleware.ts  # Role authorization guard
│   │   │   └── validate.middleware.ts # Zod request validator
│   │   ├── models/
│   │   │   ├── booking.model.ts    # Service ticket schema & atomic sequential numbering
│   │   │   ├── counter.model.ts    # Atomic daily sequence counter collection
│   │   │   ├── part.model.ts       # Spare parts schema with low-stock indicator
│   │   │   ├── service.model.ts    # Service packages schema
│   │   │   ├── stockMovement.model.ts # Stock movement audit ledger schema
│   │   │   └── user.model.ts       # User account schema with bcrypt hashing & tokenVersion
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # Authentication routes
│   │   │   ├── booking.routes.ts   # Service ticket routes
│   │   │   ├── health.routes.ts    # Health check route
│   │   │   ├── index.ts            # Master API router
│   │   │   ├── part.routes.ts      # Spare parts & stock movement routes
│   │   │   ├── report.routes.ts    # Analytics, revenue, & top-items routes
│   │   │   ├── service.routes.ts   # Workshop service package routes
│   │   │   ├── user.routes.ts      # Staff and user management routes
│   │   │   └── vehicle.routes.ts   # Vehicle service history route
│   │   ├── services/
│   │   │   ├── mail.service.ts     # Nodemailer HTML + text email notification service
│   │   │   ├── pdf.service.ts      # PDFKit branded A4 invoice generator
│   │   │   └── stock.service.ts    # Atomic stock adjustments & low-stock alerts
│   │   ├── types/
│   │   │   └── express.d.ts        # Express Request type augmentations
│   │   ├── utils/
│   │   │   ├── appError.ts         # Custom error hierarchy
│   │   │   ├── format.ts           # Rupiah, HTML escape, & WIB date formatters
│   │   │   ├── jakartaDate.ts      # Timezone & regex escape helper utilities
│   │   │   ├── jwt.ts              # Token generation and verification
│   │   │   ├── plate.ts            # Plate normalization & spacing-insensitive regex
│   │   │   ├── response.ts         # Standardized JSON response envelopes
│   │   │   └── seeder.ts           # Initial database seeder script
│   │   ├── validations/
│   │   │   ├── auth.validation.ts  # Schemas for auth and password change
│   │   │   ├── booking.validation.ts # Schemas for service ticket workflows
│   │   │   ├── catalog.validation.ts # Schemas for services, parts, restock, & movements
│   │   │   ├── common.validation.ts # Shared phone validation schema
│   │   │   ├── report.validation.ts # Schemas for revenue & top-items query parameters
│   │   │   ├── user.validation.ts  # Schemas for staff management
│   │   │   └── vehicle.validation.ts # Schema for vehicle plate history param
│   │   ├── app.ts                  # Express application setup
│   │   └── server.ts               # Server bootstrap & graceful shutdown
│   ├── test/                       # Integration & unit tests (auth, bookings, parts, stock, reports, vehicles, users, invoice/email)
│   ├── .env.example                # Environment variables template
│   ├── package.json                # Project dependencies and scripts
│   ├── pnpm-lock.yaml              # Lockfile
│   ├── pnpm-workspace.yaml         # Workspace config for pnpm builds
│   ├── tsconfig.json               # TypeScript compiler configuration
│   └── vercel.json                 # Express deployment preset
├── frontend/
│   ├── public/                     # Static assets & official MotorCenter logo
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/           # Landing page, /catalog, /login, /register
│   │   │   ├── (pelanggan)/        # Customer portal (/pelanggan, /pelanggan/baru, /pelanggan/[id], /pelanggan/motor/[plate], /pelanggan/layanan, /pelanggan/profil)
│   │   │   ├── (staff)/            # Cashier/Admin portal (/staff, /staff/board, /staff/baru, /staff/[id], /staff/parts, /staff/services, /staff/profil)
│   │   │   ├── (mekanik)/          # Mechanic portal (/mekanik, /mekanik/[id], /mekanik/profil)
│   │   │   └── (owner)/            # Owner/Admin analytics & user admin (/owner, /owner/revenue, /owner/low-stock, /owner/users, /owner/profil)
│   │   ├── components/             # Shared UI (shadcn/ui primitives, board, booking, guards, shells)
│   │   ├── hooks/                  # React Query hooks & unit tests
│   │   ├── lib/                    # API client, auth context, transitions, validations, formatters & tests
│   │   ├── services/               # Resource API callers
│   │   └── types/                  # Typed API contracts mirroring backend envelopes
│   ├── .env.example                # Frontend environment variables template
│   ├── next.config.ts              # Next.js configuration
│   ├── package.json                # Frontend dependencies and scripts
│   ├── pnpm-lock.yaml              # Lockfile
│   ├── pnpm-workspace.yaml         # Workspace config for pnpm builds
│   ├── README.md                   # Frontend-specific documentation
│   ├── tsconfig.json               # TypeScript configuration
│   └── vitest.config.ts            # Vitest test configuration
├── API_DOCUMENTATION.md            # Comprehensive API specification
├── SETUP.md                        # Quick setup & database switch guide
├── USAGE.md                        # Complete usage guide
├── .gitignore                      # Git ignored files configuration
└── README.md                       # Project documentation
```

---

## Setup & Running Guide

### 1. Prerequisites
* **Node.js**: `>= 20.x` (Tested on Node.js v24.x)
* **pnpm**: `>= 9.x` (Repo uses `11.x`; install via `npm install -g pnpm` or `corepack enable`)
* MongoDB Atlas connection string or local MongoDB (or use `pnpm run dev:memory` in `backend/` for an instant pre-seeded in-memory MongoDB replica-set session).

### 2. Backend Setup (`backend/`)
Navigate to `backend/` and install dependencies:
```bash
cd backend
pnpm install
```

Copy `backend/.env.example` to `backend/.env`, then set your Atlas URI and JWT secret. The default backend port is **`8000`** (leaving port `3000` for the Next.js frontend). With the placeholder `MONGODB_URI=YOUR_ATLAS_CONNECTION_STRING`, the server still starts and `/api/health` reports `disconnected`, while database routes return `503 Database tidak tersedia` until a real database URI is supplied (see [`SETUP.md`](SETUP.md)).

```env
NODE_ENV=development
PORT=8000
APP_NAME=MotorCenter
MONGODB_URI=YOUR_ATLAS_CONNECTION_STRING
# Optional: force DNS servers if you get "querySrv ECONNREFUSED" locally
# DNS_SERVERS=8.8.8.8,1.1.1.1
JWT_SECRET=YOUR_SECRET_AT_LEAST_8_CHARACTERS
JWT_EXPIRES_IN=1d
CORS_ORIGIN=*

# Optional: set all four together for real email delivery; otherwise Ethereal preview is used
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=

# Optional workshop identity used in PDF invoices and emails
# WORKSHOP_ADDRESS=Jl. Kaliurang Km 5 No. 12, Sleman, Yogyakarta
# WORKSHOP_PHONE=0274-123456
# WORKSHOP_HOURS=Senin-Sabtu, 08.00-17.00 WIB
```

#### Seeding & Running the Backend
The seeder creates demo accounts, services, parts, and tickets **only on an empty database**. It rejects a database that already contains data; do not run it on a populated `motorcenter_phase3`:
```bash
pnpm run seed
```

* **Development Mode (with auto-reload via `tsx`)**:
  ```bash
  pnpm run dev
  ```
* **Instant Demo Mode (in-memory MongoDB replica set with pre-seeded data)**:
  ```bash
  pnpm run dev:memory
  ```
* **Production Build**:
  ```bash
  pnpm run build
  pnpm start
  ```
* **Type-check & Backend Tests**:
  ```bash
  pnpm run typecheck
  pnpm test
  ```
* Server URL: `http://localhost:8000`
* Health Check: `http://localhost:8000/api/health`

### 3. Frontend Setup (`frontend/`)
In a second terminal, navigate to `frontend/`, install dependencies, and configure `frontend/.env.local`:
```bash
cd frontend
pnpm install
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
```

Default `frontend/.env.example`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

* **Development Mode**:
  ```bash
  pnpm run dev
  ```
* **Production Build**:
  ```bash
  pnpm run build
  pnpm start
  ```
* **Lint & Frontend Unit Tests**:
  ```bash
  pnpm run lint
  pnpm test
  ```
* Web App URL: `http://localhost:3000` (see [`frontend/README.md`](frontend/README.md) and [`USAGE.md`](USAGE.md) for detailed walkthroughs).

### 4. Deploy to Vercel

* **Backend**: Import this repository as a Vercel project with **Root Directory `backend`**. The [backend/vercel.json](backend/vercel.json) preset lets Vercel detect the exported Express app in `src/app.ts` as one function; `src/server.ts` remains the local server entry. Do not set a custom build command or run the seeder during deployment. See the [Vercel Express guide](https://vercel.com/docs/frameworks/backend/express).
  Set `MONGODB_URI`, a unique `JWT_SECRET` (at least 8 characters), and `CORS_ORIGIN` (your frontend origin) in the Vercel project settings for each deployment environment. Optionally set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` together for real email delivery (`SMTP_PORT` defaults to `587`), plus `WORKSHOP_ADDRESS`, `WORKSHOP_PHONE`, and `WORKSHOP_HOURS` to customize invoices and emails. Local `.env` files are ignored by Git and not uploaded. Ensure MongoDB Atlas allows connections from the deployment environment, and verify `https://<your-domain>/api/health` reports `data.database.status: "connected"` before using the API.
* **Frontend**: Import the repository as a separate Vercel project with **Root Directory `frontend`** and set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL (e.g., `https://<your-backend-domain>/api`).

---

## Frontend Role Areas

| Role / Surface | Route Area | Key Capabilities |
| :--- | :--- | :--- |
| **Public** | `/`, `/catalog`, `/login`, `/register` | Workshop overview, live service catalog & pricing, sign-in, customer registration |
| **`pelanggan`** | `/pelanggan` | 4-step online booking wizard, live ticket status (auto-polling), cancel `Antre` booking, per-plate service history (`/pelanggan/motor/[plate]`), PDF invoice download after `Diambil` |
| **`kasir`** | `/staff` | Drag-and-drop Kanban workshop board (`/staff/board`), queue filtering (`/staff`), walk-in tickets, mechanic assignment, checkout (`Diambil`), spare parts CRUD/restock/movements (`/staff/parts`), service catalog (`/staff/services`) |
| **`admin`** | `/staff` + `/owner` | Full `kasir` operations plus owner analytics and admin-only staff/user management (`/owner/users`) |
| **`mekanik`** | `/mekanik` | View assigned tickets, advance ticket stages sequentially (`Diperiksa` -> `Dikerjakan` -> `Selesai`), add/remove spare parts |
| **`pemilik`** | `/owner` | Executive dashboard (`/owner`), daily WIB revenue report (`/owner/revenue`), low-stock overview (`/owner/low-stock`) |

---

## Seeded Test Accounts (available only after seeding an empty database)

All accounts use `bcryptjs` hashing (salt rounds: 10):

| Role | Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin@motorcenter.id` | `admin123` | Full access, user/staff management, master data |
| **`kasir`** | `kasir@motorcenter.id` | `kasir123` | Walk-in ticket creation, mechanic assignment, cancellation (`Dibatalkan`), pricing, checkout (`Diambil`) |
| **`mekanik`** | `budi.mekanik@motorcenter.id` | `mekanik123` | Senior Mechanic: advance ticket work (`Diperiksa` -> `Dikerjakan` -> `Selesai`), assign/remove parts |
| **`mekanik`** | `joko.mekanik@motorcenter.id` | `mekanik123` | CVT Mechanic: advance ticket work (`Diperiksa` -> `Dikerjakan` -> `Selesai`), assign/remove parts |
| **`pemilik`** | `owner@motorcenter.id` | `owner123` | Workshop Owner: revenue reports, dashboard metrics, low-stock overview |
| **`pelanggan`**| `andi.pelanggan@gmail.com` | `pelanggan123` | Customer: online booking, track motorbike service progress |

---

## API Endpoint Reference

| Method | Endpoint | Access (RBAC) | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/health` | Public | Server uptime, environment, and live MongoDB status |
| `POST` | `/api/auth/register` | Public | Customer self-registration |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive Bearer JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/api/auth/me` | Authenticated | Update user name and phone number |
| `PUT` | `/api/auth/change-password` | Authenticated | Change current account password, invalidate existing JWTs, and return a fresh `accessToken` |
| `POST` | `/api/users` | Admin | Register new internal staff (`admin`, `kasir`, `mekanik`, `pemilik`) |
| `GET` | `/api/users/mechanics` | Admin, Kasir | List active mechanics for ticket assignment |
| `GET` | `/api/users` | Admin, Pemilik | Paginated user list with role and status filtering |
| `GET` | `/api/users/:id` | Admin, Pemilik | Retrieve details of a single user account |
| `PATCH`| `/api/users/:id/status` | Admin | Activate or deactivate staff accounts (protects self & last active admin); deactivation revokes all existing sessions |
| `GET` | `/api/services` | Public (`includeInactive=true`: Admin, Kasir, Pemilik) | Browse catalog of available workshop services |
| `GET` | `/api/services/:id` | Public (`includeInactive=true`: Admin, Kasir, Pemilik) | Retrieve details of a single workshop service package |
| `POST` | `/api/services` | Admin, Kasir | Create a new service package |
| `PUT` | `/api/services/:id` | Admin, Kasir | Update service package details or reactivate service |
| `DELETE`| `/api/services/:id` | Admin, Kasir | Soft-delete (deactivate) a service package |
| `GET` | `/api/parts` | Admin, Kasir, Mekanik, Pemilik (`includeInactive=true`: Admin, Kasir, Pemilik) | Browse spare parts with `isLowStock` indicator |
| `GET` | `/api/parts/low-stock` | Admin, Kasir, Pemilik | List critical inventory items (<= minimum stock threshold) |
| `GET` | `/api/parts/:id` | Admin, Kasir, Mekanik, Pemilik (`includeInactive=true`: Admin, Kasir, Pemilik) | Retrieve details of a single spare part |
| `POST` | `/api/parts` | Admin, Kasir | Add a new spare part to warehouse |
| `PUT` | `/api/parts/:id` | Admin, Kasir | Update price/details, correct stock (stock opname, logged as `adjust`), or reactivate part |
| `PATCH` | `/api/parts/:id/restock` | Admin, Kasir | Atomically add incoming stock (`$inc`), safe alongside concurrent ticket usage |
| `GET` | `/api/parts/:id/movements` | Admin, Kasir, Pemilik | Stock movement history (restock, usage, return, adjust) with type and WIB date filters |
| `DELETE`| `/api/parts/:id` | Admin, Kasir | Soft-delete (deactivate) a spare part |
| `POST` | `/api/bookings/online` | Pelanggan | Customer online appointment booking (`Antre`) |
| `POST` | `/api/bookings/walk-in` | Admin, Kasir | Walk-in counter ticket creation (`Antre`) |
| `GET` | `/api/bookings` | Authenticated | List tickets (scoped automatically by user role; WIB date filters) |
| `GET` | `/api/bookings/:id` | Authorized | Ticket detail, status audit history, and parts used |
| `PUT` | `/api/bookings/:id/assign` | Admin, Kasir | Assign mechanic to a service ticket |
| `PUT` | `/api/bookings/:id/status` | Admin, Kasir, assigned Mekanik | Sequential status changes; `Dibatalkan` (from `Antre` or `Diperiksa`, returns installed parts to stock), `Diambil`, and `serviceFee` restricted to Admin/Kasir |
| `PATCH` | `/api/bookings/:id/cancel` | Pelanggan (own) | Cancel own online booking while still `Antre`, with optional reason |
| `POST` | `/api/bookings/:id/parts` | Admin, Kasir, assigned Mekanik | Add spare part & atomically deduct warehouse stock |
| `DELETE`| `/api/bookings/:id/parts/:partItemId`| Admin, Kasir, assigned Mekanik | Remove a ticket line item and restore stock in one transaction |
| `GET` | `/api/vehicles/:plateNumber/history` | Admin, Kasir, Mekanik, Pelanggan (own) | Full service history of one vehicle, newest first; plate matching ignores case and spacing |
| `GET` | `/api/reports/dashboard` | Admin, Pemilik | Summary metrics: revenue, active jobs, completed jobs, low-stock count |
| `GET` | `/api/reports/revenue` | Admin, Pemilik | Financial performance report with date range filters |
| `GET` | `/api/reports/top-items` | Admin, Pemilik | Top parts by units sold and top service packages by tickets, with date range and `limit` |
| `GET` | `/api/bookings/:id/invoice/pdf` | Admin, Kasir, Pemilik, owning Pelanggan | Download PDF receipt invoice after `Diambil` |

Full request payloads and sample JSON responses are documented in [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md). See also [`SETUP.md`](SETUP.md), [`USAGE.md`](USAGE.md), and [`frontend/README.md`](frontend/README.md).
