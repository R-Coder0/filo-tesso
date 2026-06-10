const express = require("express");
const router = express.Router();
const { createShipment } = require("../controllers/shiprocketController");
const {
  getShiprocketProducts,
  getShiprocketCollections,
  getShiprocketProductsByCollection,
} = require("../controllers/productController");

router.get("/products", getShiprocketProducts);
router.get("/collections", getShiprocketCollections);
router.get("/collections/:collection/products", getShiprocketProductsByCollection);
router.get("/products-by-collection", getShiprocketProductsByCollection);
router.post("/create-shipment", createShipment);

module.exports = router;
