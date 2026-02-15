const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// frontend calls this before payment
router.post("/create-order", protect, createOrder);

// after payment success → frontend calls this to verify
router.post("/verify", protect, verifyPayment);

module.exports = router;
