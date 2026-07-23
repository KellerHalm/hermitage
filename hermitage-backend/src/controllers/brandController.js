import * as brandService from '../services/brandService.js';

export const createBrand = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json({ status: 'success', data: { brand } });
  } catch (error) {
    next(error);
  }
};

export const getAllBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json({ status: 'success', data: { brands } });
  } catch (error) {
    next(error);
  }
};

export const getBrandById = async (req, res, next) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.status(200).json({ status: 'success', data: { brand } });
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { brand } });
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    await brandService.deleteBrand(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

