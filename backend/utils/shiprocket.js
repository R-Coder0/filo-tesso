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
  channelId: positiveNumber(process.env.SHIPROCKET_CHANNEL_ID, 0),
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

  const payload = {
    order_id: order.orderNumber || String(order._id),
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

  if (defaults.channelId) {
    payload.channel_id = defaults.channelId;
  }

  return payload;
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

const getShiprocketOrderDetails = async (orderId) => {
  const { data } = await shiprocketRequest({
    method: "get",
    url: `/orders/show/${orderId}`,
  });

  return data?.data || data;
};

const getShipmentFromOrderDetails = (details) => {
  if (!details) return {};
  if (Array.isArray(details.shipments)) return details.shipments[0] || {};
  return details.shipments || {};
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const recoverShiprocketShipment = async (order, { attempts = 3 } = {}) => {
  const shiprocketOrderId = order.shiprocket?.orderId;
  if (!shiprocketOrderId) return order.shiprocket;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const details = await getShiprocketOrderDetails(shiprocketOrderId);
    const shipment = getShipmentFromOrderDetails(details);

    if (!shipment.id) {
      if (attempt < attempts) await wait(700);
      continue;
    }

    order.shiprocket = {
      ...order.shiprocket?.toObject?.(),
      syncStatus: "synced",
      orderId: String(details.id || shiprocketOrderId),
      shipmentId: String(shipment.id),
      status: shipment.status || details.status || order.shiprocket?.status || "",
      statusCode:
        Number(details.status_code || shipment.status_code) ||
        order.shiprocket?.statusCode,
      awbCode: shipment.awb ? String(shipment.awb) : order.shiprocket?.awbCode,
      courierCompanyId: shipment.courier_id
        ? String(shipment.courier_id)
        : order.shiprocket?.courierCompanyId,
      courierName: shipment.courier || order.shiprocket?.courierName,
      labelUrl: shipment.label_url || order.shiprocket?.labelUrl || "",
      lastAttemptAt: new Date(),
      syncedAt: order.shiprocket?.syncedAt || new Date(),
      lastError: "",
      response: {
        ...(order.shiprocket?.response || {}),
        orderDetails: details,
      },
    };
    await order.save();

    return order.shiprocket;
  }

  return order.shiprocket;
};

const assignShiprocketAwb = async (order) => {
  const shipmentId = order.shiprocket?.shipmentId;
  if (!shipmentId) {
    throw new Error("Shiprocket shipment ID is not available");
  }
  if (order.shiprocket?.awbCode) return order.shiprocket;

  const { data } = await shiprocketRequest({
    method: "post",
    url: "/courier/assign/awb",
    data: { shipment_id: Number(shipmentId) },
  });

  if (data?.awb_assign_status === 0) {
    const assignmentError =
      data?.response?.data?.awb_assign_error ||
      data?.message ||
      "Shiprocket could not assign an AWB";
    throw new Error(assignmentError);
  }

  const assignment = data?.response?.data || {};
  order.shiprocket = {
    ...order.shiprocket?.toObject?.(),
    status: assignment.awb_code
      ? "AWB ASSIGNED"
      : data?.success
        ? "AWB assignment processing"
        : order.shiprocket?.status,
    awbCode: assignment.awb_code
      ? String(assignment.awb_code)
      : order.shiprocket?.awbCode,
    courierCompanyId: assignment.courier_company_id
      ? String(assignment.courier_company_id)
      : order.shiprocket?.courierCompanyId,
    courierName: assignment.courier_name || order.shiprocket?.courierName,
    lastAttemptAt: new Date(),
    lastError: "",
    response: {
      ...(order.shiprocket?.response || {}),
      awbAssignment: data,
    },
  };
  await order.save();

  return order.shiprocket;
};

const getShiprocketShipmentDetails = async (shipmentId) => {
  const { data } = await shiprocketRequest({
    method: "get",
    url: `/shipments/${shipmentId}`,
  });

  return data?.data || data;
};

const getShiprocketTracking = async (shipmentId) => {
  const { data } = await shiprocketRequest({
    method: "get",
    url: `/courier/track/shipment/${shipmentId}`,
  });

  return data?.tracking_data || {};
};

const refreshShiprocketShipment = async (order) => {
  const shipmentId = order.shiprocket?.shipmentId;
  if (!shipmentId) {
    throw new Error("Shiprocket shipment ID is not available");
  }

  const shipment = await getShiprocketShipmentDetails(shipmentId);
  let tracking = {};

  try {
    tracking = await getShiprocketTracking(shipmentId);
  } catch (error) {
    tracking = { error: getShiprocketError(error) };
  }

  const shipmentTrack = tracking.shipment_track?.[0] || {};
  const awbCode = shipmentTrack.awb_code || shipment.awb || "";
  const currentStatus =
    shipmentTrack.current_status ||
    shipment.status_name ||
    shipment.status ||
    order.shiprocket?.status ||
    "";

  order.shiprocket = {
    ...order.shiprocket?.toObject?.(),
    syncStatus: "synced",
    orderId: String(
      shipmentTrack.order_id || shipment.order_id || order.shiprocket?.orderId || ""
    ),
    shipmentId: String(
      shipmentTrack.shipment_id || shipment.id || shipmentId
    ),
    status: String(currentStatus),
    statusCode:
      Number(tracking.shipment_status || shipment.status) ||
      order.shiprocket?.statusCode,
    awbCode: String(awbCode),
    courierCompanyId: String(
      shipmentTrack.courier_company_id ||
      shipment.sr_courier_id ||
      order.shiprocket?.courierCompanyId ||
      ""
    ),
    courierName:
      shipment.courier || order.shiprocket?.courierName || "",
    labelUrl: shipment.label_url || order.shiprocket?.labelUrl || "",
    trackingUrl: tracking.track_url || order.shiprocket?.trackingUrl || "",
    lastTrackedAt: new Date(),
    lastError: "",
    response: {
      ...(order.shiprocket?.response || {}),
      shipment,
      tracking,
    },
  };
  await order.save();

  return order.shiprocket;
};

const generateShiprocketLabel = async (order) => {
  if (!order.shiprocket?.shipmentId) {
    throw new Error("Shiprocket shipment ID is not available");
  }

  await refreshShiprocketShipment(order);
  if (!order.shiprocket?.awbCode) {
    throw new Error("AWB is not assigned yet. Assign a courier in Shiprocket first");
  }

  if (order.shiprocket.labelUrl) {
    return order.shiprocket.labelUrl;
  }

  const { data } = await shiprocketRequest({
    method: "post",
    url: "/courier/generate/label",
    data: { shipment_id: [Number(order.shiprocket.shipmentId)] },
  });

  if (!data?.label_url) {
    throw new Error(data?.response || "Shiprocket label was not generated");
  }

  order.shiprocket.labelUrl = data.label_url;
  order.shiprocket.response = {
    ...(order.shiprocket?.response || {}),
    label: data,
  };
  await order.save();
  return data.label_url;
};

const syncOrderToShiprocket = async (order, { force = false } = {}) => {
  if (!order) throw new Error("Order is required");
  if (
    order.shiprocket?.orderId &&
    order.shiprocket?.shipmentId &&
    !force
  ) {
    return order.shiprocket;
  }

  if (order.shiprocket?.orderId && !order.shiprocket?.shipmentId && !force) {
    try {
      await recoverShiprocketShipment(order);
      if (order.shiprocket?.shipmentId) return order.shiprocket;
      throw new Error(
        "Shiprocket order exists, but its shipment ID is not available yet"
      );
    } catch (error) {
      const statusCode = error.response?.status;
      const message = getShiprocketError(error);
      const orderNotFound =
        [400, 404].includes(statusCode) && /order.*not found/i.test(message);

      if (!orderNotFound) throw error;

      order.shiprocket.orderId = "";
      order.shiprocket.shipmentId = "";
      order.shiprocket.lastError = "";
      await order.save();
    }
  }

  order.shiprocket = {
    ...order.shiprocket?.toObject?.(),
    syncStatus: "pending",
    lastAttemptAt: new Date(),
    lastError: "",
  };
  await order.save();

  try {
    const { data } = await createShiprocketOrder(order);
    const createdOrder = data?.data?.order_id ? data.data : data;
    order.shiprocket = {
      syncStatus: "synced",
      orderId: createdOrder.order_id ? String(createdOrder.order_id) : "",
      shipmentId: createdOrder.shipment_id
        ? String(createdOrder.shipment_id)
        : "",
      status: createdOrder.status || "",
      statusCode:
        typeof createdOrder.status_code === "number"
          ? createdOrder.status_code
          : undefined,
      awbCode: createdOrder.awb_code ? String(createdOrder.awb_code) : "",
      courierCompanyId: createdOrder.courier_company_id
        ? String(createdOrder.courier_company_id)
        : "",
      courierName: createdOrder.courier_name || "",
      lastAttemptAt: new Date(),
      syncedAt: new Date(),
      lastError: "",
      response: data,
    };
    await order.save();

    if (!order.shiprocket.shipmentId && order.shiprocket.orderId) {
      await recoverShiprocketShipment(order);
    }

    if (!order.shiprocket.shipmentId) {
      throw new Error(
        "Shiprocket did not return a shipment ID. Check API user, channel ID, and pickup location"
      );
    }

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
  assignShiprocketAwb,
  buildShiprocketOrderPayload,
  createShiprocketOrder,
  generateShiprocketLabel,
  getShiprocketError,
  getShiprocketOrderDetails,
  getShiprocketShipmentDetails,
  getShiprocketToken,
  getShiprocketTracking,
  recoverShiprocketShipment,
  refreshShiprocketShipment,
  syncOrderToShiprocket,
};
