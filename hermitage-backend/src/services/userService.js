import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

export const getAllUsers = async (query) => {
  const { role, search, sortBy, sortOrder } = query;
  const { pageNumber, take, skip } = parsePagination(query, { defaultLimit: 100 });

  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const allowedSortFields = ['createdAt', 'role', 'email', 'firstName'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [field]: order },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(sanitizeUser),
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / take),
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);
  return sanitizeUser(user);
};

export const createUser = async (data) => {
  const { email, password, firstName, lastName, phone, role } = data;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      role: role || 'CUSTOMER',
    },
  });

  return sanitizeUser(user);
};

export const updateUser = async (id, data) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError('User not found', 404);

  const updateData = {};

  if (data.email !== undefined) {
    if (data.email && data.email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email: data.email } });
      if (conflict) throw new AppError('Email already in use', 400);
    }
    updateData.email = data.email;
  }
  if (data.firstName !== undefined) updateData.firstName = data.firstName || null;
  if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
  return sanitizeUser(user);
};

// `actorId` is the id of the admin performing the deletion; an admin cannot
// delete their own account through this endpoint.
export const deleteUser = async (id, actorId) => {
  if (id === actorId) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError('User not found', 404);

  return prisma.user.delete({ where: { id } });
};
