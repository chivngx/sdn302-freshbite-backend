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
  toggleProductAvailability,
  getBranchesAdmin
} = require('../controllers/adminWebController');

// 0. Authenication routes (Login & Logout)
router.get('/login', getLoginPage);
router.post('/login', postLogin);
router.get('/logout', getLogout);

// 1. Dashboard tong quan (Protected)
router.get('/', adminWebAuth, getDashboard);
router.get('/dashboard', adminWebAuth, getDashboard);

// 2. KDS Barista quầy hiển thị đơn hàng (Protected)
router.get('/orders', adminWebAuth, getOrdersKDS);
router.post('/orders/:id/status', adminWebAuth, updateOrderStatusWeb);

// 3. Quản lý thực đơn món ăn (Protected)
router.get('/products', adminWebAuth, getProductsAdmin);
router.post('/products/:id/toggle', adminWebAuth, toggleProductAvailability);

// 4. Danh sách chi nhánh cửa hàng (Protected)
router.get('/branches', adminWebAuth, getBranchesAdmin);

module.exports = router;
