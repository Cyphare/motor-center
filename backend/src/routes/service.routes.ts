import { Router } from 'express';
import { createService, deleteService, getService, listServices, updateService } from '../controllers/service.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { USER_ROLES } from '../constants';
import { catalogQuerySchema, createServiceSchema, updateServiceSchema } from '../validations/catalog.validation';

const router = Router();
const staff = authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR);
const inactiveReaders = authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.PEMILIK);

router.get('/', validate(catalogQuerySchema), (req, res, next) => {
  if (req.query.includeInactive === 'true') return authMiddleware(req, res, error => error ? next(error) : inactiveReaders(req, res, next));
  next();
}, listServices);
router.get('/:id', (req, res, next) => {
  if (req.query.includeInactive === 'true') return authMiddleware(req, res, error => error ? next(error) : inactiveReaders(req, res, next));
  next();
}, getService);
router.post('/', authMiddleware, staff, validate(createServiceSchema), createService);
router.put('/:id', authMiddleware, staff, validate(updateServiceSchema), updateService);
router.delete('/:id', authMiddleware, staff, deleteService);

export default router;
