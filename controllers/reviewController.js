const mongoose = require('mongoose');
const Review = require('../models/Review');

/**
 * Khách gửi đánh giá món ăn sau khi nhận đơn
 * @param {Object} req - { productId, branchId, rating, comment }
 * @param {Object} res
 * @return {Object} Đánh giá mới tạo (201)
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, branchId, rating, comment } = req.body;

    if (!productId || !branchId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: productId, branchId, rating'
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      productId,
      branchId,
      rating,
      comment: comment || ''
    });

    await review.populate('userId', 'fullName avatar');
    await review.populate('productId', 'name imageUrl');

    return res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công!',
      data: review
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Lấy danh sách đánh giá & tính sao trung bình của món ăn
 * @param {Object} req - { productId }
 * @param {Object} res
 * @return {Object} avgRating, totalReviews, danh sách đánh giá (200)
 */
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId, isHidden: false })
      .populate('userId', 'fullName avatar')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    const stats = await Review.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          isHidden: false
        }
      },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    return res.status(200).json({
      success: true,
      avgRating,
      totalReviews,
      data: reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Lấy danh sách đánh giá của chi nhánh
 * @param {Object} req - { branchId }
 * @param {Object} res
 * @return {Array} Danh sách đánh giá chi nhánh (200)
 */
exports.getReviewsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const reviews = await Review.find({ branchId, isHidden: false })
      .populate('userId', 'fullName avatar')
      .populate('productId', 'name imageUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Admin ẩn đánh giá vi phạm
 * @param {Object} req - { id }
 * @param {Object} res
 * @return {Object} Thông báo ẩn thành công (200)
 */
exports.hideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    review.isHidden = true;
    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Đã ẩn đánh giá vi phạm'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
