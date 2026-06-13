const Order = require("../models/Order");
const axios = require("axios");
const {
  generateShiprocketLabel,
  refreshShiprocketShipment,
  syncOrderToShiprocket,
} = require("../utils/shiprocket");

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

exports.refreshShipment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shiprocket = await refreshShiprocketShipment(order);
    res.json({ success: true, shiprocket });
  } catch (error) {
    console.error("Shiprocket refresh failed:", error.message);
    res.status(502).json({
      success: false,
      message: "Failed to refresh Shiprocket shipment",
      error: error.message,
    });
  }
};

exports.downloadShipmentLabel = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const labelUrl = await generateShiprocketLabel(order);
    const labelResponse = await axios.get(labelUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    res.set({
      "Content-Type": labelResponse.headers["content-type"] || "application/pdf",
      "Content-Disposition": `attachment; filename="${order.orderNumber || order._id}-label.pdf"`,
      "Cache-Control": "private, no-store",
    });
    res.send(labelResponse.data);
  } catch (error) {
    console.error("Shiprocket label download failed:", error.message);
    res.status(502).json({
      success: false,
      message: "Failed to download shipment label",
      error: error.message,
    });
  }
};

exports.handleTrackingWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    const lookup = [];

    if (payload.sr_order_id) {
      lookup.push({ "shiprocket.orderId": String(payload.sr_order_id) });
    }
    if (payload.order_id) {
      lookup.push({ orderNumber: String(payload.order_id).toUpperCase() });
    }
    if (payload.awb) {
      lookup.push({ "shiprocket.awbCode": String(payload.awb) });
    }

    const order = lookup.length ? await Order.findOne({ $or: lookup }) : null;
    if (!order) {
      return res.status(200).json({ success: true, message: "Order not found" });
    }

    const awbCode = payload.awb ? String(payload.awb) : order.shiprocket?.awbCode;
    order.shiprocket = {
      ...order.shiprocket?.toObject?.(),
      syncStatus: "synced",
      orderId: payload.sr_order_id
        ? String(payload.sr_order_id)
        : order.shiprocket?.orderId,
      status:
        payload.current_status ||
        payload.shipment_status ||
        order.shiprocket?.status,
      statusCode:
        Number(payload.current_status_id || payload.shipment_status_id) ||
        order.shiprocket?.statusCode,
      awbCode,
      courierName: payload.courier_name || order.shiprocket?.courierName,
      trackingUrl:
        order.shiprocket?.trackingUrl ||
        (awbCode ? `https://shiprocket.co/tracking/${awbCode}` : ""),
      lastTrackedAt: new Date(),
      lastError: "",
      response: {
        ...(order.shiprocket?.response || {}),
        webhook: payload,
      },
    };
    await order.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Shiprocket webhook failed:", error.message);
    res.status(200).json({ success: false });
  }
};
