import { z } from 'zod';

export const registerSchema = z.object({
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
    phone: z
      .string({ error: 'Nomor telepon wajib diisi' })
      .trim()
      .min(8, 'Nomor telepon minimal 8 digit'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ error: 'Email wajib diisi' })
      .trim()
      .email('Format alamat email tidak valid'),
    password: z
      .string({ error: 'Kata sandi wajib diisi' })
      .min(1, 'Kata sandi wajib diisi'),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Nama minimal 2 karakter')
        .max(100, 'Nama maksimal 100 karakter')
        .optional(),
      phone: z
        .string()
        .trim()
        .min(8, 'Nomor telepon minimal 8 digit')
        .optional(),
    })
    .refine(
      (value) => value.name !== undefined || value.phone !== undefined,
      'Minimal satu field (name atau phone) wajib diisi'
    ),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({ error: 'Kata sandi lama wajib diisi' })
      .min(1, 'Kata sandi lama wajib diisi'),
    newPassword: z
      .string({ error: 'Kata sandi baru wajib diisi' })
      .min(6, 'Kata sandi baru minimal 6 karakter'),
  }),
});
