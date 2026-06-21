const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildShiprocketOrderPayload,
} = require("../utils/shiprocket");
const {
  addProductPricing,
  getProductUnitPrices,
  normalizeQuantity,
} = require("../utils/orderPricing");

const makeOrder = (overrides = {}) => ({
  _id: "local-order-id",
  orderNumber: "FT-TEST-1",
  createdAt: new Date("2026-06-21T06:30:00.000Z"),
  products: [
    {
      product: "product-id",
      name: "Discounted product",
      sku: "DISCOUNTED-PRODUCT-M",
      selectedSize: "M",
      quantity: 1,
      priceAtPurchase: 1231.65,
    },
  ],
  totalAmount: 1449,
  payableAmount: 1231.65,
  paymentStatus: "Paid",
  paymentMethod: "Prepaid",
  address: {
    name: "Test Customer",
    phone: "9999999999",
    email: "customer@example.com",
    street: "Test street",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110001",
    country: "India",
  },
  ...overrides,
});

test("does not apply an MRP discount twice in the Shiprocket payload", () => {
  const payload = buildShiprocketOrderPayload(makeOrder());

  assert.equal(payload.order_items[0].selling_price, 1231.65);
  assert.equal(payload.order_items[0].discount, 0);
  assert.equal(payload.sub_total, 1231.65);
  assert.equal(payload.total_discount, 0);
  assert.equal(payload.shipping_charges, 0);
  assert.equal(payload.payment_method, "Prepaid");
});

test("calculates the subtotal from discounted snapshots and quantities", () => {
  const payload = buildShiprocketOrderPayload(
    makeOrder({
      products: [
        {
          product: "product-id",
          name: "Discounted product",
          sku: "DISCOUNTED-PRODUCT-M",
          selectedSize: "M",
          quantity: 2,
          priceAtPurchase: 615.825,
        },
      ],
      totalAmount: 1449,
      payableAmount: 1231.65,
    })
  );

  assert.equal(payload.order_items[0].selling_price, 615.83);
  assert.equal(payload.sub_total, 1231.66);
  assert.equal(payload.total_discount, 0);
});

test("keeps MRP, sale price, tax, and payable totals separate", () => {
  const product = { price: { original: 1449, sale: 1231.65 } };
  const unitPrices = getProductUnitPrices(product);
  const totals = addProductPricing(
    { totalAmount: 0, payableAmount: 0 },
    product,
    1
  );

  assert.deepEqual(unitPrices, {
    originalPrice: 1449,
    originalPriceWithTax: 1521.45,
    salePrice: 1231.65,
    taxAmount: 61.58,
    taxRate: 5,
    priceWithTax: 1293.23,
  });
  assert.equal(totals.totalAmount, 1449);
  assert.equal(totals.taxAmount, 61.58);
  assert.equal(totals.payableAmount, 1293.23);
});

test("rejects fractional, zero, and negative cart quantities", () => {
  assert.equal(normalizeQuantity(1), 1);
  assert.equal(normalizeQuantity("2"), 2);
  assert.equal(normalizeQuantity(0), null);
  assert.equal(normalizeQuantity(-1), null);
  assert.equal(normalizeQuantity(1.5), null);
});

test("sends GST-inclusive prices and a 5% tax rate to Shiprocket", () => {
  const payload = buildShiprocketOrderPayload(
    makeOrder({
      products: [
        {
          product: "product-id",
          name: "Taxed product",
          sku: "TAXED-PRODUCT-M",
          selectedSize: "M",
          quantity: 1,
          priceAtPurchase: 1231.65,
          taxRate: 5,
          taxAmount: 61.58,
        },
      ],
      taxAmount: 61.58,
      payableAmount: 1293.23,
    })
  );

  assert.equal(payload.order_items[0].selling_price, 1293.23);
  assert.equal(payload.order_items[0].tax, 5);
  assert.equal(payload.sub_total, 1293.23);
  assert.equal(payload.total_discount, 0);
});
