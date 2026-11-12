
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  KASIR: 'kasir',
  MEKANIK: 'mekanik',
  PEMILIK: 'pemilik',
  PELANGGAN: 'pelanggan',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const SERVICE_STATUS = {
  ANTRE: 'Antre',
  DIPERIKSA: 'Diperiksa',
  DIKERJAKAN: 'Dikerjakan',
  SELESAI: 'Selesai',
  DIAMBIL: 'Diambil',
  DIBATALKAN: 'Dibatalkan',
} as const;

export type ServiceStatus = (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];

// Allowed state transitions for workshop tickets
export const ALLOWED_STATUS_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  Antre: ['Diperiksa', 'Dibatalkan'],
  Diperiksa: ['Dikerjakan', 'Dibatalkan'],
  Dikerjakan: ['Selesai'],
  Selesai: ['Diambil'],
  Diambil: [],
  Dibatalkan: [],
};

export const BOOKING_TYPE = {
  WALK_IN: 'walk-in',
  ONLINE: 'online',
} as const;

export type BookingType = (typeof BOOKING_TYPE)[keyof typeof BOOKING_TYPE];
