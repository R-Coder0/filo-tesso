// backend/routes/testimonials.js
const express = require("express");
const router = express.Router();
const Testimonial = require("../models/Testimonial");
const { protect } = require("../middleware/authMiddleware");

// GET all testimonials (most recent first)
router.get("/", async (req, res) => {
  try {
    const data = await Testimonial.find().sort({ createdAt: -1 }).lean();
    res.json(data);
  } catch (err) {
    console.error("GET /api/testimonials error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create testimonial (AUTH REQUIRED)
router.post("/", protect, async (req, res) => {
  try {
    const { rating, text, comment } = req.body;
    const finalText = (text || comment || "").trim();

    if (!rating || !finalText || finalText.length < 5) {
      return res.status(400).json({
        message: "Rating & minimum 5 characters text required",
      });
    }

    // user from JWT
    const userId = req.user.id;
    const name = req.user.name || req.user.email || "User";

    const t = new Testimonial({
      userId,
      name,
      avatarUrl: null,
      rating: Number(rating),
      text: finalText,
    });

    await t.save();
    res.status(201).json(t);
  } catch (err) {
    console.error("POST /api/testimonials error:", err);
    res.status(500).json({ message: "Failed to save testimonial" });
  }
});

module.exports = router;
