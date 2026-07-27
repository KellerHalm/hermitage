import * as cartService from '../services/cartService.js';

export const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req);
    res.status(200).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const addCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.addCartItem(req, req.body.productId, req.body.quantity);
    res.status(200).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateCartItem(req, req.params.productId, req.body.quantity);
    res.status(200).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeCartItem(req, req.params.productId);
    res.status(200).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req);
    res.status(200).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const mergeGuestCart = async (req, res, next) => {
  try {
    const cart = await cartService.mergeGuestCart(req.user.id, req.guestId);
    res.status(200).json({ status: 'success', data: { cart } });
  } catch (error) {
    next(error);
  }
};
