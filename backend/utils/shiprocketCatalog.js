const objectIdToNumericId = (id) => {
  const hex = String(id || "").replace(/[^a-fA-F0-9]/g, "");
  if (!hex) return Math.floor(100000000 + Math.random() * 900000000);
  return 100000000 + (parseInt(hex.slice(-8), 16) % 900000000);
};

const getProductNumericId = (product) =>
  Number(product?.productId) || objectIdToNumericId(product?._id);

const getCatalogVariants = (product) => {
  const sizeVariants = Array.isArray(product?.sizeVariants)
    ? product.sizeVariants
    : [];
  const fallbackSizes = Array.isArray(product?.sizes) ? product.sizes : [];

  if (sizeVariants.length) return sizeVariants;
  if (fallbackSizes.length) {
    return fallbackSizes.map((size) => ({
      size,
      stock: product?.stock || 0,
    }));
  }

  return [{ size: "", stock: product?.stock || 0 }];
};

const getVariantNumericId = (product, index) => {
  const base = getProductNumericId(product);
  if (Number(product?.productId)) {
    return Number(`${String(base).slice(0, 8)}${index + 1}`);
  }
  return Number(`${base}${String(index + 1).padStart(2, "0")}`);
};

const getSelectedVariant = (product, selectedSize) => {
  const normalizedSize = String(selectedSize || "").trim().toUpperCase();
  const variants = getCatalogVariants(product);
  const index = normalizedSize
    ? variants.findIndex(
        (variant) =>
          String(variant?.size || "").trim().toUpperCase() === normalizedSize
      )
    : 0;

  if (index < 0) return null;

  return {
    index,
    variant: variants[index],
    variantId: getVariantNumericId(product, index),
  };
};

module.exports = {
  getCatalogVariants,
  getProductNumericId,
  getSelectedVariant,
  getVariantNumericId,
};
