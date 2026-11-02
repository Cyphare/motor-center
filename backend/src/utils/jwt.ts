import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../constants';
import { UnauthorizedError } from './appError';

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
}

/**
 * Menghasilkan token JWT bertanda tangan
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Memverifikasi keabsahan token JWT
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Sesi autentikasi telah kedaluwarsa, silakan login kembali');
    }
    throw new UnauthorizedError('Token autentikasi tidak valid atau telah dimodifikasi');
  }
};
