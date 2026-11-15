# MotorCenter - Motorcycle Workshop & Inventory Management System

Final Project for **Web Application Development (Pengembangan Aplikasi Web - TKIF262402)**  
**Milestone 1: Backend Engineering & API Specification**  
Department of Electrical Engineering and Information Technology, Faculty of Engineering, Universitas Gadjah Mada.

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

**MotorCenter** digitizes and connects the entire workshop workflow into a unified platform:
* **5-Stage Sequential Service Flow**:
  $$\text{Antre (Queued)} \longrightarrow \text{Diperiksa (Inspecting)} \longrightarrow \text{Dikerjakan (In Progress)} \longrightarrow \text{Selesai (Completed)} \longrightarrow \text{Diambil (Picked Up)}$$
* **Atomic Spare Part Deduction & Rollback**: Automatic stock deduction when parts are assigned, low-stock threshold alerts, and safe rollback if parts are removed.
* **Role-Based Access Control (5 Distinct Roles)**: Granular permissions across `admin`, `kasir` (cashier), `mekanik` (mechanic), `pemilik` (owner), and `pelanggan` (customer).
* **Added-Value Services (Rubric G6)**: Automated email notifications upon service completion and official PDF invoice receipts.

---

## Tech Stack & Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | **Express.js (v4.x)** | Modular RESTful API server |
| **Language** | **TypeScript (v5.x)** | Strict type-safety across models, services, and handlers |
| **Runtime** | **Node.js (v24.x / >=20.x)** | V8 JavaScript runtime |
| **Database** | **MongoDB Atlas & Mongoose (v8.x)** | Cloud NoSQL database with replica set failover |
| **Password Security** | **bcryptjs** | Salt rounds 10 one-way hashing (Rubric BE4) |
| **API Auth & RBAC** | **JSON Web Tokens (JWT)** | Stateless Bearer token authorization with `tokenVersion` rotation (Rubric BE5) |
| **HTTP Security** | **Helmet & express-rate-limit** | Security headers and IP rate limiting on API & authentication routes |
| **Request Validation** | **Zod (v4.x)** | Schema-based validation for body, query params, and URL params (aligned across backend & frontend) |
| **PDF Invoicing** | **PDFKit** | Dynamic generation of itemized receipt invoices (Rubric G6) |
| **Email Notifications**| **Nodemailer** | Service completion alerts and booking notifications (Rubric G6) |
| **Package Manager** | **`pnpm` (v10.x)** | Fast, disk-efficient package management |

---

## Directory Structure

```text
bengkel-motor-6/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               # Database connection lifecycle
│   │   │   └── env.ts              # Environment validation schema
│   │   ├── constants/
│   │   │   └── index.ts            # Status codes, roles, and workflow transitions
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts  # Auth, profile, and password handlers
│   │   │   ├── booking.controller.ts # Ticket lifecycle & atomic stock handlers
│   │   │   ├── health.controller.ts # Server health & database status
│   │   │   ├── part.controller.ts  # Spare parts inventory handlers
│   │   │   ├── report.controller.ts# Analytics & revenue handlers
│   │   │   ├── service.controller.ts # Service catalog handlers
│   │   │   └── user.controller.ts  # Staff management handlers
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
│   │   │   ├── part.routes.ts      # Spare parts routes
│   │   │   ├── report.routes.ts    # Analytics and revenue routes
│   │   │   ├── service.routes.ts   # Workshop service package routes
│   │   │   └── user.routes.ts      # Staff and user management routes
│   │   ├── services/
│   │   │   ├── mail.service.ts     # Nodemailer notification service
│   │   │   ├── pdf.service.ts      # PDFKit invoice generator
│   │   │   └── stock.service.ts    # Atomic stock adjustments & low-stock alerts
│   │   ├── types/
│   │   │   └── express.d.ts        # Express Request type augmentations
│   │   ├── utils/
│   │   │   ├── appError.ts         # Custom error hierarchy
│   │   │   ├── jakartaDate.ts      # Timezone & regex escape helper utilities
│   │   │   ├── jwt.ts              # Token generation and verification
│   │   │   ├── response.ts         # Standardized JSON response envelopes
│   │   │   └── seeder.ts           # Initial database seeder script
│   │   ├── validations/
│   │   │   ├── auth.validation.ts  # Schemas for auth and password change
│   │   │   ├── booking.validation.ts # Schemas for service ticket workflows
│   │   │   ├── catalog.validation.ts # Schemas for services and parts
│   │   │   ├── common.validation.ts # Shared phone validation schema
│   │   │   ├── report.validation.ts # Schemas for revenue query parameters
│   │   │   └── user.validation.ts  # Schemas for staff management
│   │   ├── app.ts                  # Express application setup
│   │   └── server.ts               # Server bootstrap & graceful shutdown
│   ├── .env.example                # Environment variables template
│   ├── package.json                # Project dependencies and scripts
│   ├── pnpm-lock.yaml              # Lockfile
│   ├── tsconfig.json               # TypeScript compiler configuration
│   └── vercel.json                 # Express deployment preset
├── frontend/                       # Next.js App Router frontend
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
* **pnpm**: `>= 9.x` (`npm install -g pnpm`)
* Internet connection for MongoDB Atlas access (or use `pnpm run dev:memory` for an instant pre-seeded in-memory MongoDB session).

### 2. Dependency Installation
Navigate to the `backend/` directory and install dependencies:
```bash
cd backend
pnpm install
```

### 3. Environment Configuration (`.env`)
Copy `backend/.env.example` to `backend/.env`, then set your Atlas URI and JWT secret. The default backend port is **`8000`** (leaving port `3000` for the Next.js frontend):
```env
NODE_ENV=development
PORT=8000
APP_NAME=MotorCenter
MONGODB_URI=YOUR_ATLAS_CONNECTION_STRING
JWT_SECRET=YOUR_SECRET_AT_LEAST_8_CHARACTERS
JWT_EXPIRES_IN=1d
CORS_ORIGIN=*
```

### 4. Running the Database Seeder
The seeder creates demo accounts, services, parts, and tickets **only on an empty database**. It rejects a database that already contains data; do not run it on a populated `motorcenter_phase3`:
```bash
pnpm run seed
```

### 5. Running the Backend Server
* **Development Mode (with auto-reload via `tsx`)**:
  ```bash
  pnpm run dev
  ```
* **Instant Demo Mode (in-memory MongoDB with pre-seeded data)**:
  ```bash
  pnpm run dev:memory
  ```
* **Production Build**:
  ```bash
  pnpm run build
  pnpm start
  ```
* Server URL: `http://localhost:8000`
* Health Check: `http://localhost:8000/api/health`

### 6. Deploy Express to Vercel

Import this repository as a Vercel project with **Root Directory `backend`**. The [backend/vercel.json](backend/vercel.json) preset lets Vercel detect the exported Express app in `src/app.ts` as one function; `src/server.ts` remains the local server entry. Do not set a custom build command or run the seeder during deployment. See the [Vercel Express guide](https://vercel.com/docs/frameworks/backend/express).

Set these variables in the Vercel project settings for each deployment environment: `MONGODB_URI`, a unique `JWT_SECRET` (at least 8 characters), and `CORS_ORIGIN` (your frontend origin). For real email delivery, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` together; `SMTP_PORT` is optional and defaults to 587. The local `backend/.env` is ignored by Git and is not uploaded. Ensure MongoDB Atlas allows connections from the deployment environment. After deployment, check `https://<your-domain>/api/health` for `data.database.status: "connected"` before using the API.

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
| `PATCH`| `/api/users/:id/status` | Admin | Activate or deactivate staff accounts (protects self & last active admin); deactivation revokes all existing sessions |
| `GET` | `/api/services` | Public | Browse catalog of available workshop services |
| `POST` | `/api/services` | Admin, Kasir | Create a new service package |
| `PUT` | `/api/services/:id` | Admin, Kasir | Update service package details or reactivate service |
| `DELETE`| `/api/services/:id` | Admin, Kasir | Soft-delete (deactivate) a service package |
| `GET` | `/api/parts` | Admin, Kasir, Mekanik, Pemilik | Browse spare parts with `isLowStock` indicator |
| `GET` | `/api/parts/low-stock` | Admin, Kasir, Pemilik | List critical inventory items (<= minimum stock threshold) |
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
| `POST` | `/api/bookings/:id/parts` | Admin, Kasir, Mekanik | Add spare part & atomically deduct warehouse stock |
| `DELETE`| `/api/bookings/:id/parts/:partItemId`| Admin, Kasir, Mekanik | Remove a ticket line item and restore stock in one transaction |
| `GET` | `/api/reports/dashboard` | Admin, Pemilik | Summary metrics: revenue, active jobs, completed jobs, low-stock count |
| `GET` | `/api/reports/revenue` | Admin, Pemilik | Financial performance report with date range filters |
| `GET` | `/api/bookings/:id/invoice/pdf` | Admin, Kasir, Pemilik, owning Pelanggan | Download PDF receipt invoice after `Diambil` |

Full request payloads and sample JSON responses are documented in [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md).
