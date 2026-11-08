const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const { AppError } = require('../middlewares/errorMiddleware');
const { uploadDir } = require('../middlewares/uploadMiddleware');

// Thu muc hoa don
const invoiceDir = path.join(uploadDir, 'invoices');
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir, { recursive: true });
}

/**
 * 1. POST /api/uploads/single (hoac POST /api/uploads)
 * Upload 1 anh tinh (san pham, avatar nguoi dung, banner)
 */
exports.uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tệp tin hình ảnh cần tải lên!'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

    return res.status(201).json({
      success: true,
      message: 'Tải tệp tin hình ảnh lên thành công!',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        fullUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/uploads/multiple
 * Upload nhieu anh cung luc (toi da 5 anh)
 */
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một tệp tin hình ảnh!'
      });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      fullUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    }));

    return res.status(201).json({
      success: true,
      message: `Tải lên thành công ${uploadedFiles.length} hình ảnh!`,
      data: uploadedFiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/uploads/download/:filename
 * Xu ly tai file bang res.download() theo chuan Slot 12
 * Content-Disposition: attachment; filename="..."
 */
exports.downloadFile = async (req, res, next) => {
  try {
    const rawFilename = req.params.filename;
    // Ngan chan tan cong Directory Traversal bang basename
    const safeFilename = path.basename(rawFilename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy tệp tin: ${safeFilename}`
      });
    }

    return res.download(filePath, safeFilename, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/orders/:id/invoice hoac GET /api/uploads/orders/:id/invoice
 * Xuat va tai file hoa don ban le don hang bang res.download() (Slot 12)
 */
exports.downloadOrderInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('userId', 'fullName email phone')
      .populate('branchId', 'name address phone')
      .populate('items.productId', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy đơn hàng với mã ID: ${id}`
      });
    }

    // Tao noi dung hoa don dinh dang van ban ro rang
    const invoiceFileName = `HoaDon_${order.orderCode || order._id}.txt`;
    const invoiceFilePath = path.join(invoiceDir, invoiceFileName);

    const createdAtStr = order.createdAt
      ? new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : new Date().toLocaleString('vi-VN');

    const customerName = (order.userId && order.userId.fullName) || 'Khách vãng lai';
    const customerPhone = (order.userId && order.userId.phone) || 'N/A';
    const branchName = (order.branchId && order.branchId.name) || 'FreshBite Chi nhánh Đà Nẵng';
    const branchAddress = (order.branchId && order.branchId.address) || 'Đà Nẵng';

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
Khách hàng:      ${customerName}
Số điện thoại:   ${customerPhone}
Ghi chú nhận:    ${order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString('vi-VN') : 'Sớm nhất'}
============================================================
CHI TIẾT MÓN ĂN:
${itemsTable}
Tổng tiền món:              ${Number(order.subtotal || order.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
Giảm giá / Voucher:        -${Number(order.discountAmount || 0).toLocaleString('vi-VN')} VNĐ
TỔNG THANH TOÁN:            ${Number(order.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
============================================================
Cảm ơn Quý khách đã tin tưởng và ủng hộ FreshBite Đà Nẵng!
Hotline hỗ trợ: 0236.730.0999 | Email: contact@freshbite.vn
`;

    fs.writeFileSync(invoiceFilePath, invoiceContent, 'utf8');

    // Su dung res.download() de kich hoat trinh duyet tai file ve may
    return res.download(invoiceFilePath, invoiceFileName, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/uploads/template/product-import
 * Tai file CSV/Excel mau de nhap thuc don (res.download)
 */
exports.downloadProductTemplate = async (req, res, next) => {
  try {
    const templateFileName = 'FreshBite_Product_Import_Template.csv';
    const templateFilePath = path.join(uploadDir, templateFileName);

    if (!fs.existsSync(templateFilePath)) {
      const sampleCSV = `name,categoryCode,price,sizePricing_S,sizePricing_M,sizePricing_L,calories,isAvailable,description
Cà phê Sữa Tươi Sương Sáo,coffee,35000,30000,35000,42000,190,true,Cà phê sữa tươi thơm ngậy kết hợp thạch sương sáo mát lạnh
Trà Ô Long Dưa Lưới,tea,39000,34000,39000,45000,130,true,Trà ô long thanh khiết kết hợp hương vị dưa lưới tươi ngon
Bánh Sừng Bò Hạnh Nhân,bakery,38000,,,38000,290,true,Bánh sừng bò Pháp rắc hạnh nhân nướng giòn tan
`;
      fs.writeFileSync(templateFilePath, sampleCSV, 'utf8');
    }

    return res.download(templateFilePath, templateFileName);
  } catch (error) {
    next(error);
  }
};
