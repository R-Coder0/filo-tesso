const axios = require("axios");

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const FALLBACK_TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

let cachedToken = "";
let cachedTokenExpiresAt = 0;

const positiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDefaults = () => ({
  pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "warehouse",
  length: positiveNumber(process.env.SHIPROCKET_DEFAULT_LENGTH, 10),
  breadth: positiveNumber(process.env.SHIPROCKET_DEFAULT_BREADTH, 10),
  height: positiveNumber(process.env.SHIPROCKET_DEFAULT_HEIGHT, 2),
  weight: positiveNumber(process.env.SHIPROCKET_DEFAULT_WEIGHT, 0.5),
});

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    const expiresAt = Number(payload.exp) * 1000;
    return Number.isFinite(expiresAt)
      ? expiresAt
      : Date.now() + FALLBACK_TOKEN_TTL_MS;
  } catch {
    return Date.now() + FALLBACK_TOKEN_TTL_MS;
  }
};

const getShiprocketToken = async () => {
  if (
    cachedToken &&
    cachedTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()
  ) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("Shiprocket API credentials are not configured");
  }

  const { data } = await axios.post(
    `${SHIPROCKET_API_BASE}/auth/login`,
    { email, password },
    { timeout: 15000 }
  );

  if (!data?.token) {
    throw new Error("Shiprocket authentication did not return a token");
  }

  cachedToken = data.token;
  cachedTokenExpiresAt = getTokenExpiry(data.token);
  return cachedToken;
};

const shiprocketRequest = async (config) => {
  const token = await getShiprocketToken();
  return axios({
    timeout: 20000,
    ...config,
    baseURL: SHIPROCKET_API_BASE,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

const splitCustomerName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || "Customer",
    lastName: parts.join(" "),
  };
};

const formatShiprocketDate = (value) => {
  const date = value ? new Date(value) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
};

const getProductFromItem = (item) => {
  const product = item?.product;
  return product && typeof product === "object" ? product : {};
};

const buildItemSku = (item, product) => {
  if (item.sku) return item.sku;
  if (product.sku) return product.sku;

  const productId = product.productId || product._id || item.product;
  const size = item.selectedSize || "DEFAULT";
  return `FT-${productId}-${size}`.replace(/[^a-zA-Z0-9_-]/g, "-");
};

const getItemShipping = (item, product, defaults) => {
  const shipping = product.shipping || {};
  return {
    weight: positiveNumber(item.weight ?? shipping.weight, defaults.weight),
    length: positiveNumber(item.length ?? shipping.length, defaults.length),
    breadth: positiveNumber(item.breadth ?? shipping.breadth, defaults.breadth),
    height: positiveNumber(item.height ?? shipping.height, defaults.height),
  };
};

const validateOrderForShiprocket = (order) => {
  const address = order.address || {};
  const requiredAddressFields = [
    "name",
    "phone",
    "street",
    "city",
    "state",
    "postalCode",
  ];
  const missing = requiredAddressFields.filter((field) => !address[field]);

  if (!address.email) missing.push("email");
  if (!order.products?.length) missing.push("products");

  if (missing.length) {
    throw new Error(`Missing Shiprocket order fields: ${missing.join(", ")}`);
  }
};

const buildShiprocketOrderPayload = (order) => {
  validateOrderForShiprocket(order);

  const defaults = getDefaults();
  const address = order.address;
  const customerName = splitCustomerName(address.name);
  let totalWeight = 0;
  let packageLength = defaults.length;
  let packageBreadth = defaults.breadth;
  let packageHeight = 0;

  const orderItems = order.products.map((item) => {
    const product = getProductFromItem(item);
    const shipping = getItemShipping(item, product, defaults);
    const quantity = Math.max(1, Number(item.quantity || 1));

    totalWeight += shipping.weight * quantity;
    packageLength = Math.max(packageLength, shipping.length);
    packageBreadth = Math.max(packageBreadth, shipping.breadth);
    packageHeight += shipping.height * quantity;

    const orderItem = {
      name: item.name || product.name || "Product",
      sku: buildItemSku(item, product),
      units: quantity,
      selling_price: Number(
        item.priceAtPurchase ?? product.price?.sale ?? 0
      ),
      discount: 0,
      tax: 0,
    };

    const hsn = item.hsn || product.hsn;
    if (hsn) orderItem.hsn = String(hsn);
    return orderItem;
  });

  const totalAmount = Number(order.totalAmount || 0);
  const subTotal = Number(order.payableAmount ?? totalAmount);

  return {
    order_id: String(order._id),
    order_date: formatShiprocketDate(order.createdAt),
    pickup_location: defaults.pickupLocation,
    comment: "Filo Teso website order",
    billing_customer_name: customerName.firstName,
    billing_last_name: customerName.lastName,
    billing_address: String(address.street),
    billing_city: String(address.city),
    billing_pincode: String(address.postalCode),
    billing_state: String(address.state),
    billing_country: String(address.country || "India"),
    billing_email: String(address.email),
    billing_phone: String(address.phone),
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method:
      order.paymentMethod ||
      (order.paymentStatus === "Paid" ? "Prepaid" : "COD"),
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Math.max(0, totalAmount - subTotal),
    sub_total: subTotal,
    length: Number(packageLength.toFixed(2)),
    breadth: Number(packageBreadth.toFixed(2)),
    height: Number(Math.max(packageHeight, defaults.height).toFixed(2)),
    weight: Number(Math.max(totalWeight, defaults.weight).toFixed(3)),
  };
};

const getShiprocketError = (error) => {
  const responseData = error.response?.data;
  if (responseData?.errors) {
    const details = Object.entries(responseData.errors)
      .flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [messages]).map(
          (message) => `${field}: ${message}`
        )
      )
      .join("; ");
    if (details) return details;
  }

  return responseData?.message || error.message || "Shiprocket API failed";
};

const createShiprocketOrder = async (order) => {
  const payload = buildShiprocketOrderPayload(order);
  const { data } = await shiprocketRequest({
    method: "post",
    url: "/orders/create/adhoc",
    data: payload,
  });

  return { data, payload };
};

const syncOrderToShiprocket = async (order, { force = false } = {}) => {
  if (!order) throw new Error("Order is required");
  if (order.shiprocket?.orderId && !force) return order.shiprocket;

  order.shiprocket = {
    ...order.shiprocket?.toObject?.(),
    syncStatus: "pending",
    lastAttemptAt: new Date(),
    lastError: "",
  };
  await order.save();

  try {
    const { data } = await createShiprocketOrder(order);
    order.shiprocket = {
      syncStatus: "synced",
      orderId: data.order_id ? String(data.order_id) : "",
      shipmentId: data.shipment_id ? String(data.shipment_id) : "",
      status: data.status || "",
      statusCode:
        typeof data.status_code === "number" ? data.status_code : undefined,
      awbCode: data.awb_code ? String(data.awb_code) : "",
      courierCompanyId: data.courier_company_id
        ? String(data.courier_company_id)
        : "",
      courierName: data.courier_name || "",
      lastAttemptAt: new Date(),
      syncedAt: new Date(),
      lastError: "",
      response: data,
    };
    await order.save();
    return order.shiprocket;
  } catch (error) {
    const message = getShiprocketError(error);
    order.shiprocket = {
      ...order.shiprocket?.toObject?.(),
      syncStatus: "failed",
      lastAttemptAt: new Date(),
      lastError: message,
    };
    await order.save();

    const shiprocketError = new Error(message);
    shiprocketError.cause = error;
    throw shiprocketError;
  }
};

module.exports = {
  buildShiprocketOrderPayload,
  createShiprocketOrder,
  getShiprocketError,
  getShiprocketToken,
  syncOrderToShiprocket,
};
