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

    name: { type: String, default: "" },
    sku: { type: String, default: "" },
    hsn: { type: String, default: "" },
    weight: { type: Number },
    length: { type: Number },
    breadth: { type: Number },
    height: { type: Number },

    // Freeze values needed for invoices and shipping retries.
    priceAtPurchase: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [orderItemSchema],

    totalAmount: { type: Number, required: true },
    payableAmount: { type: Number, required: true },

    firstOrderDiscountRate: { type: Number, default: 0 },
    firstOrderDiscountAmount: { type: Number, default: 0 },

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

    paymentMethod: {
      type: String,
      enum: ["COD", "Prepaid"],
      required: true,
      default: "COD",
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
      country: { type: String, default: "India" },
    },

    shiprocket: {
      syncStatus: {
        type: String,
        enum: ["not_started", "pending", "synced", "failed"],
        default: "not_started",
      },
      orderId: { type: String, default: "" },
      shipmentId: { type: String, default: "" },
      status: { type: String, default: "" },
      statusCode: Number,
      awbCode: { type: String, default: "" },
      courierCompanyId: { type: String, default: "" },
      courierName: { type: String, default: "" },
      labelUrl: { type: String, default: "" },
      trackingUrl: { type: String, default: "" },
      lastError: { type: String, default: "" },
      lastAttemptAt: Date,
      lastTrackedAt: Date,
      syncedAt: Date,
      response: mongoose.Schema.Types.Mixed,
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
