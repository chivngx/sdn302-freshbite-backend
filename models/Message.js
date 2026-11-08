const mongoose = require('mongoose');

// Lưu trữ tin nhắn trao đổi 2 chiều giữa Khách hàng và Quầy Barista chi nhánh
const messageSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    userId: {
      // Luôn là ID của khách hàng (dù staff hay customer gửi)
      // Dùng để nhóm hội thoại theo khách
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['customer', 'staff'],
      required: true
    },
    senderName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index hỗ trợ truy vấn hội thoại theo chi nhánh + khách + thứ tự thời gian
messageSchema.index({ branchId: 1, userId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

