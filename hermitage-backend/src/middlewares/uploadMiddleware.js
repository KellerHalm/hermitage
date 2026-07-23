import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

export const uploadProductFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});