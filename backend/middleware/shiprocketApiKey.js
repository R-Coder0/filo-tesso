const crypto = require("crypto");

const secureCompare = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const verifyShiprocketApiKey = (req, res, next) => {
  const configuredKey = process.env.SHIPROCKET_API_KEY;

  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      message: "Shiprocket catalog API is not configured",
    });
  }

  const suppliedKey = req.get("x-api-key");
  if (!suppliedKey || !secureCompare(suppliedKey, configuredKey)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};

module.exports = { verifyShiprocketApiKey };
