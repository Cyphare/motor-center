import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { USER_ROLES } from '../constants';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/appError';
import { escapeRegex } from '../utils/jakartaDate';

export const createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError(`Email '${email}' sudah digunakan oleh pengguna lain`);
    }

    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
    });

    sendCreated(res, `Akun staf (${role}) berhasil dibuat`, staff);
  } catch (error) {
    next(error);
  }
};

export const getMechanics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mechanics = await User.find({
      role: USER_ROLES.MEKANIK,
      isActive: true,
    })
      .select('name email phone isActive createdAt')
      .sort({ name: 1 });

    sendSuccess(res, 'Daftar mekanik aktif berhasil diambil', mechanics);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(String(req.query.search)), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    sendPaginated(res, 'Daftar pengguna berhasil diambil', users, {
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    sendSuccess(res, 'Detail pengguna berhasil diambil', user);
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive } = req.body;
    const targetUserId = req.params.id;

    // Prevent admin from disabling their own account
    if (req.user?.id === targetUserId && !isActive) {
      throw new BadRequestError('Anda tidak dapat menonaktifkan akun admin Anda sendiri');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    // Prevent disabling the last remaining active admin account
    if (!isActive && user.role === USER_ROLES.ADMIN && user.isActive) {
      const remainingActiveAdmins = await User.countDocuments({
        role: USER_ROLES.ADMIN,
        isActive: true,
        _id: { $ne: user._id },
      });
      if (remainingActiveAdmins === 0) {
        throw new BadRequestError(
          'Tidak dapat menonaktifkan satu-satunya akun admin yang masih aktif'
        );
      }
    }

    user.isActive = isActive;
    await user.save();

    const statusText = isActive ? 'diaktifkan' : 'dinonaktifkan';
    sendSuccess(res, `Akun pengguna ${user.name} berhasil ${statusText}`, user);
  } catch (error) {
    next(error);
  }
};
