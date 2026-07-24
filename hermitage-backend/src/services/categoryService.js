import prisma from '../config/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import AppError from '../utils/AppError.js';

export const createCategory = async (data, file) => {
  const slug = generateSlug(data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });

  if (existing) {
    throw new AppError('Category already exists', 400);
  }

  const imageUrl = file ? `/uploads/categories/${file.filename}` : data.image || null;

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      image: imageUrl,
      parentId: data.parentId || null,
    },
  });
};

export const getAllCategories = async () => {
  return prisma.category.findMany({
    where: {
      parentId: null,
    },
    include: {
      subcategories: {
        include: {
          subcategories: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subcategories: true,
      parent: true,
    },
  });
  if (!category) throw new AppError('Category not found', 404);
  return category;
};

export const getCategoryBySlug = async (slug) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      subcategories: true,
      parent: true,
    },
  });
  if (!category) throw new AppError('Category not found', 404);
  return category;
};

export const updateCategory = async (id, data, file) => {
  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    const newSlug = generateSlug(data.name);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (existing && newSlug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({ where: { slug: newSlug } });
      if (slugExists) {
        throw new AppError('Category with this name already exists', 400);
      }
    }
    updateData.slug = newSlug;
  }
  if (file) {
    updateData.image = `/uploads/categories/${file.filename}`;
  } else if (data.image !== undefined) {
    updateData.image = data.image || null;
  }
  if (data.parentId !== undefined) updateData.parentId = data.parentId || null;

  return prisma.category.update({
    where: { id },
    data: updateData,
  });
};

export const deleteCategory = async (id) => {
  return prisma.category.delete({
    where: { id },
  });
};

