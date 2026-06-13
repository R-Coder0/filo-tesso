const express = require("express");
const router = express.Router();
const {
  createShipment,
  downloadShipmentLabel,
  refreshShipment,
} = require("../controllers/shiprocketController");
const { isAdmin } = require("../middleware/authMiddleware");
const {
  verifyShiprocketApiKey,
} = require("../middleware/shiprocketApiKey");
const {
  getShiprocketProducts,
  getShiprocketCollections,
  getShiprocketProductsByCollection,
} = require("../controllers/productController");

router.get("/products", verifyShiprocketApiKey, getShiprocketProducts);
router.get("/collections", verifyShiprocketApiKey, getShiprocketCollections);
router.get(
  "/collections/:collection/products",
  verifyShiprocketApiKey,
  getShiprocketProductsByCollection
);
router.get(
  "/products-by-collection",
  verifyShiprocketApiKey,
  getShiprocketProductsByCollection
);
router.post("/orders/:orderId/sync", isAdmin, createShipment);
router.post("/orders/:orderId/refresh", isAdmin, refreshShipment);
router.get("/orders/:orderId/label", isAdmin, downloadShipmentLabel);
router.post("/create-shipment", isAdmin, createShipment);

module.exports = router;
