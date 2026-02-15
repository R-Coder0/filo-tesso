// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const parseProducts = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  // when multipart, products may come as JSON string
  try { return JSON.parse(raw); } catch { return []; }
};

exports.createOrder = async (req, res) => {
  try {
    // Expecting multipart/form-data with optional files:
    // fields: products(JSON), totalAmount(Number), address.* , redeemCoins(Number)
    const userId = req.user._id;

    const products = parseProducts(req.body.products);
    const totalAmount = Number(req.body.totalAmount);
    const address = req.body.address ? JSON.parse(req.body.address) : {
      name: req.body["address[name]"],
      phone: req.body["address[phone]"],
      email: req.body["address[email]"] || "",
      street: req.body["address[street]"],
      city: req.body["address[city]"],
      state: req.body["address[state]"],
      postalCode: req.body["address[postalCode]"],
      
    };
        const selectedSide = req.body.selectedSide || "";


    if (!products.length || !totalAmount || !address || !address.name) {
      return res.status(400).json({ message: "Missing or invalid order data" });
    }

    // Customize uploads (order-level)
    const customImagePath = req.files?.customImage?.[0]
      ? `/uploads/${req.files.customImage[0].filename}`
      : "";
    const customPdfPath = req.files?.customPdf?.[0]
      ? `/uploads/${req.files.customPdf[0].filename}`
      : "";

    // Coins calculation - UPDATED: Coins abhi add nahi honge
    const redeemRequested = Math.max(0, Number(req.body.redeemCoins || 0));
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    // FIX: Check if user has enough coins
    if (redeemRequested > user.coinsBalance) {
      return res.status(400).json({ 
        message: `Insufficient coins. You have ${user.coinsBalance} coins but trying to redeem ${redeemRequested}` 
      });
    }

    const redeemable = Math.min(redeemRequested, user.coinsBalance, totalAmount);
    const payableAmount = Math.max(0, totalAmount - redeemable);
    const coinsEarned = Math.floor(payableAmount * 0.01); // 1%

    // Build order items (with selectedSize/Color)
    // Expect each item: { product: <id>, quantity, selectedSize?, selectedColor? }
    const orderItems = [];
    for (const it of products) {
      if (!it.product) continue;
      orderItems.push({
        product: it.product,
        quantity: Number(it.quantity || 1),
        selectedSize: String(it.selectedSize || "").trim(),
        selectedColor: String(it.selectedColor || "").trim(),
      });
    }
    if (!orderItems.length) {
      return res.status(400).json({ message: "No valid products in order" });
    }

    // Create order - UPDATED: Coin status and date added
    const order = new Order({
      user: userId,
      products: orderItems,
      totalAmount,
      payableAmount,
      coinsEarned,
      coinsRedeemed: redeemable,
      coinStatus: "pending", // Initially pending
      coinCreditDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days later
      paymentStatus: "Pending",
      orderStatus: "pending", // Add order status
      customizationUploads: {
        image: customImagePath,
        pdf: customPdfPath,
       selectedSide: selectedSide, // ✅ YEH LINE ADD KARO

      },
      address,
    });

    await order.save();
    await order.populate("products.product");

    // FIX: PROPERLY DEDUCT REDEEMED COINS
    console.log(`🪙 Coin Transaction - User: ${userId}`);
    console.log(`📊 Before: ${user.coinsBalance} coins, Redeeming: ${redeemable} coins`);
    
    // UPDATED: Only deduct redeemed coins, don't add earned coins yet
    user.coinsBalance = Number(user.coinsBalance) - Number(redeemable);
    await user.save();
    
    console.log(`✅ After: ${user.coinsBalance} coins remaining`);

    // Email to admin (best effort, no crying if it fails)
    // Email to admin (best effort, no crying if it fails)
if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASS,
    },
  });

  const productDetails = order.products.map((p) => {
    const name = p.product?.name || "Unknown";
    const price = p.product?.price ? `₹${p.product.price}` : "";
    const size = p.selectedSize ? ` | Size: ${p.selectedSize}` : "";
    const color = p.selectedColor ? ` | Color: ${p.selectedColor}` : "";
    return `<li>${p.quantity} × ${name} ${price}${size}${color}</li>`;
  }).join("");

  // Build attachments array dynamically
  const attachments = [];
  if (customImagePath) {
    attachments.push({
      filename: customImagePath.split("/").pop(),
      path: `${__dirname}/..${customImagePath}`, // actual file path
      cid: "customImage", // reference ID used below
    });
  }
  if (customPdfPath) {
    attachments.push({
      filename: customPdfPath.split("/").pop(),
      path: `${__dirname}/..${customPdfPath}`,
    });
  }

  const mailOptions = {
    from: '"Shop Notification" <no-reply@yourstore.com>',
    to: process.env.ADMIN_EMAIL,
    subject: `🛒 New Order from ${address.name}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Name:</strong> ${address.name}</p>
      <p><strong>Phone:</strong> ${address.phone}</p>
      ${address.email ? `<p><strong>Email:</strong> ${address.email}</p>` : ""}
      <p><strong>Address:</strong> ${address.street}, ${address.city}, ${address.state} - ${address.postalCode}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
      <p><strong>Coins Redeemed:</strong> ${redeemable}</p>
      <p><strong>Payable Amount:</strong> ₹${payableAmount}</p>
      <p><strong>Coins Earned:</strong> ${coinsEarned} (will be credited after 10 days)</p>
      <p><strong>User's New Coin Balance:</strong> ${user.coinsBalance}</p>
      <p><strong>Products:</strong></p>
      <ul>${productDetails}</ul>

      ${
        customImagePath
          ? `<div style="margin-top:15px;">
              <p><strong>Customization Image:</strong></p>
              <img src="cid:customImage" style="max-width:250px; border:1px solid #ddd; border-radius:6px;" />
            </div>`
          : ""
      }

      ${
        customPdfPath
          ? `<div style="margin-top:10px;">
              <p><strong>Customization PDF Attached:</strong></p>
            </div>`
          : ""
      }
    `,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Order email sent to admin");
  } catch (emailErr) {
    console.error("❌ Failed to send email:", emailErr);
  }
} else {
  console.warn("⚠️ Missing ADMIN_EMAIL or ADMIN_EMAIL_PASS; skipping email.");
}

    // Respond with order + latest coins balance (after redemption)
    res.status(201).json({
      order,
      coinsBalance: user.coinsBalance,
    });
  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).populate("products.product");
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching user orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// UPDATED: Order status update function (with paymentStatus control)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 1) Cancel/return par pending coins cancel
    if (['cancelled', 'returned'].includes(status) && order.coinStatus === 'pending') {
      order.coinStatus = 'cancelled';
      console.log(`❌ Coins cancelled for order ${id} due to ${status}`);
    }

    // 2) Admin status ke through paymentStatus bhi control kare
    if (status === 'delivered') {
      // COD + Online dono ke liye – delivered ka matlab payment mil gaya
      order.paymentStatus = 'Paid';
    } else if (status === 'pending' || status === 'confirmed') {
      // Optional: agar wapas pending/confirmed karo to payment bhi Pending
      if (order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'Pending';
      }
    } else if (status === 'cancelled') {
      // Optional: cancel hone par payment ko Refunded/Fails jaisa rakh sakte ho
      if (order.paymentStatus === 'Pending') {
        order.paymentStatus = 'Failed';
      }
    }

    order.orderStatus = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};


// NEW: Function to credit pending coins (for cron job)
exports.creditPendingCoins = async () => {
  try {
    const ordersToCredit = await Order.find({
      coinStatus: 'pending',
      coinCreditDate: { $lte: new Date() },
      orderStatus: { $nin: ['cancelled', 'returned'] },
      paymentStatus: 'Paid'
    }).populate('user');

    let creditedCount = 0;

    for (const order of ordersToCredit) {
      // Add coins to user's wallet
      await User.findByIdAndUpdate(order.user._id, {
        $inc: { coinsBalance: order.coinsEarned }
      });

      // Update order coin status
      order.coinStatus = 'credited';
      await order.save();

      creditedCount++;
      console.log(`✅ Coins credited: ${order.coinsEarned} to user ${order.user._id} for order ${order._id}`);
    }

    return creditedCount;
  } catch (error) {
    console.error('❌ Error crediting coins:', error);
    throw error;
  }
};

// NEW: Manual coin credit endpoint for testing
exports.manualCreditCoins = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const creditedCount = await exports.creditPendingCoins();
    
    res.json({ 
      message: `Successfully credited coins for ${creditedCount} orders`,
      creditedCount 
    });
  } catch (error) {
    console.error('❌ Manual coin credit failed:', error);
    res.status(500).json({ message: "Failed to credit coins", error: error.message });
  }
};

// NEW: User cancels order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'shipped'].includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: `Order cannot be cancelled because it's already ${order.orderStatus}` 
      });
    }

    // Mark as cancellation requested
    order.cancelled = true;
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = 'user';
    order.cancellationStatus = 'requested';
    // Don't change orderStatus to 'cancelled' yet - wait for admin approval
    // order.orderStatus = 'cancelled';

    await order.save();
    
    // Send email notification to admin about cancellation request
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.ADMIN_EMAIL_PASS,
        },
      });

      const productDetails = order.products.map((p) => {
        const name = p.product?.name || "Unknown";
        return `<li>${p.quantity} × ${name}</li>`;
      }).join("");

      const mailOptions = {
        from: '"Shop Notification" <no-reply@yourstore.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `❌ Cancellation Request for Order #${order._id}`,
        html: `
          <h2>Cancellation Request Received</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>User:</strong> ${order.user.name} (${order.user.email})</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Products:</strong></p>
          <ul>${productDetails}</ul>
          <p><em>Please check the admin panel to approve or reject this cancellation request.</em></p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error("❌ Failed to send cancellation email:", emailErr);
      }
    }

    res.json({ 
      message: 'Cancellation request submitted. Admin will process it shortly.', 
      order 
    });
    
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// NEW: Admin gets cancellation requests
exports.getCancellationRequests = async (req, res) => {
  try {
    const cancellationRequests = await Order.find({
      cancelled: true,
      cancellationStatus: 'requested'
    })
    .populate('user', 'name email')
    .populate('products.product')
    .sort({ cancelledAt: -1 });
    
    res.json(cancellationRequests);
  } catch (error) {
    console.error('Get cancellation requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// NEW: Admin updates cancellation status
exports.updateCancellationStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.cancellationStatus = status;

    if (status === 'approved') {
      // Process refund and coin adjustments
      order.orderStatus = 'cancelled';
      
      // Refund coins if any were redeemed
      if (order.coinsRedeemed > 0) {
        await User.findByIdAndUpdate(order.user._id, {
          $inc: { coinsBalance: order.coinsRedeemed }
        });
        console.log(`✅ Coins refunded: ${order.coinsRedeemed} to user ${order.user._id}`);
      }
      
      // Cancel pending coins
      if (order.coinsEarned > 0 && order.coinStatus === 'pending') {
        order.coinStatus = 'cancelled';
        console.log(`❌ Pending coins cancelled: ${order.coinsEarned} for order ${order._id}`);
      }

      // Send email to user about approved cancellation
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: '"Shop Support" <support@yourstore.com>',
          to: order.user.email,
          subject: `✅ Order Cancellation Approved - #${order._id}`,
          html: `
            <h2>Your Cancellation Request Has Been Approved</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your cancellation request for order <strong>#${order._id}</strong> has been approved.</p>
            ${order.coinsRedeemed > 0 ? 
              `<p><strong>${order.coinsRedeemed} coins</strong> have been refunded to your account.</p>` : 
              ''
            }
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order._id}</li>
              <li>Total Amount: ₹${order.totalAmount}</li>
              <li>Cancellation Reason: ${order.cancellationReason}</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thank you,<br>Your Store Team</p>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error("❌ Failed to send approval email:", emailErr);
        }
      }

    } else if (status === 'rejected') {
      // Revert cancellation
      order.cancelled = false;
      order.cancellationStatus = 'rejected';
      // Keep the original order status

      // Send email to user about rejected cancellation
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: '"Shop Support" <support@yourstore.com>',
          to: order.user.email,
          subject: `❌ Order Cancellation Rejected - #${order._id}`,
          html: `
            <h2>Your Cancellation Request Has Been Rejected</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your cancellation request for order <strong>#${order._id}</strong> has been rejected.</p>
            <p><strong>Reason:</strong> Your order is already being processed and cannot be cancelled at this stage.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thank you,<br>Your Store Team</p>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error("❌ Failed to send rejection email:", emailErr);
        }
      }
    }

    await order.save();
    res.json({ message: `Cancellation ${status}`, order });
    
  } catch (error) {
    console.error('Update cancellation status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete order" });
  }
};

// NEW: User requests return
exports.requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to return this order' });
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ 
        message: 'Only delivered orders can be returned' 
      });
    }

    // Check if return window is available (24 hours)
    const deliveredTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - deliveredTime) / (1000 * 60 * 60);
    
    if (hoursDifference > 24) {
      return res.status(400).json({ 
        message: 'Return window expired. Returns must be requested within 24 hours of delivery.' 
      });
    }

    // Check if return already requested
    if (order.returnRequested) {
      return res.status(400).json({ 
        message: 'Return already requested for this order' 
      });
    }

    // Mark as return requested
    order.returnRequested = true;
    order.returnReason = reason;
    order.returnRequestedAt = new Date();
    order.returnBy = 'user';
    order.returnStatus = 'requested';

    await order.save();
    
    // Send email notification to admin about return request
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.ADMIN_EMAIL_PASS,
        },
      });

      const productDetails = order.products.map((p) => {
        const name = p.product?.name || "Unknown";
        return `<li>${p.quantity} × ${name}</li>`;
      }).join("");

      const mailOptions = {
        from: '"Shop Notification" <no-reply@yourstore.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `🔄 Return Request for Order #${order._id}`,
        html: `
          <h2>Return Request Received</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>User:</strong> ${order.user.name} (${order.user.email})</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Delivered At:</strong> ${order.updatedAt.toLocaleString()}</p>
          <p><strong>Return Requested At:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Time Since Delivery:</strong> ${Math.floor(hoursDifference)} hours</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Products:</strong></p>
          <ul>${productDetails}</ul>
          <p><em>Please check the admin panel to process this return request.</em></p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error("❌ Failed to send return email:", emailErr);
      }
    }

    res.json({ 
      message: 'Return request submitted. Admin will process it shortly.', 
      order 
    });
    
  } catch (error) {
    console.error('Return request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// NEW: Admin gets return requests
exports.getReturnRequests = async (req, res) => {
  try {
    const returnRequests = await Order.find({
      returnRequested: true,
      returnStatus: 'requested'
    })
    .populate('user', 'name email')
    .populate('products.product')
    .sort({ returnRequestedAt: -1 });
    
    res.json(returnRequests);
  } catch (error) {
    console.error('Get return requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// NEW: Admin updates return status
exports.updateReturnStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.returnStatus = status;

    if (status === 'approved') {
      // Process refund and coin adjustments
      order.orderStatus = 'returned';
      
      // Refund coins if any were redeemed
      if (order.coinsRedeemed > 0) {
        await User.findByIdAndUpdate(order.user._id, {
          $inc: { coinsBalance: order.coinsRedeemed }
        });
        console.log(`✅ Coins refunded: ${order.coinsRedeemed} to user ${order.user._id}`);
      }
      
      // Cancel pending coins if not already credited
      if (order.coinsEarned > 0 && order.coinStatus === 'pending') {
        order.coinStatus = 'cancelled';
        console.log(`❌ Pending coins cancelled: ${order.coinsEarned} for order ${order._id}`);
      }

      // Send email to user about approved return
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: '"Shop Support" <support@yourstore.com>',
          to: order.user.email,
          subject: `✅ Return Request Approved - #${order._id}`,
          html: `
            <h2>Your Return Request Has Been Approved</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your return request for order <strong>#${order._id}</strong> has been approved.</p>
            ${order.coinsRedeemed > 0 ? 
              `<p><strong>${order.coinsRedeemed} coins</strong> have been refunded to your account.</p>` : 
              ''
            }
            <p><strong>Return Details:</strong></p>
            <ul>
              <li>Order ID: ${order._id}</li>
              <li>Total Amount: ₹${order.totalAmount}</li>
              <li>Return Reason: ${order.returnReason}</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thank you,<br>Your Store Team</p>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error("❌ Failed to send return approval email:", emailErr);
        }
      }

    } else if (status === 'rejected') {
      // Revert return request
      order.returnRequested = false;
      order.returnStatus = 'rejected';
      // Keep the order status as delivered

      // Send email to user about rejected return
      if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: '"Shop Support" <support@yourstore.com>',
          to: order.user.email,
          subject: `❌ Return Request Rejected - #${order._id}`,
          html: `
            <h2>Your Return Request Has Been Rejected</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your return request for order <strong>#${order._id}</strong> has been rejected.</p>
            <p><strong>Reason:</strong> The return window has expired or the product doesn't meet return criteria.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thank you,<br>Your Store Team</p>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error("❌ Failed to send return rejection email:", emailErr);
        }
      }
    }

    await order.save();
    res.json({ message: `Return ${status}`, order });
    
  } catch (error) {
    console.error('Update return status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};