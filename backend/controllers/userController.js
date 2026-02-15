// controllers/userController.js
const User = require("../models/User");
const { sendOTPEmail } = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// helper to generate numeric OTP
function generateOTP(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

// -------- REGISTER WITH OTP ----------
// -------- REGISTER WITH OTP (FIXED) ----------
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });
    if (!validator.isEmail(email))
      return res.status(400).json({ message: "Invalid email." });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.isVerified)
      return res.status(400).json({ message: "Email already registered. Please login." });

    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ FIX: Consistent salt rounds use karo
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log("🔐 Password Hashing Debug:", {
      inputPassword: password,
      hashedPassword: hashedPassword,
      saltRounds: saltRounds
    });

    let user;
    if (existing) {
      existing.name = name;
      existing.password = hashedPassword; // ✅ Same hashing method use karo
      existing.emailOTP = otp;
      existing.otpExpires = otpExpires;
      existing.isVerified = false;
      user = await existing.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword, // ✅ Same hashing method use karo
        isVerified: false,
        emailOTP: otp,
        otpExpires,
      });
    }

    try {
      await sendOTPEmail(user.email, otp);
    } catch (err) {
      console.error("Error sending OTP:", err);
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    res.status(201).json({ message: "OTP sent to email.", email: user.email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// -------- VERIFY EMAIL ----------
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isVerified)
      return res.status(400).json({ message: "Email already verified." });

    if (!user.emailOTP || !user.otpExpires)
      return res.status(400).json({ message: "No OTP found." });
    if (new Date() > user.otpExpires)
      return res.status(400).json({ message: "OTP expired." });
    if (user.emailOTP !== otp)
      return res.status(400).json({ message: "Invalid OTP." });

    user.isVerified = true;
    user.emailOTP = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Email verified.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------- RESEND OTP ----------
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isVerified)
      return res.status(400).json({ message: "Already verified." });

    const otp = generateOTP(6);
    user.emailOTP = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendOTPEmail(user.email, otp);
    } catch (err) {
      console.error("Error resending OTP:", err);
      return res.status(500).json({ message: "Failed to send OTP." });
    }

    res.json({ message: "OTP resent to email." });
  } catch (err) {
    console.error("resendOTP error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// -------- LOGIN (WITH MORE DEBUG) ----------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt for:", email);
    console.log("📥 Input password:", password);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ message: "Invalid email or password." });
    }

    console.log("📋 User found:", {
      id: user._id,
      email: user.email,
      hasPassword: !!user.password,
      isVerified: user.isVerified,
      storedHash: user.password
    });

    // ✅ FIX: Check if user has password field
    if (!user.password) {
      console.log("❌ No password field - Google user");
      return res.status(400).json({ 
        message: "This email is registered with Google. Please use Google login." 
      });
    }

    if (!user.isVerified) {
      console.log("❌ User not verified");
      return res.status(403).json({ message: "Please verify your email before login." });
    }

    console.log("🔑 Comparing password...");
    console.log("Input:", password);
    console.log("Stored hash:", user.password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password doesn't match");
      // ✅ TEMPORARY: Direct string compare for debugging
      if (password === "1234") {
        console.log("⚠️ But direct string match found - Hashing issue confirmed");
      }
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { 
      expiresIn: "7d" 
    });
    
    console.log("✅ Login successful");
    res.json({ 
      message: "Login successful", 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coinsBalance: user.coinsBalance || 0
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// -------- GOOGLE LOGIN (Fixed) ----------
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "No Google token provided." });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
      });
    }

    const jwtToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coinsBalance: user.coinsBalance || 0,
      },
    });
  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ message: "Google login failed", error: err.message });
  }
};

// ✅ Get current user profile (FIXED)
exports.getMe = async (req, res) => {
  try {
    console.log("📋 GetMe request - req.user:", req.user);
    
    // ✅ Safety check - ensure req.user exists
    if (!req.user || !req.user.id) {
      console.error("❌ GetMe - No user in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      console.error("❌ GetMe - User not found in DB:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ GetMe - User found:", {
      id: user._id,
      name: user.name,
      email: user.email
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      coinsBalance: user.coinsBalance || 0,
    });
  } catch (err) {
    console.error("❌ GetMe error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Google OAuth Code Exchange
exports.googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: "Authorization code required" });
    }

    // Current origin get karo for redirect_uri
    const origin = req.headers.origin || 'http://localhost:5173';

    // Google se access token exchange karo
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: origin + '/login'
    });

    const { access_token, id_token } = tokenResponse.data;

    // Google user info get karo using ID token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // User create/update karo
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
      });
    } else {
      // Existing user ko update karo agar googleId nahi hai
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const jwtToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coinsBalance: user.coinsBalance || 0,
      },
    });
  } catch (err) {
    console.error("Google OAuth error:", err.response?.data || err.message);
    res.status(500).json({ 
      message: "Google login failed", 
      error: err.response?.data?.error || err.message 
    });
  }
};

// ✅ Update User Profile (FIXED)
exports.updateProfile = async (req, res) => {
  try {
    console.log("🔄 Update profile request received:", req.body);
    console.log("🔄 Update profile - req.user:", req.user);
    
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Profile updated successfully:", user.name);
    
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        coinsBalance: user.coinsBalance || 0,
      },
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};