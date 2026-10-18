const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    openingHours: { type: String, default: '07:00 - 22:00' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);
