import { Request, Response, NextFunction } from 'express';
import { Part } from '../models/part.model';
import { NotFoundError } from '../utils/appError';
import { sendCreated, sendSuccess } from '../utils/response';

export const listParts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
    sendSuccess(res, 'Daftar suku cadang berhasil diambil', await Part.find(filter).sort({ code: 1 }));
  } catch (error) { next(error); }
};

export const listLowStock = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parts = await Part.find({ isActive: true, $expr: { $lte: ['$stock', '$minStock'] } }).sort({ code: 1 });
    sendSuccess(res, 'Daftar stok rendah berhasil diambil', parts);
  } catch (error) { next(error); }
};

export const getPart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter = req.query.includeInactive === 'true' ? { _id: req.params.id } : { _id: req.params.id, isActive: true };
    const part = await Part.findOne(filter);
    if (!part) throw new NotFoundError('Suku cadang tidak ditemukan');
    sendSuccess(res, 'Detail suku cadang berhasil diambil', part);
  } catch (error) { next(error); }
};

export const createPart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendCreated(res, 'Suku cadang berhasil dibuat', await Part.create(req.body));
  } catch (error) { next(error); }
};

export const updatePart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!part) throw new NotFoundError('Suku cadang tidak ditemukan');
    sendSuccess(res, 'Suku cadang berhasil diperbarui', part);
  } catch (error) { next(error); }
};

export const deletePart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!part) throw new NotFoundError('Suku cadang tidak ditemukan');
    sendSuccess(res, 'Suku cadang berhasil dinonaktifkan', part);
  } catch (error) { next(error); }
};
