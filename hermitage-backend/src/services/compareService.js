import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

const MAX_COMPARE = 4;

const compareInclude = {
  product: {
    include: {
      images: true,
      characteristics: true,
      category: true,
      brand: true,
    },
  },
};

export const getUserCompare = async (userId) => {
  return prisma.compare.findMany({
    where: { userId },
    include: compareInclude,
    orderBy: { createdAt: 'desc' },
  });
};

export const addCompare = async (userId, productId) => {
  const count = await prisma.compare.count({ where: { userId } });
  if (count >= MAX_COMPARE) {
    throw new AppError('Compare list is full', 400);
  }

  const existing = await prisma.compare.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    throw new AppError('Product is already in compare list', 400);
  }

  return prisma.compare.create({
    data: { userId, productId },
    include: compareInclude,
  });
};

export const removeCompare = async (userId, productId) => {
  return prisma.compare.delete({
    where: {
      userId_productId: { userId, productId },
    },
  });
};

export const syncCompare = async (userId, productIds = []) => {
  const uniqueIds = [...new Set(productIds)].slice(0, MAX_COMPARE);

  await prisma.compare.deleteMany({ where: { userId } });

  if (uniqueIds.length === 0) {
    return [];
  }

  await prisma.compare.createMany({
    data: uniqueIds.map((productId) => ({ userId, productId })),
    skipDuplicates: true,
  });

  return getUserCompare(userId);
};
