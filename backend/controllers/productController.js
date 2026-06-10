// controllers/productController.js
const Product = require("../models/Product");
const { CATEGORY_MAP, MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES } = require("../config/categories");

const movedCustomizeTshirtSet = new Set(MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES);

const SUBCATEGORY_ALIASES = {
  "co-ord-set": ["co-ord-set", "co-ord set"],
  "co-ord set": ["co-ord-set", "co-ord set"],
  "oversize-shirt": ["oversize-shirt", "plus-shirt", "plus-size"],
  "plus-shirt": ["oversize-shirt", "plus-shirt", "plus-size"],
  "plus-size": ["oversize-shirt", "plus-shirt", "plus-size"],
  sneakers: ["sneakers", "shoes"],
  shoes: ["sneakers", "shoes"],
  perfume: ["perfume", "perfumes"],
  perfumes: ["perfume", "perfumes"],
};

const getSubcategoryValues = (subcategory) =>
  SUBCATEGORY_ALIASES[subcategory] || [subcategory];

const canonicalizeSubcategory = (subcategory) => {
  const normalized = String(subcategory || "").toLowerCase().trim();
  return SUBCATEGORY_ALIASES[normalized]?.[0] || normalized;
};

const buildSubcategoryMatch = (subcategoryValues) => ({
  $or: [
    { subcategory: { $in: subcategoryValues } },
    { subcategories: { $in: subcategoryValues } },
  ],
});

const withCategoryAndSubcategory = (category, subcategoryValues) => ({
  $and: [{ category }, buildSubcategoryMatch(subcategoryValues)],
});

const emptyFilter = () => ({ _id: { $exists: false } });

const buildProductFilter = (category, subcategory) => {
  const hasCategory = category && category !== "all";
  const hasSubcategory = subcategory && subcategory !== "all";
  const subcategoryValues = hasSubcategory ? getSubcategoryValues(subcategory) : null;

  if (!hasCategory) {
    return hasSubcategory ? buildSubcategoryMatch(subcategoryValues) : {};
  }

  if (category === "customize") {
    if (subcategoryValues?.some((value) => movedCustomizeTshirtSet.has(value))) {
      return emptyFilter();
    }

    return {
      category,
      ...(subcategoryValues
        ? buildSubcategoryMatch(subcategoryValues)
        : {
            subcategory: { $nin: MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES },
            subcategories: { $nin: MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES },
          }),
    };
  }

  if (category === "men" || category === "women") {
    if (!subcategoryValues) {
      return {
        $or: [
          { category },
          {
            category: "customize",
            ...buildSubcategoryMatch(MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES),
          },
        ],
      };
    }

    if (movedCustomizeTshirtSet.has(subcategory)) {
      return {
        $or: [
          withCategoryAndSubcategory(category, subcategoryValues),
          withCategoryAndSubcategory("customize", subcategoryValues),
        ],
      };
    }
  }

  return {
    ...(subcategoryValues
      ? withCategoryAndSubcategory(category, subcategoryValues)
      : { category }),
  };
};

// GET /api/products?category=men&subcategory=tshirts
const getProducts = async (req, res) => {
  try {
    const rawCat = req.query.category;
    const rawSub = req.query.subcategory;

    const category = rawCat ? String(rawCat).toLowerCase().trim() : null;
    const subcategory = rawSub ? String(rawSub).toLowerCase().trim() : null;

    const filter = buildProductFilter(category, subcategory);

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
const normalizeDetails = (details) => {
  if (Array.isArray(details)) {
    return details.map(detail => String(detail).trim()).filter(Boolean);
  }
  return String(details || "")
    .split(",")
    .map(detail => detail.trim())
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

const parseSubcategoryInput = (raw) => {
  if (typeof raw === "undefined" || raw === null) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall back to comma-separated parsing below.
    }
  }

  return String(raw).split(",");
};

const normalizeSubcategories = (raw, fallback) => {
  const selected = parseSubcategoryInput(raw);
  const source = selected.length ? selected : parseSubcategoryInput(fallback);
  const seen = new Set();

  return source
    .map(canonicalizeSubcategory)
    .filter((subcategory) => {
      if (!subcategory || seen.has(subcategory)) return false;
      seen.add(subcategory);
      return true;
    });
};

const getInvalidSubcategories = (category, subcategories) => {
  const allowed = CATEGORY_MAP[category] || [];
  return subcategories.filter((subcategory) => !allowed.includes(subcategory));
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

const getUploadedFiles = (files, fieldNames) =>
  fieldNames.flatMap((fieldName) => files?.[fieldName] || []);

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
    const subcategories = normalizeSubcategories(req.body.subcategories, req.body.subcategory);
    const subcategory = subcategories[0] || "";
    const details = normalizeDetails(
      typeof req.body.details !== "undefined" ? req.body.details : req.body.features
    );
    const washCare = normalizeDetails(req.body.washCare);
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
    if (!subcategories.length) return res.status(400).json({ message: "Select at least one subcategory" });

    const invalidSubcategories = getInvalidSubcategories(category, subcategories);
    if (invalidSubcategories.length) {
      return res.status(400).json({
        message: `Invalid subcategories for ${category}: ${invalidSubcategories.join(", ")}`,
      });
    }

    const mainImageFile = getUploadedFiles(req.files, ["image", "mainImage"])[0];
    const galleryFiles = getUploadedFiles(req.files, [
      "images",
      "images[]",
      "gallery",
      "galleryImages",
    ]);

    if (!mainImageFile) {
      return res.status(400).json({ message: "Main image is required" });
    }

    const mainImage = `/uploads/${mainImageFile.filename}`;
    const galleryImages = galleryFiles.map(file => `/uploads/${file.filename}`);

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
      details,
      washCare,
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
      subcategories,
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

    if (typeof body.details !== "undefined") {
      product.details = normalizeDetails(body.details);
    } else if (typeof body.features !== "undefined") {
      product.details = normalizeDetails(body.features);
    }

    if (typeof body.washCare !== "undefined") {
      product.washCare = normalizeDetails(body.washCare);
    }

    if (typeof body.category !== "undefined") {
      product.category = String(body.category).toLowerCase().trim();
    }

    if (typeof body.subcategories !== "undefined" || typeof body.subcategory !== "undefined") {
      const subcategories = normalizeSubcategories(body.subcategories, body.subcategory);
      if (!subcategories.length) {
        return res.status(400).json({ message: "Select at least one subcategory" });
      }

      const invalidSubcategories = getInvalidSubcategories(product.category, subcategories);
      if (invalidSubcategories.length) {
        return res.status(400).json({
          message: `Invalid subcategories for ${product.category}: ${invalidSubcategories.join(", ")}`,
        });
      }

      product.subcategory = subcategories[0];
      product.subcategories = subcategories;
    } else if (!product.subcategories?.length && product.subcategory) {
      product.subcategories = [product.subcategory];
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
    const mainImageFile = getUploadedFiles(req.files, ["image", "mainImage"])[0];
    const galleryFiles = getUploadedFiles(req.files, [
      "images",
      "images[]",
      "gallery",
      "galleryImages",
    ]);

    if (mainImageFile) {
      product.image = `/uploads/${mainImageFile.filename}`;
    }
    if (galleryFiles.length) {
      product.gallery = galleryFiles.map(file => `/uploads/${file.filename}`);
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
