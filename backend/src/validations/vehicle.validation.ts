import { z } from 'zod';

export const vehicleHistorySchema = z.object({
  params: z.object({
    plateNumber: z
      .string()
      .trim()
      .min(3, 'Nomor plat minimal 3 karakter')
      .max(15, 'Nomor plat maksimal 15 karakter')
      .regex(/^[A-Za-z0-9 ]+$/, 'Nomor plat hanya boleh berisi huruf, angka, dan spasi'),
  }),
});
