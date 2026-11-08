const mongoose = require('mongoose');
const Message = require('../models/Message');
const { getIO } = require('../config/socket');

/**
 * Khách gửi tin nhắn tới quầy chi nhánh
 * @param {Object} req - { branchId, content }
 * @param {Object} res
 * @return {Object} Tin nhắn mới tạo (201)
 */
exports.sendMessage = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { content } = req.body;

    const message = await Message.create({
      branchId,
      userId: req.user._id,
      senderRole: 'customer',
      senderName: req.user.fullName,
      content
    });

    // Phát sự kiện real-time qua Socket.IO tới phòng chat và quầy chi nhánh
    const io = getIO();
    if (io) {
      io.to(`chat_${branchId}_${req.user._id}`).emit('receive_message', message);
      io.to(`branch_${branchId}`).emit('new_customer_message', message);
    }

    return res.status(201).json({
      success: true,
      message: 'Gửi tin nhắn thành công!',
      data: message
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Nhân viên quầy Barista trả lời tin nhắn của khách
 * @param {Object} req - { branchId, targetUserId, content }
 * @param {Object} res
 * @return {Object} Tin nhắn trả lời (201)
 */
exports.staffReply = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { targetUserId, content } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu targetUserId (ID khách hàng cần trả lời)'
      });
    }

    const message = await Message.create({
      branchId,
      userId: targetUserId,
      senderRole: 'staff',
      senderName: req.user.fullName,
      content
    });

    // Phát sự kiện real-time tới phòng chat của khách hàng
    const io = getIO();
    if (io) {
      io.to(`chat_${branchId}_${targetUserId}`).emit('receive_message', message);
    }

    return res.status(201).json({
      success: true,
      message: 'Trả lời tin nhắn thành công!',
      data: message
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Khách xem lịch sử tin nhắn của mình tại chi nhánh
 * @param {Object} req - { branchId }
 * @param {Object} res
 * @return {Array} Danh sách tin nhắn (200)
 */
exports.getMyChat = async (req, res) => {
  try {
    const { branchId } = req.params;

    const messages = await Message.find({
      branchId,
      userId: req.user._id
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Nhân viên xem tất cả cuộc hội thoại của khách tại chi nhánh
 * @param {Object} req - { branchId }
 * @param {Object} res
 * @return {Array} Danh sách hội thoại khách hàng (200)
 */
exports.getBranchConversations = async (req, res) => {
  try {
    const { branchId } = req.params;

    const conversations = await Message.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(branchId) } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$senderRole', 'customer'] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          userId: '$_id',
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1,
          'customer.fullName': 1,
          'customer.phone': 1,
          'customer.avatar': 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Nhân viên xem chi tiết hội thoại với 1 khách & đánh dấu đã đọc
 * @param {Object} req - { branchId, userId }
 * @param {Object} res
 * @return {Array} Danh sách tin nhắn chi tiết (200)
 */
exports.getConversationByUser = async (req, res) => {
  try {
    const { branchId, userId } = req.params;

    const messages = await Message.find({ branchId, userId }).sort({ createdAt: 1 });

    await Message.updateMany(
      { branchId, userId, senderRole: 'customer', isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
