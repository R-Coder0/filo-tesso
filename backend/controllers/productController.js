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

// POST /api/products  (multipart: image + images[])
const addProduct = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const price = Number(req.body.price);
    const description = String(req.body.description || "");
    const category = String(req.body.category || "").toLowerCase().trim();
    const subcategory = String(req.body.subcategory || "").toLowerCase().trim();
    const features = normalizeFeatures(req.body.features);

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!price && price !== 0) return res.status(400).json({ message: "Price is required" });
    if (!category) return res.status(400).json({ message: "Category is required" });
    if (!subcategory) return res.status(400).json({ message: "Subcategory is required" });

    if (!req.files?.image?.length) {
      return res.status(400).json({ message: "Main image is required" });
    }

    const mainImage = `/uploads/${req.files.image[0].filename}`;
    const galleryImages = (req.files.images || []).map(file => `/uploads/${file.filename}`);

    const product = await Product.create({
      name,
      price,
      description,
      features,
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
    if (typeof body.price !== "undefined") product.price = Number(body.price);
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
