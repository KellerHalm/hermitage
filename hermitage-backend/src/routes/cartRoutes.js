import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { optionalProtect } from '../middlewares/optionalAuthMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(optionalProtect);

router.get('/', cartController.getCart);
router.post('/items', cartController.addCartItem);
router.patch('/items/:productId', cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);
router.post('/merge', protect, cartController.mergeGuestCart);

export default router;
