const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    price: { type: Number, required: true, min: 0 },
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
