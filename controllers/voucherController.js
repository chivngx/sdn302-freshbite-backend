/**
 * Module: Voucher Controller
 * Tác giả: Nguyễn Đắc Thịnh (Branches & Vouchers & Error Handling Lead)
 * Môn học: SDN302 - Chuẩn rubric FPT (20% Khối lượng dự án)
 * 
 * Nghiệp vụ xử lý:
 * 1. GET /api/vouchers/active - Lấy danh sách voucher đang có hiệu lực (Public)
 * 2. POST /api/vouchers/apply - Kiểm tra 4 điều kiện & tính toán tiền giảm giá server-side (Bearer Token)
 * 3. GET /api/vouchers - Quản lý danh sách voucher (Admin)
 * 4. GET /api/vouchers/:id - Xem chi tiết 1 voucher
 * 5. POST /api/vouchers - Tạo mới voucher khuyến mãi (Admin)
 * 6. PUT /api/vouchers/:id - Cập nhật thông tin voucher (Admin)
 * 7. DELETE /api/vouchers/:id - Xóa voucher khỏi hệ thống (Admin)
 */

const Voucher = require('../models/Voucher');

/**
 * @desc    Lấy danh sách các mã giảm giá đang còn hiệu lực
 * @route   GET /api/vouchers/active
 * @access  Public
 */
exports.getActiveVouchers = async (req, res, next) => {
  try {
    const now = new Date();
    const activeVouchers = await Voucher.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ minOrderAmount: 1 });

    return res.status(200).json({
      success: true,
      count: activeVouchers.length,
      data: activeVouchers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kiểm tra 4 điều kiện và tính toán số tiền giảm giá của voucher
 * @route   POST /api/vouchers/apply
 * @access  Private (hoặc Public nếu khách chưa đăng nhập muốn ướm giá)
 */
exports.applyVoucher = async (req, res, next) => {
  try {
    const code = req.body.code || req.body.voucherCode;
    const amount = Number(req.body.orderAmount !== undefined ? req.body.orderAmount : req.body.subtotal);

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giảm giá (code hoặc voucherCode)!'
      });
    }

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Tổng tiền đơn hàng (orderAmount hoặc subtotal) không hợp lệ!'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: cleanCode });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: `Mã giảm giá "${cleanCode}" không tồn tại trong hệ thống!`
      });
    }

    // Điều kiện 1: Voucher đang hoạt động
    if (!voucher.isActive) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá "${voucher.code}" hiện đã ngừng áp dụng!`
      });
    }

    // Điều kiện 2: Kiểm tra thời hạn hiệu lực (startDate - endDate)
    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá "${voucher.code}" chưa đến thời gian áp dụng!`
      });
    }

    if (voucher.endDate && now > voucher.endDate) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá "${voucher.code}" đã hết hạn sử dụng!`
      });
    }

    // Điều kiện 3: Giá trị đơn hàng tối thiểu
    if (amount < voucher.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu phải đạt ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã "${voucher.code}"!`
      });
    }

    // Điều kiện 4: Tính số tiền chiết khấu (PERCENT kèm maxDiscount hoặc FIXED)
    let discount = 0;
    if (voucher.discountType === 'PERCENT') {
      discount = Math.round(amount * (voucher.discountValue / 100));
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else {
      discount = voucher.discountValue;
    }

    // Đảm bảo tiền giảm không vượt quá tổng tiền đơn
    if (discount > amount) {
      discount = amount;
    }

    const finalAmount = Math.max(0, amount - discount);

    return res.status(200).json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      data: {
        voucher: {
          _id: voucher._id,
          code: voucher.code,
          title: voucher.title,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscount: voucher.maxDiscount,
          minOrderAmount: voucher.minOrderAmount
        },
        orderAmount: amount,
        discount,
        finalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    [Admin] Lấy danh sách toàn bộ voucher (kể cả hết hạn/tạm ngưng)
 * @route   GET /api/vouchers
 * @access  Private/Admin
 */
exports.getVouchers = async (req, res, next) => {
  try {
    const { isActive, discountType, search } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (discountType) {
      filter.discountType = discountType.toUpperCase();
    }

    if (search && search.trim()) {
      filter.$or = [
        { code: { $regex: search.trim(), $options: 'i' } },
        { title: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xem chi tiết 1 voucher theo ID
 * @route   GET /api/vouchers/:id
 * @access  Public
 */
exports.getVoucherById = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá yêu cầu!'
      });
    }

    return res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    [Admin] Tạo mới mã voucher khuyến mãi
 * @route   POST /api/vouchers
 * @access  Private/Admin
 */
exports.createVoucher = async (req, res, next) => {
  try {
    const {
      code,
      title,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      startDate,
      endDate,
      isActive
    } = req.body;

    if (!code || !title || discountValue === undefined || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: code, title, discountValue và endDate!'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Voucher.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mã giảm giá "${cleanCode}" đã tồn tại trên hệ thống!`
      });
    }

    const newVoucher = await Voucher.create({
      code: cleanCode,
      title: title.trim(),
      discountType: discountType || 'PERCENT',
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : 50000,
      minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo mã giảm giá thành công!',
      data: newVoucher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    [Admin] Cập nhật mã giảm giá
 * @route   PUT /api/vouchers/:id
 * @access  Private/Admin
 */
exports.updateVoucher = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
      const existing = await Voucher.findOne({
        code: updateData.code,
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Mã code "${updateData.code}" đã được sử dụng bởi voucher khác!`
        });
      }
    }

    const updated = await Voucher.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá cần cập nhật!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật voucher thành công!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    [Admin] Xóa mã giảm giá
 * @route   DELETE /api/vouchers/:id
 * @access  Private/Admin
 */
exports.deleteVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá cần xóa!'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Đã xóa mã giảm giá "${voucher.code}" thành công!`
    });
  } catch (error) {
    next(error);
  }
};
