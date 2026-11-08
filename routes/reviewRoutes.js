const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

// Middleware kiểm tra lỗi validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// POST /api/reviews
// Khách hàng gửi đánh giá sau khi nhận đơn
router.post(
  '/',
  verifyToken,
  [
    body('productId').isMongoId().withMessage('productId không đúng định dạng MongoDB ObjectId'),
    body('branchId').isMongoId().withMessage('branchId không đúng định dạng MongoDB ObjectId'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating phải là số nguyên từ 1 đến 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bình luận tối đa 500 ký tự')
  ],
  validate,
  reviewController.createReview
);

// GET /api/reviews/product/:productId
// Lấy danh sách đánh giá + sao trung bình của 1 món ăn (Public)
router.get(
  '/product/:productId',
  [param('productId').isMongoId().withMessage('productId không hợp lệ')],
  validate,
  reviewController.getReviewsByProduct
);

// GET /api/reviews/branch/:branchId
// Lấy danh sách đánh giá của 1 chi nhánh (Public)
router.get(
  '/branch/:branchId',
  [param('branchId').isMongoId().withMessage('branchId không hợp lệ')],
  validate,
  reviewController.getReviewsByBranch
);

// DELETE /api/reviews/:id
// Admin ẩn đánh giá vi phạm
router.delete(
  '/:id',
  verifyToken,
  checkRole('admin'),
  [param('id').isMongoId().withMessage('ID đánh giá không hợp lệ')],
  validate,
  reviewController.hideReview
);

module.exports = router;

