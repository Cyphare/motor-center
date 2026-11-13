// Typed contract mirroring the MotorCenter backend API.
// Response envelope: backend/src/utils/response.ts
// Domain constants: backend/src/constants/index.ts (kept in sync exactly).

// ---------------------------------------------------------------------------
// Response envelope
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiFieldError {
  field: string;
  location?: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: true;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export type UserRole = "admin" | "kasir" | "mekanik" | "pemilik" | "pelanggan";

// ---------------------------------------------------------------------------
// Service status flow (mirrors backend ALLOWED_STATUS_TRANSITIONS exactly)
// ---------------------------------------------------------------------------

export type ServiceStatus =
  | "Antre"
  | "Diperiksa"
  | "Dikerjakan"
  | "Selesai"
  | "Diambil"
  | "Dibatalkan";

export const SERVICE_STATUS_FLOW: ServiceStatus[] = [
  "Antre",
  "Diperiksa",
  "Dikerjakan",
  "Selesai",
  "Diambil",
];

// Must mirror backend/src/constants/index.ts ALLOWED_STATUS_TRANSITIONS exactly.
export const ALLOWED_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  Antre: ["Diperiksa", "Dibatalkan"],
  Diperiksa: ["Dikerjakan", "Dibatalkan"],
  Dikerjakan: ["Selesai"],
  Selesai: ["Diambil"],
  Diambil: [],
  Dibatalkan: [],
};

export type BookingType = "walk-in" | "online";

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Minimal shape returned by GET /api/users/mechanics (no role field).
export interface Mechanic {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export interface PartUsedItem {
  _id: string;
  partId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  addedAt: string;
}

export interface StatusHistoryEntry {
  status: ServiceStatus;
  changedBy?: string;
  changedAt: string;
  notes?: string;
}

// mechanicId may arrive either as a raw id string or a populated user object.
export type PopulatedRef<T> = string | T;

export interface Booking {
  _id: string;
  bookingNumber: string;
  bookingType: BookingType;
  customerId?: PopulatedRef<User>;
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  motorModel: string;
  complaint: string;
  serviceId?: PopulatedRef<Service>;
  serviceName?: string;
  mechanicId?: PopulatedRef<Mechanic>;
  status: ServiceStatus;
  statusHistory: StatusHistoryEntry[];
  mechanicNotes?: string;
  serviceFee: number;
  partsUsed: PartUsedItem[];
  partsTotalCost: number;
  grandTotal: number;
  serviceDate?: string;
  completedAt?: string;
  pickedUpAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Part {
  _id: string;
  code: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
  unit: string;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type StockMovementType = "restock" | "usage" | "return" | "adjust";

export interface StockMovementUserRef {
  _id: string;
  name: string;
  role: UserRole;
}

export interface StockMovementBookingRef {
  _id: string;
  bookingNumber: string;
}

export interface StockMovement {
  _id: string;
  partId: string;
  type: StockMovementType;
  quantity: number;
  stockAfter: number;
  bookingId?: PopulatedRef<StockMovementBookingRef>;
  userId: PopulatedRef<StockMovementUserRef>;
  note?: string;
  createdAt: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  estimatedPrice: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Reports (mirrors backend/src/controllers/report.controller.ts)
// ---------------------------------------------------------------------------

export interface DashboardLowStockPart {
  _id: string;
  code: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

export interface DashboardReport {
  date: string; // YYYY-MM-DD (WIB)
  revenueToday: number;
  revenueMonth: number;
  activeTickets: Record<Extract<ServiceStatus, "Antre" | "Diperiksa" | "Dikerjakan">, number>;
  completedToday: number;
  lowStockParts: DashboardLowStockPart[];
}

export interface RevenueDay {
  date: string;
  serviceTotal: number;
  partsTotal: number;
  revenue: number;
  ticketCount: number;
}

export interface RevenueReport {
  startDate: string;
  endDate: string;
  serviceTotal: number;
  partsTotal: number;
  revenue: number;
  days: RevenueDay[];
}

// ---------------------------------------------------------------------------
// Auth payloads
// ---------------------------------------------------------------------------

export interface AuthResult {
  user: User;
  accessToken: string;
}
