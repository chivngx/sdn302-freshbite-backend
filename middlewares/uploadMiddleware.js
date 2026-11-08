/**
 * Module: Upload Middleware (Multer)
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 12 - Xử lý tệp tin tải lên (Multipart/form-data) trong Express
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads luôn tồn tại
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Cấu hình diskStorage: Lưu file vào thư mục /uploads và đổi tên tránh trùng lặp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Đổi tên file: [timestamp]-[randomDigits].[extension]
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeBaseName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  }
});

// 2. Bộ lọc định dạng file (chỉ cho phép ảnh jpeg, jpg, png, webp, gif)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Định dạng tệp không được hỗ trợ! Chỉ chấp nhận các định dạng ảnh: .jpg, .jpeg, .png, .webp, .gif'
      ),
      false
    );
  }
};

// 3. Khởi tạo instance multer với giới hạn dung lượng 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes
  }
});

// 4. Helper middleware bọc xử lý lỗi Multer thân thiện
const handleMulterError = (multerAction) => (req, res, next) => {
  multerAction(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Dung lượng tệp quá lớn! Giới hạn tối đa là 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload tệp: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Upload 1 file đơn lẻ (mặc định field 'image')
exports.uploadSingle = (fieldName = 'image') => {
  return handleMulterError(upload.single(fieldName));
};

// Upload nhiều files (mặc định field 'images', tối đa 5 file)
exports.uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return handleMulterError(upload.array(fieldName, maxCount));
};

exports.upload = upload;

