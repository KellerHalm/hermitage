import { config } from '../config/index.js';
import AppError from '../utils/AppError.js';

const isStateChanging = (method) => ['POST', 'PATCH', 'DELETE', 'PUT'].includes(method);

export const csrfProtection = (req, res, next) => {
  if (!isStateChanging(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const source = origin || referer;
  if (!source) {
    return next(new AppError('Missing Origin/Referer header', 403));
  }

  let sourceHost;
  try {
    sourceHost = new URL(source).hostname;
  } catch {
    return next(new AppError('Invalid Origin/Referer header', 403));
  }

  const allowed = config.clientOrigins.some((allowedOrigin) => {
    try {
      return new URL(allowedOrigin).hostname === sourceHost;
    } catch {
      return allowedOrigin === sourceHost;
    }
  });

  if (!allowed) {
    return next(new AppError('CSRF validation failed', 403));
  }

  next();
};
