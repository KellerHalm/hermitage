import prisma from '../config/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import { parsePagination } from '../utils/pagination.js';
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

// Accepts a scalar or a comma-separated list ("red,blue") and returns a clean
// array of non-empty trimmed values, or null if there is nothing to filter on.
const splitList = (value) => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    const arr = value.map((v) => String(v).trim()).filter(Boolean);
    return arr.length > 0 ? arr : null;
  }
  const str = String(value).trim();
  if (!str) return null;
  const arr = str.split(',').map((v) => v.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
};

// Collects a category id together with all of its descendant ids so that
// filtering by a parent category also returns products from its subcategories.
const collectCategoryIds = async (categoryId) => {
  const ids = [categoryId];
  let currentLevel = [categoryId];
  // The category tree is at most a few levels deep; walk it breadth-first.
  while (currentLevel.length > 0) {
    // eslint-disable-next-line no-await-in-loop
    const children = await prisma.category.findMany({
      where: { parentId: { in: currentLevel } },
      select: { id: true },
    });
    if (children.length === 0) break;
    currentLevel = children.map((c) => c.id);
    ids.push(...currentLevel);
  }
  return ids;
};

const buildProductPayload = (data) => {
  const stockQty = parseInteger(data.stockQuantity);
  const stockStatus = data.stockStatus || 'IN_STOCK';

  return {
    title: data.title,
    slug: generateSlug(data.title),
    description: data.description || '',
    price: Number.parseFloat(data.price),
    oldPrice: data.oldPrice ? Number.parseFloat(data.oldPrice) : null,
    sku: data.sku || null,
    sizes: data.sizes || null,
    stockStatus,
    stockQuantity: stockQty,
    country: data.country || null,
    material: data.material || null,
    color: data.color || null,
    popular: parseBoolean(data.popular),
    isNew: parseBoolean(data.isNew),
    isSale: parseBoolean(data.isSale),
    categoryId: data.categoryId,
    brandId: data.brandId || null,
  };
};

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

  const { pageNumber, take, skip } = parsePagination(query, { defaultLimit: 120 });

  const where = {};

  // Multi-value filters: accept a single value or a comma-separated list.
  const colors = splitList(color);
  const materials = splitList(material);
  const countries = splitList(country);
  const stockStatuses = splitList(stockStatus);

  if (colors) where.color = { in: colors };
  if (materials) where.material = { in: materials };
  if (countries) where.country = { in: countries };
  if (stockStatuses) where.stockStatus = { in: stockStatuses };

  // brandId: support either a single id or a comma-separated list of ids.
  const brandIds = splitList(brandId);
  if (brandIds) where.brandId = { in: brandIds };

  // Category: resolve into the full set of ids (parent + descendants) so that
  // filtering by a parent category also matches products in its subcategories.
  // categorySlug takes precedence over categoryId when both are present.
  let targetCategoryIds = null;
  if (query.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: query.categorySlug },
      select: { id: true },
    });
    if (category) {
      targetCategoryIds = await collectCategoryIds(category.id);
    }
  } else if (categoryId) {
    const ids = splitList(categoryId);
    if (ids) {
      const resolved = await Promise.all(ids.map((cId) => collectCategoryIds(cId)));
      targetCategoryIds = [...new Set(resolved.flat())];
    }
  }
  if (targetCategoryIds) where.categoryId = { in: targetCategoryIds };

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

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'popular') orderBy = { popular: 'desc' };
  if (sort === 'discount') orderBy = { oldPrice: 'desc' };

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
    const newSlug = generateSlug(data.title);
    if (newSlug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: newSlug } });
      if (slugExists) {
        throw new AppError('Product with this title already exists', 400);
      }
    }
    updateData.slug = newSlug;
  }
  if (data.description !== undefined) updateData.description = data.description || '';
  if (data.price !== undefined) updateData.price = Number.parseFloat(data.price);
  if (data.oldPrice !== undefined) updateData.oldPrice = data.oldPrice ? Number.parseFloat(data.oldPrice) : null;
  if (data.sku !== undefined) updateData.sku = data.sku || null;
  if (data.sizes !== undefined) updateData.sizes = data.sizes || null;
  if (data.stockStatus !== undefined) updateData.stockStatus = data.stockStatus;
  if (data.stockQuantity !== undefined) {
    updateData.stockQuantity = parseInteger(data.stockQuantity);
  }
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

  let deleteImageIds = null;
  if (data.deleteImageIds) {
    try {
      const parsed = JSON.parse(data.deleteImageIds);
      if (Array.isArray(parsed) && parsed.length > 0) {
        deleteImageIds = parsed;
      }
    } catch { /* ignore invalid JSON */ }
  }

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
      ...(deleteImageIds
        ? {
            images: {
              deleteMany: { id: { in: deleteImageIds } },
            },
          }
        : {}),
      ...(imagesData.length > 0
        ? {
            images: {
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

