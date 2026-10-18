const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Hàm escape các ký tự đặc biệt của biểu thức chính quy (RegExp)
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Lấy danh sách sản phẩm với bộ lọc & sắp xếp (public)
exports.getProducts = async (req, res, next) => {
  try {
    const { categoryId, category, search, sort, isAvailable, isBestSeller } = req.query;
    const filter = {};

    // 1. Lọc theo categoryId (nếu truyền categoryId)
    if (categoryId) {
      if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID danh mục không hợp lệ'
        });
      }
      filter.categoryId = categoryId;
    } else if (category) {
      // 2. Lọc theo code của Category (ví dụ: coffee, bakery...)
      const targetCategory = await Category.findOne({
        code: String(category).trim().toLowerCase()
      });

      if (!targetCategory) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
      filter.categoryId = targetCategory._id;
    }

    // 3. Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường, escape ký tự regex)
    if (search && search.trim()) {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: 'i'
      };
    }

    // 4. Lọc theo trạng thái có sẵn (isAvailable)
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    // 5. Lọc theo sản phẩm bán chạy (isBestSeller)
    if (isBestSeller !== undefined) {
      filter.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
    }

    // 6. Xử lý sắp xếp (mặc định: newest)
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('categoryId', 'name code icon');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết sản phẩm theo id (public)
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    const product = await Product.findById(id).populate('categoryId', 'name code icon description');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Tạo món mới (chỉ admin)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      price,
      description,
      calories,
      ingredients,
      isBestSeller,
      isAvailable
    } = req.body;

    // --- Chỗ để tích hợp middleware upload (Multer) ---
    // Ví dụ khi route sử dụng: router.post('/', verifyToken, authorize('admin'), uploadMiddleware.single('image'), createProduct);
    // Nếu có file upload từ req.file thì ưu tiên lấy đường dẫn file:
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Validation thủ công dữ liệu đầu vào
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm không được để trống'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không được để trống'
      });
    }

    if (!mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ'
      });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    if (price === undefined || price === null || price === '' || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá sản phẩm phải là số lớn hơn hoặc bằng 0'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả sản phẩm không được để trống'
      });
    }

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hình ảnh sản phẩm không được để trống'
      });
    }

    let parsedIngredients = [];
    if (Array.isArray(ingredients)) {
      parsedIngredients = ingredients.map(i => String(i).trim()).filter(Boolean);
    } else if (typeof ingredients === 'string' && ingredients.trim()) {
      parsedIngredients = ingredients.split(',').map(i => i.trim()).filter(Boolean);
    }

    const product = await Product.create({
      name: name.trim(),
      categoryId,
      price: Number(price),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      calories: calories !== undefined && !isNaN(calories) ? Number(calories) : 150,
      ingredients: parsedIngredients,
      isBestSeller: isBestSeller === true || isBestSeller === 'true',
      isAvailable: isAvailable !== undefined ? (isAvailable === true || isAvailable === 'true') : true
    });

    const populatedProduct = await Product.findById(product._id).populate('categoryId', 'name code icon');

    res.status(201).json({
      success: true,
      data: populatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật sản phẩm (chỉ admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    // --- Chỗ để tích hợp middleware upload (Multer) ---
    // Ví dụ khi route sử dụng: router.put('/:id', verifyToken, authorize('admin'), uploadMiddleware.single('image'), updateProduct);
    const updates = { ...req.body };
    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Validation các trường nếu có cập nhật
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên sản phẩm không được để trống'
        });
      }
      updates.name = updates.name.trim();
    }

    if (updates.categoryId !== undefined) {
      if (!mongoose.isValidObjectId(updates.categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'ID danh mục không hợp lệ'
        });
      }
      const categoryExists = await Category.findById(updates.categoryId);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục không tồn tại'
        });
      }
    }

    if (updates.price !== undefined) {
      if (updates.price === '' || isNaN(updates.price) || Number(updates.price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá sản phẩm phải là số lớn hơn hoặc bằng 0'
        });
      }
      updates.price = Number(updates.price);
    }

    if (updates.description !== undefined) {
      if (!updates.description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mô tả sản phẩm không được để trống'
        });
      }
      updates.description = updates.description.trim();
    }

    if (updates.imageUrl !== undefined) {
      if (!updates.imageUrl.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Hình ảnh sản phẩm không được để trống'
        });
      }
      updates.imageUrl = updates.imageUrl.trim();
    }

    if (updates.calories !== undefined) {
      if (isNaN(updates.calories) || Number(updates.calories) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Calories phải là số lớn hơn hoặc bằng 0'
        });
      }
      updates.calories = Number(updates.calories);
    }

    if (updates.ingredients !== undefined) {
      if (Array.isArray(updates.ingredients)) {
        updates.ingredients = updates.ingredients.map(i => String(i).trim()).filter(Boolean);
      } else if (typeof updates.ingredients === 'string') {
        updates.ingredients = updates.ingredients.split(',').map(i => i.trim()).filter(Boolean);
      }
    }

    if (updates.isBestSeller !== undefined) {
      updates.isBestSeller = updates.isBestSeller === true || updates.isBestSeller === 'true';
    }

    if (updates.isAvailable !== undefined) {
      updates.isAvailable = updates.isAvailable === true || updates.isAvailable === 'true';
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('categoryId', 'name code icon');

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// Xóa sản phẩm (chỉ admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công',
      data: product
    });
  } catch (error) {
    next(error);
  }
};
