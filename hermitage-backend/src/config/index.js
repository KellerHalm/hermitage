import dotenv from 'dotenv';

dotenv.config();

const clientUrlRaw = process.env.CLIENT_URL || 'http://localhost:3000';
const clientOrigins = clientUrlRaw.split(',').map((s) => s.trim());

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: clientUrlRaw,
  clientOrigins,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};