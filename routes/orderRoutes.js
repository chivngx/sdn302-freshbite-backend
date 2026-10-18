const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const { validateCreateOrder } = require('../middlewares/validators/orderValidator');

// 1. Route đặt đơn hàng (user đăng nhập) kèm validator
router.post('/', verifyToken, validateCreateOrder, createOrder);

// 2. Các route tĩnh (CỐ ĐỊNH) - BẮT BUỘC đặt TRƯỚC route có param '/:id'
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/admin/all', verifyToken, authorize('admin'), getAllOrders);

// 3. Các route động có param '/:id'
router.get('/:id', verifyToken, getOrderById);
router.patch('/:id/status', verifyToken, authorize('admin'), updateOrderStatus);

module.exports = router;
