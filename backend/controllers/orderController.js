// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { buildOrderItemSnapshot } = require("../utils/orderItemSnapshot");
const { getNextOrderNumber } = require("../utils/orderNumber");
const { sendOrderPlacedEmails } = require("../utils/orderEmails");
const {
  assignShiprocketAwb,
  syncOrderToShiprocket,
} = require("../utils/shiprocket");

const getVariantForSize = (product, selectedSize) => {
  const variants = product.sizeVariants || [];
  return variants.find((variant) => String(variant.size || "").trim().toUpperCase() === selectedSize);
};

const parseProducts = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  // when multipart, products may come as JSON string
  try { return JSON.parse(raw); } catch { return []; }
};

const getOrderReference = (order) => order.orderNumber || String(order._id);

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    const products = parseProducts(req.body.products);

    const address = req.body.address
      ? JSON.parse(req.body.address)
      : {
          name: req.body["address[name]"],
          phone: req.body["address[phone]"],
          email: req.body["address[email]"] || "",
          street: req.body["address[street]"],
          city: req.body["address[city]"],
          state: req.body["address[state]"],
          postalCode: req.body["address[postalCode]"],
        };

    const selectedSide = req.body.selectedSide || "";

    if (!products.length || !address || !address.name) {
      return res.status(400).json({ message: "Missing or invalid order data" });
    }

    // ✅ FILES
    const customImagePath = req.files?.customImage?.[0]
      ? `/uploads/${req.files.customImage[0].filename}`
      : "";
    const customPdfPath = req.files?.customPdf?.[0]
      ? `/uploads/${req.files.customPdf[0].filename}`
      : "";

    // ✅ USER
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    address.email = address.email || user.email || "";
    address.country = address.country || "India";

    // 🔥🔥🔥 MAIN FIX START (SECURE PRICING)
    let totalAmount = 0;
    const orderItems = [];

    for (const it of products) {
      const product = await Product.findById(it.product);

      if (!product) continue;

      const qty = Number(it.quantity || 1);
      const selectedSize = String(it.selectedSize || "").trim().toUpperCase();

      const allowedSizes = (product.sizes || []).map(size => String(size).trim().toUpperCase());
      const selectedVariant = getVariantForSize(product, selectedSize);
      const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

      // ✅ STOCK CHECK
      if (availableStock < qty) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      if (allowedSizes.length && !allowedSizes.includes(selectedSize)) {
        return res.status(400).json({
          message: `Please select a valid size for ${product.name}`,
        });
      }

      const price = product.price?.sale || 0;

      totalAmount += price * qty;

      orderItems.push(buildOrderItemSnapshot(product, { ...it, quantity: qty }, price));
    }

    if (!orderItems.length || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid order" });
    }
    // 🔥🔥🔥 MAIN FIX END

    const payableAmount = totalAmount;

    // ✅ CREATE ORDER
    const order = new Order({
      orderNumber: await getNextOrderNumber(),
      user: userId,
      products: orderItems,
      totalAmount,
      payableAmount,
      paymentStatus: "Pending",
      paymentMethod: "COD",
      orderStatus: "pending",
      customizationUploads: {
        image: customImagePath,
        pdf: customPdfPath,
        selectedSide,
      },
      address,
    });

    await order.save();
    await order.populate("products.product");

    // ✅ STOCK REDUCE
    for (const item of orderItems) {
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

    try {
      const emailResults = await sendOrderPlacedEmails(order);
      for (const result of emailResults) {
        if (!result.sent) {
          console.error(
            `Order email failed for ${result.role} (${getOrderReference(order)}):`,
            result.error
          );
        }
      }
    } catch (emailError) {
      console.error(
        `Order email setup failed (${getOrderReference(order)}):`,
        emailError.message
      );
    }

    try {
      await syncOrderToShiprocket(order);
    } catch (shiprocketError) {
      console.error(
        `Shiprocket sync failed for order ${getOrderReference(order)}:`,
        shiprocketError.message
      );
    }

    res.status(201).json({
      order,
    });

  } catch (err) {
    console.error("❌ Error placing order:", err);
    res.status(500).json({
      message: "Failed to place order",
      error: err.message,
    });
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
    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(id).populate("products.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let shiprocketWarning = "";
    if (status === "shipped") {
      try {
        if (!order.shiprocket?.shipmentId) {
          await syncOrderToShiprocket(order);
        }

        if (!order.shiprocket?.shipmentId) {
          return res.status(409).json({
            message: "Order cannot be marked shipped without a Shiprocket shipment ID",
          });
        }
      } catch (shiprocketError) {
        console.error(
          `Shiprocket sync failed for order ${getOrderReference(order)}:`,
          shiprocketError.message
        );
        return res.status(502).json({
          message: "Order was not marked shipped",
          error: shiprocketError.message,
        });
      }
    }

    // Admin status ke through paymentStatus bhi control kare
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

    if (status === "shipped") {
      try {
        if (!order.shiprocket?.awbCode) {
          await assignShiprocketAwb(order);
        }
      } catch (shiprocketError) {
        shiprocketWarning = shiprocketError.message;
        console.error(
          `Shiprocket sync failed for order ${getOrderReference(order)}:`,
          shiprocketWarning
        );
      }
    }

    res.json({
      message: shiprocketWarning
        ? "Order marked shipped, but AWB assignment is pending"
        : "Order status updated",
      order,
      shiprocketWarning,
    });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ message: "Failed to update status" });
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
        subject: `❌ Cancellation Request for Order #${getOrderReference(order)}`,
        html: `
          <h2>Cancellation Request Received</h2>
          <p><strong>Order ID:</strong> ${getOrderReference(order)}</p>
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
      order.orderStatus = 'cancelled';

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
          subject: `✅ Order Cancellation Approved - #${getOrderReference(order)}`,
          html: `
            <h2>Your Cancellation Request Has Been Approved</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your cancellation request for order <strong>#${getOrderReference(order)}</strong> has been approved.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${getOrderReference(order)}</li>
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
          subject: `❌ Order Cancellation Rejected - #${getOrderReference(order)}`,
          html: `
            <h2>Your Cancellation Request Has Been Rejected</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your cancellation request for order <strong>#${getOrderReference(order)}</strong> has been rejected.</p>
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
        subject: `🔄 Return Request for Order #${getOrderReference(order)}`,
        html: `
          <h2>Return Request Received</h2>
          <p><strong>Order ID:</strong> ${getOrderReference(order)}</p>
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
      order.orderStatus = 'returned';

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
          subject: `✅ Return Request Approved - #${getOrderReference(order)}`,
          html: `
            <h2>Your Return Request Has Been Approved</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your return request for order <strong>#${getOrderReference(order)}</strong> has been approved.</p>
            <p><strong>Return Details:</strong></p>
            <ul>
              <li>Order ID: ${getOrderReference(order)}</li>
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
          subject: `❌ Return Request Rejected - #${getOrderReference(order)}`,
          html: `
            <h2>Your Return Request Has Been Rejected</h2>
            <p>Dear ${order.user.name},</p>
            <p>Your return request for order <strong>#${getOrderReference(order)}</strong> has been rejected.</p>
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
