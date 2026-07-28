import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import prisma from '../config/prisma.js';

const GUEST_COOKIE = 'guest_id';
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Strict UUID v4 regex: version nibble = 4, variant bits = 8/9/a/b
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const setGuestCookie = (res, guestId) => {
  res.cookie(GUEST_COOKIE, guestId, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
};

const resolveGuestId = (req, res) => {
  let guestId = req.cookies?.[GUEST_COOKIE];

  if (guestId && UUID_V4_RE.test(guestId)) {
    req.guestId = guestId;
    return;
  }

  // Invalid or missing guestId — generate a new one server-side
  guestId = crypto.randomUUID();
  setGuestCookie(res, guestId);
  req.guestId = guestId;
};

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
      resolveGuestId(req, res);
    }

    next();
  } catch {
    if (!req.user) {
      resolveGuestId(req, res);
    }
    next();
  }
};
