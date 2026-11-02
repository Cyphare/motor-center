import { Router } from 'express';
import { createPart, deletePart, getPart, listLowStock, listParts, updatePart } from '../controllers/part.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { USER_ROLES } from '../constants';
import { catalogQuerySchema, createPartSchema, updatePartSchema } from '../validations/catalog.validation';

const router = Router();
const staff = authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR);
const readers = authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.MEKANIK, USER_ROLES.PEMILIK);
const inactiveReaders = authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.KASIR, USER_ROLES.PEMILIK);

router.use(authMiddleware);
router.get('/', readers, validate(catalogQuerySchema), (req, res, next) => {
  if (req.query.includeInactive === 'true') return inactiveReaders(req, res, next);
  next();
}, listParts);
router.get('/low-stock', authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.PEMILIK), listLowStock);
router.get('/:id', readers, (req, res, next) => {
  if (req.query.includeInactive === 'true') return inactiveReaders(req, res, next);
  next();
}, getPart);
router.post('/', staff, validate(createPartSchema), createPart);
router.put('/:id', staff, validate(updatePartSchema), updatePart);
router.delete('/:id', staff, deletePart);

export default router;
