import { Router } from 'express';
import { getDashboard, getRevenue, getTopItems } from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { revenueQuerySchema, topItemsQuerySchema } from '../validations/report.validation';
import { USER_ROLES } from '../constants';

const router = Router();
router.use(authMiddleware, authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PEMILIK));
router.get('/dashboard', getDashboard);
router.get('/revenue', validate(revenueQuerySchema), getRevenue);
router.get('/top-items', validate(topItemsQuerySchema), getTopItems);
export default router;
