const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

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
    const { cartItems, redeemCoins = 0 } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    let totalAmount = 0;

    for (const item of cartItems) {
      const product = await Product.findById(item._id);

      if (!product) continue;

      const qty = item.quantity || 1;
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

      const price = product.price?.sale || 0;
      totalAmount += price * qty;
    }

    const redeemable = Math.min(
      Number(redeemCoins),
      user.coinsBalance,
      totalAmount
    );

    const payableAmount = Math.max(0, totalAmount - redeemable);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(payableAmount * 100),
      currency: "INR",
      receipt: "order_" + Date.now(),
    });

    await Payment.create({
      razorpay_order_id: razorpayOrder.id,
      user: userId,
      totalAmount,
      payableAmount,
      coinsUsed: redeemable,
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
      redeemCoins = 0,
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

    const user = await User.findById(userId);

    let totalAmount = 0;
    const products = [];

    // ✅ RECALCULATE (MOST IMPORTANT FIX)
    for (const item of cartItems) {
      const product = await Product.findById(item._id);

      if (!product) continue;

      const qty = item.quantity || 1;
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

      const price = product.price?.sale || 0;

      totalAmount += price * qty;

      products.push({
        product: product._id,
        quantity: qty,
        selectedSize,
        selectedColor: item.selectedColor || "",
        priceAtPurchase: price, // ✅ FIXED
      });
    }

    if (!products.length) {
      return res.status(400).json({
        success: false,
        message: "No valid products",
      });
    }

    // ✅ COINS LOGIC
    const redeemable = Math.min(
      Number(redeemCoins),
      user.coinsBalance,
      totalAmount
    );

    const payableAmount = Math.max(0, totalAmount - redeemable);
    const coinsEarned = Math.floor(payableAmount * 0.1);

    console.log(`🪙 Before: ${user.coinsBalance}, Redeeming: ${redeemable}`);

    if (redeemable > 0) {
      user.coinsBalance -= redeemable;
      await user.save();
    }

    // ✅ CREATE ORDER
    const order = new Order({
      user: userId,
      products,
      totalAmount,
      payableAmount,
      coinsEarned,
      coinsRedeemed: redeemable,
      coinStatus: "pending",
      coinCreditDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      paymentStatus: "Paid",
      orderStatus: "pending",
      address: address || {},
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

    res.status(200).json({
      success: true,
      message: "Payment successful",
      order,
      coinsBalance: user.coinsBalance,
    });

  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).json({
      success: false,
      message: "Server error verifying payment",
    });
  }
};
