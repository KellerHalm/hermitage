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
const MAX_IMAGE_FILE_SIZE = 15 * 1024 * 1024;

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

/**
 * Проверка magic bytes (сигнатур) реального содержимого файла.
 * Клиентский MIME-тип и расширение тривиально подделываются, поэтому
 * полагаться только на них небезопасно. Здесь сверяем первые байты файла
 * с известными сигнатурами поддерживаемых форматов.
 *
 * @param {string} filepath — путь к сохранённому файлу
 * @returns {boolean} true, если сигнатура совпадает с допустимым форматом
 */
const verifyMagicBytes = (filepath) => {
  let fd;
  try {
    // Достаточно прочитать первые 16 байт: все сигнатуры лежат в этом диапазоне
    fd = fs.openSync(filepath, 'r');
    const header = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, header, 0, 16, 0);

    if (bytesRead < 12) return false;

    // JPEG: FF D8 FF
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 &&
      header[4] === 0x0d && header[5] === 0x0a && header[6] === 0x1a && header[7] === 0x0a
    ) return true;
    // GIF: "GIF87a" или "GIF89a"
    if (
      header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38 &&
      (header[4] === 0x37 || header[4] === 0x39) && header[5] === 0x61
    ) return true;
    // WebP: "RIFF" .... "WEBP"
    if (
      header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
    ) return true;
    // AVIF: ftyp box со брэндом avif/avis/mif1 в смещениях 4..11
    if (
      header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70 &&
      ((header[8] === 0x61 && header[9] === 0x76 && header[10] === 0x69 && header[11] === 0x66) || // avif
       (header[8] === 0x61 && header[9] === 0x76 && header[10] === 0x69 && header[11] === 0x73) || // avis
       (header[8] === 0x6d && header[9] === 0x69 && header[10] === 0x66 && header[11] === 0x31))   // mif1
    ) return true;

    return false;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }
};

/**
 * Обёртка над multer, которая после приёма файлов проверяет их реальные
 * сигнатуры (magic bytes) и удаляет те, чьё содержимое не соответствует
 * заявленному типу. Защищает от загрузки маскируемых под изображения файлов.
 * Сохраняет API multer: возвращаемый объект имеет методы .array()/.single()/.fields().
 */
const withMagicByteValidation = (multerInstance) => {
  const collectFiles = (req) => {
    if (Array.isArray(req.files) && req.files.length > 0) {
      return req.files;
    }

    if (req.files && typeof req.files === 'object') {
      return Object.values(req.files).flat();
    }

    return req.file ? [req.file] : [];
  };

  const validateFiles = (req, res, next) => {
    const files = collectFiles(req);

    const invalid = files.find((f) => !verifyMagicBytes(f.path));
    if (invalid) {
      // Удаляем все файлы текущей загрузки, чтобы не оставлять мусор
      for (const f of files) {
        fs.rm(f.path, { force: true }, () => {});
      }
      // Очищаем req.files/req.file, чтобы контроллер не ссылался на удалённое
      req.files = undefined;
      req.file = undefined;
      return next(new AppError('File content does not match an allowed image type. Possible spoofed upload.', 400));
    }
    next();
  };

  const wrap = (method) => (...args) => (req, res, next) => {
    const middleware = method.apply(multerInstance, args);
    middleware(req, res, (err) => {
      if (err) return next(err);
      validateFiles(req, res, next);
    });
  };

  return {
    array: wrap(multerInstance.array),
    single: wrap(multerInstance.single),
    fields: wrap(multerInstance.fields),
    any: wrap(multerInstance.any),
    none: multerInstance.none.bind(multerInstance),
  };
};

export const uploadProductFiles = withMagicByteValidation(multer({
  storage: createStorage('products', 'product'),
  fileFilter,
  limits: { fileSize: MAX_IMAGE_FILE_SIZE },
}));

export const uploadCategoryFiles = withMagicByteValidation(multer({
  storage: createStorage('categories', 'category'),
  fileFilter,
  limits: { fileSize: MAX_IMAGE_FILE_SIZE },
}));

export const uploadCountryFiles = withMagicByteValidation(multer({
  storage: createStorage('countries', 'country'),
  fileFilter,
  limits: { fileSize: MAX_IMAGE_FILE_SIZE },
}));
