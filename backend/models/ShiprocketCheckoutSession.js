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
    // Optional for compatibility with checkout sessions created before price
    // snapshots were introduced.
    originalPrice: { type: Number },
    priceAtCheckout: { type: Number },
    taxRate: { type: Number },
    taxAmount: { type: Number },
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
    taxAmount: { type: Number, required: true, default: 0 },
    payableAmount: { type: Number, required: true },
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
