import { Router } from 'express';
import {
  createOnlineBooking,
  createWalkInBooking,
  getBookings,
  getBookingById,
  getInvoicePdf,
  assignMechanic,
  updateStatus,
  addPartToBooking,
  removePartFromBooking,
  cancelOwnBooking,
} from '../controllers/booking.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { USER_ROLES } from '../constants';
import {
  createOnlineBookingSchema,
  createWalkInBookingSchema,
  assignMechanicSchema,
  updateStatusSchema,
  addPartToBookingSchema,
  bookingQuerySchema,
  cancelOwnBookingSchema,
} from '../validations/booking.validation';

const router = Router();

router.use(authMiddleware);

router.post(
  '/online',
  authorizeRoles(USER_ROLES.PELANGGAN),
  validate(createOnlineBookingSchema),
  createOnlineBooking
);

router.post(
  '/walk-in',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR),
  validate(createWalkInBookingSchema),
  createWalkInBooking
);

router.get('/', validate(bookingQuerySchema), getBookings);
router.get('/:id', getBookingById);
router.get(
  '/:id/invoice/pdf',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.PEMILIK, USER_ROLES.PELANGGAN),
  getInvoicePdf
);

router.put(
  '/:id/assign',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR),
  validate(assignMechanicSchema),
  assignMechanic
);

router.put(
  '/:id/status',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.MEKANIK),
  validate(updateStatusSchema),
  updateStatus
);

router.patch(
  '/:id/cancel',
  authorizeRoles(USER_ROLES.PELANGGAN),
  validate(cancelOwnBookingSchema),
  cancelOwnBooking
);

router.post(
  '/:id/parts',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.MEKANIK),
  validate(addPartToBookingSchema),
  addPartToBooking
);

router.delete(
  '/:id/parts/:partItemId',
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.MEKANIK),
  removePartFromBooking
);

export default router;
