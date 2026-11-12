import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/appError';
import { User } from '../models/user.model';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Header Authorization dengan format Bearer <token> diperlukan');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token autentikasi tidak ditemukan');
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('isActive role tokenVersion');
    if (!user) {
      throw new UnauthorizedError('Pengguna dengan kredensial ini tidak lagi terdaftar');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Akun Anda telah dinonaktifkan. Silakan hubungi administrator bengkel');
    }

    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new UnauthorizedError(
        'Sesi Anda sudah tidak berlaku karena kata sandi atau status akun berubah. Silakan login kembali'
      );
    }

    req.user = {
      ...decoded,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };
    next();
  } catch (error) {
    next(error);
  }
};
