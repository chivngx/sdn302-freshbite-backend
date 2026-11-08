/**
 * Module: Upload & Download Controller
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 12 - Tải lên tệp tin và Tải xuống file (res.download) trong Express.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
const Order = require('../models/Order');

/**
 * 1. POST /api/upload
 * Tiếp nhận 1 ảnh tải lên qua Multer, trả về URL tĩnh phục vụ trên server
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn 1 tệp hình ảnh để tải lên!'
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativePath}`;

    return res.status(201).json({
      success: true,
      message: 'Tải lên hình ảnh thành công!',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: relativePath,
        url: fullUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/upload/multiple
 * Tiếp nhận tối đa 5 ảnh cùng lúc
 */
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 tệp hình ảnh để tải lên!'
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;

    const filesData = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      url: `${protocol}://${host}/uploads/${file.filename}`
    }));

    return res.status(201).json({
      success: true,
      message: `Tải lên thành công ${filesData.length} hình ảnh!`,
      count: filesData.length,
      data: filesData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/orders/:id/invoice (hoặc /api/upload/orders/:id/invoice)
 * Tải file hóa đơn biên nhận đơn hàng (res.download - Slot 12)
 *
 * Bản chất: res.download(path, [filename], [callback]) tự động gán HTTP Header:
 * Content-Disposition: attachment; filename="..."
 * Buộc trình duyệt / thiết bị di động kích hoạt hộp thoại tải file về máy,
 * khác với res.sendFile() vốn hiển thị inline trực tiếp.
 */
exports.downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không đúng định dạng MongoDB ObjectId!'
      });
    }

    const order = await Order.findById(id)
      .populate('userId', 'fullName email phone')
      .populate('branchId', 'name address phone openingHours')
      .populate('items.productId', 'name price imageUrl calories');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn hàng để xuất hóa đơn!'
      });
    }

    // Kiểm tra quyền: Chủ đơn hàng hoặc tài khoản Admin mới được tải hóa đơn
    if (req.user) {
      const isOwner = order.userId && order.userId._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền tải hóa đơn của đơn hàng này!'
        });
      }
    }

    // Định dạng nội dung Hóa đơn biên nhận chi tiết UTF-8
    const customerName = order.userId ? order.userId.fullName : 'Khách vãng lai';
    const customerPhone = order.userId ? order.userId.phone : 'N/A';
    const customerEmail = order.userId ? order.userId.email : 'N/A';
    const branchName = order.branchId ? order.branchId.name : 'FreshBite Đà Nẵng';
    const branchAddress = order.branchId ? order.branchId.address : 'Đà Nẵng';
    const branchPhone = order.branchId ? order.branchId.phone : '0236.730.0999';

    const orderDate = new Date(order.createdAt).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh'
    });

    const formatCurrency = (amount) =>
      Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';

    let itemsTable = '';
    order.items.forEach((item, index) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      itemsTable += `
[${index + 1}] ${item.name}
    - Size: ${item.size || 'S'} | Số lượng: ${item.quantity} | Đơn giá: ${formatCurrency(item.price)}
    - Tùy chọn: ${item.sugarLevel || '100%'} đường | ${item.iceLevel || '100%'} đá
    ${item.note ? `- Ghi chú: ${item.note}` : ''}
    - Thành tiền: ${formatCurrency(itemTotal)}
`;
    });

    const invoiceContent = `
============================================================
              FRESHBITE COFFEE & BAKERY
        Mạng lưới Cà phê Đặc sản & Bánh thủ công Đà Nẵng
============================================================
HÓA ĐƠN BIÊN NHẬN ĐẶT TRƯỚC (ORDER AHEAD RECEIPT)
Mã đơn hàng       : ${order.orderCode}
Thời gian tạo     : ${orderDate}
Trạng thái đơn    : ${order.status}
Hẹn giờ nhận món  : ${order.pickupTime}
------------------------------------------------------------
THÔNG TIN CHI NHÁNH NHẬN HÀNG:
- Chi nhánh       : ${branchName}
- Địa chỉ         : ${branchAddress}
- Hotline         : ${branchPhone}

THÔNG TIN KHÁCH HÀNG:
- Họ và tên       : ${customerName}
- Số điện thoại   : ${customerPhone}
- Email           : ${customerEmail}
------------------------------------------------------------
CHI TIẾT DANH SÁCH MÓN:${itemsTable}
------------------------------------------------------------
Tạm tính          : ${formatCurrency(order.subtotal)}
Mã giảm giá       : ${order.voucherCode || 'Không áp dụng'}
Giảm giá          : -${formatCurrency(order.discount || 0)}
------------------------------------------------------------
TỔNG CỘNG THANH TOÁN : ${formatCurrency(order.totalAmount)}
Phương thức TT    : ${order.paymentMethod}
Trạng thái TT     : ${order.paymentStatus}
============================================================
   Mô hình Order Ahead & In-Store Pick-up (100% Không Shipper)
   Quý khách vui lòng xuất trình mã đơn ${order.orderCode} tại quầy!
          Cảm ơn Quý khách & Hẹn gặp lại!
============================================================
`;

    // Lưu file tạm vào thư mục tạm của hệ điều hành (os.tmpdir)
    const fileName = `HoaDon_${order.orderCode}.txt`;
    const tempFilePath = path.join(os.tmpdir(), fileName);

    // Ghi kèm BOM UTF-8 '\ufeff' để Windows Notepad / Excel không bị lỗi font Tiếng Việt
    fs.writeFileSync(tempFilePath, '\ufeff' + invoiceContent, 'utf8');

    // Kích hoạt res.download() tải file về máy Client (Slot 12)
    return res.download(tempFilePath, fileName, (err) => {
      if (err) {
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: `Lỗi tải file hóa đơn: ${err.message}`
          });
        }
      }
      // Dọn dẹp file tạm trên ổ cứng sau khi hoàn tất truyền tải
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupErr) {
        console.error('Lỗi dọn file hóa đơn tạm:', cleanupErr.message);
      }
    });
  } catch (error) {
    next(error);
  }
};

