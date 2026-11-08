const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const shiftQueryValidators = [
  query('branchId')
    .isMongoId()
    .withMessage('branchId không đúng định dạng MongoDB ObjectId'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date phải đúng định dạng ISO 8601 (YYYY-MM-DD)')
];

// GET /api/reports/shift/export?branchId=...&date=2026-11-01
// Xuất file CSV báo cáo đối soát ca quầy Barista qua res.download() (Slot 12)
router.get(
  '/shift/export',
  verifyToken,
  checkRole('admin'),
  shiftQueryValidators,
  validate,
  reportController.exportShiftReport
);

// GET /api/reports/shift?branchId=...&date=2026-11-01
// Báo cáo ca & Đối soát doanh thu quầy Barista cuối ngày
router.get(
  '/shift',
  verifyToken,
  checkRole('admin'),
  shiftQueryValidators,
  validate,
  reportController.getShiftReport
);

module.exports = router;
