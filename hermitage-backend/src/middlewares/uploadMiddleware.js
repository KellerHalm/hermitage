import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
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