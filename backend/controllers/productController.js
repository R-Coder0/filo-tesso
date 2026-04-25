// controllers/productController.js
const Product = require("../models/Product");

// GET /api/products?category=men&subcategory=tshirts
const getProducts = async (req, res) => {
  try {
    const rawCat = req.query.category;
    const rawSub = req.query.subcategory;

    const category = rawCat ? String(rawCat).toLowerCase().trim() : null;
    const subcategory = rawSub ? String(rawSub).toLowerCase().trim() : null;

    const filter = {};
    if (category && category !== "all") filter.category = category;
    if (subcategory && subcategory !== "all") filter.subcategory = subcategory;

    const products = await Product
      .find(filter)
      .sort({ createdAt: -1 });   // 🔥 newest first

    res.json(products);
  } catch (err) {
    console.error("❌ Failed to fetch products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("❌ Invalid product ID:", err);
    res.status(400).json({ message: "Invalid product ID" });
  }
};

// helpers
const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return features.map(f => String(f).trim()).filter(Boolean);
  }
  return String(features || "")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);
};

const normalizeSizes = (sizes) => {
  if (Array.isArray(sizes)) {
    return sizes.map(size => String(size).trim().toUpperCase()).filter(Boolean);
  }
  return String(sizes || "")
    .split(",")
    .map(size => size.trim().toUpperCase())
    .filter(Boolean);
};

const normalizeSizeVariants = (raw, fallbackSizes = [], fallbackStock = 0) => {
  let parsed = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  }

  if (Array.isArray(parsed)) {
    const seen = new Set();
    return parsed
      .map((variant) => ({
        size: String(variant?.size || "").trim().toUpperCase(),
        stock: Math.max(0, Number(variant?.stock || 0)),
      }))
      .filter((variant) => {
        if (!variant.size || seen.has(variant.size)) return false;
        seen.add(variant.size);
        return true;
      });
  }

  return normalizeSizes(fallbackSizes).map((size) => ({
    size,
    stock: Math.max(0, Number(fallbackStock || 0)),
  }));
};

const getTotalVariantStock = (variants) =>
  variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0);

// POST /api/products  (multipart: image + images[])
const addProduct = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const originalPrice = Number(req.body.originalPrice);
    const salePrice = Number(req.body.salePrice);
    const stock = Math.max(0, Number(req.body.stock || 0));
    if (salePrice > originalPrice) {
      return res.status(400).json({
        message: "Sale price cannot be greater than original price"
      });
    }
    const description = String(req.body.description || "");
    const category = String(req.body.category || "").toLowerCase().trim();
    const subcategory = String(req.body.subcategory || "").toLowerCase().trim();
    const features = normalizeFeatures(req.body.features);
const sizeVariants = normalizeSizeVariants(req.body.sizeVariants, req.body.sizes, stock);
const sizes = sizeVariants.length ? sizeVariants.map((variant) => variant.size) : normalizeSizes(req.body.sizes);
const totalStock = sizeVariants.length ? getTotalVariantStock(sizeVariants) : stock;
const tags = req.body.tags
  ? String(req.body.tags).split(",").map(t => t.trim()).filter(Boolean)
  : [];

const metaTitle = String(req.body.metaTitle || "");
const metaDescription = String(req.body.metaDescription || "");
const keywords = req.body.keywords
  ? String(req.body.keywords).split(",").map(k => k.trim()).filter(Boolean)
  : [];
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!originalPrice && originalPrice !== 0)
      return res.status(400).json({ message: "Original price is required" });

    if (!salePrice && salePrice !== 0)
      return res.status(400).json({ message: "Sale price is required" });
    if (!category) return res.status(400).json({ message: "Category is required" });
    if (!subcategory) return res.status(400).json({ message: "Subcategory is required" });

    if (!req.files?.image?.length) {
      return res.status(400).json({ message: "Main image is required" });
    }

    const mainImage = `/uploads/${req.files.image[0].filename}`;
    const galleryImages = (req.files.images || []).map(file => `/uploads/${file.filename}`);

    const product = await Product.create({
      name,
      price: {
        original: originalPrice,
        sale: salePrice,
      },
      stock: totalStock,
      sizes,
      sizeVariants,
      description,
      features,
        tags,
  seo: {
    metaTitle,
    metaDescription,
    keywords,
  },
      image: mainImage,
      gallery: galleryImages,
      category,
      subcategory,
    });


    res.status(201).json({ message: "Product added successfully!", product });
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
};

// PUT /api/products/:id  (JSON-only or multipart, both fine)
const updateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const body = req.body;

    if (typeof body.name !== "undefined") product.name = String(body.name).trim();
    if (typeof body.originalPrice !== "undefined") {
      product.price.original = Number(body.originalPrice);
    }

    if (typeof body.salePrice !== "undefined") {
      product.price.sale = Number(body.salePrice);
    }

    if (typeof body.sizeVariants !== "undefined" || typeof body.sizes !== "undefined") {
      const nextVariants = normalizeSizeVariants(body.sizeVariants, body.sizes, body.stock ?? product.stock);
      product.sizeVariants = nextVariants;
      product.sizes = nextVariants.length ? nextVariants.map((variant) => variant.size) : normalizeSizes(body.sizes);
      product.stock = nextVariants.length ? getTotalVariantStock(nextVariants) : Number(body.stock ?? product.stock);
    } else if (typeof body.stock !== "undefined") {
      product.stock = Math.max(0, Number(body.stock));
    }
    if (typeof body.description !== "undefined") product.description = String(body.description);

    if (typeof body.features !== "undefined") {
      product.features = normalizeFeatures(body.features);
    }

    if (typeof body.category !== "undefined") {
      product.category = String(body.category).toLowerCase().trim();
    }
    if (typeof body.subcategory !== "undefined") {
      product.subcategory = String(body.subcategory).toLowerCase().trim();
    }
    if (typeof body.tags !== "undefined") {
  product.tags = String(body.tags)
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

if (typeof body.metaTitle !== "undefined") {
  product.seo.metaTitle = String(body.metaTitle);
}

if (typeof body.metaDescription !== "undefined") {
  product.seo.metaDescription = String(body.metaDescription);
}

if (typeof body.keywords !== "undefined") {
  product.seo.keywords = String(body.keywords)
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);
}

    // files if provided
    if (req.files?.image?.length) {
      product.image = `/uploads/${req.files.image[0].filename}`;
    }
    if (req.files?.images?.length) {
      product.gallery = req.files.images.map(file => `/uploads/${file.filename}`);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error("❌ Failed to update product:", err);
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete product:", err);
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};

// ✅ YEH NAYA FUNCTION ADD KARO - Latest Products
const getLatestProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // Default 10 products
    const latestProducts = await Product.find()
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit);

    res.json(latestProducts);
  } catch (err) {
    console.error("❌ Failed to fetch latest products:", err);
    res.status(500).json({ message: "Failed to fetch latest products" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getLatestProducts, // ✅ YEH ADD KARO

};
