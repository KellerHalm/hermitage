import crypto from 'crypto';
import { config } from '../config/index.js';
import AppError from '../utils/AppError.js';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_SECRET = config.jwtSecret;

const isStateChanging = (method) => ['POST', 'PATCH', 'DELETE', 'PUT'].includes(method);

export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const signCsrfToken = (token) => {
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
  return `${token}.${signature}`;
};

export const verifyCsrfToken = (signed, token) => {
  const expected = signCsrfToken(token);
  return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected));
};

export const setCsrfCookie = (res) => {
  const token = generateCsrfToken();
  const signed = signCsrfToken(token);
  res.cookie(CSRF_COOKIE, signed, {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  return token;
};

export const csrfProtection = (req, res, next) => {
  if (!isStateChanging(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    return next(new AppError('CSRF token missing', 403));
  }

  try {
    const [tokenPart] = cookieToken.split('.');
    if (!verifyCsrfToken(cookieToken, headerToken) || tokenPart !== headerToken) {
      return next(new AppError('CSRF validation failed', 403));
    }
  } catch {
    return next(new AppError('CSRF validation failed', 403));
  }

  next();
};
