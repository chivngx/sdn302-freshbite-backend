const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin-only routes
router.post('/', verifyToken, authorize('admin'), createCategory);
router.put('/:id', verifyToken, authorize('admin'), updateCategory);
router.delete('/:id', verifyToken, authorize('admin'), deleteCategory);

module.exports = router;
