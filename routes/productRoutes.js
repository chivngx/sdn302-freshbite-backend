const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');

// Chỗ gắn middleware upload Multer trong tương lai:
// const upload = require('../middlewares/uploadMiddleware'); // Thành viên khác tích hợp Multer sau

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-only routes
// Tích hợp Multer sau: router.post('/', verifyToken, authorize('admin'), upload.single('image'), createProduct);
router.post('/', verifyToken, authorize('admin'), createProduct);

// Tích hợp Multer sau: router.put('/:id', verifyToken, authorize('admin'), upload.single('image'), updateProduct);
router.put('/:id', verifyToken, authorize('admin'), updateProduct);

router.delete('/:id', verifyToken, authorize('admin'), deleteProduct);

module.exports = router;
