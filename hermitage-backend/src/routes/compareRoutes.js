import express from 'express';
import * as compareController from '../controllers/compareController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', compareController.getUserCompare);
router.post('/', compareController.addCompare);
router.post('/sync', compareController.syncCompare);
router.delete('/:productId', compareController.removeCompare);

export default router;
