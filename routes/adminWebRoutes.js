const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getOrdersKDS,
  updateOrderStatusWeb,
  getProductsAdmin,
  toggleProductAvailability,
  getBranchesAdmin
} = require('../controllers/adminWebController');

// 1. Dashboard tong quan
router.get('/', getDashboard);
router.get('/dashboard', getDashboard);

// 2. KDS Barista quầy hiển thị đơn hàng
router.get('/orders', getOrdersKDS);
router.post('/orders/:id/status', updateOrderStatusWeb);

// 3. Quản lý thực đơn món ăn
router.get('/products', getProductsAdmin);
router.post('/products/:id/toggle', toggleProductAvailability);

// 4. Danh sách chi nhánh cửa hàng
router.get('/branches', getBranchesAdmin);

module.exports = router;
