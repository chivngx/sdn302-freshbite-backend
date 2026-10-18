const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['coffee', 'bakery', 'tea', 'specialty'],
      lowercase: true,
      trim: true
    },
    description: { type: String },
    icon: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
