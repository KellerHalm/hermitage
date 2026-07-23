import express from 'express';
import * as favoriteController from '../controllers/favoriteController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', favoriteController.getUserFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:productId', favoriteController.removeFavorite);

export default router;