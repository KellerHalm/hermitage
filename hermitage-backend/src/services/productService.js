import prisma from '../config/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import AppError from '../utils/AppError.js';

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
};

const parseInteger = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildImagesData = (files = []) => files.map((file, index) => ({
  url: `/uploads/products/${file.filename}`,
  isMain: index === 0,
}));

const buildProductPayload = (data) => ({
  title: data.title,
  slug: generateSlug(data.title),
  description: data.description || '',
  price: Number.parseFloat(data.price),
  sku: data.sku || null,
  sizes: data.sizes || null,
  stockStatus: data.stockStatus || 'IN_STOCK',
  stockQuantity: parseInteger(data.stockQuantity),
  country: data.country || null,
  material: data.material || null,
  color: data.color || null,
  popular: parseBoolean(data.popular),
  isNew: parseBoolean(data.isNew),
  isSale: parseBoolean(data.isSale),
  categoryId: data.categoryId,
  brandId: data.brandId || null,
});

const productInclude = {
  images: true,
  characteristics: true,
  category: true,
  brand: true,
};

export const createProduct = async (data, files) => {
  const slug = generateSlug(data.title);
  const existing = await prisma.product.findUnique({ where: { slug } });

  if (existing) {
    throw new AppError('Product with this title already exists', 400);
  }

  const characteristicsData = data.characteristics ? JSON.parse(data.characteristics) : [];
  const imagesData = buildImagesData(files);

  return prisma.product.create({
    data: {
      ...buildProductPayload(data),
      characteristics: {
        create: characteristicsData,
      },
      ...(imagesData.length > 0
        ? {
            images: {
              create: imagesData,
            },
          }
        : {}),
    },
    include: productInclude,
  });
};

export const getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 120,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    stockStatus,
    color,
    material,
    country,
    search,
    sort,
  } = query;

  const pageNumber = Number.parseInt(page, 10) || 1;
  const take = Number.parseInt(limit, 10) || 120;
  const skip = (pageNumber - 1) * take;

  const where = {};

  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (stockStatus) where.stockStatus = stockStatus;
  if (color) where.color = color;
  if (material) where.material = material;
  if (country) where.country = country;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number.parseFloat(minPrice);
    if (maxPrice) where.price.lte = Number.parseFloat(maxPrice);
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { brand: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (query.isNew === '1' || query.isNew === 'true') {
    where.isNew = true;
  }

  if (query.isSale === '1' || query.isSale === 'true') {
    where.isSale = true;
  }

  if (query.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: query.categorySlug },
      select: { id: true },
    });
    if (category) {
      where.categoryId = category.id;
    }
  }

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'popular') orderBy = { popular: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / take),
  };
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) throw new AppError('Product not found', 404);
  return product;
};

export const getProductBySlug = async (slug) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });

  if (!product) throw new AppError('Product not found', 404);
  return product;
};

export const updateProduct = async (id, data, files) => {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  const updateData = {};

  if (data.title) {
    updateData.title = data.title;
    updateData.slug = generateSlug(data.title);
  }
  if (data.description !== undefined) updateData.description = data.description || '';
  if (data.price !== undefined) updateData.price = Number.parseFloat(data.price);
  if (data.sku !== undefined) updateData.sku = data.sku || null;
  if (data.sizes !== undefined) updateData.sizes = data.sizes || null;
  if (data.stockStatus !== undefined) updateData.stockStatus = data.stockStatus;
  if (data.stockQuantity !== undefined) updateData.stockQuantity = parseInteger(data.stockQuantity);
  if (data.country !== undefined) updateData.country = data.country || null;
  if (data.material !== undefined) updateData.material = data.material || null;
  if (data.color !== undefined) updateData.color = data.color || null;
  if (data.popular !== undefined) updateData.popular = parseBoolean(data.popular);
  if (data.isNew !== undefined) updateData.isNew = parseBoolean(data.isNew);
  if (data.isSale !== undefined) updateData.isSale = parseBoolean(data.isSale);
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.brandId !== undefined) updateData.brandId = data.brandId || null;

  const characteristicsData = data.characteristics ? JSON.parse(data.characteristics) : null;
  const imagesData = buildImagesData(files);

  await prisma.product.update({
    where: { id },
    data: {
      ...updateData,
      ...(characteristicsData
        ? {
            characteristics: {
              deleteMany: {},
              create: characteristicsData,
            },
          }
        : {}),
      ...(imagesData.length > 0
        ? {
            images: {
              deleteMany: {},
              create: imagesData,
            },
          }
        : {}),
    },
  });

  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
};

export const deleteProduct = async (id) => {
  return prisma.product.delete({
    where: { id },
  });
};

export const getSimilarProducts = async (slug) => {
  const currentProduct = await prisma.product.findUnique({
    where: { slug },
    select: { categoryId: true, id: true },
  });

  if (!currentProduct) {
    throw new AppError('Product not found', 404);
  }

  return prisma.product.findMany({
    where: {
      categoryId: currentProduct.categoryId,
      id: { not: currentProduct.id },
    },
    take: 4,
    include: productInclude,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getBoughtTogetherProducts = async (slug) => {
  const currentProduct = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });

  if (!currentProduct) {
    throw new AppError('Product not found', 404);
  }

  return prisma.product.findMany({
    where: {
      categoryId: currentProduct.categoryId,
      id: { not: currentProduct.id },
    },
    take: 4,
    include: productInclude,
    orderBy: {
      popular: 'desc',
    },
  });
};

