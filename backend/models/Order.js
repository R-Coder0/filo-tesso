// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, default: 1 },
    selectedSize: { type: String, default: "" },
    selectedColor: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [orderItemSchema],

    totalAmount: { type: Number, required: true },
    payableAmount: { type: Number, required: true },

    // Coins - UPDATED FIELDS
    coinsEarned: { type: Number, required: true, default: 0 },
    coinsRedeemed: { type: Number, required: true, default: 0 },
    coinStatus: { 
      type: String, 
      enum: ["pending", "credited", "cancelled"],
      default: "pending" 
    },
    coinCreditDate: { type: Date },

    // Payment status lifecycle
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // Order status for better tracking
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending"
    },

    // NEW: Cancellation fields
    cancelled: {
      type: Boolean,
      default: false
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    cancellationStatus: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'completed'],
      default: 'requested'
    },

    // Optional customization uploads (order-level)
    customizationUploads: {
      image: { type: String, default: "" },
      pdf: { type: String, default: "" },
      selectedSide: { type: String, default: "" }, // ✅ YEH LINE ADD KARO

    },

    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    returnRequested: {
      type: Boolean,
      default: false
    },
    returnReason: String,
    returnRequestedAt: Date,
    returnStatus: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'completed'],
      default: 'requested'
    },
    returnBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
  },
  
  
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);