import { Request, Response, NextFunction } from 'express';
import { Service } from '../models/service.model';
import { NotFoundError } from '../utils/appError';
import { sendCreated, sendSuccess } from '../utils/response';

export const listServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
    sendSuccess(res, 'Daftar layanan berhasil diambil', await Service.find(filter).sort({ name: 1 }));
  } catch (error) { next(error); }
};

export const getService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter = req.query.includeInactive === 'true' ? { _id: req.params.id } : { _id: req.params.id, isActive: true };
    const service = await Service.findOne(filter);
    if (!service) throw new NotFoundError('Layanan tidak ditemukan');
    sendSuccess(res, 'Detail layanan berhasil diambil', service);
  } catch (error) { next(error); }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendCreated(res, 'Layanan berhasil dibuat', await Service.create(req.body));
  } catch (error) { next(error); }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) throw new NotFoundError('Layanan tidak ditemukan');
    sendSuccess(res, 'Layanan berhasil diperbarui', service);
  } catch (error) { next(error); }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!service) throw new NotFoundError('Layanan tidak ditemukan');
    sendSuccess(res, 'Layanan berhasil dinonaktifkan', service);
  } catch (error) { next(error); }
};
