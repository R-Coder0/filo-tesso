const mongoose = require("mongoose");
const { CATEGORY_MAP, ALL_CATEGORIES } = require("../config/categories");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const objectIdToNumericId = (id) => {
  const hex = String(id || "").replace(/[^a-fA-F0-9]/g, "");
  if (!hex) return Math.floor(100000000 + Math.random() * 900000000);
  return 100000000 + (parseInt(hex.slice(-8), 16) % 900000000);
};

const isAllowedSubcategory = function (val) {
  const cat = this.category?.toLowerCase();
  if (!cat || !val) return false;
  const allowed = CATEGORY_MAP[cat] || [];
  return allowed.includes(String(val).toLowerCase().trim());
};

const productSchema = new mongoose.Schema({
  productId: {
    type: Number,
    unique: true,
    sparse: true,
    index: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  gallery: { type: [String], default: [] },
price: {
  original: { type: Number, required: true }, // MRP
  sale: { type: Number, required: true }      // Discount price
},
  sku: { type: String, trim: true, default: "" },
  hsn: { type: String, trim: true, default: "" },
  shipping: {
    weight: { type: Number, min: 0.001 },
    length: { type: Number, min: 0.5 },
    breadth: { type: Number, min: 0.5 },
    height: { type: Number, min: 0.5 },
  },
  description: { type: String, default: "" },
  details: { type: [String], default: [] },
  washCare: { type: [String], default: [] },
  features: { type: [String], default: [] },
  faqs: {
    type: [
      {
        _id: false,
        question: { type: String, required: true, trim: true, maxlength: 300 },
        answer: { type: String, required: true, trim: true, maxlength: 2000 },
      },
    ],
    default: [],
  },
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ slug: 1 }, { unique: true, sparse: true });

productSchema.pre("validate", async function ensureCatalogIdentifiers(next) {
  try {
    if (!this.productId) {
      let candidate = objectIdToNumericId(this._id);
      let exists = await this.constructor.exists({
        productId: candidate,
        _id: { $ne: this._id },
      });

      while (exists) {
        candidate = Math.floor(100000000 + Math.random() * 900000000);
        exists = await this.constructor.exists({
          productId: candidate,
          _id: { $ne: this._id },
        });
      }

      this.productId = candidate;
    }

    if (!this.slug || this.isModified("name")) {
      const baseSlug = slugify(this.slug || this.name) || `product-${this.productId}`;
      let candidateSlug = baseSlug;
      let suffix = 2;
      let exists = await this.constructor.exists({
        slug: candidateSlug,
        _id: { $ne: this._id },
      });

      while (exists) {
        candidateSlug = `${baseSlug}-${suffix}`;
        suffix += 1;
        exists = await this.constructor.exists({
          slug: candidateSlug,
          _id: { $ne: this._id },
        });
      }

      this.slug = candidateSlug;
    }

    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Product", productSchema);
