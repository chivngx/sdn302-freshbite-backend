const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    price: { type: Number, required: true, min: 0 }, // Giá base cho Size S
    sizePricing: {
      S: { type: Number, default: 0 },     // Giá gốc (+0đ)
      M: { type: Number, default: 6000 },  // Giá tăng thêm cho Size M (+6.000đ)
      L: { type: Number, default: 10000 }  // Giá tăng thêm cho Size L (+10.000đ)
    },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    calories: { type: Number, default: 150 },
    ingredients: [{ type: String }],
    isBestSeller: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
