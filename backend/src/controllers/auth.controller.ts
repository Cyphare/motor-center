import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { USER_ROLES } from '../constants';
import { generateToken } from '../utils/jwt';
import { sendCreated, sendSuccess } from '../utils/response';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError, ForbiddenError} from '../utils/appError';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError(`Email '${email}' sudah digunakan oleh pengguna lain`);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: USER_ROLES.PELANGGAN,
      phone,
    });

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    sendCreated(res, 'Pendaftaran akun berhasil', {
      user,
      accessToken: token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedError('Alamat email atau kata sandi tidak valid');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Alamat email atau kata sandi tidak valid');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Akun Anda dinonaktifkan. Silakan hubungi administrator bengkel');
    }

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    sendSuccess(res, 'Login berhasil', {
      user,
      accessToken: token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('Profil pengguna tidak ditemukan');
    }

    sendSuccess(res, 'Data profil berhasil diambil', user);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('Profil pengguna tidak ditemukan');
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    sendSuccess(res, 'Profil berhasil diperbarui', user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { oldPassword, newPassword } = req.body;

    if (oldPassword === newPassword) {
      throw new BadRequestError('Kata sandi baru tidak boleh sama dengan kata sandi lama');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Kata sandi lama yang Anda masukkan salah');
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    sendSuccess(res, 'Kata sandi berhasil diperbarui. Silakan login kembali dengan sandi baru.');
  } catch (error) {
    next(error);
  }
};
