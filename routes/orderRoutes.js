const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { downloadInvoice } = require('../controllers/uploadController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const { validateCreateOrder } = require('../middlewares/validators/orderValidator');

// 1. Route đặt đơn hàng (user đăng nhập) kèm validator
router.post('/', verifyToken, validateCreateOrder, createOrder);

// 2. Các route tĩnh (CỐ ĐỊNH) - BẮT BUỘC đặt TRƯỚC route có param '/:id'
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/admin/all', verifyToken, authorize('admin'), getAllOrders);

// 3. Route tải hóa đơn biên nhận đơn hàng qua res.download() (Slot 12 - Lê Tự Nhật Thạch)
router.get('/:id/invoice', (req, res, next) => {
  if (req.headers.authorization) {
    return verifyToken(req, res, next);
  }
  next();
}, downloadInvoice);

// 4. Các route động có param '/:id'
router.get('/:id', verifyToken, getOrderById);
router.patch('/:id/status', verifyToken, authorize('admin'), updateOrderStatus);

module.exports = router;
