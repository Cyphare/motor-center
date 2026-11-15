import { z } from 'zod';
import { isValidIsoCalendarDate } from '../utils/jakartaDate';

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus YYYY-MM-DD')
  .refine(isValidIsoCalendarDate, 'Tanggal tidak valid');

const dateRange = { startDate: date.optional(), endDate: date.optional() };

const isValidRange = ({ startDate, endDate }: { startDate?: string; endDate?: string }): boolean =>
  (!startDate && !endDate) || (!!startDate && !!endDate && startDate <= endDate);

const rangeMessage = 'startDate dan endDate wajib bersama dan rentang tidak boleh terbalik';

export const revenueQuerySchema = z.object({
  query: z.object(dateRange).refine(isValidRange, rangeMessage),
});

export const topItemsQuerySchema = z.object({
  query: z
    .object({
      ...dateRange,
      limit: z.coerce.number().int().min(1, 'limit minimal 1').max(50, 'limit maksimal 50').optional(),
    })
    .strict()
    .refine(isValidRange, rangeMessage),
});
