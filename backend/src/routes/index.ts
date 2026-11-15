import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import bookingRoutes from './booking.routes';
import serviceRoutes from './service.routes';
import partRoutes from './part.routes';
import reportRoutes from './report.routes';
import vehicleRoutes from './vehicle.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    app: 'MotorCenter API',
    description: 'RESTful API for MotorCenter Workshop Management System',
    version: '1.0.0',
    status: 'ACTIVE',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      bookings: '/api/bookings',
      services: '/api/services',
      parts: '/api/parts',
      reports: '/api/reports',
      vehicles: '/api/vehicles/:plateNumber/history',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/services', serviceRoutes);
router.use('/parts', partRoutes);
router.use('/reports', reportRoutes);
router.use('/vehicles', vehicleRoutes);

export default router;
