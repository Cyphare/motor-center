import {z} from 'zod';

export const phoneSchema = z
    .string({error: 'Nomor telepon wajib diisi'})
    .trim()
    .regex(/^[0-9]{10,13}$/, 'Nomor telepon harus 10 sampai 13 digit angka')