import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { config } from '../config/index.js';
import AppError from '../utils/AppError.js';
import { sendWelcomeEmail } from '../utils/email.js';

const signToken = (id) => jwt.sign({ id }, config.jwtSecret, {
  expiresIn: config.jwtExpiresIn,
});

const sanitizeUser = (user) => {
  const nextUser = { ...user };
  nextUser.password = undefined;
  return nextUser;
};

export const registerUser = async (data) => {
  const { email, password, firstName, lastName, phone } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    },
  });

  const token = signToken(newUser.id);

  void sendWelcomeEmail({ email, firstName }).catch(() => {});

  return { user: sanitizeUser(newUser), token };
};

export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(user.id);

  return { user: sanitizeUser(user), token };
};

export const updateUser = async (id, data) => {
  const updateData = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName || null;
  if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
  if (data.phone !== undefined) updateData.phone = data.phone || null;

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return sanitizeUser(user);
};

