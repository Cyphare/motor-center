import { z } from 'zod';
import { isValidIsoCalendarDate } from '../utils/jakartaDate';

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus YYYY-MM-DD')
  .refine(isValidIsoCalendarDate, 'Tanggal tidak valid');

export const revenueQuerySchema = z.object({
  query: z
    .object({ startDate: date.optional(), endDate: date.optional() })
    .refine(
      ({ startDate, endDate }) =>
        (!startDate && !endDate) || (!!startDate && !!endDate && startDate <= endDate),
      'startDate dan endDate wajib bersama dan rentang tidak boleh terbalik'
    ),
});
