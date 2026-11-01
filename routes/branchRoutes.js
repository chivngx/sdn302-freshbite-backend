const express = require('express');
const router = express.Router();
const {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const {
  validateBranchId,
  validateCreateBranch,
  validateUpdateBranch
} = require('../middlewares/validators/branchValidator');

/**
 * @route   GET /api/branches
 * @desc    Lấy danh sách các chi nhánh tại Đà Nẵng kèm tọa độ GPS
 * @access  Public
 */
router.get('/', getBranches);

/**
 * @route   GET /api/branches/:id
 * @desc    Xem chi tiết 1 chi nhánh
 * @access  Public
 */
router.get('/:id', validateBranchId, getBranchById);

/**
 * @route   POST /api/branches
 * @desc    [Admin] Tạo chi nhánh mới
 * @access  Private/Admin
 */
router.post('/', verifyToken, authorize('admin'), validateCreateBranch, createBranch);

/**
 * @route   PUT /api/branches/:id
 * @desc    [Admin] Cập nhật thông tin chi nhánh
 * @access  Private/Admin
 */
router.put('/:id', verifyToken, authorize('admin'), validateUpdateBranch, updateBranch);

/**
 * @route   DELETE /api/branches/:id
 * @desc    [Admin] Xóa chi nhánh hoặc đưa vào trạng thái tạm ngưng nếu có đơn
 * @access  Private/Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), validateBranchId, deleteBranch);

module.exports = router;
