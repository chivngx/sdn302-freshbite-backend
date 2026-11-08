/**
 * Module: Web Admin SSR Controller (EJS Template Engine)
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 7 - Server-Side Rendering (SSR) với EJS & Express
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const User = require('../models/User');

/**
 * 0. Authentication Middleware cho Web Admin SSR
 */
exports.adminWebAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.freshbite_admin_token ||
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]) ||
      req.query.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).lean();
        if (user && (user.role === 'admin' || user.role === 'staff')) {
          req.user = user;
          res.locals.currentUser = user;
          return next();
        }
      } catch (tokenErr) {
        res.clearCookie('freshbite_admin_token', { path: '/' });
        res.clearCookie('freshbite_admin_token');
        res.clearCookie('token', { path: '/' });
        res.clearCookie('token');
      }
    }

    // Nếu không có token hợp lệ -> Chuyển hướng bắt buộc về trang đăng nhập
    return res.redirect('/admin/login');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/login
 * Render trang Đăng Nhập Quản Trị & Barista KDS
 */
exports.getLoginPage = (req, res) => {
  const token = req.cookies?.freshbite_admin_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        return res.redirect('/admin/dashboard');
      }
    } catch (e) {
      res.clearCookie('freshbite_admin_token', { path: '/' });
    }
  }

  res.render('login', {
    title: 'Đăng Nhập Quản Trị & Barista - FreshBite Coffee',
    error: req.query.error || null,
    message: req.query.message || null
  });
};

/**
 * POST /admin/login
 * Xử lý xác thực đăng nhập Quản Trị Viên / Nhân Viên
 */
exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render('login', {
        title: 'Đăng Nhập Quản Trị & Barista - FreshBite Coffee',
        error: 'Vui lòng nhập đầy đủ email và mật khẩu',
        message: null
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).render('login', {
        title: 'Đăng Nhập Quản Trị & Barista - FreshBite Coffee',
        error: 'Tài khoản không tồn tại trong hệ thống',
        message: null
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render('login', {
        title: 'Đăng Nhập Quản Trị & Barista - FreshBite Coffee',
        error: 'Mật khẩu không chính xác',
        message: null
      });
    }

    if (user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).render('login', {
        title: 'Đăng Nhập Quản Trị & Barista - FreshBite Coffee',
        error: 'Tài khoản không có quyền truy cập hệ thống Quản Trị',
        message: null
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('freshbite_admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.redirect('/admin/dashboard');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/logout
 * Đăng xuất và xóa phiên cookie
 */
exports.getLogout = (req, res) => {
  res.clearCookie('freshbite_admin_token', { path: '/' });
  res.clearCookie('freshbite_admin_token');
  res.clearCookie('token', { path: '/' });
  res.clearCookie('token');
  res.redirect('/admin/login?message=logged_out');
};

/**
 * 1. GET /admin hoặc GET /admin/dashboard
 * Trang Tổng quan Dashboard: Thống kê doanh thu, tổng đơn hàng, số lượng theo trạng thái
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, branches, revenueAgg, statusCountsAgg, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Branch.find({ isActive: true }).lean(),
      Order.aggregate([
        { $match: { status: 'Completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            cashRevenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'CASH_AT_COUNTER'] }, '$totalAmount', 0]
              }
            },
            digitalRevenue: {
              $sum: {
                $cond: [{ $ne: ['$paymentMethod', 'CASH_AT_COUNTER'] }, '$totalAmount', 0]
              }
            }
          }
        }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'fullName email phone')
        .populate('branchId', 'name address')
        .populate('items.productId', 'name price')
        .lean()
    ]);

    const revenue = revenueAgg[0] || { totalRevenue: 0, cashRevenue: 0, digitalRevenue: 0 };
    const statusCounts = {
      Received: 0,
      Preparing: 0,
      'Ready for Pickup': 0,
      Completed: 0,
      Cancelled: 0
    };

    statusCountsAgg.forEach((item) => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    const processingOrders = (statusCounts.Received || 0) + (statusCounts.Preparing || 0) + (statusCounts['Ready for Pickup'] || 0);

    const stats = {
      totalRevenue: revenue.totalRevenue,
      cashRevenue: revenue.cashRevenue,
      digitalRevenue: revenue.digitalRevenue,
      totalOrders,
      totalProducts,
      processingOrders,
      completedOrders: statusCounts.Completed || 0,
      statusCounts
    };

    res.render('dashboard', {
      title: 'FRESHBITE COFFEE & BAKERY (ĐÀ NẴNG) - Tổng Quan Hoạt Động',
      activeTab: 'dashboard',
      stats,
      branches,
      recentOrders,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};
exports.renderDashboard = exports.getDashboard;

/**
 * 2. GET /admin/orders
 * Màn hình KDS quầy Barista thời gian thực
 */
exports.getOrdersKDS = async (req, res, next) => {
  try {
    const { branchId, status } = req.query;
    const query = {};

    if (branchId && mongoose.isValidObjectId(branchId)) {
      query.branchId = branchId;
    }

    if (status) {
      query.status = status;
    }

    const [branches, orders, statusCountsAgg] = await Promise.all([
      Branch.find({ isActive: true }).sort({ name: 1 }).lean(),
      Order.find(query)
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName email phone')
        .populate('branchId', 'name address phone')
        .populate('items.productId', 'name price')
        .lean(),
      Order.aggregate([
        { $match: branchId && mongoose.isValidObjectId(branchId) ? { branchId: new mongoose.Types.ObjectId(branchId) } : {} },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statusCounts = {
      Received: 0,
      Preparing: 0,
      'Ready for Pickup': 0,
      Completed: 0,
      Cancelled: 0
    };

    statusCountsAgg.forEach((item) => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    res.render('orders', {
      title: 'FRESHBITE COFFEE & BAKERY (ĐÀ NẴNG) - Màn Hình Bếp KDS',
      activeTab: 'orders',
      orders,
      branches,
      statusCounts,
      selectedBranchId: branchId || '',
      selectedStatus: status || '',
      currentBranch: branchId || '',
      currentStatus: status || '',
      totalCount: orders.length,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};
exports.renderOrders = exports.getOrdersKDS;

/**
 * 3. POST /admin/orders/:id/status
 * Cập nhật trạng thái đơn hàng trực tiếp từ KDS
 */
exports.updateOrderStatusWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, redirectUrl } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/orders?err=ID đơn hàng không hợp lệ!');
    }

    const validStatuses = ['Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.redirect('/admin/orders?err=Trạng thái không hợp lệ!');
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.redirect('/admin/orders?err=Không tìm thấy đơn hàng!');
    }

    order.status = status;
    if (status === 'Completed' && order.paymentMethod === 'CASH_AT_COUNTER') {
      order.paymentStatus = 'PAID';
    }

    await order.save();

    const targetUrl = redirectUrl || '/admin/orders';
    return res.redirect(`${targetUrl}?msg=${encodeURIComponent(`Đơn hàng ${order.orderCode || order._id} đã chuyển sang "${status}"`)}`);
  } catch (error) {
    return res.redirect(`/admin/orders?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 4. GET /admin/products
 * Danh sách thực đơn & Quản lý món ăn
 */
exports.getProductsAdmin = async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find().populate('categoryId', 'name code').sort({ categoryId: 1, name: 1 }).lean(),
      Category.find().sort({ name: 1 }).lean()
    ]);

    res.render('products', {
      title: 'FRESHBITE COFFEE & BAKERY (ĐÀ NẴNG) - Quản Lý Thực Đơn',
      activeTab: 'products',
      products,
      categories,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};
exports.renderProducts = exports.getProductsAdmin;

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

    let imageUrl = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

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
 * Bật/tắt trạng thái phục vụ món ăn (isAvailable)
 */
exports.toggleProductAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/products?err=ID món ăn không hợp lệ!');
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.redirect('/admin/products?err=Không tìm thấy món ăn!');
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    const statusText = product.isAvailable ? 'Còn Hàng' : 'Hết Hàng';
    return res.redirect(`/admin/products?msg=${encodeURIComponent(`Món "${product.name}" đã cập nhật: [${statusText}]`)}`);
  } catch (error) {
    return res.redirect(`/admin/products?err=${encodeURIComponent(error.message)}`);
  }
};
exports.toggleProductAvailabilityWeb = exports.toggleProductAvailability;

/**
 * 7. GET /admin/branches
 * Danh sách 4 chi nhánh chuỗi FreshBite Đà Nẵng
 */
exports.getBranchesAdmin = async (req, res, next) => {
  try {
    const branches = await Branch.find().sort({ name: 1 }).lean();

    res.render('branches', {
      title: 'Hệ Thống Chi Nhánh FreshBite Đà Nẵng',
      activeTab: 'branches',
      branches,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};
