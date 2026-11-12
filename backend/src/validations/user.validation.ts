import { z } from 'zod';
import { USER_ROLES } from '../constants';
import { phoneSchema } from './common.validation';
const staffRoles = [
  USER_ROLES.ADMIN,
  USER_ROLES.KASIR,
  USER_ROLES.MEKANIK,
  USER_ROLES.PEMILIK,
] as const;

const allRoles = Object.values(USER_ROLES) as [
  (typeof USER_ROLES)[keyof typeof USER_ROLES],
  ...(typeof USER_ROLES)[keyof typeof USER_ROLES][],
];

export const createStaffSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Nama lengkap wajib diisi' })
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    email: z
      .string({ error: 'Email wajib diisi' })
      .trim()
      .email('Format alamat email tidak valid'),
    password: z
      .string({ error: 'Kata sandi wajib diisi' })
      .min(6, 'Kata sandi minimal 6 karakter'),
    role: z.enum(staffRoles, {
      error: 'Peran staf harus salah satu dari: admin, kasir, mekanik, pemilik',
    }),
    phone: phoneSchema,
  }),
});

export const userQuerySchema = z.object({
  query: z.object({
    role: z.enum(allRoles).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(10).optional(),
    search: z.string().optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ error: 'Status isActive (true/false) wajib diisi' }),
  }),
});
