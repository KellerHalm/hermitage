import dotenv from 'dotenv';

dotenv.config();

const clientUrlRaw = process.env.CLIENT_URL || 'http://localhost:3000';
const clientOrigins = clientUrlRaw.split(',').map((s) => s.trim());

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'secret' || jwtSecret === 'your_super_secret_jwt_key_here') {
  throw new Error('JWT_SECRET must be set to a secure random string (min 32 chars)');
}

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!jwtRefreshSecret || jwtRefreshSecret === jwtSecret) {
  throw new Error('JWT_REFRESH_SECRET must be set and must differ from JWT_SECRET');
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'production',
  clientUrl: clientUrlRaw,
  clientOrigins,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  // В production cookie должен быть Secure по умолчанию (только HTTPS),
  // даже если COOKIE_SECURE забыли выставить явно.
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  emailHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  emailPort: Number(process.env.SMTP_PORT) || 587,
  emailSecure: process.env.SMTP_SECURE === 'true',
  emailUser: process.env.SMTP_USER || '',
  emailPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.SMTP_FROM || '',
};