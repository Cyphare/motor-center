import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { BadRequestError } from '../utils/appError';

export interface RequestValidationResult {
  body?: any;
  query?: any;
  params?: any;
}

/**
 * Middleware untuk validasi request payload menggunakan Zod schema
 */
export const validate = (schema: z.ZodType<RequestValidationResult>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.slice(1).map(String).join('.'),
          location: String(issue.path[0] ?? ''),
          message: issue.message,
        }));
        return next(new BadRequestError('Validasi input data gagal', formattedErrors));
      }
      next(error);
    }
  };
};
