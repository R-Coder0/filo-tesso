const mongoose = require("mongoose");
const { CATEGORY_MAP, ALL_CATEGORIES } = require("../config/categories");

const isAllowedSubcategory = function (val) {
  const cat = this.category?.toLowerCase();
  if (!cat || !val) return false;
  const allowed = CATEGORY_MAP[cat] || [];
  return allowed.includes(String(val).toLowerCase().trim());
};

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  gallery: { type: [String], default: [] },
price: {
  original: { type: Number, required: true }, // MRP
  sale: { type: Number, required: true }      // Discount price
},
  description: { type: String, default: "" },
  details: { type: [String], default: [] },
  washCare: { type: [String], default: [] },
  features: { type: [String], default: [] },
  sizes: {
    type: [String],
    default: [],
  },
  sizeVariants: {
    type: [
      {
        size: { type: String, required: true, trim: true, uppercase: true },
        stock: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  },
stock: {
  type: Number,
  default: 0,
  min: 0
},
tags: {
  type: [String],
  default: [],
},

seo: {
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  keywords: { type: [String], default: [] },
},
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
      validator: isAllowedSubcategory,
      message: (props) => `Invalid subcategory "${props.value}" for category "${props.instance.category}"`,
    },
  },
  subcategories: {
    type: [{ type: String, lowercase: true, trim: true }],
    default: [],
    validate: {
      validator: function (values) {
        if (!Array.isArray(values) || values.length === 0) return true;
        return values.every((value) => isAllowedSubcategory.call(this, value));
      },
      message: (props) => `Invalid subcategories for category "${props.instance.category}"`,
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
