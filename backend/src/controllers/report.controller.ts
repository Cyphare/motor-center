import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models/booking.model';
import { Part } from '../models/part.model';
import { SERVICE_STATUS } from '../constants';
import { sendSuccess } from '../utils/response';
import { jakartaDate, nextJakartaDay, startOfJakartaDay } from '../utils/jakartaDate';

const pickedUp = (start: string, end: string) => ({
  status: SERVICE_STATUS.DIAMBIL,
  pickedUpAt: { $gte: startOfJakartaDay(start), $lt: nextJakartaDay(end) },
});

export const getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = jakartaDate(new Date());
    const monthStart = `${today.slice(0, 7)}-01`;
    const [revenueToday, revenueMonth, active, completedToday, lowStockParts] = await Promise.all([
      Booking.aggregate([{ $match: pickedUp(today, today) }, { $group: { _id: null, total: { $sum: { $add: ['$serviceFee', '$partsTotalCost'] } } } }]),
      Booking.aggregate([{ $match: pickedUp(monthStart, today) }, { $group: { _id: null, total: { $sum: { $add: ['$serviceFee', '$partsTotalCost'] } } } }]),
      Booking.aggregate([{ $match: { status: { $in: [SERVICE_STATUS.ANTRE, SERVICE_STATUS.DIPERIKSA, SERVICE_STATUS.DIKERJAKAN] } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.countDocuments({ completedAt: { $gte: startOfJakartaDay(today), $lt: nextJakartaDay(today) } }),
      Part.find({ isActive: true, $expr: { $lte: ['$stock', '$minStock'] } }).select('code name stock minStock unit').lean(),
    ]);
    sendSuccess(res, 'Dashboard berhasil diambil', {
      date: today,
      revenueToday: revenueToday[0]?.total ?? 0,
      revenueMonth: revenueMonth[0]?.total ?? 0,
      activeTickets: Object.fromEntries([SERVICE_STATUS.ANTRE, SERVICE_STATUS.DIPERIKSA, SERVICE_STATUS.DIKERJAKAN].map(
        (status) => [status, active.find((item) => item._id === status)?.count ?? 0]
      )),
      completedToday,
      lowStockParts,
    });
  } catch (error) { next(error); }
};

const resolveRange = (req: Request): { startDate: string; endDate: string } => {
  const today = jakartaDate(new Date());
  return {
    startDate: (req.query.startDate as string) || `${today.slice(0, 7)}-01`,
    endDate: (req.query.endDate as string) || today,
  };
};

export const getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = resolveRange(req);
    const days = await Booking.aggregate([
      { $match: pickedUp(startDate, endDate) },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$pickedUpAt', timezone: 'Asia/Jakarta' } },
        serviceTotal: { $sum: '$serviceFee' }, partsTotal: { $sum: '$partsTotalCost' },
        ticketCount: { $sum: 1 },
      } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', serviceTotal: 1, partsTotal: 1, revenue: { $add: ['$serviceTotal', '$partsTotal'] }, ticketCount: 1 } },
    ]);
    const totals = days.reduce((sum, day) => ({
      serviceTotal: sum.serviceTotal + day.serviceTotal,
      partsTotal: sum.partsTotal + day.partsTotal,
      revenue: sum.revenue + day.revenue,
    }), { serviceTotal: 0, partsTotal: 0, revenue: 0 });
    sendSuccess(res, 'Laporan omzet berhasil diambil', { startDate, endDate, ...totals, days });
  } catch (error) { next(error); }
};

export const getTopItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = resolveRange(req);
    const limit = Number(req.query.limit) || 10;
    const match = pickedUp(startDate, endDate);

    const [parts, services, counts] = await Promise.all([
      Booking.aggregate([
        { $match: match },
        { $sort: { pickedUpAt: 1 } },
        { $unwind: '$partsUsed' },
        { $group: {
          _id: '$partsUsed.partId',
          code: { $last: '$partsUsed.code' },
          name: { $last: '$partsUsed.name' },
          quantity: { $sum: '$partsUsed.quantity' },
          revenue: { $sum: '$partsUsed.subtotal' },
          ticketIds: { $addToSet: '$_id' },
        } },
        { $sort: { quantity: -1, revenue: -1, name: 1 } },
        { $limit: limit },
        { $project: { _id: 0, partId: '$_id', code: 1, name: 1, quantity: 1, revenue: 1, ticketCount: { $size: '$ticketIds' } } },
      ]),
      Booking.aggregate([
        { $match: { ...match, serviceId: { $ne: null } } },
        { $sort: { pickedUpAt: 1 } },
        { $group: {
          _id: '$serviceId',
          name: { $last: '$serviceName' },
          ticketCount: { $sum: 1 },
          revenue: { $sum: '$serviceFee' },
        } },
        { $sort: { ticketCount: -1, revenue: -1, name: 1 } },
        { $limit: limit },
        { $project: { _id: 0, serviceId: '$_id', name: 1, ticketCount: 1, revenue: 1 } },
      ]),
      Booking.aggregate([
        { $match: match },
        { $group: {
          _id: null,
          ticketCount: { $sum: 1 },
          servicelessTickets: { $sum: { $cond: [{ $ifNull: ['$serviceId', false] }, 0, 1] } },
        } },
      ]),
    ]);

    sendSuccess(res, 'Ringkasan terlaris berhasil diambil', {
      startDate,
      endDate,
      ticketCount: counts[0]?.ticketCount ?? 0,
      servicelessTickets: counts[0]?.servicelessTickets ?? 0,
      parts,
      services,
    });
  } catch (error) { next(error); }
};
