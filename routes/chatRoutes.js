const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');
const Message = require('../models/Message');

// Middleware kiểm tra lỗi validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Validator cho nội dung tin nhắn
const messageValidator = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Nội dung tin nhắn không được để trống (tối đa 500 ký tự)')
];

// Validator cho branchId param
const branchIdValidator = [
  param('branchId').isMongoId().withMessage('branchId không đúng định dạng MongoDB ObjectId')
];

// POST /api/chats/:branchId
// Khách hàng gửi tin nhắn tới quầy
router.post(
  '/:branchId',
  verifyToken,
  branchIdValidator,
  messageValidator,
  validate,
  chatController.sendMessage
);

// POST /api/chats/:branchId/reply
// Staff quầy trả lời tin nhắn của khách
router.post(
  '/:branchId/reply',
  verifyToken,
  checkRole('admin'),
  branchIdValidator,
  [
    body('targetUserId').isMongoId().withMessage('targetUserId không đúng định dạng MongoDB ObjectId'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Nội dung tin nhắn không được để trống (tối đa 500 ký tự)')
  ],
  validate,
  chatController.staffReply
);

// GET /api/chats/:branchId
// Khách xem lịch sử tin nhắn của mình tại chi nhánh
router.get(
  '/:branchId',
  verifyToken,
  branchIdValidator,
  validate,
  chatController.getMyChat
);

// GET /api/chats/:branchId/conversations & /api/chats/:branchId/customers
// Staff xem danh sách tất cả hội thoại khách hàng tại chi nhánh
router.get(
  '/:branchId/conversations',
  verifyToken,
  checkRole('admin'),
  branchIdValidator,
  validate,
  chatController.getBranchConversations
);

router.get(
  '/:branchId/customers',
  verifyToken,
  checkRole('admin'),
  branchIdValidator,
  validate,
  chatController.getBranchConversations
);

// GET /api/chats/:branchId/conversations/:userId
// Staff xem chi tiết hội thoại với 1 khách cụ thể
router.get(
  '/:branchId/conversations/:userId',
  verifyToken,
  checkRole('admin'),
  [
    param('branchId').isMongoId().withMessage('branchId không hợp lệ'),
    param('userId').isMongoId().withMessage('userId không hợp lệ')
  ],
  validate,
  chatController.getConversationByUser
);

// PATCH /api/chats/:branchId/read
// Đánh dấu tin nhắn đã đọc
router.patch(
  '/:branchId/read',
  verifyToken,
  branchIdValidator,
  validate,
  async (req, res, next) => {
    try {
      const { branchId } = req.params;
      const customerId = req.body.customerId || req.user._id;

      await Message.updateMany(
        { branchId, userId: customerId, isRead: false },
        { isRead: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu tin nhắn đã đọc!'
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
