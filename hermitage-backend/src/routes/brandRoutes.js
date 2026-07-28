import express from 'express';
import * as brandController from '../controllers/brandController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validateMiddleware.js';

const router = express.Router();

router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);

router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.post('/', validate(schemas.createBrand), brandController.createBrand);
router.patch('/:id', validate(schemas.updateBrand), brandController.updateBrand);
router.delete('/:id', restrictTo('ADMIN'), brandController.deleteBrand);

export default router;