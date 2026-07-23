import * as productService from '../services/productService.js';

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.files);
    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.files);
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getSimilarProducts = async (req, res, next) => {
  try {
    const products = await productService.getSimilarProducts(req.params.slug);
    res.status(200).json({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
};

export const getBoughtTogetherProducts = async (req, res, next) => {
  try {
    const products = await productService.getBoughtTogetherProducts(req.params.slug);
    res.status(200).json({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
};

