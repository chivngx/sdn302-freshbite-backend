const { body, param, validationResult } = require('express-validator');

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

const validDistricts = ['Ngũ Hành Sơn', 'Hải Châu', 'Sơn Trà', 'Thanh Khê'];

// Validator kiểm tra ID chi nhánh trên params (:id)
exports.validateBranchId = [
  param('id')
    .notEmpty()
    .withMessage('Vui lòng cung cấp ID chi nhánh!')
    .isMongoId()
    .withMessage('ID chi nhánh không hợp lệ!'),
  handleValidationErrors
];

// Validator tạo mới chi nhánh
exports.validateCreateBranch = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên chi nhánh không được để trống!')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên chi nhánh phải từ 3 đến 100 ký tự!'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ chi nhánh không được để trống!')
    .isLength({ min: 5, max: 200 })
    .withMessage('Địa chỉ chi nhánh phải từ 5 đến 200 ký tự!'),

  body('district')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng chọn quận cho chi nhánh!')
    .isIn(validDistricts)
    .withMessage('Quận phải thuộc 1 trong 4 quận: Ngũ Hành Sơn, Hải Châu, Sơn Trà, Thanh Khê!'),

  body('latitude')
    .notEmpty()
    .withMessage('Tọa độ vĩ độ (latitude) không được để trống!')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Vĩ độ (latitude) phải là số thực từ -90 đến 90!'),

  body('longitude')
    .notEmpty()
    .withMessage('Tọa độ kinh độ (longitude) không được để trống!')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Kinh độ (longitude) phải là số thực từ -180 đến 180!'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại không được để trống!')
    .matches(/^(0[3|5|7|8|9][0-9]{8}|0236\.[0-9]{3}\.[0-9]{3,4})$/)
    .withMessage('Số điện thoại phải là số di động VN hoặc số cố định Đà Nẵng (VD: 0236.730.0999 hoặc 0901234567)!'),

  body('openingHours')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Giờ mở cửa không hợp lệ!'),

  body('imageUrl')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp link ảnh chi nhánh!')
    .isURL()
    .withMessage('Link ảnh chi nhánh phải là URL hợp lệ!'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoạt động phải là boolean (true/false)!'),

  handleValidationErrors
];

// Validator cập nhật chi nhánh
exports.validateUpdateBranch = [
  param('id')
    .isMongoId()
    .withMessage('ID chi nhánh không hợp lệ!'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên chi nhánh phải từ 3 đến 100 ký tự!'),

  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Địa chỉ chi nhánh phải từ 5 đến 200 ký tự!'),

  body('district')
    .optional()
    .trim()
    .isIn(validDistricts)
    .withMessage('Quận phải thuộc 1 trong 4 quận: Ngũ Hành Sơn, Hải Châu, Sơn Trà, Thanh Khê!'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Vĩ độ (latitude) phải là số thực từ -90 đến 90!'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Kinh độ (longitude) phải là số thực từ -180 đến 180!'),

  body('phone')
    .optional()
    .trim()
    .matches(/^(0[3|5|7|8|9][0-9]{8}|0236\.[0-9]{3}\.[0-9]{3,4})$/)
    .withMessage('Số điện thoại phải là số di động VN hoặc số cố định Đà Nẵng!'),

  body('openingHours')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Giờ mở cửa không hợp lệ!'),

  body('imageUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Link ảnh chi nhánh phải là URL hợp lệ!'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái hoạt động phải là boolean (true/false)!'),

  handleValidationErrors
];
