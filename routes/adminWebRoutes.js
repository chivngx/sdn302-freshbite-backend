/**
 * Module: Web Admin SSR Routes
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 7 (EJS SSR) & Slot 12 (Multer Upload)
 */

const express = require('express');
const router = express.Router();
const {
  adminWebAuth,
  getLoginPage,
  postLogin,
  getLogout,
  getDashboard,
  getOrdersKDS,
  updateOrderStatusWeb,
  getProductsAdmin,
  createProductWeb,
  updateProductWeb,
  deleteProductWeb,
  toggleProductAvailability,
  getBranchesAdmin,
  getChatsPage,
  postStaffReplyWeb,
  getReviewsPage,
  toggleReviewHideWeb,
  getReportsPage,
  exportShiftReportWeb,
  getVouchersPage,
  createVoucherWeb,
  editVoucherWeb,
  toggleVoucherWeb,
  deleteVoucherWeb
} = require('../controllers/adminWebController');
const { downloadOrderInvoice } = require('../controllers/uploadController');
const { uploadSingle } = require('../middlewares/uploadMiddleware');

// 0. Authentication routes (Login & Logout)
router.get('/login', getLoginPage);
router.post('/login', postLogin);
router.get('/logout', getLogout);
router.post('/logout', getLogout);

// 1. Dashboard tổng quan (Protected)
router.get('/', adminWebAuth, (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', adminWebAuth, getDashboard);

// 2. KDS Barista quầy hiển thị đơn hàng (Protected)
router.get('/orders', adminWebAuth, getOrdersKDS);
router.get('/orders/:id/invoice', adminWebAuth, downloadOrderInvoice);
router.post('/orders/:id/status', adminWebAuth, updateOrderStatusWeb);

// 3. Quản lý thực đơn & CRUD món ăn (Protected)
router.get('/products', adminWebAuth, getProductsAdmin);
router.post('/products', adminWebAuth, uploadSingle('image'), createProductWeb);
router.post('/products/:id/edit', adminWebAuth, uploadSingle('image'), updateProductWeb);
router.post('/products/:id/delete', adminWebAuth, deleteProductWeb);
router.post('/products/:id/toggle', adminWebAuth, toggleProductAvailability);

// 4. Live Chat CSKH 2 chiều với khách hàng (Protected)
router.get('/chats', adminWebAuth, getChatsPage);
router.post('/chats/reply', adminWebAuth, postStaffReplyWeb);

// 5. Quản lý đánh giá món ăn (Protected)
router.get('/reviews', adminWebAuth, getReviewsPage);
router.post('/reviews/:id/toggle', adminWebAuth, toggleReviewHideWeb);

// 6. Đối soát ca & Doanh thu quầy Barista (Protected)
router.get('/reports', adminWebAuth, getReportsPage);
router.get('/reports/export', adminWebAuth, exportShiftReportWeb);

// 7. Quản lý Voucher & Khuyến mãi (Protected)
router.get('/vouchers', adminWebAuth, getVouchersPage);
router.post('/vouchers', adminWebAuth, createVoucherWeb);
router.post('/vouchers/:id/edit', adminWebAuth, editVoucherWeb);
router.post('/vouchers/:id/toggle', adminWebAuth, toggleVoucherWeb);
router.post('/vouchers/:id/delete', adminWebAuth, deleteVoucherWeb);

// 8. Danh sách chi nhánh cửa hàng (Protected)
router.get('/branches', adminWebAuth, getBranchesAdmin);

module.exports = router;
