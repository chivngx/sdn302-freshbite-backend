/**
 * Module: Web Admin SSR Controller (EJS Template Engine)
 * Tác giả: Lê Tự Nhật Thạch (Uploads, Seed Data & Web Admin SSR Lead)
 * Bài học tích hợp: Slot 7 - Server-Side Rendering (SSR) với EJS & Express
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Category = require('../models/Category');
const User = require('../models/User');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Voucher = require('../models/Voucher');
const { getIO } = require('../config/socket');

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
        } else {
          res.clearCookie('freshbite_admin_token', { path: '/' });
          res.clearCookie('freshbite_admin_token');
          res.clearCookie('token', { path: '/' });
          res.clearCookie('token');
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
exports.getLoginPage = async (req, res) => {
  const token = req.cookies?.freshbite_admin_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).lean();
        if (user && (user.role === 'admin' || user.role === 'staff')) {
          return res.redirect('/admin/dashboard');
        } else {
          res.clearCookie('freshbite_admin_token', { path: '/' });
          res.clearCookie('freshbite_admin_token');
        }
      }
    } catch (e) {
      res.clearCookie('freshbite_admin_token', { path: '/' });
      res.clearCookie('freshbite_admin_token');
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
      currentBranchId: branchId || '',
      selectedBranchId: branchId || '',
      currentBranch: branchId || '',
      currentStatus: status || '',
      selectedStatus: status || '',
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
 * Thêm món ăn mới kèm Upload ảnh thật qua Multer DiskStorage (Slot 12) & giá theo Size
 */
exports.createProductWeb = async (req, res, next) => {
  try {
    const { name, categoryId, price, sizePriceM, sizePriceL, calories, description, ingredients, isBestSeller } = req.body;

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
        M: !isNaN(Number(sizePriceM)) ? Number(sizePriceM) : 6000,
        L: !isNaN(Number(sizePriceL)) ? Number(sizePriceL) : 10000
      },
      calories: Number(calories) || 150,
      description: description.trim(),
      imageUrl,
      ingredients: ingredientsArr,
      isBestSeller: Boolean(isBestSeller === 'true' || isBestSeller === true || isBestSeller === 'on'),
      isAvailable: true
    });

    return res.redirect(`/admin/products?msg=${encodeURIComponent(`Đã thêm thành công món ăn "${name}" vào thực đơn!`)}`);
  } catch (error) {
    return res.redirect(`/admin/products?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 5b. POST /admin/products/:id/edit
 * Cập nhật món ăn (Tên, Giá, Giá theo Size S/M/L, Calo, Mô tả, Ảnh mới nếu có)
 */
exports.updateProductWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/products?err=ID món ăn không hợp lệ!');
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.redirect('/admin/products?err=Không tìm thấy món ăn!');
    }

    const { name, categoryId, price, sizePriceM, sizePriceL, calories, description, ingredients, isBestSeller, isAvailable } = req.body;

    if (name) product.name = name.trim();
    if (categoryId) product.categoryId = categoryId;
    if (price !== undefined && !isNaN(Number(price))) product.price = Number(price);
    if (calories !== undefined && !isNaN(Number(calories))) product.calories = Number(calories);
    if (description) product.description = description.trim();

    if (ingredients !== undefined) {
      product.ingredients = ingredients.split(',').map((s) => s.trim()).filter(Boolean);
    }

    product.isBestSeller = isBestSeller === 'true' || isBestSeller === true || isBestSeller === 'on';
    if (isAvailable !== undefined) {
      product.isAvailable = isAvailable === 'true' || isAvailable === true || isAvailable === 'on';
    }

    product.sizePricing = {
      S: 0,
      M: !isNaN(Number(sizePriceM)) ? Number(sizePriceM) : (product.sizePricing?.M ?? 6000),
      L: !isNaN(Number(sizePriceL)) ? Number(sizePriceL) : (product.sizePricing?.L ?? 10000)
    };

    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();
    return res.redirect(`/admin/products?msg=${encodeURIComponent(`Đã cập nhật món "${product.name}" thành công!`)}`);
  } catch (error) {
    return res.redirect(`/admin/products?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 5c. POST /admin/products/:id/delete
 * Xóa món ăn khỏi thực đơn
 */
exports.deleteProductWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/products?err=ID món ăn không hợp lệ!');
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.redirect('/admin/products?err=Không tìm thấy món ăn cần xóa!');
    }

    return res.redirect(`/admin/products?msg=${encodeURIComponent(`Đã xóa món "${product.name}" khỏi thực đơn!`)}`);
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

/**
 * 8. GET /admin/chats
 * Màn hình Live Chat CSKH 2 chiều với khách hàng
 */
exports.getChatsPage = async (req, res, next) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
    if (!branches.length) {
      return res.render('chats', {
        title: 'FRESHBITE CSKH - Live Chat Khách Hàng',
        activeTab: 'chats',
        branches: [],
        selectedBranchId: '',
        conversations: [],
        selectedUserId: '',
        activeCustomer: null,
        messages: [],
        successMsg: req.query.msg || null,
        errorMsg: req.query.err || null,
        currentUser: res.locals.currentUser || req.user || null
      });
    }

    let selectedBranchId = req.query.branchId;
    if (!selectedBranchId || !mongoose.isValidObjectId(selectedBranchId)) {
      selectedBranchId = branches[0]._id.toString();
    }

    // Nhóm hội thoại theo từng khách hàng tại chi nhánh này
    const conversations = await Message.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(selectedBranchId) } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          lastSenderRole: { $first: '$senderRole' },
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
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          lastMessage: 1,
          lastMessageAt: 1,
          lastSenderRole: 1,
          unreadCount: 1,
          customerName: { $ifNull: ['$customer.fullName', 'Khách Hàng'] },
          customerEmail: { $ifNull: ['$customer.email', ''] },
          customerPhone: { $ifNull: ['$customer.phone', ''] },
          customerAvatar: { $ifNull: ['$customer.avatar', ''] }
        }
      }
    ]);

    let selectedUserId = req.query.userId;
    if (!selectedUserId && conversations.length > 0) {
      selectedUserId = conversations[0].userId.toString();
    }

    let messages = [];
    let activeCustomer = null;

    if (selectedUserId && mongoose.isValidObjectId(selectedUserId)) {
      [messages, activeCustomer] = await Promise.all([
        Message.find({ branchId: selectedBranchId, userId: selectedUserId }).sort({ createdAt: 1 }).lean(),
        User.findById(selectedUserId).select('fullName email phone avatar').lean()
      ]);

      // Đánh dấu tin nhắn của khách là đã đọc khi CSKH mở hội thoại
      await Message.updateMany(
        { branchId: selectedBranchId, userId: selectedUserId, senderRole: 'customer', isRead: false },
        { isRead: true }
      );
    }

    res.render('chats', {
      title: 'FRESHBITE CSKH - Live Chat Khách Hàng',
      activeTab: 'chats',
      branches,
      selectedBranchId,
      conversations,
      selectedUserId: selectedUserId || '',
      activeCustomer,
      messages,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8b. POST /admin/chats/reply
 * Nhân viên quầy / CSKH trả lời khách hàng trực tiếp trên Web Admin EJS
 */
exports.postStaffReplyWeb = async (req, res, next) => {
  try {
    const { branchId, userId, content } = req.body;
    if (!branchId || !userId || !content || !content.trim()) {
      return res.redirect(`/admin/chats?branchId=${branchId || ''}&userId=${userId || ''}&err=${encodeURIComponent('Nội dung tin nhắn không được để trống!')}`);
    }

    const senderName = (req.user && req.user.fullName) ? req.user.fullName : 'CSKH FreshBite';
    const message = await Message.create({
      branchId,
      userId,
      senderRole: 'staff',
      senderName,
      content: content.trim()
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`chat_${branchId}_${userId}`).emit('receive_message', message);
        io.to(`branch_${branchId}`).emit('new_staff_message', message);
      }
    } catch (socketErr) {
      console.warn('Socket emit warning:', socketErr.message);
    }

    return res.redirect(`/admin/chats?branchId=${branchId}&userId=${userId}`);
  } catch (error) {
    return res.redirect(`/admin/chats?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 9. GET /admin/reviews
 * Quản lý đánh giá món ăn & sao trung bình
 */
exports.getReviewsPage = async (req, res, next) => {
  try {
    const { branchId, productId, rating, status } = req.query;
    const filter = {};

    if (branchId && mongoose.isValidObjectId(branchId)) {
      filter.branchId = branchId;
    }
    if (productId && mongoose.isValidObjectId(productId)) {
      filter.productId = productId;
    }
    if (rating && !isNaN(Number(rating))) {
      filter.rating = Number(rating);
    }
    if (status === 'visible') {
      filter.isHidden = false;
    } else if (status === 'hidden') {
      filter.isHidden = true;
    }

    const [branches, products, reviews, statsAgg] = await Promise.all([
      Branch.find({ isActive: true }).sort({ name: 1 }).lean(),
      Product.find().select('name imageUrl price').sort({ name: 1 }).lean(),
      Review.find(filter)
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName email avatar phone')
        .populate('productId', 'name imageUrl price')
        .populate('branchId', 'name address district')
        .lean(),
      Review.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            count5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            count4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            count3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            count2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            count1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        }
      ])
    ]);

    const stats = statsAgg[0] || {
      avgRating: 0,
      totalReviews: 0,
      count5: 0,
      count4: 0,
      count3: 0,
      count2: 0,
      count1: 0
    };

    res.render('reviews', {
      title: 'FRESHBITE - Đánh Giá & Phản Hồi Món Ăn',
      activeTab: 'reviews',
      reviews,
      stats: {
        ...stats,
        avgRating: stats.avgRating ? Math.round(stats.avgRating * 10) / 10 : 0
      },
      branches,
      products,
      currentBranch: branchId || '',
      currentProduct: productId || '',
      currentRating: rating || '',
      currentStatus: status || '',
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9b. POST /admin/reviews/:id/toggle
 * Ẩn hoặc Hiện đánh giá của khách hàng (kiểm duyệt nội dung)
 */
exports.toggleReviewHideWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/reviews?err=ID đánh giá không hợp lệ!');
    }
    const review = await Review.findById(id);
    if (!review) {
      return res.redirect('/admin/reviews?err=Không tìm thấy đánh giá!');
    }
    review.isHidden = !review.isHidden;
    await review.save();

    const msg = review.isHidden ? 'Đã ẩn đánh giá khỏi ứng dụng!' : 'Đã mở hiển thị lại đánh giá!';
    return res.redirect(`/admin/reviews?msg=${encodeURIComponent(msg)}`);
  } catch (error) {
    return res.redirect(`/admin/reviews?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 10. GET /admin/reports
 * Đối soát ca quầy Barista & thống kê doanh thu theo ngày
 */
exports.getReportsPage = async (req, res, next) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
    let selectedBranchId = req.query.branchId;
    if (!selectedBranchId || !mongoose.isValidObjectId(selectedBranchId)) {
      selectedBranchId = branches.length > 0 ? branches[0]._id.toString() : '';
    }

    const reportDateStr = req.query.date || new Date().toISOString().split('T')[0];
    const reportDate = new Date(reportDateStr);
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };
    if (selectedBranchId && mongoose.isValidObjectId(selectedBranchId)) {
      query.branchId = selectedBranchId;
    }

    const orders = await Order.find(query)
      .populate('userId', 'fullName email phone')
      .populate('branchId', 'name address')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'Completed');
    const cancelledOrders = orders.filter((o) => o.status === 'Cancelled');
    const processingOrders = totalOrders - completedOrders.length - cancelledOrders.length;

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const cashRevenue = completedOrders
      .filter((o) => o.paymentMethod === 'CASH_AT_COUNTER')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const digitalRevenue = completedOrders
      .filter((o) => o.paymentMethod !== 'CASH_AT_COUNTER')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const discountTotal = orders.reduce((sum, o) => sum + (o.discount || 0), 0);

    const selectedBranch = branches.find((b) => b._id.toString() === String(selectedBranchId)) || null;

    res.render('reports', {
      title: 'FRESHBITE - Đối Soát Ca & Báo Cáo Doanh Thu Quầy',
      activeTab: 'reports',
      branches,
      selectedBranchId,
      selectedBranch,
      reportDate: reportDateStr,
      stats: {
        totalOrders,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        processingOrders,
        totalRevenue,
        cashRevenue,
        digitalRevenue,
        discountTotal
      },
      orders,
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10b. GET /admin/reports/export
 * Xuất file CSV đối soát ca và kích hoạt tải về qua res.download() (Slot 12)
 */
exports.exportShiftReportWeb = async (req, res, next) => {
  try {
    const { branchId, date } = req.query;
    if (!branchId || !mongoose.isValidObjectId(branchId)) {
      return res.redirect('/admin/reports?err=Vui lòng chọn chi nhánh hợp lệ để xuất báo cáo!');
    }

    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      branchId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'fullName phone');

    const branch = await Branch.findById(branchId).select('name address');
    const branchName = branch ? branch.name : 'Branch';
    const dateStr = reportDate.toISOString().split('T')[0];

    const csvRows = [
      '\ufeff"Mã đơn","Khách hàng","Số điện thoại","Hẹn lấy","Phương thức TT","Trạng thái TT","Trạng thái đơn","Tạm tính (VNĐ)","Giảm giá (VNĐ)","Tổng tiền (VNĐ)","Thời gian tạo"'
    ];

    orders.forEach((o) => {
      const customerName = o.userId ? o.userId.fullName : 'Khách vãng lai';
      const customerPhone = o.userId ? o.userId.phone : '';
      csvRows.push(
        `"${o.orderCode}","${customerName}","${customerPhone}","${o.pickupTime}","${o.paymentMethod}","${o.paymentStatus}","${o.status}","${o.subtotal || 0}","${o.discount || 0}","${o.totalAmount || 0}","${o.createdAt.toISOString()}"`
      );
    });

    const csvContent = csvRows.join('\r\n');
    const tempFilePath = path.join(os.tmpdir(), `BaoCaoCa_${branchName.replace(/\s+/g, '_')}_${dateStr}.csv`);
    fs.writeFileSync(tempFilePath, csvContent, 'utf8');

    return res.download(tempFilePath, `BaoCaoCa_${dateStr}.csv`, (err) => {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {}
    });
  } catch (error) {
    return res.redirect(`/admin/reports?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 11. GET /admin/vouchers
 * Quản lý chương trình khuyến mãi & mã Voucher
 */
exports.getVouchersPage = async (req, res, next) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 }).lean();
    const now = new Date();

    const activeCount = vouchers.filter((v) => v.isActive && new Date(v.endDate) >= now).length;
    const expiredCount = vouchers.filter((v) => !v.isActive || new Date(v.endDate) < now).length;

    res.render('vouchers', {
      title: 'FRESHBITE - Quản Lý Voucher & Mã Khuyến Mãi',
      activeTab: 'vouchers',
      vouchers,
      stats: {
        total: vouchers.length,
        active: activeCount,
        expired: expiredCount
      },
      successMsg: req.query.msg || null,
      errorMsg: req.query.err || null,
      currentUser: res.locals.currentUser || req.user || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11b. POST /admin/vouchers
 * Tạo mới Voucher ưu đãi
 */
exports.createVoucherWeb = async (req, res, next) => {
  try {
    const { code, title, discountType, discountValue, maxDiscount, minOrderAmount, startDate, endDate } = req.body;
    if (!code || !title || !discountValue || !endDate) {
      return res.redirect('/admin/vouchers?err=Vui lòng nhập đầy đủ các thông tin bắt buộc của Voucher!');
    }

    const existing = await Voucher.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.redirect('/admin/vouchers?err=Mã voucher này đã tồn tại trong hệ thống!');
    }

    await Voucher.create({
      code: code.toUpperCase().trim(),
      title: title.trim(),
      discountType: discountType || 'PERCENT',
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : 50000,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      isActive: true
    });

    return res.redirect(`/admin/vouchers?msg=${encodeURIComponent(`Đã tạo thành công voucher "${code.toUpperCase()}"!`)}`);
  } catch (error) {
    return res.redirect(`/admin/vouchers?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 11c. POST /admin/vouchers/:id/edit
 * Cập nhật thông tin Voucher
 */
exports.editVoucherWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/vouchers?err=ID voucher không hợp lệ!');
    }
    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.redirect('/admin/vouchers?err=Không tìm thấy voucher!');
    }

    const { title, discountType, discountValue, maxDiscount, minOrderAmount, startDate, endDate, isActive } = req.body;
    if (title) voucher.title = title.trim();
    if (discountType) voucher.discountType = discountType;
    if (discountValue !== undefined && !isNaN(Number(discountValue))) voucher.discountValue = Number(discountValue);
    if (maxDiscount !== undefined && !isNaN(Number(maxDiscount))) voucher.maxDiscount = Number(maxDiscount);
    if (minOrderAmount !== undefined && !isNaN(Number(minOrderAmount))) voucher.minOrderAmount = Number(minOrderAmount);
    if (startDate) voucher.startDate = new Date(startDate);
    if (endDate) voucher.endDate = new Date(endDate);
    if (isActive !== undefined) {
      voucher.isActive = isActive === 'true' || isActive === true || isActive === 'on';
    }

    await voucher.save();
    return res.redirect(`/admin/vouchers?msg=${encodeURIComponent(`Đã cập nhật voucher "${voucher.code}"!`)}`);
  } catch (error) {
    return res.redirect(`/admin/vouchers?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 11d. POST /admin/vouchers/:id/toggle
 * Bật hoặc tắt trạng thái áp dụng Voucher
 */
exports.toggleVoucherWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/vouchers?err=ID voucher không hợp lệ!');
    }
    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.redirect('/admin/vouchers?err=Không tìm thấy voucher!');
    }
    voucher.isActive = !voucher.isActive;
    await voucher.save();

    const state = voucher.isActive ? 'Kích hoạt' : 'Tạm dừng';
    return res.redirect(`/admin/vouchers?msg=${encodeURIComponent(`Voucher "${voucher.code}" đã được [${state}]!`)}`);
  } catch (error) {
    return res.redirect(`/admin/vouchers?err=${encodeURIComponent(error.message)}`);
  }
};

/**
 * 11e. POST /admin/vouchers/:id/delete
 * Xóa Voucher khỏi hệ thống
 */
exports.deleteVoucherWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.redirect('/admin/vouchers?err=ID voucher không hợp lệ!');
    }
    const voucher = await Voucher.findByIdAndDelete(id);
    if (!voucher) {
      return res.redirect('/admin/vouchers?err=Không tìm thấy voucher cần xóa!');
    }
    return res.redirect(`/admin/vouchers?msg=${encodeURIComponent(`Đã xóa voucher "${voucher.code}"!`)}`);
  } catch (error) {
    return res.redirect(`/admin/vouchers?err=${encodeURIComponent(error.message)}`);
  }
};
