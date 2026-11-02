import { z } from 'zod';

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
