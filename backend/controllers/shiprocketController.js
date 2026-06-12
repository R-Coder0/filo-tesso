const Order = require("../models/Order");
const { syncOrderToShiprocket } = require("../utils/shiprocket");

exports.createShipment = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.body.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findById(orderId).populate("products.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shiprocket = await syncOrderToShiprocket(order);
    res.json({
      success: true,
      message: "Order synced with Shiprocket",
      shiprocket,
    });
  } catch (error) {
    console.error("Shiprocket sync failed:", error.message);
    res.status(502).json({
      success: false,
      message: "Failed to sync order with Shiprocket",
      error: error.message,
    });
  }
};
