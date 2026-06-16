// routes/userRoutes.js
const express = require("express");
const { register, login, getMe, googleLogin, verifyEmail, resendOTP, googleAuth, updateProfile} =
  require("../controllers/userController");
  const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/me", protect, getMe);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/google-auth", googleAuth);
router.put("/profile", protect, updateProfile); // ✅ Naya route add karo



module.exports = router;
