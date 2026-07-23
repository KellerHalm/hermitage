import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/prisma.js';

export const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (currentUser) {
        req.user = currentUser;
      }
    }

    req.guestId = req.headers['x-guest-id'] || null;
    next();
  } catch {
    req.guestId = req.headers['x-guest-id'] || null;
    next();
  }
};
