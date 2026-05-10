// backend/routes/adminRoutes.js (or similar)
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authMiddleware');
const {
  getFirstOrderDiscountSetting,
} = require('../utils/firstOrderDiscount');
const DiscountSetting = require('../models/DiscountSetting');

router.post('/login', (req, res) => {
  
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true, token: 'admin-token-123' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

router.get('/first-order-discount', async (req, res) => {
  try {
    const setting = await getFirstOrderDiscountSetting();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: "Failed to load discount setting" });
  }
});

router.put('/first-order-discount', isAdmin, async (req, res) => {
  try {
    const enabled = Boolean(req.body.enabled);
    const percentage = Number(req.body.percentage);

    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({ message: "Discount percentage must be between 0 and 100" });
    }

    const setting = await DiscountSetting.findOneAndUpdate(
      { key: "firstOrder" },
      { enabled, percentage },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    res.json({
      enabled: Boolean(setting.enabled),
      percentage: Number(setting.percentage),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update discount setting" });
  }
});

module.exports = router;
