const jwt = require('jsonwebtoken');
const User = require('../models/User');

// giai ma va xac thuc token tu header authorization, cookie hoac query parameter
exports.verifyToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.freshbite_admin_token || req.cookies.token)) {
      token = req.cookies.freshbite_admin_token || req.cookies.token;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Bearer token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
};

// middleware xac thuc tuy chon: neu co token thi kiem tra va gan req.user, neu khong co thi van tiep tuc
exports.optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.freshbite_admin_token || req.cookies.token)) {
      token = req.cookies.freshbite_admin_token || req.cookies.token;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (err) {
        // Bo qua loi token trong optionalAuth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// kiem tra role nguoi dung de phan quyen truy cap
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
    }
    next();
  };
};

// alias hoac ham authorize de phan quyen (vi du: authorize('admin'))
exports.authorize = exports.checkRole;
