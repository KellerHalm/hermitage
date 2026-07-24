import express from 'express';
import * as countryController from '../controllers/countryController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { uploadCountryFiles } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', countryController.getAllCountries);
router.get('/:id', countryController.getCountryById);

router.use(protect);
router.use(restrictTo('ADMIN', 'MANAGER'));

router.post('/', uploadCountryFiles.single('image'), countryController.createCountry);
router.patch('/:id', uploadCountryFiles.single('image'), countryController.updateCountry);
router.delete('/:id', restrictTo('ADMIN'), countryController.deleteCountry);

export default router;
