/**
 * Module: Upload & Download Routes
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 12 - Multer Upload & File Download (res.download)
 */

const express = require('express');
const router = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImages,
  downloadFile,
  downloadOrderInvoice,
  downloadProductTemplate
} = require('../controllers/uploadController');
const { uploadSingle, uploadMultiple } = require('../middlewares/uploadMiddleware');
const { verifyToken, optionalAuth } = require('../middlewares/authMiddleware');

// 1. Upload hình ảnh đơn lẻ (POST /api/uploads/single hoặc POST /api/upload)
router.post(
  '/single',
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.freshbite_admin_token) {
      return verifyToken(req, res, next);
    }
    next();
  },
  uploadSingle('image'),
  uploadSingleImage
);

router.post(
  '/',
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.freshbite_admin_token) {
      return verifyToken(req, res, next);
    }
    next();
  },
  uploadSingle('image'),
  uploadSingleImage
);

// 2. Upload nhiều hình ảnh (POST /api/uploads/multiple hoặc POST /api/upload/multiple)
router.post(
  '/multiple',
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.freshbite_admin_token) {
      return verifyToken(req, res, next);
    }
    next();
  },
  uploadMultiple('images', 5),
  uploadMultipleImages
);

// 3. Tải file mẫu thực đơn CSV (GET /api/uploads/template/product-import)
router.get('/template/product-import', downloadProductTemplate);

// 4. Xuất và tải hóa đơn bán lẻ theo mã đơn hàng (GET /api/uploads/orders/:id/invoice)
router.get('/orders/:id/invoice', optionalAuth, downloadOrderInvoice);

// 5. Tải file bất kỳ từ uploads/ bằng res.download (GET /api/uploads/download/:filename)
router.get('/download/:filename', downloadFile);

module.exports = router;
