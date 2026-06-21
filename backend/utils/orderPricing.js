const PRODUCT_TAX_RATE = 5;

const roundCurrency = (value) =>
  Number((Number.isFinite(Number(value)) ? Number(value) : 0).toFixed(2));

const getInclusiveTaxBreakdown = (amount, taxRate = PRODUCT_TAX_RATE) => {
  const inclusiveAmount = roundCurrency(amount);
  const rate = Number(taxRate || 0);
  const taxableAmount = rate > 0
    ? roundCurrency(inclusiveAmount / (1 + rate / 100))
    : inclusiveAmount;

  return {
    taxRate: rate,
    taxableAmount,
    taxAmount: roundCurrency(inclusiveAmount - taxableAmount),
  };
};

const normalizeQuantity = (value) => {
  const quantity = Number(value ?? 1);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
};

const getProductUnitPrices = (product) => {
  const salePrice = roundCurrency(product?.price?.sale);
  const originalPrice = roundCurrency(product?.price?.original ?? salePrice);
  const tax = getInclusiveTaxBreakdown(salePrice);

  return {
    originalPrice: Math.max(originalPrice, salePrice),
    salePrice,
    ...tax,
  };
};

const addProductPricing = (totals, product, quantity) => {
  const qty = normalizeQuantity(quantity);
  if (!qty) throw new Error("Quantity must be a positive integer");
  const {
    originalPrice,
    salePrice,
    taxAmount,
    taxableAmount,
    taxRate,
  } = getProductUnitPrices(product);

  return {
    totalAmount: roundCurrency(totals.totalAmount + originalPrice * qty),
    taxableAmount: roundCurrency(
      (totals.taxableAmount || 0) + taxableAmount * qty
    ),
    taxAmount: roundCurrency((totals.taxAmount || 0) + taxAmount * qty),
    payableAmount: roundCurrency(totals.payableAmount + salePrice * qty),
    salePrice,
    taxRate,
    unitTaxAmount: taxAmount,
    unitTaxableAmount: taxableAmount,
  };
};

module.exports = {
  PRODUCT_TAX_RATE,
  addProductPricing,
  getProductUnitPrices,
  getInclusiveTaxBreakdown,
  normalizeQuantity,
  roundCurrency,
};
