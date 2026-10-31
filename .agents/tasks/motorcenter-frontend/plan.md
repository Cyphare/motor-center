# Implementation Plan — MotorCenter Next.js Frontend + Backend Rubric Verification

Grounded in the backend source under `backend/src` (read in full), `API_DOCUMENTATION.md`, and `README.md`.
Workspace root: `c:\Users\Acer\Documents\ANTIGRAV\bengkel-motor-6`.
Frontend to create at: `c:\Users\Acer\Documents\ANTIGRAV\bengkel-motor-6\frontend`.

> This single-file plan is the fallback. The workflow tail has been restructured into per-FEAT coder steps that read `context.json` + the FEAT files under this same directory. Both describe the same work; the FEAT artifacts are the primary hand-off.

## Verified backend facts (the contract the frontend MUST match)

- **Response envelope** (`backend/src/utils/response.ts`): success `{ success:true, message, data? }`; paginated `{ success:true, message, data:[...], pagination:{ page, limit, total, totalPages } }`; error `{ success:false, message, errors? }` where `errors` is `[{ field, location, message }]` for Zod failures.
- **Auth** (`auth.controller.ts`, `auth.middleware.ts`, `jwt.ts`): `POST /api/auth/register` (public, always creates role `pelanggan`) and `POST /api/auth/login` return `data.user` + `data.accessToken`. Header is `Authorization: Bearer <token>`. `GET /api/auth/me` returns the user object directly in `data`. JWT payload = `{ id, name, email, role }`, 1d expiry. Inactive users are rejected at login and in middleware.
- **Roles** (`constants/index.ts`): `admin`, `kasir`, `mekanik`, `pemilik`, `pelanggan`.
- **Status flow** (`ALLOWED_STATUS_TRANSITIONS`): `Antre→[Diperiksa, Dibatalkan]`, `Diperiksa→[Dikerjakan]`, `Dikerjakan→[Selesai]`, `Selesai→[Diambil]`, `Diambil→[]`, `Dibatalkan→[]`. Note the extra `Dibatalkan` (cancel) available only from `Antre`. Only `admin`/`kasir` may set `Diambil`. `Diperiksa` requires a mechanic already assigned. A mekanik may only act on tickets assigned to them.
- **Bookings** (`booking.controller.ts`, `booking.routes.ts`): `POST /online` (pelanggan) body `{ plateNumber, motorModel, complaint, serviceId?, serviceDate? (ISO datetime) }`. `POST /walk-in` (admin/kasir) body `{ customerName, customerPhone, plateNumber, motorModel, complaint, serviceId?, mechanicId?, serviceFee? }`. `GET /` auto-scopes: pelanggan→own, mekanik→assigned; query `status,bookingType,plateNumber,mechanicId,startDate,endDate,page,limit`. `GET /:id` enforces same scoping. `PUT /:id/assign` body `{ mechanicId }`. `PUT /:id/status` body `{ status, mechanicNotes?, serviceFee? }`. `POST /:id/parts` body `{ partId, quantity }` — only in `Diperiksa`/`Dikerjakan`, stock auto-deducts. `DELETE /:id/parts/:partItemId` restores stock. `GET /:id/invoice/pdf` streams `application/pdf`, only after `Diambil`, roles admin/kasir/pemilik/owning-online-pelanggan.
- **Users** (`user.routes.ts`): `POST /api/users` (admin) create staff `{ name, email, password, role, phone }` (role ∈ admin|kasir|mekanik|pemilik). `GET /api/users/mechanics` (admin/kasir). `GET /api/users` (admin/pemilik) paginated, query `role,isActive,search,page,limit`. `PATCH /api/users/:id/status` (admin) body `{ isActive }`.
- **Catalog**: Services — `GET /api/services` + `GET /api/services/:id` are PUBLIC (no auth); `POST/PUT/DELETE` admin/kasir. Parts — `GET /api/parts` (admin/kasir/mekanik/pemilik) returns `isLowStock` virtual; `GET /api/parts/low-stock` (admin/pemilik); `POST /api/parts` + `PUT /api/parts/:id` (admin/kasir). Part body `{ code, name, stock, minStock, price, unit, isActive? }` (strict). Service body `{ name, description, estimatedPrice, estimatedDurationMinutes, isActive? }` (strict).
- **Reports** (`report.routes.ts`, admin/pemilik only): `GET /api/reports/dashboard` → `{ date, revenueToday, revenueMonth, activeTickets:{Antre,Diperiksa,Dikerjakan}, completedToday, lowStockParts:[...] }`. `GET /api/reports/revenue?startDate&endDate` (YYYY-MM-DD, both-or-neither, not reversed) → `{ startDate, endDate, serviceTotal, partsTotal, revenue, days:[{date,serviceTotal,partsTotal,revenue,ticketCount}] }`.
- **G6** (`mail.service.ts`, `pdf.service.ts`): email is fully automatic server-side (confirmation on online booking, completion on `Selesai` for online tickets). The frontend's G6 job is to SURFACE it — tell the user the confirmation/completion email was sent — and provide the invoice-PDF download button once `Diambil`.
- **Seeded accounts** (README / `seeder.ts`): admin@motorcenter.id/admin123, kasir@motorcenter.id/kasir123, budi.mekanik@motorcenter.id & joko.mekanik@motorcenter.id/mekanik123, owner@motorcenter.id/owner123, andi.pelanggan@gmail.com/pelanggan123.

## Backend rubric verification (BE1–BE5) — do, don't rebuild

- [ ] 1. Verify backend builds/typechecks and the rubric points hold; fix only if broken.
      Files: none (read-only unless a real defect surfaces).
      Verify: `cd backend && pnpm run typecheck` passes. Evidence to record: BE1 Express 4 (`app.ts`), BE2 Mongoose 8 models (`models/*`), BE3 CRUD (parts/services/users/bookings controllers), BE4 bcryptjs salt-10 pre-save + `toJSON` password strip (`user.model.ts`), BE5 `authMiddleware` + `authorizeRoles` + per-resource scoping. If a live/in-memory DB is available, smoke-test `GET /api/health`; otherwise record what could not be verified without a DB.

## Frontend plan (ordered, each item leaves a buildable tree)

- [ ] 2. Scaffold Next.js App Router + TypeScript + Tailwind + shadcn/ui in `frontend/`.
      Create the project (`frontend/package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `components.json`), add deps: `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`, `axios`, `sonner` (toasts), `lucide-react`, shadcn/ui primitives. Create `frontend/.env.local` and `frontend/.env.example` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`. Add `frontend/.gitignore` (ignore `.env*` except `.env.example`, `.next/`, `node_modules/`).
      Files: `frontend/**` (scaffold), `frontend/.env.local`, `frontend/.env.example`, `frontend/.gitignore`.
      Verify: `cd frontend && pnpm install && pnpm run build` succeeds.

- [ ] 3. Build the typed API/services layer and shared domain types.
      `lib/api-client.ts` (axios instance, baseURL from env, request interceptor injects Bearer token, response interceptor unwraps the envelope and normalizes `{success:false,...}` into a thrown typed error carrying `message` + field errors; 401 clears session). `types/api.ts` (envelope, User, Booking, Part, Service, Report types, `ServiceStatus` union incl. `Dibatalkan`, `ALLOWED_TRANSITIONS` map mirrored from backend). `services/*.ts` (auth, bookings, users, parts, services, reports) — one typed function per endpoint.
      Files: `frontend/src/lib/api-client.ts`, `frontend/src/types/api.ts`, `frontend/src/services/*.ts`.
      Verify: `pnpm run build` + `pnpm run lint` pass (no logic in components yet).

- [ ] 4. Auth + session + route-guard infrastructure.
      `lib/auth-context.tsx` (React context: token+user in memory + localStorage, login/logout, hydrate from `/auth/me`), `hooks/use-auth.ts`, a `<RoleGuard allow={[...]}>` wrapper + middleware or layout-level redirect that reads role from the stored user and sends each role to its home. Centralize the role→home map. Wrap the app in QueryClientProvider + Toaster.
      Files: `frontend/src/lib/auth-context.tsx`, `frontend/src/hooks/use-auth.ts`, `frontend/src/components/guards/role-guard.tsx`, `frontend/src/app/layout.tsx` (providers).
      Verify: `pnpm run build` passes; manual: visiting a guarded route while logged out redirects to `/login`.

- [ ] 5. Reusable UI + data-fetching hooks (presentation/logic separation, FE3/FE4).
      Shared presentational components: `StatusBadge`, `StatusStepper` (the 5-stage flow + cancelled), `DataTable`, `PageHeader`, `StatCard`, `EmptyState`, `LoadingState`/skeletons, `ErrorState`, `ConfirmDialog`, `Rupiah` formatter, `FormField` wrappers. Data hooks via React Query: `useBookings`, `useBooking`, `useParts`, `useServices`, `useMechanics`, `useUsers`, `useDashboard`, `useRevenue`, plus mutation hooks (`useUpdateStatus`, `useAssignMechanic`, `useAddPart`, `useRemovePart`, `useCheckout`) with toast + error handling wired in.
      Files: `frontend/src/components/ui/**` (shared), `frontend/src/hooks/**`.
      Verify: `pnpm run build` + `pnpm run lint` pass.

- [ ] 6. Public + auth pages: landing, login, register, shared service-catalog browse.
      `app/(public)/` with login and register forms (react-hook-form + zod mirroring backend rules: register name≥2, email, password≥6, phone≥8). On success store session and redirect to role home. Public services catalog page consuming public `GET /api/services`.
      Files: `frontend/src/app/(public)/**`, relevant form components.
      Verify: `pnpm run build`; manual against seeded accounts: login as each role lands on its area.

- [ ] 7. Pelanggan area.
      `app/(pelanggan)/` guarded to `pelanggan`: dashboard listing own bookings, create-online-booking form (`plateNumber, motorModel, complaint, serviceId? from catalog, serviceDate?`), booking detail with `StatusStepper` tracking the 5 stages, a "confirmation email sent" notice on create (G6 surface), and an invoice **Download PDF** button shown only when `status==='Diambil'` (fetches the PDF as a blob with auth header and triggers download).
      Files: `frontend/src/app/(pelanggan)/**`.
      Verify: `pnpm run build`; manual with seeded pelanggan: create booking, see Antre, open the `Diambil` seeded ticket is owned by others so use own flow; download button appears only post-Diambil.

- [ ] 8. Kasir/Admin operations area.
      `app/(staff)/` guarded to `admin`/`kasir`: ticket queue with filters, walk-in ticket creation, assign-mechanic dialog (uses `/users/mechanics`), status-advance control that offers only backend-allowed next statuses (incl. cancel from Antre), checkout → `Diambil` (admin/kasir only) then surface the invoice download, and master-data management for parts (add/restock/price via `POST`/`PUT /api/parts`) and services (`POST`/`PUT /api/services`). Enforce the "assign mechanic before Diperiksa" rule in the UI.
      Files: `frontend/src/app/(staff)/**`.
      Verify: `pnpm run build`; manual: walk-in → assign → Diperiksa → Dikerjakan → add part (stock drops) → Selesai → Diambil → invoice downloads.

- [ ] 9. Mekanik area.
      `app/(mekanik)/` guarded to `mekanik`: list of assigned tickets (auto-scoped by backend), ticket detail with sequential status advance (no `Diambil` option shown), add/remove parts with live stock feedback and error toasts on insufficient stock.
      Files: `frontend/src/app/(mekanik)/**`.
      Verify: `pnpm run build`; manual with seeded budi.mekanik: only assigned tickets visible; advance status; add/remove part adjusts stock.

- [ ] 10. Pemilik (owner) + admin-user-management area.
      `app/(owner)/` guarded to `pemilik`/`admin`: dashboard cards (revenueToday/Month, activeTickets breakdown, completedToday, low-stock count) from `/reports/dashboard`; revenue report with date-range filter from `/reports/revenue` (both-or-neither validation client-side); low-stock overview from `/parts/low-stock`. Admin-only staff management: create staff form, paginated user list with role/status filters, activate/deactivate toggle (`PATCH /users/:id/status`), guarding against self-deactivation message from backend.
      Files: `frontend/src/app/(owner)/**`, `frontend/src/app/(admin)/**` (or a shared management route).
      Verify: `pnpm run build`; manual with seeded owner/admin: dashboard numbers render; revenue filter works; staff create + toggle work.

- [ ] 11. Documentation + env + database-switch instructions (DB decision).
      Add a frontend `README.md` (setup, env, role map, G6 notes) and a prominent SETUP section (root README or `SETUP.md`) explaining the dummy-DB default and exactly how to switch to a real Atlas string (`mongodb+srv://user:pass@cluster.xxxx.mongodb.net/motorcenter_phase3`), then `pnpm run seed` and `pnpm run dev`. Keep `backend/.env` `MONGODB_URI` as the clearly-labeled placeholder; do NOT commit credentials. Confirm `.env`/`.env.local` stay gitignored. Do not change the app default to in-memory.
      Files: `frontend/README.md`, `SETUP.md` (or README edit), comment in `backend/.env.example`.
      Verify: `git check-ignore frontend/.env.local backend/.env` lists both; `pnpm run build` still passes.

## Digest

Frontend is greenfield — every `frontend/**` file below is created new; the only existing files touched are documentation/env.

| File / area | Block to create or change | Covering verification |
| --- | --- | --- |
| `frontend/package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `components.json` | New scaffold (item 2) | `pnpm install && pnpm run build` |
| `frontend/.env.local`, `.env.example`, `.gitignore` | `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`; ignore `.env*` (keep `.env.example`) | `git check-ignore frontend/.env.local` |
| `frontend/src/lib/api-client.ts` | axios instance + Bearer interceptor + envelope unwrap/throw, 401 handling (item 3) | `pnpm run build` |
| `frontend/src/types/api.ts` | envelope, User/Booking/Part/Service/Report types, `ServiceStatus` union incl. `Dibatalkan`, transitions map | `pnpm run build` |
| `frontend/src/services/{auth,bookings,users,parts,services,reports}.ts` | one typed fn per documented endpoint | `pnpm run build` |
| `frontend/src/lib/auth-context.tsx`, `hooks/use-auth.ts`, `components/guards/role-guard.tsx` | session state, role→home map, guard (item 4) | `pnpm run build`, manual redirect check |
| `frontend/src/components/ui/**`, `hooks/**` | StatusBadge/Stepper, DataTable, Stat/Empty/Loading/Error, ConfirmDialog, Rupiah; React Query data + mutation hooks (item 5) | `pnpm run build`, `pnpm run lint` |
| `frontend/src/app/(public)/**` | landing, login, register (zod rules mirror backend), public catalog (item 6) | login per seeded role |
| `frontend/src/app/(pelanggan)/**` | own bookings, online booking form, tracking stepper, email-sent notice, invoice download post-Diambil (item 7) | manual pelanggan flow |
| `frontend/src/app/(staff)/**` | queue, walk-in, assign, status advance (+cancel), checkout, parts & services master data (item 8) | manual full ticket lifecycle |
| `frontend/src/app/(mekanik)/**` | assigned tickets, sequential status (no Diambil), add/remove parts (item 9) | manual mekanik flow |
| `frontend/src/app/(owner)/** , (admin)/**` | dashboard, revenue report, low-stock, staff management + status toggle (item 10) | manual owner/admin flow |
| `frontend/README.md`, `SETUP.md`, `backend/.env.example` comment | setup + real-DB switch instructions; placeholder preserved (item 11) | `pnpm run build`, gitignore check |
| `backend/**` | READ-ONLY verification of BE1–BE5 (item 1); fix only real defects | `cd backend && pnpm run typecheck` |

**Verification commands discovered:** backend `cd backend && pnpm run typecheck` (and `pnpm run build` = `tsc`, `pnpm run dev`, `pnpm run seed`); frontend (created in item 2) `cd frontend && pnpm install && pnpm run build && pnpm run lint`. No backend tests exist in-repo (`backend/tests/` is gitignored and absent); verification is typecheck + build + manual API-driven flows against seeded data. A live or in-memory MongoDB is required for end-to-end manual checks; without one, record which flows could not be executed.

**Testing note:** no test framework ships in the repo. For the frontend, set up the ecosystem-standard (Vitest + React Testing Library) and cover the api-client envelope-unwrap/error path, the auth/role-guard logic, and the allowed-status-transition helper — the pure-logic units where regressions are cheapest to catch.
