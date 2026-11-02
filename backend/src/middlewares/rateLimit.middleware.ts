import rateLimit, { Options } from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export const createRateLimiter = (options: {
  windowMs: number;
  limit: number;
  message: string;
  skipInTest?: boolean;
  extra?: Partial<Options>;
}) =>
  rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => (options.skipInTest ?? true) && env.NODE_ENV === 'test',
    handler: (_req, res) => {
      sendError(res, options.message, 429);
    },
    ...options.extra,
  });

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Terlalu banyak permintaan dari alamat IP ini. Silakan coba lagi beberapa saat kemudian.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Terlalu banyak percobaan autentikasi. Silakan coba lagi dalam 15 menit.',
});
