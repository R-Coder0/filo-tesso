const {
  PRODUCT_TAX_RATE,
  getInclusiveTaxBreakdown,
  roundCurrency,
} = require("./orderPricing");

const buildOrderItemSnapshot = (product, item, price, tax = {}) => {
  const selectedSize = String(item.selectedSize || "").trim().toUpperCase();
  const baseSku = product.sku || `FT-${product.productId || product._id}`;
  const priceAtPurchase = roundCurrency(price);
  const breakdown = getInclusiveTaxBreakdown(
    priceAtPurchase,
    tax.taxRate ?? PRODUCT_TAX_RATE
  );

  return {
    product: product._id,
    quantity: Number(item.quantity || 1),
    selectedSize,
    selectedColor: String(item.selectedColor || "").trim(),
    name: product.name,
    sku: `${baseSku}-${selectedSize || "DEFAULT"}`,
    hsn: product.hsn || "",
    weight: product.shipping?.weight,
    length: product.shipping?.length,
    breadth: product.shipping?.breadth,
    height: product.shipping?.height,
    priceAtPurchase,
    taxRate: Number(tax.taxRate ?? breakdown.taxRate),
    taxableAmount: roundCurrency(
      tax.taxableAmount ?? breakdown.taxableAmount
    ),
    taxAmount: roundCurrency(tax.taxAmount ?? breakdown.taxAmount),
  };
};

module.exports = { buildOrderItemSnapshot };
