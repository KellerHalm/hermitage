import * as searchService from '../services/searchService.js';

export const search = async (req, res, next) => {
  try {
    const results = await searchService.globalSearch(req.query.q);
    res.status(200).json({ status: 'success', data: results });
  } catch (error) {
    next(error);
  }
};