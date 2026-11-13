import { z } from 'zod';
import { BOOKING_TYPE, SERVICE_STATUS } from '../constants';
import {
  isValidIsoCalendarDate,
  nextJakartaDay,
  startOfJakartaDay,
} from '../utils/jakartaDate';
import {phoneSchema} from './common.validation';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const isoDatetime = z.iso.datetime({
  offset: true,
  message: 'Format tanggal harus ISO datetime',
});

const dateFilterParam = z
  .string()
  .trim()
  .refine(
    (value) => isValidIsoCalendarDate(value) || isoDatetime.safeParse(value).success,
    'Format tanggal harus YYYY-MM-DD yang valid atau ISO datetime'
  );

function resolveStartBound(value: string): Date {
  return isValidIsoCalendarDate(value) ? startOfJakartaDay(value) : new Date(value);
}

function resolveEndExclusiveOrInclusiveBound(value: string): Date {
  return isValidIsoCalendarDate(value)
    ? new Date(nextJakartaDay(value).getTime() - 1)
    : new Date(value);
}

const serviceStatusValues = Object.values(SERVICE_STATUS) as [
  (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS],
  ...(typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS][],
];

const bookingTypeValues = Object.values(BOOKING_TYPE) as [
  (typeof BOOKING_TYPE)[keyof typeof BOOKING_TYPE],
  ...(typeof BOOKING_TYPE)[keyof typeof BOOKING_TYPE][],
];

export const createOnlineBookingSchema = z.object({
  body: z.object({
    plateNumber: z
      .string({ error: 'Nomor plat kendaraan wajib diisi' })
      .trim()
      .min(3, 'Nomor plat minimal 3 karakter')
      .max(15, 'Nomor plat maksimal 15 karakter'),
    motorModel: z
      .string({ error: 'Model motor wajib diisi' })
      .trim()
      .min(2, 'Model motor minimal 2 karakter')
      .max(50, 'Model motor maksimal 50 karakter'),
    complaint: z
      .string({ error: 'Keluhan kendaraan wajib diisi' })
      .trim()
      .min(3, 'Keluhan minimal 3 karakter')
      .max(500, 'Keluhan maksimal 500 karakter'),
    serviceId: z.string().regex(objectIdRegex, 'ID Layanan tidak valid').optional(),
    serviceDate: isoDatetime.optional(),
  }),
});

export const createWalkInBookingSchema = z.object({
  body: z.object({
    customerName: z
      .string({ error: 'Nama pelanggan wajib diisi' })
      .trim()
      .min(2, 'Nama pelanggan minimal 2 karakter')
      .max(100, 'Nama pelanggan maksimal 100 karakter'),
    customerPhone: phoneSchema,
    plateNumber: z
      .string({ error: 'Nomor plat kendaraan wajib diisi' })
      .trim()
      .min(3, 'Nomor plat minimal 3 karakter')
      .max(15, 'Nomor plat maksimal 15 karakter'),
    motorModel: z
      .string({ error: 'Model motor wajib diisi' })
      .trim()
      .min(2, 'Model motor minimal 2 karakter')
      .max(50, 'Model motor maksimal 50 karakter'),
    complaint: z
      .string({ error: 'Keluhan kendaraan wajib diisi' })
      .trim()
      .min(3, 'Keluhan minimal 3 karakter')
      .max(500, 'Keluhan maksimal 500 karakter'),
    serviceId: z.string().regex(objectIdRegex, 'ID Layanan tidak valid').optional(),
    mechanicId: z.string().regex(objectIdRegex, 'ID Mekanik tidak valid').optional(),
    serviceFee: z.coerce.number().min(0, 'Biaya jasa tidak boleh bernilai negatif').optional(),
  }),
});

export const assignMechanicSchema = z.object({
  body: z.object({
    mechanicId: z
      .string({ error: 'ID Mekanik wajib diisi' })
      .regex(objectIdRegex, 'Format ID Mekanik tidak valid'),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(serviceStatusValues, {
      error: (issue) =>
        issue.input === undefined ? 'Status baru wajib diisi' : 'Status tidak valid',
    }),
    mechanicNotes: z.string().max(1000).optional(),
    serviceFee: z.coerce.number().min(0, 'Biaya jasa tidak boleh bernilai negatif').optional(),
  }),
});

export const addPartToBookingSchema = z.object({
  body: z.object({
    partId: z
      .string({ error: 'ID Suku Cadang wajib diisi' })
      .regex(objectIdRegex, 'Format ID Part tidak valid'),
    quantity: z.coerce
      .number({ error: 'Jumlah (quantity) wajib diisi' })
      .int()
      .min(1, 'Jumlah minimal 1'),
  }),
});

export const bookingQuerySchema = z.object({
  query: z
    .object({
      status: z.enum(serviceStatusValues).optional(),
      bookingType: z.enum(bookingTypeValues).optional(),
      plateNumber: z.string().optional(),
      mechanicId: z.string().regex(objectIdRegex, 'Format ID Mekanik tidak valid').optional(),
      startDate: dateFilterParam.optional(),
      endDate: dateFilterParam.optional(),
      page: z.coerce.number().min(1).default(1).optional(),
      limit: z.coerce.number().min(1).max(100).default(10).optional(),
    })
    .refine(
      ({ startDate, endDate }) => {
        if (!startDate || !endDate) return true;
        return resolveStartBound(startDate) <= resolveEndExclusiveOrInclusiveBound(endDate);
      },
      {
        path: ['endDate'],
        message: 'Rentang tanggal tidak boleh terbalik (startDate harus sebelum atau sama dengan endDate)',
      }
    ),
});
