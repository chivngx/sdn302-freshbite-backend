const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  sugarLevel: {
    type: String,
    enum: ['100%', '70%', '50%', '0%'],
    default: '100%'
  },
  iceLevel: {
    type: String,
    enum: ['100%', '50%', 'Nóng'],
    default: '100%'
  },
  note: { type: String }
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    pickupTime: {
      type: String,
      required: true,
      enum: ['15_MINS', '30_MINS', '45_MINS', 'CUSTOM']
    },
    status: {
      type: String,
      enum: ['Received', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'],
      default: 'Received'
    },
    paymentMethod: {
      type: String,
      enum: ['CASH_AT_COUNTER', 'MOCK_MOMO', 'PAYOS'],
      default: 'CASH_AT_COUNTER'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
