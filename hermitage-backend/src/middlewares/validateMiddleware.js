import Joi from 'joi';
import AppError from '../utils/AppError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('. ');
      return next(new AppError(message, 400));
    }

    req[source] = value;
    next();
  };
};

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().max(100).allow('', null),
    lastName: Joi.string().max(100).allow('', null),
    phone: Joi.string().max(20).allow('', null),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().max(100).allow('', null),
    lastName: Joi.string().max(100).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    email: Joi.string().email().max(255).optional(),
    password: Joi.string().min(8).max(128).optional(),
  }).min(1),

  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).max(100).required(),
      })
    ).min(1).max(50).required(),
    shippingAddress: Joi.string().max(500).allow('', null),
    paymentMethod: Joi.string().max(50).allow('', null),
    deliveryType: Joi.string().valid('delivery', 'pickup').allow('', null),
    comment: Joi.string().max(1000).allow('', null),
    customerFirstName: Joi.string().max(100).allow('', null),
    customerLastName: Joi.string().max(100).allow('', null),
    customerPhone: Joi.string().max(20).allow('', null),
    customerEmail: Joi.string().email().allow('', null),
  }),

  createProduct: Joi.object({
    title: Joi.string().max(300).required(),
    description: Joi.string().max(10000).required(),
    price: Joi.number().positive().precision(2).required(),
    oldPrice: Joi.number().positive().precision(2).allow(null),
    sku: Joi.string().max(100).allow('', null),
    sizes: Joi.string().max(200).allow('', null),
    stockStatus: Joi.string().valid('IN_STOCK', 'OUT_OF_STOCK', 'ON_ORDER'),
    stockQuantity: Joi.number().integer().min(0).allow(null),
    country: Joi.string().max(100).allow('', null),
    material: Joi.string().max(200).allow('', null),
    color: Joi.string().max(100).allow('', null),
    popular: Joi.boolean(),
    isNew: Joi.boolean(),
    isSale: Joi.boolean(),
    categoryId: Joi.string().uuid().required(),
    brandId: Joi.string().uuid().allow(null, ''),
  }),

  updateProduct: Joi.object({
    title: Joi.string().max(300),
    description: Joi.string().max(10000),
    price: Joi.number().positive().precision(2),
    oldPrice: Joi.number().positive().precision(2).allow(null),
    sku: Joi.string().max(100).allow('', null),
    sizes: Joi.string().max(200).allow('', null),
    stockStatus: Joi.string().valid('IN_STOCK', 'OUT_OF_STOCK', 'ON_ORDER'),
    stockQuantity: Joi.number().integer().min(0).allow(null),
    country: Joi.string().max(100).allow('', null),
    material: Joi.string().max(200).allow('', null),
    color: Joi.string().max(100).allow('', null),
    popular: Joi.boolean(),
    isNew: Joi.boolean(),
    isSale: Joi.boolean(),
    categoryId: Joi.string().uuid(),
    brandId: Joi.string().uuid().allow(null, ''),
  }).min(1),

  createUser: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().max(100).allow('', null),
    lastName: Joi.string().max(100).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'CUSTOMER'),
  }),

  updateUser: Joi.object({
    email: Joi.string().email().max(255),
    password: Joi.string().min(8).max(128),
    firstName: Joi.string().max(100).allow('', null),
    lastName: Joi.string().max(100).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    role: Joi.string().valid('ADMIN', 'MANAGER', 'CUSTOMER'),
  }).min(1),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED').required(),
  }),
};
