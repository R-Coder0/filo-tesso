const axios = require("axios");
const crypto = require("crypto");

const CHECKOUT_API_BASE = "https://checkout-api.shiprocket.com";

const getCredentials = () => {
  const apiKey = process.env.SHIPROCKET_CHECKOUT_API_KEY;
  const secretKey = process.env.SHIPROCKET_CHECKOUT_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Shiprocket Checkout credentials are not configured");
  }

  return { apiKey, secretKey };
};

const shiprocketCheckoutRequest = async (path, payload) => {
  const { apiKey, secretKey } = getCredentials();
  const body = JSON.stringify(payload);
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(body)
    .digest("base64");

  const { data } = await axios.post(`${CHECKOUT_API_BASE}${path}`, body, {
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      "X-Api-HMAC-SHA256": hmac,
    },
    transformRequest: [(value) => value],
  });

  return data;
};

const createCheckoutAccessToken = (payload) =>
  shiprocketCheckoutRequest("/api/v1/access-token/checkout", payload);

const getCheckoutOrderDetails = (orderId) =>
  shiprocketCheckoutRequest("/api/v1/custom-platform-order/details", {
    order_id: orderId,
    timestamp: new Date().toISOString(),
  });

const syncCheckoutProduct = (productPayload) =>
  shiprocketCheckoutRequest("/wh/v1/custom/product", productPayload);

const syncCheckoutCollection = (collectionPayload) =>
  shiprocketCheckoutRequest("/wh/v1/custom/collection", collectionPayload);

module.exports = {
  createCheckoutAccessToken,
  getCheckoutOrderDetails,
  syncCheckoutCollection,
  syncCheckoutProduct,
};
