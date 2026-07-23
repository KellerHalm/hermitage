import prisma from '../config/prisma.js';

export const getSitemapUrls = async () => {
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return { products, categories, brands };
};