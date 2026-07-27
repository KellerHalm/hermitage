import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import prisma from '../config/prisma.js';

const GUEST_COOKIE = 'guest_id';
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (currentUser) {
        req.user = currentUser;
      }
    }

    if (!req.user) {
      let guestId = req.cookies?.[GUEST_COOKIE];
      if (!guestId || typeof guestId !== 'string' || !/^[a-f0-9-]{36}$/.test(guestId)) {
        guestId = crypto.randomUUID();
        res.cookie(GUEST_COOKIE, guestId, {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: GUEST_COOKIE_MAX_AGE,
        });
      }
      req.guestId = guestId;
    }

    next();
  } catch {
    if (!req.user) {
      let guestId = req.cookies?.[GUEST_COOKIE];
      if (!guestId || typeof guestId !== 'string' || !/^[a-f0-9-]{36}$/.test(guestId)) {
        guestId = crypto.randomUUID();
        res.cookie(GUEST_COOKIE, guestId, {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: GUEST_COOKIE_MAX_AGE,
        });
      }
      req.guestId = guestId;
    }
    next();
  }
};
