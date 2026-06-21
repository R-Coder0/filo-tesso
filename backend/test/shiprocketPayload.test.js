const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildShiprocketOrderPayload,
} = require("../utils/shiprocket");
const {
  addProductPricing,
  getProductUnitPrices,
  getInclusiveTaxBreakdown,
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

test("extracts 5% GST without increasing the payable sale total", () => {
  const product = { price: { original: 1449, sale: 1231.65 } };
  const unitPrices = getProductUnitPrices(product);
  const totals = addProductPricing(
    { totalAmount: 0, payableAmount: 0 },
    product,
    1
  );

  assert.deepEqual(unitPrices, {
    originalPrice: 1449,
    salePrice: 1231.65,
    taxRate: 5,
    taxableAmount: 1173,
    taxAmount: 58.65,
  });
  assert.equal(totals.totalAmount, 1449);
  assert.equal(totals.taxableAmount, 1173);
  assert.equal(totals.taxAmount, 58.65);
  assert.equal(totals.payableAmount, 1231.65);
});

test("rejects fractional, zero, and negative cart quantities", () => {
  assert.equal(normalizeQuantity(1), 1);
  assert.equal(normalizeQuantity("2"), 2);
  assert.equal(normalizeQuantity(0), null);
  assert.equal(normalizeQuantity(-1), null);
  assert.equal(normalizeQuantity(1.5), null);
});

test("breaks ₹1499 into taxable value and inclusive 5% GST", () => {
  assert.deepEqual(getInclusiveTaxBreakdown(1499), {
    taxRate: 5,
    taxableAmount: 1427.62,
    taxAmount: 71.38,
  });
});

test("sends ₹1499 unchanged with tax 5 for Shiprocket invoicing", () => {
  const payload = buildShiprocketOrderPayload(
    makeOrder({
      products: [
        {
          product: "product-id",
          name: "GST-inclusive product",
          sku: "GST-INCLUSIVE-M",
          selectedSize: "M",
          quantity: 1,
          priceAtPurchase: 1499,
          taxRate: 5,
          taxableAmount: 1427.62,
          taxAmount: 71.38,
        },
      ],
      totalAmount: 1499,
      taxableAmount: 1427.62,
      taxAmount: 71.38,
      payableAmount: 1499,
    })
  );

  assert.equal(payload.order_items[0].selling_price, 1499);
  assert.equal(payload.order_items[0].tax, 5);
  assert.equal(payload.sub_total, 1499);
  assert.equal(payload.total_discount, 0);
});
