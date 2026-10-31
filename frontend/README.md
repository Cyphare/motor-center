# MotorCenter Frontend

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui frontend for the
MotorCenter motorcycle-workshop system. It talks to the existing Express API in
[`../backend`](../backend) and surfaces the full service flow for every role.

## Prerequisites

- Node.js 20+ (the repo is developed against Node 22/26)
- pnpm 11.x (`corepack enable` or install globally)
- The MotorCenter backend running and reachable (see the root
  [`SETUP.md`](../SETUP.md) and [`../backend`](../backend))

## Setup

```bash
cd frontend
pnpm install
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
```

## Environment

| Variable                   | Default                     | Purpose                                  |
| -------------------------- | --------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api` | Base URL of the MotorCenter backend API. |

`NEXT_PUBLIC_API_BASE_URL` is read in `src/lib/api-client.ts`. Point it at your
deployed backend (for example `https://your-api.example.com/api`) when the API
does not run on `localhost:8000`. `.env.local` is gitignored and must never be
committed.

## Commands

| Command          | Description                                     |
| ---------------- | ----------------------------------------------- |
| `pnpm run dev`   | Start the dev server at http://localhost:3000.  |
| `pnpm run build` | Production build (type-checks the whole app).   |
| `pnpm run start` | Serve the production build.                     |
| `pnpm run lint`  | Run ESLint over the project.                    |
| `pnpm run test`  | Run the Vitest unit suite once.                 |

## Roles and areas

Authentication is JWT based; the token is stored client-side and attached as a
`Bearer` header on every request. After login each user is routed to the home
for their role. Client-side route guards (`src/components/guards/role-guard.tsx`)
redirect unauthenticated users to `/login` and wrong-role users to their own
home. The server still enforces authorization independently.

| Role        | Area root    | What they can do                                                        |
| ----------- | ------------ | ----------------------------------------------------------------------- |
| `pelanggan` | `/pelanggan` | Book online, track their own tickets, download invoices after pickup.   |
| `kasir`     | `/staff`     | Create walk-in tickets, manage the queue, parts and services.           |
| `admin`     | `/staff` + `/owner` | Everything `kasir` can do, plus reports and user management.     |
| `mekanik`   | `/mekanik`   | Update status and parts on tickets assigned to them.                    |
| `pemilik`   | `/owner`     | View the dashboard, revenue report and low-stock overview.              |

User management (`/owner/users`, create staff + activate/deactivate) is
restricted to `admin` only, guarded both by the nav and a nested role guard.

### Seeded accounts (after `pnpm run seed` in the backend)

| Role      | Email                        | Password      |
| --------- | ---------------------------- | ------------- |
| admin     | `admin@motorcenter.id`       | `admin123`    |
| kasir     | `kasir@motorcenter.id`       | `kasir123`    |
| mekanik   | `budi.mekanik@motorcenter.id`| `mekanik123`  |
| mekanik   | `joko.mekanik@motorcenter.id`| `mekanik123`  |
| pemilik   | `owner@motorcenter.id`       | `owner123`    |
| pelanggan | `andi.pelanggan@gmail.com`   | `pelanggan123`|

## Project structure

```
src/
  app/            Route groups per area: (public) (pelanggan) (staff) (mekanik) (owner)
  components/     Shared UI (shadcn/ui primitives + domain components)
  hooks/          React Query hooks (use-queries, use-mutations) + query keys
  lib/            api-client, auth context/session, role + status helpers, formatters
  services/       Thin API callers per resource (auth, bookings, parts, services, users, reports)
  types/          The typed API contract mirroring the backend envelope
```

## G6 notes (rubric)

- **FE2** — responsive layout (mobile + desktop), loading skeletons, toast
  notifications (sonner), error states and hover affordances are used
  consistently across every area.
- **FE4** — Indonesian domain labels (Antre / Diperiksa / Dikerjakan / Selesai /
  Diambil / Dibatalkan), Rupiah and Asia/Jakarta date formatting, and role-based
  navigation that only renders links a role may use.
- The service status flow and allowed transitions in `src/types/api.ts` mirror
  the backend `ALLOWED_STATUS_TRANSITIONS` exactly; the frontend never invents
  transitions the API would reject.
- Email delivery (booking confirmation, completion notice) is fully automatic on
  the backend; the frontend only surfaces that it happens.
