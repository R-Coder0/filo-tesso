const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Admin authentication middleware
const isAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === process.env.ADMIN_TOKEN) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized admin" });
  }
};

// ✅ User authentication middleware (FIXED)
const protect = async (req, res, next) => {
  try {
    console.log("🛡️ Auth Middleware - Headers:", req.headers);
    
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = header.split(" ")[1];
    console.log("🛡️ Token received:", token ? "Present" : "Missing");

    // extra safety check
    if (!token || token === "undefined" || token === "null") {
      console.log("❌ Invalid token format");
      return res.status(401).json({ message: "Invalid or missing token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded successfully:", decoded);
    } catch (verifyErr) {
      console.error("❌ JWT verify failed:", verifyErr.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ✅ IMPORTANT FIX: Check if decoded has id property
    if (!decoded.id) {
      console.error("❌ No user ID in decoded token:", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.error("❌ User not found for ID:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User authenticated:", user.email);
    
    // ✅ FIX: Use consistent property names for wishlist compatibility
    req.user = {
      _id: user._id,           // ← Added _id for wishlist controller
      id: user._id.toString(), // ← Keep id for backward compatibility
      name: user.name,
      email: user.email
    };
    
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = { isAdmin, protect };