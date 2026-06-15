const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true },
    selectedSize: { type: String, default: "" },
    selectedColor: { type: String, default: "" },
  },
  { _id: false }
);

const shiprocketCheckoutSessionSchema = new mongoose.Schema(
  {
    shiprocketOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cartItems: {
      type: [checkoutItemSchema],
      required: true,
    },
    totalAmount: { type: Number, required: true },
    payableAmount: { type: Number, required: true },
    firstOrderDiscountRate: { type: Number, default: 0 },
    firstOrderDiscountAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["initiated", "completed", "failed"],
      default: "initiated",
    },
    localOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    shiprocketResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ShiprocketCheckoutSession",
  shiprocketCheckoutSessionSchema
);
