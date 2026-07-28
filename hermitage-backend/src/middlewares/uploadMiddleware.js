import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type. Only JPG, PNG, WEBP, GIF, and AVIF images are allowed.', 400), false);
  }
};

const createStorage = (subfolder, prefix) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `uploads/${subfolder}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

export const uploadProductFiles = multer({
  storage: createStorage('products', 'product'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadCategoryFiles = multer({
  storage: createStorage('categories', 'category'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadCountryFiles = multer({
  storage: createStorage('countries', 'country'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
