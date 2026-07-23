import express from 'express';
import * as brandController from '../controllers/brandController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);

router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.post('/', brandController.createBrand);
router.patch('/:id', brandController.updateBrand);
router.delete('/:id', restrictTo('ADMIN'), brandController.deleteBrand);

export default router;