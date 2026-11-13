import { z } from "zod";

// Centralized Zod v4 validation schemas mirroring backend/src/validations/*.ts.
// Keeping every form schema in one module prevents drift across pages and keeps
// client/server constraints aligned on the same Zod major version (v4).

export const STAFF_ROLES = ["admin", "kasir", "mekanik", "pemilik"] as const;

// Mirrors backend/src/validations/common.validation.ts phoneSchema
export const phoneFieldSchema = z
  .string()
  .trim()
  .min(1, "Nomor telepon wajib diisi")
  .regex(/^[0-9]{10,13}$/, "Nomor telepon harus 10 sampai 13 digit angka");

const intString = (label: string, min = 0) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .refine(
      (value) => {
        const n = Number(value);
        return Number.isSafeInteger(n) && n >= min;
      },
      min > 0
        ? `${label} harus bilangan bulat lebih dari ${min - 1}`
        : `${label} harus bilangan bulat tidak negatif`
    );

// Mirrors backend/src/validations/auth.validation.ts loginSchema
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format alamat email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

// Mirrors backend/src/validations/auth.validation.ts registerSchema
export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  phone: phoneFieldSchema,
});
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

// Mirrors backend/src/validations/auth.validation.ts updateProfileSchema
export const updateProfileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  phone: phoneFieldSchema,
});
export type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;

// Mirrors backend/src/validations/auth.validation.ts changePasswordSchema (+ UI confirmation)
export const changePasswordFormSchema = z
  .object({
    oldPassword: z.string().min(1, "Kata sandi lama wajib diisi"),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi kata sandi minimal 6 karakter"),
  })
  .refine((values) => values.newPassword !== values.oldPassword, {
    path: ["newPassword"],
    message: "Kata sandi baru tidak boleh sama dengan kata sandi lama",
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak cocok",
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

// Mirrors backend/src/validations/booking.validation.ts createOnlineBookingSchema
export const createOnlineBookingFormSchema = z.object({
  plateNumber: z
    .string()
    .trim()
    .min(3, "Nomor plat minimal 3 karakter")
    .max(15, "Nomor plat maksimal 15 karakter"),
  motorModel: z
    .string()
    .trim()
    .min(2, "Model motor minimal 2 karakter")
    .max(50, "Model motor maksimal 50 karakter"),
  complaint: z
    .string()
    .trim()
    .min(3, "Keluhan minimal 3 karakter")
    .max(500, "Keluhan maksimal 500 karakter"),
  serviceId: z.string().optional(),
  serviceDate: z.string().optional(),
});
export type CreateOnlineBookingFormValues = z.infer<
  typeof createOnlineBookingFormSchema
>;

// Mirrors backend/src/validations/booking.validation.ts createWalkInBookingSchema
export const createWalkInBookingFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Nama pelanggan minimal 2 karakter")
    .max(100, "Nama pelanggan maksimal 100 karakter"),
  customerPhone: phoneFieldSchema,
  plateNumber: z
    .string()
    .trim()
    .min(3, "Nomor plat minimal 3 karakter")
    .max(15, "Nomor plat maksimal 15 karakter"),
  motorModel: z
    .string()
    .trim()
    .min(2, "Model motor minimal 2 karakter")
    .max(50, "Model motor maksimal 50 karakter"),
  complaint: z
    .string()
    .trim()
    .min(3, "Keluhan minimal 3 karakter")
    .max(500, "Keluhan maksimal 500 karakter"),
  serviceId: z.string().optional(),
  mechanicId: z.string().optional(),
  serviceFee: z
    .string()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Biaya jasa tidak boleh negatif"
    ),
});
export type CreateWalkInBookingFormValues = z.infer<
  typeof createWalkInBookingFormSchema
>;

// Mirrors backend/src/validations/catalog.validation.ts part schema
export const partFormSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi").max(50),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  stock: intString("Stok", 0),
  minStock: intString("Stok minimal", 0),
  price: intString("Harga", 0),
  unit: z.string().trim().min(1, "Satuan wajib diisi").max(30),
});
export type PartFormValues = z.infer<typeof partFormSchema>;

// Mirrors backend/src/validations/catalog.validation.ts restockPartSchema
export const restockPartFormSchema = z.object({
  quantity: intString("Jumlah tambahan", 1),
  note: z
    .string()
    .trim()
    .max(200, "Catatan maksimal 200 karakter")
    .optional(),
});
export type RestockPartFormValues = z.infer<typeof restockPartFormSchema>;

// Mirrors backend/src/validations/catalog.validation.ts service schema
export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  description: z.string().trim().min(1, "Deskripsi wajib diisi").max(1000),
  estimatedPrice: intString("Harga", 0),
  estimatedDurationMinutes: intString("Durasi", 1),
});
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// Mirrors backend/src/validations/user.validation.ts createStaffSchema
export const createStaffFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().trim().email("Format alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  role: z.enum(STAFF_ROLES, {
    message: "Peran harus salah satu dari: admin, kasir, mekanik, pemilik",
  }),
  phone: phoneFieldSchema,
});
export type CreateStaffFormValues = z.infer<typeof createStaffFormSchema>;

/**
 * Shared YYYY-MM-DD date range validator mirroring backend report.validation.ts
 * and booking.validation.ts.
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  options: { requireBoth?: boolean } = {}
): string | null {
  const hasStart = startDate.trim() !== "";
  const hasEnd = endDate.trim() !== "";
  if (!hasStart && !hasEnd) return null;
  if (options.requireBoth && hasStart !== hasEnd) {
    return "Tanggal mulai dan tanggal akhir wajib diisi bersama.";
  }
  if (hasStart && hasEnd && startDate > endDate) {
    return "Rentang tanggal tidak boleh terbalik (mulai harus sebelum akhir).";
  }
  return null;
}
