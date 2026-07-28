import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { uploadCategoryFiles } from '../middlewares/uploadMiddleware.js';
import { validate, schemas } from '../middlewares/validateMiddleware.js';

const router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);

router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.post('/', uploadCategoryFiles.single('image'), validate(schemas.createCategory), categoryController.createCategory);
router.patch('/:id', uploadCategoryFiles.single('image'), validate(schemas.updateCategory), categoryController.updateCategory);
router.delete('/:id', restrictTo('ADMIN'), categoryController.deleteCategory);

export default router;