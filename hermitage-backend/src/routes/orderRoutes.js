import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);

router.use(restrictTo('ADMIN', 'MANAGER'));

router.get('/', orderController.getAllOrders);
router.patch('/:id/status', orderController.updateOrderStatus);

export default router;