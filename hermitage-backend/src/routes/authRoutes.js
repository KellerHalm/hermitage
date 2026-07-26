import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validateMiddleware.js';

const router = express.Router();

router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/verify-admin', protect, authController.verifyAdmin);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, validate(schemas.updateProfile), authController.updateMe);
router.delete('/me', protect, authController.deleteMe);

export default router;
