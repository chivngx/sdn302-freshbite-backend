/**
 * Module: Upload & Download Routes
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 12 - Multer Upload & File Download (res.download)
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadSingle, uploadMultiple } = require('../middlewares/uploadMiddleware');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');

// 1. POST /api/upload - Upload 1 ảnh tĩnh qua Multer (Admin role hoặc Bearer Token)
router.post(
  '/',
  (req, res, next) => {
    // Cho phép upload nếu có Bearer token hoặc phục vụ form web admin
    if (req.headers.authorization) {
      return verifyToken(req, res, next);
    }
    next();
  },
  uploadSingle('image'),
  uploadController.uploadImage
);

// 2. POST /api/upload/multiple - Upload nhiều ảnh (tối đa 5 ảnh)
router.post(
  '/multiple',
  (req, res, next) => {
    if (req.headers.authorization) {
      return verifyToken(req, res, next);
    }
    next();
  },
  uploadMultiple('images', 5),
  uploadController.uploadMultipleImages
);

// 3. GET /api/upload/orders/:id/invoice - Tải file hóa đơn biên nhận đơn hàng qua res.download()
router.get(
  '/orders/:id/invoice',
  (req, res, next) => {
    if (req.headers.authorization) {
      return verifyToken(req, res, next);
    }
    next();
  },
  uploadController.downloadInvoice
);

module.exports = router;

