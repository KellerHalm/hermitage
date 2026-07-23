import * as favoriteService from '../services/favoriteService.js';

export const addFavorite = async (req, res, next) => {
  try {
    const favorite = await favoriteService.addFavorite(req.user.id, req.body.productId);
    res.status(201).json({ status: 'success', data: { favorite } });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user.id, req.params.productId);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getUserFavorites = async (req, res, next) => {
  try {
    const favorites = await favoriteService.getUserFavorites(req.user.id);
    res.status(200).json({ status: 'success', data: { favorites } });
  } catch (error) {
    next(error);
  }
};