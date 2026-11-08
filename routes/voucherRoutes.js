/**
 * Module: Voucher Routes
 * Tác giả: Nguyễn Đắc Thịnh (Branches & Vouchers & Error Handling Lead)
 * Môn học: SDN302
 */

const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');

// 1. GET /api/vouchers/active - Lấy danh sách mã giảm giá đang còn hiệu lực (Public)
router.get('/active', voucherController.getActiveVouchers);

// 2. POST /api/vouchers/apply - Kiểm tra điều kiện & tính tiền chiết khấu voucher
// Cho phép cả khách có Bearer token hoặc đang tính thử giỏ hàng
router.post('/apply', (req, res, next) => {
  if (req.headers.authorization) {
    return verifyToken(req, res, next);
  }
  next();
}, voucherController.applyVoucher);

// 3. GET /api/vouchers - [Admin] Danh sách tất cả voucher
router.get('/', verifyToken, authorize('admin'), voucherController.getVouchers);

// 4. GET /api/vouchers/:id - Xem chi tiết 1 voucher
router.get('/:id', voucherController.getVoucherById);

// 5. POST /api/vouchers - [Admin] Tạo voucher mới
router.post('/', verifyToken, authorize('admin'), voucherController.createVoucher);

// 6. PUT /api/vouchers/:id - [Admin] Cập nhật voucher
router.put('/:id', verifyToken, authorize('admin'), voucherController.updateVoucher);

// 7. DELETE /api/vouchers/:id - [Admin] Xóa voucher
router.delete('/:id', verifyToken, authorize('admin'), voucherController.deleteVoucher);

module.exports = router;
