import dotenv from 'dotenv';

dotenv.config();

const clientUrlRaw = process.env.CLIENT_URL || 'http://localhost:3000';
const clientOrigins = clientUrlRaw.split(',').map((s) => s.trim());

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'secret') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a secure random string in production');
  }
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: clientUrlRaw,
  clientOrigins,
  jwtSecret: jwtSecret || 'dev-secret-not-for-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  emailHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  emailPort: Number(process.env.SMTP_PORT) || 587,
  emailSecure: process.env.SMTP_SECURE === 'true',
  emailUser: process.env.SMTP_USER || '',
  emailPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.SMTP_FROM || '',
};