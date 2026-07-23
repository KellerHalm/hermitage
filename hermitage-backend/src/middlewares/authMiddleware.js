import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import AppError from '../utils/AppError.js';
import prisma from '../config/prisma.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized', 401));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!currentUser) {
      return next(new AppError('User no longer exists', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied', 403));
    }
    next();
  };
};