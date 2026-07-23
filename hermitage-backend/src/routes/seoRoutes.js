import express from 'express';
import * as seoController from '../controllers/seoController.js';

const router = express.Router();

router.get('/sitemap', seoController.getSitemapData);

export default router;