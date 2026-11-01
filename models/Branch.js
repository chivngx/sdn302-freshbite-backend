const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên chi nhánh là bắt buộc'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ chi nhánh là bắt buộc'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'Quận/huyện là bắt buộc'],
      enum: {
        values: ['Ngũ Hành Sơn', 'Hải Châu', 'Sơn Trà', 'Thanh Khê'],
        message: 'Quận phải thuộc 1 trong 4 quận: Ngũ Hành Sơn, Hải Châu, Sơn Trà, Thanh Khê'
      }
    },
    latitude: {
      type: Number,
      required: [true, 'Vĩ độ (latitude) là bắt buộc']
    },
    longitude: {
      type: Number,
      required: [true, 'Kinh độ (longitude) là bắt buộc']
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại chi nhánh là bắt buộc'],
      trim: true
    },
    openingHours: {
      type: String,
      default: '06:30 - 22:30'
    },
    imageUrl: {
      type: String,
      required: [true, 'Ảnh chi nhánh là bắt buộc']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual location property hỗ trợ tương thích nếu gọi location.latitude/longitude
branchSchema.virtual('location').get(function () {
  return {
    latitude: this.latitude,
    longitude: this.longitude
  };
});

module.exports = mongoose.model('Branch', branchSchema);
