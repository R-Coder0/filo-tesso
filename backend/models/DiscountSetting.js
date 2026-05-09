const mongoose = require("mongoose");

const discountSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "firstOrder" },
    enabled: { type: Boolean, default: true },
    percentage: {
      type: Number,
      enum: [10, 15, 20],
      default: 15,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountSetting", discountSettingSchema);
