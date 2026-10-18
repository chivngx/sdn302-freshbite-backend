const { body, validationResult } = require('express-validator');

// Hàm xử lý validationResult trả lỗi 400 với message là lỗi đầu tiên
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg
    });
  }
  next();
};

// Validator tạo đơn hàng
exports.validateCreateOrder = [
  body('branchId')
    .notEmpty()
    .withMessage('Vui lòng chọn chi nhánh nhận hàng!')
    .isMongoId()
    .withMessage('Chi nhánh nhận hàng không hợp lệ!'),

  body('pickupTime')
    .notEmpty()
    .withMessage('Vui lòng chọn thời gian ghé nhận món!')
    .isIn(['15_MINS', '30_MINS', '45_MINS', 'CUSTOM'])
    .withMessage('Vui lòng chọn thời gian ghé nhận món!'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Giỏ hàng chưa có sản phẩm nào!'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Vui lòng cung cấp ID sản phẩm!')
    .isMongoId()
    .withMessage('ID sản phẩm không hợp lệ!'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Vui lòng nhập số lượng sản phẩm!')
    .isInt({ min: 1 })
    .withMessage('Số lượng sản phẩm phải là số nguyên từ 1 trở lên!'),

  body('items.*.sugarLevel')
    .optional({ checkFalsy: true })
    .isIn(['100%', '70%', '50%', '0%'])
    .withMessage('Mức đường không hợp lệ! Chấp nhận: 100%, 70%, 50%, 0%'),

  body('items.*.iceLevel')
    .optional({ checkFalsy: true })
    .isIn(['100%', '50%', 'Nóng'])
    .withMessage('Mức đá không hợp lệ! Chấp nhận: 100%, 50%, Nóng'),

  body('paymentMethod')
    .optional({ checkFalsy: true })
    .isIn(['CASH_AT_COUNTER', 'MOCK_MOMO', 'PAYOS'])
    .withMessage('Phương thức thanh toán không hợp lệ! Chấp nhận: CASH_AT_COUNTER, MOCK_MOMO, PAYOS'),

  handleValidationErrors
];
