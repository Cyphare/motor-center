import { z } from 'zod';
import { MOVEMENT_TYPE } from '../models/stockMovement.model';
import { isValidIsoCalendarDate } from '../utils/jakartaDate';

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().min(1).max(1000);
const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const service = z
  .object({
    name,
    description,
    estimatedPrice: money,
    estimatedDurationMinutes: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    isActive: z.boolean().optional(),
  })
  .strict();

const part = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .transform((value) => value.toUpperCase()),
    name,
    stock: count,
    minStock: count,
    price: money,
    unit: z.string().trim().min(1).max(30),
    isActive: z.boolean().optional(),
  })
  .strict();

const nonempty = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'Minimal satu field diperlukan');

export const createServiceSchema = z.object({ body: service });
export const updateServiceSchema = z.object({ body: nonempty(service) });
export const createPartSchema = z.object({ body: part });
export const updatePartSchema = z.object({ body: nonempty(part) });
export const catalogQuerySchema = z.object({
  query: z.object({ includeInactive: z.enum(['true', 'false']).optional() }).strict(),
});

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const restockPartSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID suku cadang tidak valid'),
  }),
  body: z.object({
    quantity: z.number().int('Jumlah harus bilangan bulat').min(1, 'jumlah minimal 1').max(Number.MAX_SAFE_INTEGER),
    note: z.string().trim().max(200).optional(),
  })
  .strict()
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus YYYY-MM-DD')
  .refine(isValidIsoCalendarDate, 'Tanggal tidak valid');

export const partMovementsSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID suku cadang tidak valid'),
  }),
  query: z
    .object({
      type: z.enum(MOVEMENT_TYPE).optional(),
      startDate: isoDate.optional(),
      endDate: isoDate.optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict()
    .refine(
      ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
      'startDate tidak boleh setelah endDate'
    ),
});
