// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // ◀ Required हटा दिया
  googleId: { type: String }, // ◀ नया field
  coinsBalance: { type: Number, required: true, default: 0 },

  // Email verification
  isVerified: { type: Boolean, default: false },
  emailOTP: { type: String, default: null },
  otpExpires: { type: Date, default: null },

}, {
  timestamps: true // ◀ Automatic created/updated dates
});




// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);