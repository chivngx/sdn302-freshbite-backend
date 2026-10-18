const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Lấy danh sách tất cả danh mục (public)
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết danh mục theo id (public)
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// Tạo mới danh mục (chỉ admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, code, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống'
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã danh mục không được để trống'
      });
    }

    const validCodes = ['coffee', 'bakery', 'tea', 'specialty'];
    const normalizedCode = code.trim().toLowerCase();

    if (!validCodes.includes(normalizedCode)) {
      return res.status(400).json({
        success: false,
        message: `Mã danh mục không hợp lệ. Chỉ chấp nhận: ${validCodes.join(', ')}`
      });
    }

    // Kiểm tra tên trùng lặp (không phân biệt hoa thường)
    const existingName = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại'
      });
    }

    // Kiểm tra mã danh mục trùng lặp
    const existingCode = await Category.findOne({ code: normalizedCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Mã danh mục đã tồn tại'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      code: normalizedCode,
      description: description ? description.trim() : undefined,
      icon: icon ? icon.trim() : undefined
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = error.keyPattern?.name ? 'Tên danh mục' : error.keyPattern?.code ? 'Mã danh mục' : 'Dữ liệu';
      return res.status(400).json({
        success: false,
        message: `${field} đã tồn tại`
      });
    }
    next(error);
  }
};

// Cập nhật danh mục (chỉ admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    const { name, code, description, icon } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục không được để trống'
        });
      }

      const existingName = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại'
        });
      }

      updates.name = name.trim();
    }

    if (code !== undefined) {
      const validCodes = ['coffee', 'bakery', 'tea', 'specialty'];
      const normalizedCode = code.trim().toLowerCase();

      if (!validCodes.includes(normalizedCode)) {
        return res.status(400).json({
          success: false,
          message: `Mã danh mục không hợp lệ. Chỉ chấp nhận: ${validCodes.join(', ')}`
        });
      }

      const existingCode = await Category.findOne({
        code: normalizedCode,
        _id: { $ne: id }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã danh mục đã tồn tại'
        });
      }

      updates.code = normalizedCode;
    }

    if (description !== undefined) updates.description = description ? description.trim() : '';
    if (icon !== undefined) updates.icon = icon ? icon.trim() : '';

    const updatedCategory = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = error.keyPattern?.name ? 'Tên danh mục' : error.keyPattern?.code ? 'Mã danh mục' : 'Dữ liệu';
      return res.status(400).json({
        success: false,
        message: `${field} đã tồn tại`
      });
    }
    next(error);
  }
};

// Xóa danh mục (chỉ admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Kiểm tra nếu còn product thuộc category đó thì từ chối (400)
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục vì vẫn còn ${productCount} sản phẩm thuộc danh mục này`
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công',
      data: category
    });
  } catch (error) {
    next(error);
  }
};
