// controllers/productController.js
const Product = require("../models/Product");
const { CATEGORY_MAP, ALL_CATEGORIES } = require("../config/categories");

const BRAND_VENDOR = "Filo Teso";
const DEFAULT_COLLECTION_IMAGE = "/uploads/products/productone.jpg";
const COLLECTION_TIMESTAMP = new Date("2024-01-01T00:00:00.000Z");

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

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (value) =>
  String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const objectIdToNumericId = (id) => {
  const hex = String(id || "").replace(/[^a-fA-F0-9]/g, "");
  if (!hex) return Math.floor(100000000 + Math.random() * 900000000);
  return 100000000 + (parseInt(hex.slice(-8), 16) % 900000000);
};

const getProductNumericId = (product) =>
  Number(product?.productId) || objectIdToNumericId(product?._id);

const getProductSlug = (product) =>
  product?.slug || slugify(product?.name) || `product-${getProductNumericId(product)}`;

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

  if (!ALL_CATEGORIES.includes(category)) {
    return emptyFilter();
  }

  return {
    ...(subcategoryValues
      ? withCategoryAndSubcategory(category, subcategoryValues)
      : { category }),
  };
};

const getAssetBaseUrl = (req) => {
  const configured = process.env.PUBLIC_API_URL || process.env.BASE_URL;
  if (configured) return String(configured).replace(/\/+$/, "");

  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host");
  return host ? `${proto}://${host}` : "";
};

const toAbsoluteUrl = (req, value) => {
  if (!value) return "";
  const src = String(value);
  if (/^https?:\/\//i.test(src)) return src;
  const normalized = src.startsWith("/") ? src : `/${src}`;
  return `${getAssetBaseUrl(req)}${normalized}`;
};

const formatMoney = (value) => Number(value || 0).toFixed(2);

const getPagination = (req, defaultLimit = 50) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
};

const toIsoDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const getProductSubcategories = (product) => {
  if (Array.isArray(product?.subcategories) && product.subcategories.length) {
    return product.subcategories;
  }
  return product?.subcategory ? [product.subcategory] : [];
};

const getProductType = (product) => {
  const [primarySubcategory] = getProductSubcategories(product);
  return primarySubcategory ? titleCase(primarySubcategory) : titleCase(product?.category);
};

const getProductTags = (product) =>
  Array.isArray(product?.tags) ? product.tags.filter(Boolean).join(", ") : "";

const getProductBodyHtml = (product) => {
  const description = product?.description || "";
  if (/<[a-z][\s\S]*>/i.test(description)) return description;
  return description ? `<p>${escapeHtml(description)}</p>` : "";
};

const getVariantNumericId = (product, index) => {
  const base = getProductNumericId(product);
  return Number(`${String(base).slice(0, 8)}${index + 1}`);
};

const toShiprocketVariant = (req, product, variant, index) => {
  const size = String(variant?.size || "").trim();
  const optionValues = {};
  if (size) optionValues.Size = size;
  const weight = Number(product?.shipping?.weight || 0.5);
  const baseSku = product?.sku || `FT-${getProductNumericId(product)}`;

  return {
    id: getVariantNumericId(product, index),
    title: size || "Default",
    price: formatMoney(product?.price?.sale),
    compare_at_price: formatMoney(product?.price?.original),
    sku: `${baseSku}-${size || "DEFAULT"}`,
    quantity: Math.max(0, Number(variant?.stock ?? product?.stock ?? 0)),
    created_at: toIsoDate(product?.createdAt),
    updated_at: toIsoDate(product?.updatedAt || product?.createdAt),
    taxable: true,
    option_values: optionValues,
    grams: Math.round(weight * 1000),
    image: {
      src: toAbsoluteUrl(req, product?.image),
    },
    weight,
    weight_unit: "kg",
    hsn: product?.hsn || "",
    length: Number(product?.shipping?.length || 10),
    breadth: Number(product?.shipping?.breadth || 10),
    height: Number(product?.shipping?.height || 2),
  };
};

const toShiprocketProduct = (req, product) => {
  const sizeVariants = Array.isArray(product?.sizeVariants) ? product.sizeVariants : [];
  const fallbackSizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const variants = sizeVariants.length
    ? sizeVariants
    : fallbackSizes.length
      ? fallbackSizes.map((size) => ({ size, stock: product?.stock || 0 }))
      : [{ size: "", stock: product?.stock || 0 }];

  const optionValues = variants
    .map((variant) => String(variant?.size || "").trim())
    .filter(Boolean);

  return {
    id: getProductNumericId(product),
    title: product?.name || "",
    body_html: getProductBodyHtml(product),
    vendor: BRAND_VENDOR,
    product_type: getProductType(product),
    created_at: toIsoDate(product?.createdAt),
    handle: getProductSlug(product),
    updated_at: toIsoDate(product?.updatedAt || product?.createdAt),
    tags: getProductTags(product),
    status: "active",
    variants: variants.map((variant, index) => toShiprocketVariant(req, product, variant, index)),
    image: {
      src: toAbsoluteUrl(req, product?.image),
    },
    options: optionValues.length
      ? [
          {
            name: "Size",
            values: [...new Set(optionValues)],
          },
        ]
      : [],
  };
};

const collectionIdFromHandle = (handle) => {
  const normalized = slugify(handle);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return 100000000 + (hash % 900000000);
};

const collectionToResponse = (req, collection) => ({
  id: collection.id,
  updated_at: toIsoDate(collection.updatedAt),
  body_html: `<p>${escapeHtml(collection.description)}</p>`,
  handle: collection.handle,
  image: {
    src: toAbsoluteUrl(req, collection.image || DEFAULT_COLLECTION_IMAGE),
  },
  title: collection.title,
  created_at: toIsoDate(collection.createdAt),
});

const buildCollections = () => {
  return ALL_CATEGORIES.flatMap((category) => {
    const categoryCollection = {
      id: collectionIdFromHandle(category),
      category,
      subcategory: null,
      handle: category,
      title: titleCase(category),
      description: `${titleCase(category)} collection`,
      image: DEFAULT_COLLECTION_IMAGE,
      createdAt: COLLECTION_TIMESTAMP,
      updatedAt: COLLECTION_TIMESTAMP,
    };

    const subcategoryCollections = (CATEGORY_MAP[category] || []).map((subcategory) => {
      const handle = `${category}-${subcategory}`;
      return {
        id: collectionIdFromHandle(handle),
        category,
        subcategory,
        handle,
        title: `${titleCase(category)} ${titleCase(subcategory)}`,
        description: `${titleCase(category)} ${titleCase(subcategory)} collection`,
        image: DEFAULT_COLLECTION_IMAGE,
        createdAt: COLLECTION_TIMESTAMP,
        updatedAt: COLLECTION_TIMESTAMP,
      };
    });

    return [categoryCollection, ...subcategoryCollections];
  });
};

const findCollection = (identifier) => {
  if (!identifier) return null;
  const normalized = slugify(identifier);
  const numericId = Number(identifier);

  return buildCollections().find(
    (collection) =>
      collection.handle === normalized ||
      collection.id === numericId ||
      `${collection.id}` === `${identifier}`
  );
};

const productListResponse = (products, pagination = {}) => ({
  data: {
    total: pagination.total ?? products.length,
    page: pagination.page ?? 1,
    limit: pagination.limit ?? products.length,
    total_pages: pagination.limit
      ? Math.ceil((pagination.total ?? products.length) / pagination.limit)
      : 1,
    products,
  },
});

const toAppProduct = (product) => {
  const plain =
    typeof product?.toObject === "function"
      ? product.toObject({ virtuals: false })
      : { ...product };
  const numericId = getProductNumericId(plain);
  const slug = getProductSlug(plain);

  return {
    ...plain,
    id: numericId,
    productId: numericId,
    slug,
    handle: slug,
  };
};

// GET /api/products?category=men&subcategory=tshirts
const getProducts = async (req, res) => {
  try {
    const rawCat = req.query.category;
    const rawSub = req.query.subcategory;
    const rawSearch = req.query.q || req.query.search;
    const paginationRequested =
      req.query.page !== undefined || req.query.limit !== undefined;

    const category = rawCat ? String(rawCat).toLowerCase().trim() : null;
    const subcategory = rawSub ? String(rawSub).toLowerCase().trim() : null;
    const search = rawSearch ? String(rawSearch).trim() : "";

    const filter = buildProductFilter(category, subcategory);
    const finalFilter = search
      ? {
          $and: [
            filter,
            {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
              ],
            },
          ],
        }
      : filter;

    if (paginationRequested) {
      const { page, limit, skip } = getPagination(req, 20);
      const [products, total] = await Promise.all([
        Product.find(finalFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments(finalFilter),
      ]);

      const mappedProducts =
        String(req.query.format || "").toLowerCase() === "shiprocket"
          ? products.map((product) => toShiprocketProduct(req, product))
          : products.map(toAppProduct);

      return res.json(
        productListResponse(mappedProducts, { total, page, limit })
      );
    }

    const products = await Product
      .find(finalFilter)
      .sort({ createdAt: -1 });   // 🔥 newest first

    if (String(req.query.format || "").toLowerCase() === "shiprocket") {
      return res.json(productListResponse(products.map((product) => toShiprocketProduct(req, product))));
    }

    res.json(products.map(toAppProduct));
  } catch (err) {
    console.error("❌ Failed to fetch products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const identifier = String(req.params.id || "").trim();
    const lookup = /^[a-f\d]{24}$/i.test(identifier)
      ? { _id: identifier }
      : /^\d+$/.test(identifier)
        ? { productId: Number(identifier) }
        : { slug: slugify(identifier) };

    const product = await Product.findOne(lookup);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(toAppProduct(product));
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

const optionalPositiveNumber = (value, minimum) => {
  if (typeof value === "undefined" || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : undefined;
};

const getShippingInput = (body) => ({
  weight: optionalPositiveNumber(body.weight ?? body.shippingWeight, 0.001),
  length: optionalPositiveNumber(body.length ?? body.shippingLength, 0.5),
  breadth: optionalPositiveNumber(body.breadth ?? body.shippingBreadth, 0.5),
  height: optionalPositiveNumber(body.height ?? body.shippingHeight, 0.5),
});

const getUploadedFiles = (files, fieldNames) =>
  fieldNames.flatMap((fieldName) => files?.[fieldName] || []);

const parseStringList = (raw) => {
  if (typeof raw === "undefined" || raw === null) return undefined;
  if (Array.isArray(raw)) return raw.map((item) => String(item).trim()).filter(Boolean);

  const value = String(raw).trim();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated parsing below.
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const normalizeGalleryInput = (raw) => {
  const values = parseStringList(raw);
  if (typeof values === "undefined") return undefined;

  return values.filter((item) => item.startsWith("/uploads/") || /^https?:\/\//i.test(item));
};

const MAX_PRODUCT_GALLERY_IMAGES = 10;

const normalizeImageReference = (raw) => {
  const [image] = normalizeGalleryInput(raw) || [];
  return image || "";
};

const parseGalleryOrder = (raw) => {
  if (!raw) return null;

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const buildOrderedGallery = ({ existingImages = [], uploadedImages = [], rawOrder }) => {
  const normalizedExisting = normalizeGalleryInput(existingImages) || [];
  const order = parseGalleryOrder(rawOrder);

  if (!order) {
    return [...normalizedExisting, ...uploadedImages].slice(
      0,
      MAX_PRODUCT_GALLERY_IMAGES
    );
  }

  const allowedExisting = new Set(normalizedExisting);
  const orderedImages = [];
  const addUniqueImage = (image) => {
    if (
      image &&
      orderedImages.length < MAX_PRODUCT_GALLERY_IMAGES &&
      !orderedImages.includes(image)
    ) {
      orderedImages.push(image);
    }
  };

  order.forEach((item) => {
    if (item?.type === "existing") {
      const image = normalizeImageReference(item.value);
      if (allowedExisting.has(image)) addUniqueImage(image);
      return;
    }

    if (item?.type === "new") {
      const index = Number(item.index);
      if (Number.isInteger(index) && index >= 0) {
        addUniqueImage(uploadedImages[index]);
      }
    }
  });

  normalizedExisting.forEach(addUniqueImage);
  uploadedImages.forEach(addUniqueImage);
  return orderedImages;
};

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
    const sku = String(req.body.sku || "").trim();
    const hsn = String(req.body.hsn || "").trim();
    const shipping = getShippingInput(req.body);
    const category = String(req.body.category || "").toLowerCase().trim();
    const slug = slugify(req.body.slug || req.body.handle || name);
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
    const existingMainImage = normalizeImageReference(req.body.existingMainImage);

    if (!mainImageFile && !existingMainImage) {
      return res.status(400).json({ message: "Main image is required" });
    }

    const mainImage = mainImageFile
      ? `/uploads/${mainImageFile.filename}`
      : existingMainImage;
    const galleryImages = buildOrderedGallery({
      existingImages: req.body.existingGallery,
      uploadedImages: galleryFiles.map(file => `/uploads/${file.filename}`),
      rawOrder: req.body.galleryOrder,
    });

    const product = await Product.create({
      name,
      price: {
        original: originalPrice,
        sale: salePrice,
      },
      sku,
      hsn,
      shipping,
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
      slug,
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
    if (typeof body.slug !== "undefined" || typeof body.handle !== "undefined") {
      product.slug = slugify(body.slug || body.handle || product.name);
    }
    if (typeof body.originalPrice !== "undefined") {
      product.price.original = Number(body.originalPrice);
    }

    if (typeof body.salePrice !== "undefined") {
      product.price.sale = Number(body.salePrice);
    }

    if (typeof body.sku !== "undefined") product.sku = String(body.sku).trim();
    if (typeof body.hsn !== "undefined") product.hsn = String(body.hsn).trim();
    const shippingInput = getShippingInput(body);
    for (const [field, value] of Object.entries(shippingInput)) {
      if (typeof value !== "undefined") product.set(`shipping.${field}`, value);
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
    if (
      typeof body.existingGallery !== "undefined" ||
      typeof body.galleryOrder !== "undefined" ||
      galleryFiles.length
    ) {
      product.gallery = buildOrderedGallery({
        existingImages:
          typeof body.existingGallery !== "undefined"
            ? body.existingGallery
            : product.gallery,
        uploadedImages: galleryFiles.map(file => `/uploads/${file.filename}`),
        rawOrder: body.galleryOrder,
      });
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

    if (String(req.query.format || "").toLowerCase() === "shiprocket") {
      return res.json(productListResponse(latestProducts.map((product) => toShiprocketProduct(req, product))));
    }

    res.json(latestProducts.map(toAppProduct));
  } catch (err) {
    console.error("❌ Failed to fetch latest products:", err);
    res.status(500).json({ message: "Failed to fetch latest products" });
  }
};

const getShiprocketProducts = async (req, res) => {
  try {
    const rawCat = req.query.category;
    const rawSub = req.query.subcategory;
    const category = rawCat ? String(rawCat).toLowerCase().trim() : null;
    const subcategory = rawSub ? String(rawSub).toLowerCase().trim() : null;
    const filter = buildProductFilter(category, subcategory);
    const { page, limit, skip } = getPagination(req);

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json(
      productListResponse(
        products.map((product) => toShiprocketProduct(req, product)),
        { total, page, limit }
      )
    );
  } catch (err) {
    console.error("❌ Failed to fetch Shiprocket products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

const getShiprocketCollections = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req, 100);
    const allCollections = buildCollections();
    const collections = allCollections
      .slice(skip, skip + limit)
      .map((collection) => collectionToResponse(req, collection));

    res.json({
      data: {
        total: allCollections.length,
        page,
        limit,
        total_pages: Math.ceil(allCollections.length / limit),
        collections,
      },
    });
  } catch (err) {
    console.error("❌ Failed to fetch Shiprocket collections:", err);
    res.status(500).json({ message: "Failed to fetch collections" });
  }
};

const getShiprocketProductsByCollection = async (req, res) => {
  try {
    const identifier =
      req.params.collection ||
      req.params.collectionId ||
      req.query.collection_id ||
      req.query.collectionId ||
      req.query.collection_handle ||
      req.query.handle;

    const collection = findCollection(identifier);
    if (!collection) {
      return res.json(productListResponse([]));
    }

    const filter = buildProductFilter(collection.category, collection.subcategory || null);
    const { page, limit, skip } = getPagination(req);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json(
      productListResponse(
        products.map((product) => toShiprocketProduct(req, product)),
        { total, page, limit }
      )
    );
  } catch (err) {
    console.error("❌ Failed to fetch Shiprocket collection products:", err);
    res.status(500).json({ message: "Failed to fetch products by collection" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getLatestProducts, // ✅ YEH ADD KARO
  getShiprocketProducts,
  getShiprocketCollections,
  getShiprocketProductsByCollection,

};
