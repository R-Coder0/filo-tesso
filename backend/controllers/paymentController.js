const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { buildOrderItemSnapshot } = require("../utils/orderItemSnapshot");
const { getNextOrderNumber } = require("../utils/orderNumber");
const { sendOrderPlacedEmails } = require("../utils/orderEmails");
const { syncOrderToShiprocket } = require("../utils/shiprocket");
const {
  addProductPricing,
  normalizeQuantity,
} = require("../utils/orderPricing");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getVariantForSize = (product, selectedSize) => {
  const variants = product.sizeVariants || [];
  return variants.find((variant) => String(variant.size || "").trim().toUpperCase() === selectedSize);
};

// ✅ CREATE ORDER (PAYMENT INIT)
exports.createOrder = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.user._id;

    let pricing = {
      totalAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      payableAmount: 0,
    };

    for (const item of cartItems) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available",
        });
      }

      const qty = normalizeQuantity(item.quantity);
      if (!qty) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity",
        });
      }
      const selectedSize = String(item.selectedSize || "").trim().toUpperCase();
      const selectedVariant = getVariantForSize(product, selectedSize);
      const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

      if (availableStock < qty) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      const allowedSizes = (product.sizes || []).map(size => String(size).trim().toUpperCase());
      if (allowedSizes.length && !allowedSizes.includes(selectedSize)) {
        return res.status(400).json({
          success: false,
          message: `Please select a valid size for ${product.name}`,
        });
      }

      pricing = addProductPricing(pricing, product, qty);
    }

    const { totalAmount, taxableAmount, taxAmount, payableAmount } = pricing;
    if (payableAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "No valid products in cart",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100),
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    await Payment.create({
      razorpay_order_id: razorpayOrder.id,
      user: userId,
      totalAmount,
      taxableAmount,
      taxAmount,
      payableAmount,
      status: "created",
    });

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      payableAmount,
    });

  } catch (err) {
    console.error("❌ Create Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};


// ✅ VERIFY PAYMENT + CREATE ORDER
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
      address,
    } = req.body;

    const userId = req.user._id;

    // ✅ SIGNATURE VERIFY
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const payment = await Payment.findOne({
      razorpay_order_id,
      user: userId,
    });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (payment.status === "paid" && payment.order) {
      const existingOrder = await Order.findById(payment.order);
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: existingOrder,
      });
    }

    const user = await User.findById(userId);
    const shippingAddress = {
      ...(address || {}),
      email: address?.email || user?.email || "",
      country: address?.country || "India",
    };

    let pricing = {
      totalAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      payableAmount: 0,
    };
    const products = [];

    // ✅ RECALCULATE (MOST IMPORTANT FIX)
    for (const item of cartItems) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available",
        });
      }

      const qty = normalizeQuantity(item.quantity);
      if (!qty) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity",
        });
      }
      const selectedSize = String(item.selectedSize || "").trim().toUpperCase();
      const selectedVariant = getVariantForSize(product, selectedSize);
      const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

      if (availableStock < qty) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      const allowedSizes = (product.sizes || []).map(size => String(size).trim().toUpperCase());
      if (allowedSizes.length && !allowedSizes.includes(selectedSize)) {
        return res.status(400).json({
          success: false,
          message: `Please select a valid size for ${product.name}`,
        });
      }

      pricing = addProductPricing(pricing, product, qty);

      products.push(
        buildOrderItemSnapshot(
          product,
          { ...item, quantity: qty },
          pricing.salePrice
        )
      );
    }

    if (!products.length) {
      return res.status(400).json({
        success: false,
        message: "No valid products",
      });
    }

    const { totalAmount, taxableAmount, taxAmount, payableAmount } = pricing;

    if (Math.abs(payableAmount - Number(payment.payableAmount)) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Order total changed. Please restart payment.",
      });
    }

    // ✅ CREATE ORDER
    const order = new Order({
      orderNumber: await getNextOrderNumber(),
      user: userId,
      products,
      totalAmount,
      taxableAmount,
      taxAmount,
      payableAmount,
      paymentStatus: "Paid",
      paymentMethod: "Prepaid",
      orderStatus: "pending",
      address: shippingAddress,
    });

    await order.save();

    // ✅ REDUCE STOCK
    for (const item of products) {
      if (item.selectedSize) {
        await Product.updateOne(
          { _id: item.product, "sizeVariants.size": item.selectedSize },
          { $inc: { stock: -item.quantity, "sizeVariants.$.stock": -item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    // ✅ UPDATE PAYMENT
    await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
        order: order._id,
      }
    );

    try {
      const emailResults = await sendOrderPlacedEmails(order);
      for (const result of emailResults) {
        if (!result.sent) {
          console.error(
            `Order email failed for ${result.role} (${order.orderNumber || order._id}):`,
            result.error
          );
        }
      }
    } catch (emailError) {
      console.error(
        `Order email setup failed (${order.orderNumber || order._id}):`,
        emailError.message
      );
    }

    try {
      await syncOrderToShiprocket(order);
    } catch (shiprocketError) {
      console.error(
        `Shiprocket sync failed for order ${order.orderNumber || order._id}:`,
        shiprocketError.message
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment successful",
      order,
    });

  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).json({
      success: false,
      message: "Server error verifying payment",
    });
  }
};
