const PRODUCT_TAX_RATE = 5;

const roundCurrency = (value) =>
  Number((Number.isFinite(Number(value)) ? Number(value) : 0).toFixed(2));

const calculateTaxAmount = (amount, taxRate = PRODUCT_TAX_RATE) =>
  roundCurrency((roundCurrency(amount) * Number(taxRate || 0)) / 100);

const normalizeQuantity = (value) => {
  const quantity = Number(value ?? 1);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
};

const getProductUnitPrices = (product) => {
  const salePrice = roundCurrency(product?.price?.sale);
  const originalPrice = roundCurrency(product?.price?.original ?? salePrice);
  const taxAmount = calculateTaxAmount(salePrice);
  const normalizedOriginalPrice = Math.max(originalPrice, salePrice);

  return {
    originalPrice: normalizedOriginalPrice,
    originalPriceWithTax: roundCurrency(
      normalizedOriginalPrice + calculateTaxAmount(normalizedOriginalPrice)
    ),
    salePrice,
    taxAmount,
    taxRate: PRODUCT_TAX_RATE,
    priceWithTax: roundCurrency(salePrice + taxAmount),
  };
};

const addProductPricing = (totals, product, quantity) => {
  const qty = normalizeQuantity(quantity);
  if (!qty) throw new Error("Quantity must be a positive integer");
  const { originalPrice, priceWithTax, salePrice, taxAmount, taxRate } =
    getProductUnitPrices(product);

  return {
    totalAmount: roundCurrency(totals.totalAmount + originalPrice * qty),
    taxAmount: roundCurrency((totals.taxAmount || 0) + taxAmount * qty),
    payableAmount: roundCurrency(totals.payableAmount + priceWithTax * qty),
    priceWithTax,
    salePrice,
    taxRate,
    unitTaxAmount: taxAmount,
  };
};

module.exports = {
  PRODUCT_TAX_RATE,
  addProductPricing,
  calculateTaxAmount,
  getProductUnitPrices,
  normalizeQuantity,
  roundCurrency,
};
