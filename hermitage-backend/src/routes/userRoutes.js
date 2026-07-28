import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, restrictTo, preventPrivilegeEscalation } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validateMiddleware.js';

const router = express.Router();

// Admin-only user management.
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', preventPrivilegeEscalation, validate(schemas.createUser), userController.createUser);
router.patch('/:id', preventPrivilegeEscalation, validate(schemas.updateUser), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
