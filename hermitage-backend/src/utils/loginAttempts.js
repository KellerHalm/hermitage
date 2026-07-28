import prisma from '../config/prisma.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export const recordFailedAttempt = async (email) => {
  const key = email.toLowerCase();
  const now = new Date();

  const existing = await prisma.loginAttempt.findUnique({ where: { email: key } });

  if (existing?.lockedUntil && existing.lockedUntil > now) {
    return { locked: true, remainingMs: existing.lockedUntil.getTime() - now.getTime() };
  }

  const count = (existing?.count || 0) + 1;

  if (count >= MAX_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
    await prisma.loginAttempt.upsert({
      where: { email: key },
      update: { count, lockedUntil },
      create: { email: key, count, lockedUntil },
    });
    return { locked: true, remainingMs: LOCKOUT_MS };
  }

  await prisma.loginAttempt.upsert({
    where: { email: key },
    update: { count, lockedUntil: null },
    create: { email: key, count },
  });

  return { locked: false, attemptsLeft: MAX_ATTEMPTS - count };
};

export const clearAttempts = async (email) => {
  await prisma.loginAttempt.deleteMany({ where: { email: email.toLowerCase() } });
};

export const isLocked = async (email) => {
  const key = email.toLowerCase();
  const data = await prisma.loginAttempt.findUnique({ where: { email: key } });

  if (!data) return { locked: false };

  const now = new Date();
  if (data.lockedUntil && data.lockedUntil > now) {
    return { locked: true, remainingMs: data.lockedUntil.getTime() - now.getTime() };
  }

  if (data.lockedUntil && data.lockedUntil <= now) {
    await prisma.loginAttempt.delete({ where: { email: key } });
  }

  return { locked: false };
};
