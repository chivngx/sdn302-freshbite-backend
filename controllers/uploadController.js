/**
 * Module: Upload & Download Controller
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 12 - Tải lên tệp tin (Multer) và Tải xuống file (res.download)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { uploadDir } = require('../middlewares/uploadMiddleware');

// Thư mục lưu hóa đơn bán lẻ
const invoiceDir = path.join(uploadDir, 'invoices');
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir, { recursive: true });
}

/**
 * 1. POST /api/uploads/single (hoặc POST /api/upload hoặc POST /api/uploads)
 * Tiếp nhận 1 ảnh tải lên qua Multer, trả về URL tĩnh phục vụ trên server
 */
exports.uploadSingleImage = async (req, res, next) => {
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
exports.uploadImage = exports.uploadSingleImage;

/**
 * 2. POST /api/uploads/multiple (hoặc POST /api/upload/multiple)
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
 * 3. GET /api/uploads/download/:filename
 * Tải file bất kỳ trong thư mục uploads qua res.download() (Slot 12)
 * Kèm cơ chế chống Directory Traversal Attack
 */
exports.downloadFile = (req, res, next) => {
  try {
    const { filename } = req.params;

    // Ngăn chặn Directory Traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(404).json({
        success: false,
        message: 'Đường dẫn tệp tin không hợp lệ hoặc bị từ chối truy cập!'
      });
    }

    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy tệp tin: ${filename}`
      });
    }

    return res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/orders/:id/invoice hoặc /api/uploads/orders/:id/invoice
 * Xuất và tải file hóa đơn bán lẻ đơn hàng bằng res.download() (Slot 12)
 * Kèm BOM UTF-8 '\ufeff' cho Windows Notepad / Excel
 */
exports.downloadOrderInvoice = async (req, res, next) => {
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
        message: `Không tìm thấy đơn hàng với mã ID: ${id}`
      });
    }

    const invoiceFileName = `HoaDon_${order.orderCode || order._id}.txt`;
    const invoiceFilePath = path.join(invoiceDir, invoiceFileName);

    const createdAtStr = order.createdAt
      ? new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : new Date().toLocaleString('vi-VN');

    const customerName = (order.userId && order.userId.fullName) || 'Khách vãng lai';
    const customerPhone = (order.userId && order.userId.phone) || 'N/A';
    const branchName = (order.branchId && order.branchId.name) || 'FreshBite Chi nhánh Đà Nẵng';
    const branchAddress = (order.branchId && order.branchId.address) || 'Đà Nẵng';
    const branchPhone = (order.branchId && order.branchId.phone) || '0236.730.0999';

    let itemsTable = '------------------------------------------------------------\n';
    itemsTable += 'Tên món                       Size   SL      Đơn giá   Thành tiền\n';
    itemsTable += '------------------------------------------------------------\n';

    (order.items || []).forEach((item, idx) => {
      const prodName = (item.productId && item.productId.name) || item.name || `Món #${idx + 1}`;
      const paddedName = prodName.padEnd(28, ' ').slice(0, 28);
      const sizeStr = (item.size || 'M').padEnd(6, ' ');
      const qtyStr = String(item.quantity || 1).padEnd(6, ' ');
      const priceStr = `${Number(item.price || 0).toLocaleString('vi-VN')}đ`.padEnd(11, ' ');
      const itemSubtotal = (item.quantity || 1) * (item.price || 0);
      const subStr = `${itemSubtotal.toLocaleString('vi-VN')}đ`;

      itemsTable += `${paddedName} ${sizeStr} ${qtyStr} ${priceStr} ${subStr}\n`;
      if (item.sugarLevel || item.iceLevel || item.note) {
        itemsTable += `    - Tùy chọn: ${item.sugarLevel || '100%'} đường, ${item.iceLevel || '100%'} đá${item.note ? ` | Ghi chú: ${item.note}` : ''}\n`;
      }
    });
    itemsTable += '------------------------------------------------------------\n';

    const invoiceContent = `============================================================
              HỆ THỐNG CÀ PHÊ FRESHBITE ĐÀ NẴNG
          HÓA ĐƠN BÁN LẺ & PHIẾU XÁC NHẬN ĐƠN HÀNG
============================================================
Mã đơn hàng:     ${order.orderCode || order._id}
Ngày đặt hàng:   ${createdAtStr}
Trạng thái:      ${order.status}
Phương thức TT:  ${order.paymentMethod} (${order.paymentStatus || 'PENDING'})
------------------------------------------------------------
Chi nhánh:       ${branchName}
Địa chỉ:         ${branchAddress}
Hotline:         ${branchPhone}
Khách hàng:      ${customerName}
Số điện thoại:   ${customerPhone}
Ghi chú nhận:    ${order.pickupTime ? order.pickupTime : 'Sớm nhất tại quầy'}
============================================================
CHI TIẾT MÓN ĂN:
${itemsTable}
Tổng tiền món:              ${Number(order.subtotal || order.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
Giảm giá / Voucher:        -${Number(order.discount || order.discountAmount || 0).toLocaleString('vi-VN')} VNĐ
TỔNG THANH TOÁN:            ${Number(order.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
============================================================
Cảm ơn Quý khách đã tin tưởng và ủng hộ FreshBite Đà Nẵng!
Mô hình Order Ahead & In-Store Pick-up (100% Không Shipper)
Hotline hỗ trợ: 0236.730.0999 | Email: contact@freshbite.vn
`;

    // Ghi kèm BOM UTF-8 '\ufeff' để Windows Notepad / Excel không bị lỗi font Tiếng Việt
    fs.writeFileSync(invoiceFilePath, '\ufeff' + invoiceContent, 'utf8');

    // Kích hoạt res.download() tải file về máy Client (Slot 12)
    return res.download(invoiceFilePath, invoiceFileName, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.downloadInvoice = exports.downloadOrderInvoice;

/**
 * 5. GET /api/uploads/template/product-import
 * Tải file mẫu CSV thực đơn bằng res.download() (Slot 12)
 */
exports.downloadProductTemplate = (req, res, next) => {
  try {
    const templateFileName = 'FreshBite_Menu_Import_Template.csv';
    const templateFilePath = path.join(uploadDir, templateFileName);

    const templateContent = `name,categoryCode,price,calories,description,isAvailable,ingredients
Cà phê Sữa Tươi Sương Sáo,coffee,39000,195,"Cà phê sữa tươi thơm béo kết hợp sương sáo thanh mát đặc sản Đà Nẵng",true,"Cà phê Robusta, Sữa tươi, Sương sáo"
Trà Lài Hạt Sen Cố Đô,tea,42000,120,"Trà hoa lài thanh nhã hòa quyện hạt sen Huế bùi bùi thanh mát",true,"Trà lài, Hạt sen, Đường phèn"
Bánh Sừng Bò Trứng Muối,bakery,35000,280,"Bánh sừng bò ngàn lớp nhân sốt trứng muối hoàng kim béo ngậy",true,"Bột mì Pháp, Bơ tươi, Trứng muối"
`;

    fs.writeFileSync(templateFilePath, '\ufeff' + templateContent, 'utf8');

    return res.download(templateFilePath, templateFileName, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};
