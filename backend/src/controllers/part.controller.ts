import { Request, Response, NextFunction } from 'express';
import { Part } from '../models/part.model';
import { NotFoundError, UnauthorizedError} from '../utils/appError';
import { sendCreated, sendSuccess } from '../utils/response';
import { changeStock } from '../services/stock.service';
import mongoose from 'mongoose';

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

export const restockPart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try{
    if (!req.user) throw new UnauthorizedError();
    const user = req.user;
    const {quantity, note} = req.body;    
    let part!: NonNullable<Awaited<ReturnType<typeof changeStock>>>;
    await mongoose.connection.transaction(async (session) => {
      const result = await changeStock({
        partId: String(req.params.id),
        delta: quantity,
        type: 'restock',
        userId: user.id,
        note,
        session,
        requireActive: true
      })
      if(!result) throw new NotFoundError('Suku cadang tidak ditemukan atau tidak aktif');
      part = result;
    })

    sendSuccess(res, `Stok ${part.name} berhasil ditambah sebanyak ${quantity} ${part.unit}`, part);
  } catch (error) {next(error);}
}

export const deletePart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!part) throw new NotFoundError('Suku cadang tidak ditemukan');
    sendSuccess(res, 'Suku cadang berhasil dinonaktifkan', part);
  } catch (error) { next(error); }
};
