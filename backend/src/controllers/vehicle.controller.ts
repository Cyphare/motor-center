import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Booking } from '../models/booking.model';
import { BOOKING_TYPE, USER_ROLES } from '../constants';
import { UnauthorizedError } from '../utils/appError';
import { normalizePlate, plateSearchPattern } from '../utils/plate';
import { sendSuccess } from '../utils/response';

const VISIT_FIELDS = [
  'bookingNumber',
  'bookingType',
  'status',
  'serviceDate',
  'completedAt',
  'pickedUpAt',
  'plateNumber',
  'motorModel',
  'complaint',
  'serviceName',
  'mechanicId',
  'mechanicNotes',
  'partsUsed',
  'serviceFee',
  'partsTotalCost',
  'grandTotal',
].join(' ');

export const getVehicleHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const plateNumber = normalizePlate(String(req.params.plateNumber));
    const filter: Record<string, unknown> = { plateNumber: plateSearchPattern(plateNumber) };
    if (req.user.role === USER_ROLES.PELANGGAN) {
      filter.bookingType = BOOKING_TYPE.ONLINE;
      filter.customerId = new Types.ObjectId(req.user.id);
    }

    const visits = await Booking.find(filter)
      .sort({ serviceDate: -1, createdAt: -1 })
      .select(VISIT_FIELDS)
      .populate('mechanicId', 'name')
      .lean();

    const message = visits.length
      ? `Ditemukan ${visits.length} riwayat servis untuk kendaraan ${plateNumber}`
      : `Riwayat servis untuk kendaraan ${plateNumber} belum tersedia`;
    sendSuccess(res, message, { plateNumber, totalVisits: visits.length, visits });
  } catch (error) {
    next(error);
  }
};
