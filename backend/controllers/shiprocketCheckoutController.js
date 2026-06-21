const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const ShiprocketCheckoutSession = require("../models/ShiprocketCheckoutSession");
const { buildOrderItemSnapshot } = require("../utils/orderItemSnapshot");
const { getNextOrderNumber } = require("../utils/orderNumber");
const { sendOrderPlacedEmails } = require("../utils/orderEmails");
const { syncOrderToShiprocket } = require("../utils/shiprocket");
const {
  createCheckoutAccessToken,
  getCheckoutOrderDetails,
} = require("../utils/shiprocketCheckout");
const { getSelectedVariant } = require("../utils/shiprocketCatalog");
const {
  addProductPricing,
  getProductUnitPrices,
  normalizeQuantity,
  roundCurrency,
} = require("../utils/orderPricing");

const ALLOWED_FRONTEND_ORIGINS = new Set([
  "http://localhost:5173",
  "https://filoteso.co.in",
  "https://www.filoteso.co.in",
]);

const getFrontendOrigin = (req) => {
  const requestOrigin = req.get("origin");
  if (requestOrigin && ALLOWED_FRONTEND_ORIGINS.has(requestOrigin)) {
    return requestOrigin;
  }

  return String(process.env.FRONTEND_URL || "https://filoteso.co.in").replace(
    /\/+$/,
    ""
  );
};

const getCheckoutError = (error) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  "Shiprocket Checkout request failed";

const loadCheckoutCart = async (cartItems) => {
  const checkoutItems = [];
  const sessionItems = [];
  let pricing = { totalAmount: 0, taxAmount: 0, payableAmount: 0 };

  for (const item of cartItems || []) {
    const product = await Product.findById(item._id);
    if (!product) {
      throw new Error("A product in your cart is no longer available");
    }

    const quantity = normalizeQuantity(item.quantity);
    if (!quantity) throw new Error("Invalid product quantity");
    const selectedSize = String(item.selectedSize || "").trim().toUpperCase();
    const selected = getSelectedVariant(product, selectedSize);

    if (!selected) {
      throw new Error(`Please select a valid size for ${product.name}`);
    }

    const availableStock = Number(
      selected.variant?.stock ?? product.stock ?? 0
    );
    if (availableStock < quantity) {
      throw new Error(`${product.name} is out of stock`);
    }

    pricing = addProductPricing(pricing, product, quantity);
    const { originalPrice, salePrice, taxAmount, taxRate } =
      getProductUnitPrices(product);

    checkoutItems.push({
      variant_id: String(selected.variantId),
      quantity,
    });
    sessionItems.push({
      product: product._id,
      quantity,
      selectedSize,
      selectedColor: String(item.selectedColor || ""),
      originalPrice,
      priceAtCheckout: salePrice,
      taxRate,
      taxAmount,
    });
  }

  if (!checkoutItems.length) {
    throw new Error("No valid products in cart");
  }

  return { checkoutItems, sessionItems, ...pricing };
};

exports.createShiprocketCheckoutToken = async (req, res) => {
  try {
    const {
      checkoutItems,
      sessionItems,
      totalAmount,
      taxAmount,
      payableAmount,
    } =
      await loadCheckoutCart(req.body.cartItems);
    const frontendOrigin = getFrontendOrigin(req);

    const cartData = {
      items: checkoutItems,
      custom_attributes: {
        customer_id: String(req.user._id),
      },
      mobile_app: false,
    };

    const checkoutPayload = {
      cart_data: cartData,
      redirect_url: `${frontendOrigin}/shiprocket-checkout-return`,
      timestamp: new Date().toISOString(),
    };
    const checkoutResponse = await createCheckoutAccessToken(checkoutPayload);
    const token = checkoutResponse?.result?.token;
    const shiprocketOrderId = checkoutResponse?.result?.data?.order_id;

    if (!token || !shiprocketOrderId) {
      throw new Error("Shiprocket Checkout did not return an access token");
    }

    await ShiprocketCheckoutSession.findOneAndUpdate(
      { shiprocketOrderId },
      {
        shiprocketOrderId,
        user: req.user._id,
        cartItems: sessionItems,
        totalAmount,
        taxAmount,
        payableAmount,
        status: "initiated",
        shiprocketResponse: checkoutResponse,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      token,
      orderId: shiprocketOrderId,
      sellerDomain:
        process.env.SHIPROCKET_CHECKOUT_DOMAIN || "filoteso.co.in",
    });
  } catch (error) {
    console.error("Shiprocket Checkout token failed:", getCheckoutError(error));
    res.status(error?.response?.status || 500).json({
      success: false,
      message: getCheckoutError(error),
    });
  }
};

const toShippingAddress = (details, user) => {
  const address = details.shipping_address || {};
  return {
    name: [address.first_name, address.last_name].filter(Boolean).join(" "),
    phone: details.phone || address.phone || "",
    email: details.email || address.email || user?.email || "",
    street: [address.line1, address.line2, address.landmark]
      .filter(Boolean)
      .join(", "),
    city: address.city || "",
    state: address.state || "",
    postalCode: address.pincode || "",
    country: address.country || "India",
  };
};

exports.finalizeShiprocketCheckout = async (req, res) => {
  try {
    const shiprocketOrderId = String(req.body.orderId || "").trim();
    if (!shiprocketOrderId) {
      return res.status(400).json({
        success: false,
        message: "Shiprocket Checkout order ID is required",
      });
    }

    const session = await ShiprocketCheckoutSession.findOne({
      shiprocketOrderId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Checkout session not found",
      });
    }

    if (session.localOrder) {
      const existingOrder = await Order.findById(session.localOrder);
      return res.json({ success: true, order: existingOrder });
    }

    const response = await getCheckoutOrderDetails(shiprocketOrderId);
    const details = response?.result;
    if (!details || String(details.status).toUpperCase() !== "SUCCESS") {
      return res.status(409).json({
        success: false,
        pending: true,
        message: "Shiprocket Checkout order is not completed yet",
      });
    }

    const products = [];
    for (const item of session.cartItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error("A checkout product is no longer available");
      }

      const quantity = normalizeQuantity(item.quantity);
      if (!quantity) throw new Error("Invalid checkout product quantity");

      const selected = getSelectedVariant(product, item.selectedSize);
      const availableStock = Number(
        selected?.variant?.stock ?? product.stock ?? 0
      );
      if (!selected || availableStock < quantity) {
        throw new Error(`${product.name} is out of stock`);
      }

      products.push(
        buildOrderItemSnapshot(
          product,
          {
            quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          },
          roundCurrency(
            item.priceAtCheckout ?? getProductUnitPrices(product).salePrice
          ),
          {
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
          }
        )
      );
    }

    const user = await User.findById(req.user._id);
    const isPrepaid =
      String(details.payment_type || "").toUpperCase() !== "CASH_ON_DELIVERY";
    const paidAmount = roundCurrency(details.total_amount_payable);
    const payableAmount = paidAmount > 0
      ? paidAmount
      : session.payableAmount;

    const order = await Order.create({
      orderNumber: await getNextOrderNumber(),
      user: req.user._id,
      products,
      totalAmount: session.totalAmount,
      taxAmount: session.taxAmount,
      payableAmount,
      paymentStatus: isPrepaid ? "Paid" : "Pending",
      paymentMethod: isPrepaid ? "Prepaid" : "COD",
      orderStatus: "pending",
      address: toShippingAddress(details, user),
    });

    for (const item of products) {
      if (item.selectedSize) {
        await Product.updateOne(
          { _id: item.product, "sizeVariants.size": item.selectedSize },
          {
            $inc: {
              stock: -item.quantity,
              "sizeVariants.$.stock": -item.quantity,
            },
          }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    session.status = "completed";
    session.localOrder = order._id;
    session.shiprocketResponse = response;
    await session.save();

    sendOrderPlacedEmails(order).catch((error) => {
      console.error("Shiprocket Checkout order email failed:", error.message);
    });
    syncOrderToShiprocket(order).catch((error) => {
      console.error("Shiprocket shipping sync failed:", error.message);
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error(
      "Shiprocket Checkout finalization failed:",
      getCheckoutError(error)
    );
    res.status(error?.response?.status || 500).json({
      success: false,
      message: getCheckoutError(error),
    });
  }
};
