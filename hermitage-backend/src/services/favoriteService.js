import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

export const addFavorite = async (userId, productId) => {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    throw new AppError('Product is already in favorites', 400);
  }

  return prisma.favorite.create({
    data: {
      userId,
      productId,
    },
    include: {
      product: {
        include: {
          images: { where: { isMain: true } },
        },
      },
    },
  });
};

export const removeFavorite = async (userId, productId) => {
  return prisma.favorite.delete({
    where: {
      userId_productId: { userId, productId },
    },
  });
};

export const getUserFavorites = async (userId) => {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: { where: { isMain: true } },
          category: true,
          brand: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};