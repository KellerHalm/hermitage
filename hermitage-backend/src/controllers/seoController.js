import * as seoService from '../services/seoService.js';

export const getSitemapData = async (req, res, next) => {
  try {
    const sitemapData = await seoService.getSitemapUrls();
    res.status(200).json({ status: 'success', data: sitemapData });
  } catch (error) {
    next(error);
  }
};