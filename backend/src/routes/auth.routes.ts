import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, validate(updateProfileSchema), updateMe);
router.put('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);

export default router;
