import prisma from '../config/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import AppError from '../utils/AppError.js';

export const createBrand = async (data) => {
  const slug = generateSlug(data.name);
  const existing = await prisma.brand.findUnique({ where: { slug } });

  if (existing) {
    throw new AppError('Brand already exists', 400);
  }

  return prisma.brand.create({
    data: {
      name: data.name,
      slug,
      country: data.country || null,
    },
  });
};

export const getAllBrands = async () => {
  return prisma.brand.findMany({
    orderBy: { name: 'asc' },
  });
};

export const getBrandById = async (id) => {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw new AppError('Brand not found', 404);
  return brand;
};

export const updateBrand = async (id, data) => {
  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    const newSlug = generateSlug(data.name);
    const existing = await prisma.brand.findUnique({ where: { id } });
    if (existing && newSlug !== existing.slug) {
      const slugExists = await prisma.brand.findUnique({ where: { slug: newSlug } });
      if (slugExists) {
        throw new AppError('Brand with this name already exists', 400);
      }
    }
    updateData.slug = newSlug;
  }
  if (data.country !== undefined) updateData.country = data.country || null;

  return prisma.brand.update({
    where: { id },
    data: updateData,
  });
};

export const deleteBrand = async (id) => {
  return prisma.brand.delete({
    where: { id },
  });
};

