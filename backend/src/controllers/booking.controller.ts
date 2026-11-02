import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Booking, IBooking } from '../models/booking.model';
import { User } from '../models/user.model';
import { Service } from '../models/service.model';
import { Part } from '../models/part.model';
import { sendBookingEmail } from '../services/mail.service';
import { writeInvoice } from '../services/pdf.service';
import {
  ALLOWED_STATUS_TRANSITIONS,
  BOOKING_TYPE,
  SERVICE_STATUS,
  ServiceStatus,
  USER_ROLES,
} from '../constants';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/appError';
import {
  escapeRegex,
  isValidIsoCalendarDate,
  nextJakartaDay,
  startOfJakartaDay,
} from '../utils/jakartaDate';

const MAX_BOOKING_CREATE_ATTEMPTS = 5;

function isBookingNumberDuplicateError(error: any): boolean {
  if (error?.code !== 11000) return false;
  if (error.keyPattern && 'bookingNumber' in error.keyPattern) return true;
  if (error.keyValue && 'bookingNumber' in error.keyValue) return true;
  return typeof error?.message === 'string' && error.message.includes('bookingNumber');
}

async function createBookingWithRetry(
  buildDocument: (bookingNumber: string) => Record<string, unknown>
): Promise<IBooking> {
  for (let attempt = 1; attempt <= MAX_BOOKING_CREATE_ATTEMPTS; attempt += 1) {
    const bookingNumber = await Booking.generateBookingNumber();
    try {
      return await Booking.create(buildDocument(bookingNumber));
    } catch (error) {
      if (isBookingNumberDuplicateError(error) && attempt < MAX_BOOKING_CREATE_ATTEMPTS) {
        await Booking.syncBookingCounter();
        continue;
      }
      throw error;
    }
  }
  throw new Error('Gagal menghasilkan nomor booking unik setelah beberapa percobaan');
}

export const createOnlineBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const customer = await User.findById(req.user.id);
    if (!customer) throw new NotFoundError('Data profil pelanggan tidak ditemukan');

    const { plateNumber, motorModel, complaint, serviceId, serviceDate } = req.body;

    let serviceName: string | undefined;
    let initialServiceFee = 0;

    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        throw new BadRequestError('Layanan servis yang dipilih tidak ditemukan atau sedang tidak aktif');
      }
      serviceName = service.name;
      initialServiceFee = service.estimatedPrice;
    }

    const booking = await createBookingWithRetry((bookingNumber) => ({
      bookingNumber,
      bookingType: BOOKING_TYPE.ONLINE,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      plateNumber: plateNumber.toUpperCase(),
      motorModel,
      complaint,
      serviceId: serviceId ? new Types.ObjectId(serviceId) : undefined,
      serviceName,
      status: SERVICE_STATUS.ANTRE,
      serviceFee: initialServiceFee,
      partsTotalCost: 0,
      grandTotal: initialServiceFee,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      statusHistory: [
        {
          status: SERVICE_STATUS.ANTRE,
          changedBy: customer._id,
          changedAt: new Date(),
          notes: 'Reservasi servis online berhasil dibuat oleh pelanggan',
        },
      ],
    }));

    try {
      await sendBookingEmail(customer.email, booking, 'created');
    } catch (error) {
      console.error(`[Email] Konfirmasi booking ${booking.bookingNumber} gagal:`, error);
    }
    sendCreated(res, 'Reservasi online berhasil dibuat', booking);
  } catch (error) {
    next(error);
  }
};

export const createWalkInBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const {
      customerName,
      customerPhone,
      plateNumber,
      motorModel,
      complaint,
      serviceId,
      mechanicId,
      serviceFee,
    } = req.body;

    let serviceName: string | undefined;
    let initialServiceFee = serviceFee ?? 0;

    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        throw new BadRequestError('Layanan servis tidak valid atau tidak aktif');
      }
      serviceName = service.name;
      if (serviceFee === undefined) {
        initialServiceFee = service.estimatedPrice;
      }
    }

    if (mechanicId) {
      const mechanic = await User.findOne({
        _id: mechanicId,
        role: USER_ROLES.MEKANIK,
        isActive: true,
      });
      if (!mechanic) {
        throw new BadRequestError('Mekanik yang dipilih tidak valid atau tidak aktif');
      }
    }

    const actorId = new Types.ObjectId(req.user.id);
    const booking = await createBookingWithRetry((bookingNumber) => ({
      bookingNumber,
      bookingType: BOOKING_TYPE.WALK_IN,
      customerName,
      customerPhone,
      plateNumber: plateNumber.toUpperCase(),
      motorModel,
      complaint,
      serviceId: serviceId ? new Types.ObjectId(serviceId) : undefined,
      serviceName,
      mechanicId: mechanicId ? new Types.ObjectId(mechanicId) : undefined,
      status: SERVICE_STATUS.ANTRE,
      serviceFee: initialServiceFee,
      partsTotalCost: 0,
      grandTotal: initialServiceFee,
      serviceDate: new Date(),
      statusHistory: [
        {
          status: SERVICE_STATUS.ANTRE,
          changedBy: actorId,
          changedAt: new Date(),
          notes: 'Tiket servis langsung (Walk-in) dibuat oleh kasir/admin',
        },
      ],
    }));

    sendCreated(res, 'Tiket servis walk-in berhasil dibuat', booking);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Scope query for role-restricted access
    if (req.user.role === USER_ROLES.PELANGGAN) {
      filter.customerId = new Types.ObjectId(req.user.id);
    } else if (req.user.role === USER_ROLES.MEKANIK) {
      filter.mechanicId = new Types.ObjectId(req.user.id);
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.bookingType) {
      filter.bookingType = req.query.bookingType;
    }

    if (req.query.plateNumber) {
      filter.plateNumber = new RegExp(escapeRegex(String(req.query.plateNumber)), 'i');
    }

    if (req.query.mechanicId && req.user.role !== USER_ROLES.MEKANIK) {
      filter.mechanicId = new Types.ObjectId(String(req.query.mechanicId));
    }

    if (req.query.startDate || req.query.endDate) {
      filter.serviceDate = {};
      if (req.query.startDate) {
        const startRaw = String(req.query.startDate);
        filter.serviceDate.$gte = isValidIsoCalendarDate(startRaw)
          ? startOfJakartaDay(startRaw)
          : new Date(startRaw);
      }
      if (req.query.endDate) {
        const endRaw = String(req.query.endDate);
        if (isValidIsoCalendarDate(endRaw)) {
          filter.serviceDate.$lt = nextJakartaDay(endRaw);
        } else {
          filter.serviceDate.$lte = new Date(endRaw);
        }
      }
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('mechanicId', 'name phone')
        .populate('serviceId', 'name estimatedPrice estimatedDurationMinutes'),
      Booking.countDocuments(filter),
    ]);

    sendPaginated(res, 'Daftar tiket servis berhasil diambil', bookings, {
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const booking = await Booking.findById(req.params.id)
      .populate('mechanicId', 'name phone email')
      .populate('serviceId', 'name description estimatedPrice estimatedDurationMinutes')
      .populate('customerId', 'name phone email');

    if (!booking) {
      throw new NotFoundError('Tiket servis tidak ditemukan');
    }

    if (
      req.user.role === USER_ROLES.PELANGGAN &&
      (booking.bookingType !== BOOKING_TYPE.ONLINE ||
        !booking.customerId ||
        !booking.customerId._id.equals(req.user.id))
    ) {
      throw new ForbiddenError('Anda tidak memiliki izin untuk melihat tiket servis milik pelanggan lain');
    }

    if (
      req.user.role === USER_ROLES.MEKANIK &&
      (!booking.mechanicId || !booking.mechanicId._id.equals(req.user.id))
    ) {
      throw new ForbiddenError('Anda hanya dapat melihat tiket servis yang ditugaskan kepada Anda');
    }

    sendSuccess(res, 'Detail tiket servis berhasil diambil', booking);
  } catch (error) {
    next(error);
  }
};

export const getInvoicePdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new NotFoundError('Tiket servis tidak ditemukan');
    if (
      req.user.role === USER_ROLES.PELANGGAN &&
      (booking.bookingType !== BOOKING_TYPE.ONLINE || !booking.customerId?.equals(req.user.id))
    ) {
      throw new ForbiddenError('Anda tidak memiliki izin untuk mengunduh faktur ini');
    }
    if (booking.status !== SERVICE_STATUS.DIAMBIL || !booking.pickedUpAt) {
      throw new BadRequestError('Faktur tersedia setelah tiket berstatus Diambil');
    }
    writeInvoice(booking, res);
  } catch (error) {
    next(error);
  }
};

export const assignMechanic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { mechanicId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new NotFoundError('Tiket servis tidak ditemukan');
    }

    if (
      booking.status === SERVICE_STATUS.SELESAI ||
      booking.status === SERVICE_STATUS.DIAMBIL ||
      booking.status === SERVICE_STATUS.DIBATALKAN
    ) {
      throw new BadRequestError(
        'Tidak dapat menugaskan mekanik pada tiket yang sudah selesai, diambil, atau dibatalkan'
      );
    }

    const mechanic = await User.findOne({
      _id: mechanicId,
      role: USER_ROLES.MEKANIK,
      isActive: true,
    });

    if (!mechanic) {
      throw new BadRequestError('Mekanik tidak ditemukan atau sedang tidak aktif');
    }

    booking.mechanicId = mechanic._id;
    booking.statusHistory.push({
      status: booking.status,
      changedBy: new Types.ObjectId(req.user.id),
      changedAt: new Date(),
      notes: `Ditugaskan kepada mekanik: ${mechanic.name}`,
    });

    await booking.save();

    sendSuccess(
      res,
      `Mekanik ${mechanic.name} berhasil ditugaskan ke tiket ${booking.bookingNumber}`,
      booking
    );
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { status: newStatus, mechanicNotes, serviceFee } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new NotFoundError('Tiket servis tidak ditemukan');
    }

    if (req.user.role === USER_ROLES.MEKANIK) {
      if (!booking.mechanicId || !booking.mechanicId.equals(req.user.id)) {
        throw new ForbiddenError(
          'Anda hanya berwenang memperbarui status tiket yang ditugaskan kepada Anda'
        );
      }
      if (newStatus === SERVICE_STATUS.DIAMBIL) {
        throw new ForbiddenError(
          'Hanya admin atau kasir yang dapat mencatat pembayaran dan pengambilan motor'
        );
      }
      if (newStatus === SERVICE_STATUS.DIBATALKAN) {
        throw new ForbiddenError('Hanya admin atau kasir yang dapat membatalkan tiket servis');
      }
      if (serviceFee !== undefined) {
        throw new ForbiddenError(
          'Hanya admin atau kasir yang dapat menetapkan atau mengubah biaya jasa'
        );
      }
    }

    // Validate sequential status workflow (US1)
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(newStatus as ServiceStatus)) {
      throw new BadRequestError(
        `Transisi dari status '${booking.status}' ke '${newStatus}' tidak sah. Alur yang sah: Antre -> Diperiksa -> Dikerjakan -> Selesai -> Diambil`
      );
    }

    if (newStatus === SERVICE_STATUS.DIPERIKSA && !booking.mechanicId) {
      throw new BadRequestError(
        'Mekanik harus ditugaskan terlebih dahulu sebelum status diubah ke Diperiksa'
      );
    }

    if (newStatus === SERVICE_STATUS.SELESAI) {
      booking.completedAt = new Date();
    } else if (newStatus === SERVICE_STATUS.DIAMBIL) {
      booking.pickedUpAt = new Date();
    }

    if (mechanicNotes !== undefined) {
      booking.mechanicNotes = mechanicNotes;
    }

    if (serviceFee !== undefined) {
      booking.serviceFee = serviceFee;
      booking.grandTotal = booking.serviceFee + booking.partsTotalCost;
    }

    booking.status = newStatus as ServiceStatus;
    booking.statusHistory.push({
      status: newStatus as ServiceStatus,
      changedBy: new Types.ObjectId(req.user.id),
      changedAt: new Date(),
      notes: mechanicNotes || `Status diperbarui menjadi ${newStatus}`,
    });

    await booking.save();

    if (
      newStatus === SERVICE_STATUS.SELESAI &&
      booking.bookingType === BOOKING_TYPE.ONLINE &&
      booking.customerId
    ) {
      try {
        const customer = await User.findById(booking.customerId).select('email');
        if (customer) await sendBookingEmail(customer.email, booking, 'completed');
      } catch (error) {
        console.error(`[Email] Pemberitahuan selesai ${booking.bookingNumber} gagal:`, error);
      }
    }

    sendSuccess(res, `Status tiket servis berhasil diubah ke '${newStatus}'`, booking);
  } catch (error) {
    next(error);
  }
};

export const addPartToBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { partId, quantity } = req.body;
    let booking;
    let partName = '';
    await mongoose.connection.transaction(async (session) => {
      booking = await Booking.findById(req.params.id).session(session);
      if (!booking) throw new NotFoundError('Tiket servis tidak ditemukan');
      if (
        req.user!.role === USER_ROLES.MEKANIK &&
        (!booking.mechanicId || !booking.mechanicId.equals(req.user!.id))
      ) {
        throw new ForbiddenError(
          'Anda hanya dapat menambahkan suku cadang pada tiket yang ditugaskan kepada Anda'
        );
      }
      if (
        booking.status !== SERVICE_STATUS.DIPERIKSA &&
        booking.status !== SERVICE_STATUS.DIKERJAKAN
      ) {
        throw new BadRequestError(
          `Suku cadang hanya dapat ditambahkan pada status 'Diperiksa' atau 'Dikerjakan' (status saat ini: '${booking.status}')`
        );
      }
      const part = await Part.findOneAndUpdate(
        { _id: partId, stock: { $gte: quantity }, isActive: true },
        { $inc: { stock: -quantity } },
        { new: true, session }
      );
      if (!part) {
        throw new BadRequestError(
          'Suku cadang tidak ditemukan, tidak aktif, atau jumlah stok di gudang tidak mencukupi'
        );
      }
      partName = part.name;
      booking.partsUsed.push({
        partId: part._id,
        code: part.code,
        name: part.name,
        price: part.price,
        quantity,
        subtotal: part.price * quantity,
        addedAt: new Date(),
      });
      booking.partsTotalCost = booking.partsUsed.reduce((sum, item) => sum + item.subtotal, 0);
      booking.grandTotal = booking.serviceFee + booking.partsTotalCost;
      await booking.save({ session });
    });
    sendSuccess(
      res,
      `Suku cadang '${partName}' (x${quantity}) berhasil ditambahkan ke tiket servis`,
      booking
    );
  } catch (error) {
    next(error);
  }
};

export const removePartFromBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const { id: bookingId, partItemId } = req.params;
    let booking;
    let removedName = '';
    await mongoose.connection.transaction(async (session) => {
      booking = await Booking.findById(bookingId).session(session);
      if (!booking) throw new NotFoundError('Tiket servis tidak ditemukan');
      if (
        req.user!.role === USER_ROLES.MEKANIK &&
        (!booking.mechanicId || !booking.mechanicId.equals(req.user!.id))
      ) {
        throw new ForbiddenError(
          'Anda hanya dapat mengelola suku cadang pada tiket yang ditugaskan kepada Anda'
        );
      }
      if (
        booking.status !== SERVICE_STATUS.DIPERIKSA &&
        booking.status !== SERVICE_STATUS.DIKERJAKAN
      ) {
        throw new BadRequestError(
          `Suku cadang hanya dapat dibatalkan saat status 'Diperiksa' atau 'Dikerjakan' (status saat ini: '${booking.status}')`
        );
      }
      const index = booking.partsUsed.findIndex((item) => item._id?.toString() === partItemId);
      if (index === -1) throw new NotFoundError('Item suku cadang tidak ditemukan pada tiket servis ini');
      const removed = booking.partsUsed[index];
      const part = await Part.findByIdAndUpdate(
        removed.partId,
        { $inc: { stock: removed.quantity } },
        { new: true, session }
      );
      if (!part) throw new NotFoundError('Suku cadang asal tidak ditemukan; stok tidak dapat dikembalikan');
      removedName = removed.name;
      booking.partsUsed.splice(index, 1);
      booking.partsTotalCost = booking.partsUsed.reduce((sum, item) => sum + item.subtotal, 0);
      booking.grandTotal = booking.serviceFee + booking.partsTotalCost;
      await booking.save({ session });
    });
    sendSuccess(
      res,
      `Suku cadang '${removedName}' berhasil dibatalkan dan stok dikembalikan ke gudang`,
      booking
    );
  } catch (error) {
    next(error);
  }
};
