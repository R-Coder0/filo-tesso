const buildOrderItemSnapshot = (product, item, price) => {
  const selectedSize = String(item.selectedSize || "").trim().toUpperCase();
  const baseSku = product.sku || `FT-${product.productId || product._id}`;

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
    priceAtPurchase: price,
  };
};

module.exports = { buildOrderItemSnapshot };
