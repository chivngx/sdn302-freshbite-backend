const { Server } = require('socket.io');
const Message = require('../models/Message');

let io;

/**
 * Hàm phân tích an toàn dữ liệu từ client (hỗ trợ cả JSON Object lẫn chuỗi Raw Text từ Postman)
 * @param {any} data
 * @return {Object}
 */
const parseData = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data || {};
};

/**
 * Khởi tạo Socket.IO gắn vào HTTP Server
 * @param {Object} httpServer - Node.js HTTP Server instance
 * @return {Object} Socket.IO Server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // 1. Nhân viên quầy tham gia phòng nhận thông báo của chi nhánh
    socket.on('join_branch', (raw) => {
      const data = parseData(raw);
      const branchId = typeof raw === 'string' && !raw.startsWith('{') ? raw : data.branchId;
      if (branchId) {
        socket.join(`branch_${branchId}`);
      }
    });

    // 2. Tham gia phòng chat riêng giữa khách và quầy (phòng: chat_branchId_userId)
    socket.on('join_conversation', (raw) => {
      const { branchId, userId } = parseData(raw);
      if (branchId && userId) {
        const room = `chat_${branchId}_${userId}`;
        socket.join(room);
        socket.emit('joined', { room, success: true });
      }
    });

    // 3. Khách gửi tin nhắn trực tiếp qua Socket
    socket.on('send_message', async (raw) => {
      try {
        const data = parseData(raw);
        const { branchId, userId, senderName, content } = data;

        if (!branchId || !userId || !content) {
          socket.emit('socket_error', { message: 'Thiếu branchId, userId hoặc content' });
          return;
        }

        const message = await Message.create({
          branchId,
          userId,
          senderRole: 'customer',
          senderName: senderName || 'Khách hàng',
          content
        });

        const room = `chat_${branchId}_${userId}`;
        // Bắn tin nhắn tới phòng chat riêng và quầy chi nhánh
        io.to(room).emit('receive_message', message);
        io.to(`branch_${branchId}`).emit('new_customer_message', message);

        // Đảm bảo client gửi luôn nhận được phản hồi kể cả khi chưa kịp join room
        if (!socket.rooms.has(room)) {
          socket.emit('receive_message', message);
        }
      } catch (err) {
        socket.emit('socket_error', { message: err.message });
      }
    });

    // 4. Nhân viên quầy trả lời tin nhắn trực tiếp qua Socket
    socket.on('staff_reply', async (raw) => {
      try {
        const data = parseData(raw);
        const { branchId, targetUserId, senderName, content } = data;

        if (!branchId || !targetUserId || !content) {
          socket.emit('socket_error', { message: 'Thiếu branchId, targetUserId hoặc content' });
          return;
        }

        const message = await Message.create({
          branchId,
          userId: targetUserId,
          senderRole: 'staff',
          senderName: senderName || 'Nhân viên quầy',
          content
        });

        const room = `chat_${branchId}_${targetUserId}`;
        io.to(room).emit('receive_message', message);

        if (!socket.rooms.has(room)) {
          socket.emit('receive_message', message);
        }
      } catch (err) {
        socket.emit('socket_error', { message: err.message });
      }
    });
  });

  return io;
};

/**
 * Lấy đối tượng Socket.IO hiện tại để bắn event từ Controller
 * @return {Object} io instance
 */
const getIO = () => io;

module.exports = { initSocket, getIO };
