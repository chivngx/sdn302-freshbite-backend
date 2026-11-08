/**
 * Module: Web Admin SSR Controller (EJS Template Engine)
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 7 - Server-Side Rendering (SSR) với EJS & Express Layouts
 *
 * ĐIỂM SỐNG CÒN KHI VẤN ĐÁP:
 * SSR (EJS) khác gì CSR (Client-Side Rendering trên React Native/Flutter)?
 * -> SSR sinh toàn bộ mã HTML đã ghép sẵn dữ liệu trực tiếp trên Server Node.js
 *    rồi mới gửi về cho trình duyệt. Giúp tải nhanh, nhẹ thiết bị, rất phù hợp
 *    cho quầy Barista KDS tại chỗ hoạt động ổn định.
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Category = require('../models/Category');

/**
 * 1. GET /admin/dashboard
 * Render giao diện tổng quan doanh thu & hoạt động các chi nhánh
 */
exports.renderDashboard = async (req, res, next) => {
  try {
    const branches = await Branch.find().lean();
    const orders = await Order.find().lean();

    // Tính toán các chỉ số thống kê đối soát ca
    const completedOrders = orders.filter((o) => o.status === 'Completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const cashRevenue = completedOrders
      .filter((o) => o.paymentMethod === 'CASH_AT_COUNTER')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const digitalRevenue = completedOrders
      .filter((o) => o.paymentMethod !== 'CASH_AT_COUNTER')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const processingOrders = orders.filter((o) =>
      ['Received', 'Preparing', 'Ready for Pickup'].includes(o.status)
    ).length;

    const stats = {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      processingOrders,
      totalRevenue,
      cashRevenue,
      digitalRevenue
    };

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'fullName phone')
      .populate('branchId', 'name')
      .lean();

    return res.render('dashboard', {
      title: 'FreshBite Đà Nẵng - Tổng Quan Hoạt Động',
      activeTab: 'dashboard',
      stats,
      branches,
      recentOrders,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /admin/orders
 * Render màn hình KDS Bếp & Quầy Barista
 */
exports.renderOrders = async (req, res, next) => {
  try {
    const { status, branchId } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (branchId && mongoose.isValidObjectId(branchId)) {
      filter.branchId = branchId;
    }

    const branches = await Branch.find().sort({ name: 1 }).lean();

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName phone')
      .populate('branchId', 'name address phone')
      .populate('items.productId', 'name price imageUrl calories')
      .lean();

    // Thống kê số lượng đơn theo từng trạng thái để hiển thị trên tabs
    const allBranchOrders = await Order.find(branchId ? { branchId } : {}).lean();
    const statusCounts = {
      Received: 0,
      Preparing: 0,
      'Ready for Pickup': 0,
      Completed: 0
    };

    allBranchOrders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    return res.render('orders', {
      title: 'Màn Hình Bếp KDS Quầy Barista - FreshBite Đà Nẵng',
      activeTab: 'orders',
      orders,
      branches,
      currentStatus: status || '',
      currentBranch: branchId || '',
      statusCounts,
      totalCount: allBranchOrders.length,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /admin/orders/:id/status
 * Xử lý chuyển đổi trạng thái đơn hàng trực tiếp từ màn hình KDS
 */
exports.updateOrderStatusWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/orders?err=ID đơn hàng không hợp lệ!');
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.redirect('/admin/orders?err=Không tìm thấy đơn hàng!');
    }

    const validStatuses = ['Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.redirect('/admin/orders?err=Trạng thái không hợp lệ!');
    }

    order.status = status;

    // Tự động chuyển paymentStatus sang PAID khi hoàn tất đơn trả tiền mặt tại quầy
    if (status === 'Completed' && order.paymentMethod === 'CASH_AT_COUNTER') {
      order.paymentStatus = 'PAID';
    }

    await order.save();

    return res.redirect(
      `/admin/orders?msg=Đơn hàng ${order.orderCode} đã chuyển sang trạng thái: "${status}"`
    );
  } catch (error) {
    return res.redirect(`/admin/orders?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 4. GET /admin/products
 * Render giao diện quản lý thực đơn & danh sách sản phẩm
 */
exports.renderProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('categoryId', 'name code')
      .lean();

    const categories = await Category.find().sort({ name: 1 }).lean();

    return res.render('products', {
      title: 'Quản Lý Thực Đơn & Upload Ảnh - FreshBite',
      activeTab: 'products',
      products,
      categories,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /admin/products
 * Xử lý thêm món ăn mới kèm Upload ảnh thật qua Multer DiskStorage (Slot 12)
 */
exports.createProductWeb = async (req, res, next) => {
  try {
    const { name, categoryId, price, calories, description, ingredients, isBestSeller } = req.body;

    if (!name || !categoryId || !price || !description) {
      return res.redirect('/admin/products?err=Vui lòng nhập đầy đủ các trường bắt buộc!');
    }

    // Nếu có file upload từ Multer, lưu đường dẫn /uploads/...
    let imageUrl = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Xử lý nguyên liệu dạng mảng
    const ingredientsArr = ingredients
      ? ingredients.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

    await Product.create({
      name: name.trim(),
      categoryId,
      price: Number(price),
      sizePricing: {
        S: 0,
        M: 6000,
        L: 10000
      },
      calories: Number(calories) || 150,
      description: description.trim(),
      imageUrl,
      ingredients: ingredientsArr,
      isBestSeller: Boolean(isBestSeller),
      isAvailable: true
    });

    return res.redirect(`/admin/products?msg=Đã thêm thành công món ăn "${name}" vào thực đơn!`);
  } catch (error) {
    return res.redirect(`/admin/products?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 6. POST /admin/products/:id/toggle
 * Bật/tắt nhanh trạng thái còn hàng (isAvailable) của món ăn
 */
exports.toggleProductAvailabilityWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.redirect('/admin/products?err=Không tìm thấy món ăn!');
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    const statusText = product.isAvailable ? 'Còn Hàng' : 'Hết Hàng';
    return res.redirect(
      `/admin/products?msg=Món "${product.name}" đã được cập nhật: [${statusText}]`
    );
  } catch (error) {
    return res.redirect(`/admin/products?err=${encodeURIComponent(error.message)}`);
  }
};

