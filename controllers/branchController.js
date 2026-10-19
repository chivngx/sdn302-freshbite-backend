const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Order = require('../models/Order');

// Công thức Haversine tính khoảng cách giữa 2 tọa độ GPS (km)
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Làm tròn 2 chữ số thập phân
};

/**
 * @desc    Lấy danh sách các chi nhánh tại Đà Nẵng
 * @route   GET /api/branches
 * @access  Public
 * @query   district, search, isActive, userLat, userLng, sort
 */
exports.getBranches = async (req, res, next) => {
  try {
    const { district, search, isActive, userLat, userLng, sort } = req.query;

    const query = {};

    // Lọc theo trạng thái hoạt động (mặc định lấy tất cả chi nhánh đang mở trừ khi yêu cầu khác)
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Lọc theo quận tại Đà Nẵng
    if (district) {
      query.district = district;
    }

    // Tìm kiếm theo tên chi nhánh hoặc địa chỉ
    if (search && search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } }
      ];
    }

    let branchesQuery = Branch.find(query);

    // Sắp xếp
    if (sort === 'name_asc') {
      branchesQuery = branchesQuery.sort({ name: 1 });
    } else if (sort === 'name_desc') {
      branchesQuery = branchesQuery.sort({ name: -1 });
    } else {
      branchesQuery = branchesQuery.sort({ createdAt: -1 });
    }

    let branches = await branchesQuery.lean();

    // Nếu client truyền tọa độ GPS hiện tại (userLat, userLng), tính khoảng cách và sắp xếp theo gần nhất
    if (userLat && userLng) {
      const uLat = parseFloat(userLat);
      const uLng = parseFloat(userLng);

      if (!isNaN(uLat) && !isNaN(uLng)) {
        branches = branches.map((b) => ({
          ...b,
          distanceKm: calculateDistanceKm(uLat, uLng, b.latitude, b.longitude)
        }));

        // Sắp xếp theo khoảng cách tăng dần (gần nhất lên đầu)
        branches.sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }

    return res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xem chi tiết 1 chi nhánh
 * @route   GET /api/branches/:id
 * @access  Public
 */
exports.getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ!'
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi nhánh với ID đã cung cấp!'
      });
    }

    return res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo mới chi nhánh Đà Nẵng
 * @route   POST /api/branches
 * @access  Private/Admin
 */
exports.createBranch = async (req, res, next) => {
  try {
    const {
      name,
      address,
      district,
      latitude,
      longitude,
      phone,
      openingHours,
      imageUrl,
      isActive
    } = req.body;

    // Kiểm tra trùng tên chi nhánh
    const existingBranch = await Branch.findOne({ name: name.trim() });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: `Chi nhánh "${name}" đã tồn tại trong hệ thống!`
      });
    }

    const newBranch = await Branch.create({
      name: name.trim(),
      address: address.trim(),
      district,
      latitude: Number(latitude),
      longitude: Number(longitude),
      phone: phone.trim(),
      openingHours: openingHours ? openingHours.trim() : '06:30 - 22:30',
      imageUrl: imageUrl.trim(),
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo chi nhánh mới thành công!',
      data: newBranch
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin chi nhánh
 * @route   PUT /api/branches/:id
 * @access  Private/Admin
 */
exports.updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ!'
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi nhánh cần cập nhật!'
      });
    }

    const {
      name,
      address,
      district,
      latitude,
      longitude,
      phone,
      openingHours,
      imageUrl,
      isActive
    } = req.body;

    // Nếu đổi tên, kiểm tra trùng tên với chi nhánh khác
    if (name && name.trim() !== branch.name) {
      const duplicate = await Branch.findOne({
        name: name.trim(),
        _id: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Tên chi nhánh "${name}" đã được sử dụng bởi chi nhánh khác!`
        });
      }
      branch.name = name.trim();
    }

    if (address !== undefined) branch.address = address.trim();
    if (district !== undefined) branch.district = district;
    if (latitude !== undefined) branch.latitude = Number(latitude);
    if (longitude !== undefined) branch.longitude = Number(longitude);
    if (phone !== undefined) branch.phone = phone.trim();
    if (openingHours !== undefined) branch.openingHours = openingHours.trim();
    if (imageUrl !== undefined) branch.imageUrl = imageUrl.trim();
    if (isActive !== undefined) branch.isActive = Boolean(isActive);

    const updatedBranch = await branch.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin chi nhánh thành công!',
      data: updatedBranch
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa chi nhánh (Hỗ trợ kiểm tra đơn hàng liên quan để tránh mất toàn vẹn dữ liệu)
 * @route   DELETE /api/branches/:id
 * @access  Private/Admin
 */
exports.deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ!'
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi nhánh cần xóa!'
      });
    }

    // Kiểm tra xem có đơn hàng nào thuộc chi nhánh này không
    const orderCount = await Order.countDocuments({ branchId: id });
    if (orderCount > 0) {
      // Nếu có đơn hàng liên kết, không xóa cứng mà chuyển sang tạm ngưng để đảm bảo toàn vẹn dữ liệu
      branch.isActive = false;
      await branch.save();

      return res.status(200).json({
        success: true,
        message: `Chi nhánh đã có ${orderCount} đơn hàng liên kết nên đã được chuyển sang trạng thái tạm ngưng (isActive: false) thay vì xóa vĩnh viễn.`,
        data: branch
      });
    }

    await Branch.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa chi nhánh thành công!'
    });
  } catch (error) {
    next(error);
  }
};
