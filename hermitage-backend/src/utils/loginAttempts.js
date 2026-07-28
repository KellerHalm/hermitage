const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map(); // email -> { count, lockedUntil }

const cleanup = () => {
  const now = Date.now();
  for (const [email, data] of attempts) {
    if (data.lockedUntil && data.lockedUntil <= now) {
      attempts.delete(email);
    } else if (!data.lockedUntil && data.resetAt && data.resetAt <= now) {
      attempts.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000).unref();

export const recordFailedAttempt = (email) => {
  const key = email.toLowerCase();
  const now = Date.now();
  const existing = attempts.get(key);

  if (existing && existing.lockedUntil && existing.lockedUntil > now) {
    return { locked: true, remainingMs: existing.lockedUntil - now };
  }

  const count = (existing?.count || 0) + 1;

  if (count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    attempts.set(key, { count, lockedUntil });
    return { locked: true, remainingMs: LOCKOUT_MS };
  }

  attempts.set(key, { count, resetAt: now + LOCKOUT_MS });
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - count };
};

export const clearAttempts = (email) => {
  attempts.delete(email.toLowerCase());
};

export const isLocked = (email) => {
  const key = email.toLowerCase();
  const data = attempts.get(key);
  if (!data) return { locked: false };

  const now = Date.now();
  if (data.lockedUntil && data.lockedUntil > now) {
    return { locked: true, remainingMs: data.lockedUntil - now };
  }

  if (data.lockedUntil && data.lockedUntil <= now) {
    attempts.delete(key);
  }

  return { locked: false };
};
