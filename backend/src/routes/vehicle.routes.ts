import { Router } from 'express';
import { getVehicleHistory } from '../controllers/vehicle.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { vehicleHistorySchema } from '../validations/vehicle.validation';
import { USER_ROLES } from '../constants';

const router = Router();

router.get(
  '/:plateNumber/history',
  authMiddleware,
  authorizeRoles(USER_ROLES.PELANGGAN, USER_ROLES.KASIR, USER_ROLES.MEKANIK, USER_ROLES.ADMIN),
  validate(vehicleHistorySchema),
  getVehicleHistory
);

export default router;
