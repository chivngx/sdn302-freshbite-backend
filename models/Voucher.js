const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FIXED'],
      default: 'PERCENT'
    },
    discountValue: {
      type: Number,
      required: true
    }, // % giảm hoặc số tiền cố định
    maxDiscount: {
      type: Number,
      default: 50000
    }, // Mức giảm tối đa
    minOrderAmount: {
      type: Number,
      default: 0
    }, // Đơn hàng tối thiểu để áp dụng
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Voucher', voucherSchema);

