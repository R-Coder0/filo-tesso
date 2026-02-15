const Razorpay = require("razorpay");
const crypto = require("crypto"); // ✅ Built-in module, no installation needed
const Payment = require("../models/Payment");
const Order = require("../models/Order"); // ✅ Order model import karo
const User = require("../models/User"); // ✅ User model import karo

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    // ✅ Validation add karo
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Valid amount is required" 
      });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    
    if (amountInPaise < 100) { // Minimum ₹1
      return res.status(400).json({ 
        success: false,
        message: "Amount must be at least ₹1" 
      });
    }

    const options = {
      amount: amountInPaise, // in paise
      currency: "INR",
      receipt: "order_rcpt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    console.log("🧾 Razorpay Order Created:", order);

    // Save to DB
    await Payment.create({
      razorpay_order_id: order.id,
      amount: amount,
      currency: "INR",
      status: "created",
    });

    // ✅ SAHI RESPONSE
    res.status(200).json({
      success: true,
      order: order
    });

  } catch (err) {
    console.error("❌ Error creating Razorpay order:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to create Razorpay order" 
    });
  }
};

// ✅ Verify Payment Signature
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      // Order data from frontend
      cartItems,
      address,
      totalAmount,
      redeemCoins,
      subtotal,
      discountAmount,
      discountedTotal
    } = req.body;

    const userId = req.user._id;

    // ✅ Signature verify karo
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid payment signature" 
      });
    }

    // ✅ PAYMENT VERIFIED - Ab order create karo

    // Parse products
    const products = Array.isArray(cartItems) ? cartItems.map(item => ({
      product: item._id,
      quantity: item.quantity || 1,
      selectedSize: item.selectedSize || "",
      selectedColor: item.selectedColor || "",
    })) : [];

    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid products in order"
      });
    }

    // Coins calculation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const redeemable = Math.min(
      Number(redeemCoins || 0), 
      user.coinsBalance, 
      Number(totalAmount || 0)
    );
    
    const payableAmount = Math.max(0, Number(totalAmount || 0) - redeemable);
    const coinsEarned = Math.floor(payableAmount * 0.10); // 10% coins

    // FIX: DEDUCT COINS BEFORE CREATING ORDER
    console.log(`🪙 Online Payment - Coin Transaction - User: ${userId}`);
    console.log(`📊 Before: ${user.coinsBalance} coins, Redeeming: ${redeemable} coins`);
    
    // Deduct redeemed coins from user's wallet
    if (redeemable > 0) {
      user.coinsBalance = Number(user.coinsBalance) - Number(redeemable);
      await user.save();
      console.log(`✅ After: ${user.coinsBalance} coins remaining`);
    }

    // Create order with NEW coin system
    const order = new Order({
      user: userId,
      products: products,
      totalAmount: Number(totalAmount || 0),
      payableAmount: payableAmount,
      coinsEarned: coinsEarned,
      coinsRedeemed: redeemable,
      coinStatus: "pending", // NEW: Coin status for 10-day system
      coinCreditDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // NEW: 10 days later
      paymentStatus: "Paid", // ✅ Directly Paid since payment successful
      orderStatus: "pending", // NEW: Order status
      address: address || {},
    });

    await order.save();
    await order.populate("products.product");

    // FIX: DON'T ADD COINS EARNED IMMEDIATELY - They will be added after 10 days via cron job
    // Removed: user.coinsBalance = (user.coinsBalance - redeemable) + coinsEarned;
    // Coins earned will be added automatically after 10 days

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
      }
    );

    // ✅ SAHI RESPONSE BHEJO - Frontend ko order data chahiye
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: order, // ✅ Frontend ko order object bhejo
      coinsBalance: user.coinsBalance // ✅ Updated coins balance bhejo
    });

  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error verifying payment" 
    });
  }
};