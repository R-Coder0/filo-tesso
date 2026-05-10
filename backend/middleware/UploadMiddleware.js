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

const MAX_PRODUCT_GALLERY_IMAGES = 10;

// Product uploads (main image + gallery)
const uploadProduct = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
}).fields([
  { name: "image", maxCount: 1 }, // main image
  { name: "mainImage", maxCount: 1 }, // older/alternate main image field
  { name: "images", maxCount: MAX_PRODUCT_GALLERY_IMAGES }, // gallery images
  { name: "images[]", maxCount: MAX_PRODUCT_GALLERY_IMAGES }, // common FormData array name
  { name: "gallery", maxCount: MAX_PRODUCT_GALLERY_IMAGES },
  { name: "galleryImages", maxCount: MAX_PRODUCT_GALLERY_IMAGES },
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
    const fieldMessage = err.field ? `: ${err.field}` : "";
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_UNEXPECTED_FILE"
          ? `Unexpected upload field${fieldMessage}. Please upload one main image and up to ${MAX_PRODUCT_GALLERY_IMAGES} gallery images.`
          : err.message,
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
