const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // 🔑 Razorpay Fields
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },

    // 👤 User & Order Linking (VERY IMPORTANT)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // 💰 Pricing Breakdown
    totalAmount: {
      type: Number,
      required: true, // full cart amount
    },

    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    payableAmount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // 📊 Payment Status
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },

    // 🧾 Optional metadata (future use)
    receipt: String,

  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
