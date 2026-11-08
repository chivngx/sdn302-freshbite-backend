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
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. Upload hinh anh don le (POST /api/uploads/single hoac POST /api/uploads)
router.post('/single', verifyToken, uploadSingle('image'), uploadSingleImage);
router.post('/', verifyToken, uploadSingle('image'), uploadSingleImage);

// 2. Upload nhieu hinh anh (POST /api/uploads/multiple)
router.post('/multiple', verifyToken, uploadMultiple('images', 5), uploadMultipleImages);

// 3. Tai file mau thuc don CSV (GET /api/uploads/template/product-import)
router.get('/template/product-import', downloadProductTemplate);

// 4. Xuat va tai hoa don ban le theo ma don hang (GET /api/uploads/orders/:id/invoice)
router.get('/orders/:id/invoice', verifyToken, downloadOrderInvoice);

// 5. Tai file bat ky tu uploads/ bang res.download (GET /api/uploads/download/:filename)
router.get('/download/:filename', downloadFile);

module.exports = router;
