import prisma from '../config/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import AppError from '../utils/AppError.js';

export const createCountry = async (data, file) => {
  const slug = generateSlug(data.name);
  const existing = await prisma.country.findUnique({ where: { slug } });

  if (existing) {
    throw new AppError('Country already exists', 400);
  }

  const imageUrl = file ? `/uploads/countries/${file.filename}` : data.image || null;

  return prisma.country.create({
    data: {
      name: data.name,
      slug,
      image: imageUrl,
    },
  });
};

export const getAllCountries = async () => {
  return prisma.country.findMany({
    orderBy: { name: 'asc' },
  });
};

export const getCountryById = async (id) => {
  const country = await prisma.country.findUnique({ where: { id } });
  if (!country) throw new AppError('Country not found', 404);
  return country;
};

export const updateCountry = async (id, data, file) => {
  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = generateSlug(data.name);
  }
  if (file) {
    updateData.image = `/uploads/countries/${file.filename}`;
  } else if (data.image !== undefined) {
    updateData.image = data.image || null;
  }

  return prisma.country.update({
    where: { id },
    data: updateData,
  });
};

export const deleteCountry = async (id) => {
  return prisma.country.delete({ where: { id } });
};
