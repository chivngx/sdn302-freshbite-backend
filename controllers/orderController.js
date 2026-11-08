const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Voucher = require('../models/Voucher');

// Hàm sinh mã đơn hàng 'FB-' + 5 chữ số ngẫu nhiên, kiểm tra trùng trong DB tối đa 5 lần
const generateOrderCode = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomDigits = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const orderCode = `FB-${randomDigits}`;
    const exists = await Order.findOne({ orderCode });
    if (!exists) {
      return orderCode;
    }
  }
  return `FB-${Date.now().toString().slice(-5)}`;
};

// 1) POST /api/orders (verifyToken) - Người dùng đặt món
exports.createOrder = async (req, res, next) => {
  try {
    const { branchId, items, pickupTime, paymentMethod, voucherCode } = req.body;
    const userId = req.user._id;

    // Kiểm tra chi nhánh tồn tại và isActive = true
    const branch = await Branch.findById(branchId);
    if (!branch || !branch.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Chi nhánh nhận hàng không tồn tại hoặc đã tạm ngưng hoạt động!'
      });
    }

    // Lấy tất cả productId một lần bằng Product.find({ _id: { $in: ids } })
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map();
    products.forEach(p => productMap.set(p._id.toString(), p));

    // Tập hợp ID các món tạm hết hàng tại riêng chi nhánh này
    const outOfStockBranchSet = new Set(
      (branch.outOfStockProductIds || []).map(id => id.toString())
    );

    const verifiedItems = [];
    let subtotal = 0;

    // Với mỗi item: lấy name và price từ DB, kiểm tra tồn tại, isAvailable và tồn kho tại chi nhánh
    for (const item of items) {
      const product = productMap.get(item.productId.toString());
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm với ID "${item.productId}" không tồn tại trong hệ thống!`
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Món "${product.name}" hiện đang hết hàng hoặc tạm ngưng phục vụ!`
        });
      }

      if (outOfStockBranchSet.has(product._id.toString())) {
        return res.status(400).json({
          success: false,
          message: `Món "${product.name}" hiện đang tạm hết hàng tại chi nhánh này!`
        });
      }

      const quantity = Number(item.quantity);
      const size = item.size && ['S', 'M', 'L'].includes(item.size) ? item.size : 'S';

      // Tính giá phụ thu theo size (S: +0đ, M: +6.000đ, L: +10.000đ)
      let extraPrice = 0;
      if (product.sizePricing && product.sizePricing[size] !== undefined) {
        extraPrice = Number(product.sizePricing[size]) || 0;
      } else {
        if (size === 'M') extraPrice = 6000;
        else if (size === 'L') extraPrice = 10000;
      }

      const unitPrice = product.price + extraPrice;
      subtotal += unitPrice * quantity;

      verifiedItems.push({
        productId: product._id,
        name: product.name,
        size,
        quantity,
        price: unitPrice,
        sugarLevel: item.sugarLevel || '100%',
        iceLevel: item.iceLevel || '100%',
        note: item.note ? String(item.note).trim() : ''
      });
    }

    let discount = 0;
    let appliedVoucherCode = null;

    if (voucherCode && String(voucherCode).trim()) {
      const cleanVoucherCode = String(voucherCode).trim().toUpperCase();
      const voucher = await Voucher.findOne({ code: cleanVoucherCode });

      if (voucher && voucher.isActive) {
        const now = new Date();
        const isTimeValid = (!voucher.startDate || now >= voucher.startDate) && (!voucher.endDate || now <= voucher.endDate);
        const isAmountValid = subtotal >= (voucher.minOrderAmount || 0);

        if (isTimeValid && isAmountValid) {
          if (voucher.discountType === 'PERCENT') {
            discount = Math.round(subtotal * (voucher.discountValue / 100));
            if (voucher.maxDiscount && discount > voucher.maxDiscount) {
              discount = voucher.maxDiscount;
            }
          } else {
            discount = voucher.discountValue;
          }
          if (discount > subtotal) {
            discount = subtotal;
          }
          appliedVoucherCode = voucher.code;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discount);
    const orderCode = await generateOrderCode();

    const newOrder = await Order.create({
      orderCode,
      userId,
      branchId,
      items: verifiedItems,
      subtotal,
      discount,
      voucherCode: appliedVoucherCode || (voucherCode ? String(voucherCode).trim().toUpperCase() : null),
      totalAmount,
      pickupTime,
      status: 'Received',
      paymentMethod: paymentMethod || 'CASH_AT_COUNTER',
      paymentStatus: 'PENDING'
    });

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('branchId', 'name address phone');

    return res.status(201).json({
      success: true,
      message: 'Đặt đơn hàng thành công!',
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// 2) GET /api/orders/my-orders (verifyToken) - Lấy danh sách đơn của user hiện tại
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('branchId', 'name address phone')
      .populate('items.productId', 'name price imageUrl calories sizePricing');

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng của bạn thành công!',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// 3) GET /api/orders/:id (verifyToken) - Chi tiết đơn hàng
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ!'
      });
    }

    const order = await Order.findById(id)
      .populate('userId', 'fullName email phone')
      .populate('branchId', 'name address phone openingHours')
      .populate('items.productId', 'name price imageUrl calories sizePricing');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng!'
      });
    }

    const isOwner = order.userId && order.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng này!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công!',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 4) GET /api/orders/admin/all (verifyToken, authorize('admin')) - Quản trị xem tất cả đơn hàng
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, branchId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (branchId) {
      if (!mongoose.isValidObjectId(branchId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chi nhánh không hợp lệ!'
        });
      }
      filter.branchId = branchId;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limitNum);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'fullName phone')
      .populate('branchId', 'name');

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tất cả đơn hàng thành công!',
      totalOrders,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// Alias để tương thích tên gọi
exports.getAllOrdersAdmin = exports.getAllOrders;

// 5) PATCH /api/orders/:id/status (verifyToken, authorize('admin')) - Cập nhật trạng thái đơn
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ!'
      });
    }

    const validStatuses = ['Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ! Chấp nhận: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng!'
      });
    }

    // Đơn Completed hoặc Cancelled không được phép chuyển trạng thái nữa
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng đã ở trạng thái "${order.status}", không thể thay đổi trạng thái nữa!`
      });
    }

    // Luồng hợp lệ: Received -> Preparing -> Ready for Pickup -> Completed
    // Cho phép Cancelled từ Received hoặc Preparing
    const validTransitions = {
      'Received': ['Preparing', 'Cancelled'],
      'Preparing': ['Ready for Pickup', 'Cancelled'],
      'Ready for Pickup': ['Completed']
    };

    const allowedNextStatuses = validTransitions[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái từ "${order.status}" sang "${status}". Trạng thái hiện tại: "${order.status}". Các trạng thái tiếp theo hợp lệ: ${allowedNextStatuses.join(', ')}`
      });
    }

    order.status = status;

    // Khi chuyển sang Completed và paymentMethod là CASH_AT_COUNTER thì set paymentStatus = 'PAID'
    if (status === 'Completed' && order.paymentMethod === 'CASH_AT_COUNTER') {
      order.paymentStatus = 'PAID';
    }

    // TODO: Gửi push notification khi status = 'Ready for Pickup'
    if (status === 'Ready for Pickup') {
      // Logic gửi push notification (FCM, OneSignal, WebPush hoặc Socket.io) cho khách hàng
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('userId', 'fullName email phone')
      .populate('branchId', 'name address phone')
      .populate('items.productId', 'name price imageUrl calories sizePricing');

    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng thành "${status}" thành công!`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};
