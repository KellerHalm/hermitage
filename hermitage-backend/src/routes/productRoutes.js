import express from 'express';
import * as productController from '../controllers/productController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { uploadProductFiles } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/by-id/:id', productController.getProductById);
router.get('/:slug/similar', productController.getSimilarProducts);
router.get('/:slug/bought-together', productController.getBoughtTogetherProducts);
router.get('/:slug', productController.getProductBySlug);

router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.post('/', uploadProductFiles.array('images', 10), productController.createProduct);
router.patch('/:id', uploadProductFiles.array('images', 10), productController.updateProduct);
router.delete('/:id', restrictTo('ADMIN'), productController.deleteProduct);

export default router;

