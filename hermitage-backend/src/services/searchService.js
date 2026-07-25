import prisma from '../config/prisma.js';

export const globalSearch = async (query) => {
  if (!query) {
    return { products: [], categories: [], brands: [] };
  }

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 8,
      include: {
        images: true,
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true, country: true } },
        characteristics: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 3,
    }),
    prisma.brand.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 3,
    }),
  ]);

  return { products, categories, brands };
};