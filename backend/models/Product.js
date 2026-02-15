const mongoose = require("mongoose");
const { CATEGORY_MAP, ALL_CATEGORIES } = require("../config/categories");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  gallery: { type: [String], default: [] },
  price: { type: Number, required: true },
  description: { type: String, default: "" },
  features: { type: [String], default: [] },

  category: {
    type: String,
    enum: ALL_CATEGORIES,
    required: true,
    lowercase: true,
    trim: true,
  },
  subcategory: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (val) {
        const cat = this.category?.toLowerCase();
        if (!cat || !val) return false;
        const allowed = CATEGORY_MAP[cat] || [];
        return allowed.includes(val.toLowerCase());
      },
      message: (props) => `Invalid subcategory "${props.value}" for category "${props.instance.category}"`,
    },
  },
  
  // ✅ YEH NAYA FIELD ADD KARO
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  // ✅ YEH NAYA FIELD ADD KARO (TIMESTAMP)
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);