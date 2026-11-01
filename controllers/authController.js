const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      role: role === 'admin' ? 'admin' : 'user'
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    let query = User.findById(req.user._id);

    // chi populate khi model product da khoi tao de tranh loi
    if (mongoose.models.Product && req.user.favoriteProducts?.length > 0) {
      query = query.populate('favoriteProducts', 'name price imageUrl calories isAvailable isBestSeller');
    }

    const user = await query;
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// lay danh sach mon an yeu thich cua user
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'favoriteProducts',
      'name price imageUrl calories isAvailable isBestSeller'
    );

    res.status(200).json({
      success: true,
      count: user.favoriteProducts ? user.favoriteProducts.length : 0,
      data: user.favoriteProducts || []
    });
  } catch (error) {
    next(error);
  }
};

// them mon an vao danh sach yeu thich (dung toan tu $addToSet de tranh trung lap)
exports.addFavorite = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favoriteProducts: productId } },
      { new: true }
    ).populate('favoriteProducts', 'name price imageUrl calories isAvailable isBestSeller');

    res.status(200).json({
      success: true,
      message: 'Product added to favorites successfully',
      data: user.favoriteProducts
    });
  } catch (error) {
    next(error);
  }
};

// xoa mon an khoi danh sach yeu thich (dung toan tu $pull)
exports.removeFavorite = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favoriteProducts: productId } },
      { new: true }
    ).populate('favoriteProducts', 'name price imageUrl calories isAvailable isBestSeller');

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites successfully',
      data: user.favoriteProducts
    });
  } catch (error) {
    next(error);
  }
};
