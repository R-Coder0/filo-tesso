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

    // ✅ IMPORTANT (freeze price)
    priceAtPurchase: { type: Number, required: true },
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

    coinsEarned: { type: Number, default: 0 },
    coinsRedeemed: { type: Number, default: 0 },

    coinStatus: {
      type: String,
      enum: ["pending", "credited", "cancelled"],
      default: "pending",
    },

    coinCreditDate: { type: Date },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
    },

    address: {
      name: String,
      phone: String,
      email: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },

    customizationUploads: {
      image: String,
      pdf: String,
      selectedSide: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);