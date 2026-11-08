/**
 * Module: Web Admin SSR Routes
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 7 (EJS SSR) & Slot 12 (Multer Upload)
 */

const express = require('express');
const router = express.Router();
const adminWebController = require('../controllers/adminWebController');
const { uploadSingle } = require('../middlewares/uploadMiddleware');

// 1. Điều hướng gốc /admin -> /admin/dashboard
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

// 2. Màn hình Dashboard Tổng quan doanh thu quầy
router.get('/dashboard', adminWebController.renderDashboard);

// 3. Màn hình KDS Bếp & Quầy Barista (xem đơn hàng & bấm nút cập nhật trạng thái)
router.get('/orders', adminWebController.renderOrders);
router.post('/orders/:id/status', adminWebController.updateOrderStatusWeb);

// 4. Màn hình Quản lý món ăn thực đơn
router.get('/products', adminWebController.renderProducts);

// 5. Thêm món ăn mới kèm Upload ảnh thật qua Multer
router.post('/products', uploadSingle('image'), adminWebController.createProductWeb);

// 6. Bật/tắt trạng thái còn hàng của món ăn
router.post('/products/:id/toggle', adminWebController.toggleProductAvailabilityWeb);

module.exports = router;

