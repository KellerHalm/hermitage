import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { config } from '../config/index.js';
import AppError from '../utils/AppError.js';
import { sendWelcomeEmail } from '../utils/email.js';

const signAccessToken = (id) => jwt.sign({ id }, config.jwtSecret, {
  expiresIn: config.jwtExpiresIn,
});

const signRefreshToken = (id, jti) => jwt.sign({ id, jti }, config.jwtSecret, {
  expiresIn: config.jwtRefreshExpiresIn,
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return num * multipliers[unit];
};

const createRefreshToken = async (userId) => {
  const jti = crypto.randomUUID();
  const token = signRefreshToken(userId, jti);
  const expiresAt = new Date(Date.now() + parseDuration(config.jwtRefreshExpiresIn));

  const hashed = hashToken(token);
  await prisma.refreshToken.create({
    data: { token: hashed, userId, expiresAt },
  });

  return token;
};

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

  const token = signAccessToken(newUser.id);
  const refreshToken = await createRefreshToken(newUser.id);

  void sendWelcomeEmail({ email, firstName }).catch(() => {});

  return { user: sanitizeUser(newUser), token, refreshToken };
};

export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  return { user: sanitizeUser(user), token, refreshToken };
};

export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const hashed = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { token: hashed },
  });

  if (!stored) {
    throw new AppError('Refresh token not found (already used or revoked)', 401);
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AppError('Refresh token expired', 401);
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  const newAccessToken = signAccessToken(user.id);
  const newRefreshToken = await createRefreshToken(user.id);

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    const hashed = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { token: hashed } });
  }
};

export const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

export const cleanupExpiredTokens = async () => {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (count > 0) {
    console.log(`Cleaned up ${count} expired refresh token(s)`);
  }
  return count;
};

export const updateUser = async (id, data) => {
  const updateData = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName || null;
  if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
  if (data.phone !== undefined) updateData.phone = data.phone || null;

  if (data.email !== undefined && data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== id) {
      throw new AppError('Email already in use', 400);
    }
    updateData.email = data.email;
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return sanitizeUser(user);
};

export const deleteMe = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
};
