import * as compareService from '../services/compareService.js';

export const getUserCompare = async (req, res, next) => {
  try {
    const compares = await compareService.getUserCompare(req.user.id);
    res.status(200).json({ status: 'success', data: { compares } });
  } catch (error) {
    next(error);
  }
};

export const addCompare = async (req, res, next) => {
  try {
    const compare = await compareService.addCompare(req.user.id, req.body.productId);
    res.status(201).json({ status: 'success', data: { compare } });
  } catch (error) {
    next(error);
  }
};

export const removeCompare = async (req, res, next) => {
  try {
    await compareService.removeCompare(req.user.id, req.params.productId);
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const syncCompare = async (req, res, next) => {
  try {
    const compares = await compareService.syncCompare(req.user.id, req.body.productIds || []);
    res.status(200).json({ status: 'success', data: { compares } });
  } catch (error) {
    next(error);
  }
};
