const mongoose = require('mongoose');

// Schema đánh giá món ăn sau khi khách hoàn tất đơn hàng Pick-up
const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    isHidden: {
      // Admin có thể ẩn đánh giá vi phạm
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index hỗ trợ truy vấn đánh giá theo sản phẩm và chi nhánh
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ branchId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);

