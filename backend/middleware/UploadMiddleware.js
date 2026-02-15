const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================== Ensure uploads directory ==================
const UPLOAD_DIR = "uploads";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ================== Storage ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname || "");
    cb(null, uniqueName);
  },
});

// ================== SAFE File Filters ==================

// ✅ IMAGE ONLY (CRASH-PROOF)
const imageOnlyFilter = (req, file, cb) => {
  // Ignore preflight / non-multipart requests
  if (req.method === "OPTIONS") {
    return cb(null, false);
  }

  // If no file or mimetype, silently skip
  if (!file || !file.mimetype) {
    return cb(null, false);
  }

  // Allow only images
  if (!file.mimetype.startsWith("image/")) {
    return cb(null, false);
  }

  cb(null, true);
};

// ✅ IMAGE + PDF (CRASH-PROOF)
const imageOrPdfFilter = (req, file, cb) => {
  if (req.method === "OPTIONS") {
    return cb(null, false);
  }

  if (!file || !file.mimetype) {
    return cb(null, false);
  }

  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    return cb(null, true);
  }

  cb(null, false);
};

// ================== Multer Uploaders ==================

// Product uploads (main image + gallery)
const uploadProduct = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
}).fields([
  { name: "image", maxCount: 1 },   // main image
  { name: "images", maxCount: 5 },  // gallery images
]);

// Order uploads (custom image / pdf)
const uploadOrder = multer({
  storage,
  fileFilter: imageOrPdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
}).fields([
  { name: "customImage", maxCount: 1 },
  { name: "customPdf", maxCount: 1 },
]);

// ================== Error Handler ==================
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

// ================== Exports ==================
module.exports = {
  uploadProduct,
  uploadOrder,
  uploadErrorHandler,
};
