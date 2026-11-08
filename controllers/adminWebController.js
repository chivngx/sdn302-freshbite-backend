const Order = require('../models/Order');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const Category = require('../models/Category');

/**
 * 1. GET /admin hoac GET /admin/dashboard
 * Trang Tong quan Dashboard: Thong ke doanh thu, tong don hang, so luong theo trang thai
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, branches, revenueAgg, statusCountsAgg, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Branch.find({ isActive: true }).lean(),
      Order.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('branchId', 'name district')
        .populate('userId', 'fullName email phone')
        .lean()
    ]);

    const totalRevenue = (revenueAgg[0] && revenueAgg[0].totalRevenue) || 0;

    const statusCounts = {
      Pending: 0,
      Preparing: 0,
      'Ready for Pickup': 0,
      Completed: 0,
      Cancelled: 0
    };
    statusCountsAgg.forEach((item) => {
      if (item._id && statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    res.render('dashboard', {
      title: 'FreshBite - Bảng Quản Trị Quán & Doanh Thu',
      stats: {
        totalOrders,
        totalProducts,
        totalBranches: branches.length,
        totalRevenue,
        statusCounts
      },
      recentOrders,
      branches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /admin/orders
 * Man hinh KDS (Kitchen Display System) quay Barista: Theo doi va cap nhat don hang theo thoi gian thuc
 */
exports.getOrdersKDS = async (req, res, next) => {
  try {
    const { branchId, status } = req.query;
    const filter = {};

    if (branchId) {
      filter.branchId = branchId;
    }
    if (status) {
      filter.status = status;
    }

    const [orders, branches] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('branchId', 'name district phone')
        .populate('userId', 'fullName email phone')
        .populate('items.productId', 'name price imageUrl')
        .lean(),
      Branch.find({ isActive: true }).lean()
    ]);

    res.render('orders', {
      title: 'Màn Hình Quầy Barista (KDS) - FreshBite Đà Nẵng',
      orders,
      branches,
      currentBranchId: branchId || '',
      currentStatus: status || ''
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /admin/orders/:id/status
 * Cap nhat trang thai don hang tu Web Admin SSR (KDS)
 */
exports.updateOrderStatusWeb = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, redirectUrl } = req.body;

    const allowedStatuses = ['Pending', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.redirect((redirectUrl || '/admin/orders') + '?error=invalid_status');
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.redirect((redirectUrl || '/admin/orders') + '?error=order_not_found');
    }

    order.status = status;
    if (status === 'Completed' && order.paymentMethod === 'CASH_AT_COUNTER') {
      order.paymentStatus = 'PAID';
    }

    await order.save();

    res.redirect((redirectUrl || '/admin/orders') + '?success=status_updated');
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /admin/products
 * Danh sach thuc don mon an quan tri
 */
exports.getProductsAdmin = async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find()
        .populate('categoryId', 'name code')
        .sort({ isAvailable: -1, name: 1 })
        .lean(),
      Category.find().lean()
    ]);

    res.render('products', {
      title: 'Quản Lý Thực Đơn & Giá Món Ăn - FreshBite',
      products,
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /admin/products/:id/toggle
 * Bat/tat trang thai con hang / het hang truc tiep tu Web Admin
 */
exports.toggleProductAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (product) {
      product.isAvailable = !product.isAvailable;
      await product.save();
    }
    res.redirect('/admin/products?success=availability_toggled');
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /admin/branches
 * Danh sach 4 chi nhanh Da Nang
 */
exports.getBranchesAdmin = async (req, res, next) => {
  try {
    const branches = await Branch.find().lean();
    res.render('branches', {
      title: 'Hệ Thống Chi Nhánh Cửa Hàng - FreshBite Đà Nẵng',
      branches
    });
  } catch (error) {
    next(error);
  }
};
