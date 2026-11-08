const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorMiddleware');

// Thu muc luu tru anh upload
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cau hinh diskStorage: luu vao thu muc uploads/ va sinh ten file doc nhat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Loai bo ky tu dac biet khoi ten goc, them timestamp de tranh trung lap
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBaseName}-${uniqueSuffix}${ext}`);
  }
});

// Bo loc chi chap nhan anh hop le (jpeg, jpg, png, webp, gif)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ chấp nhận các định dạng tệp hình ảnh: JPEG, JPG, PNG, WEBP, GIF!', 400), false);
  }
};

// Khoi tao instance multer voi gioi han 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Wrapper middleware ho tro ca fieldName 'image' va 'file' trong 1 luong parse duy nhat
const uploadSingle = (primaryField = 'image') => {
  const fields = [
    { name: primaryField, maxCount: 1 }
  ];
  if (primaryField !== 'file') {
    fields.push({ name: 'file', maxCount: 1 });
  }
  if (primaryField !== 'image') {
    fields.push({ name: 'image', maxCount: 1 });
  }

  const fieldsParser = upload.fields(fields);

  return (req, res, next) => {
    fieldsParser(req, res, (err) => {
      if (err) return next(err);
      if (req.files) {
        req.file =
          (req.files[primaryField] && req.files[primaryField][0]) ||
          (req.files['image'] && req.files['image'][0]) ||
          (req.files['file'] && req.files['file'][0]) ||
          null;
      }
      next();
    });
  };
};

// Wrapper middleware upload nhieu anh (toi da 5 anh)
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadDir
};
