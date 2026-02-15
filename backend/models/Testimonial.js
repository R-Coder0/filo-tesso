// backend/models/Testimonial.js
const mongoose = require("mongoose");

const TestimonialSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, default: "Guest" },
  avatarUrl: { type: String, default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model("Testimonial", TestimonialSchema);
