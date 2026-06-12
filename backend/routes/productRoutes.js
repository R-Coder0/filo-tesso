// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authMiddleware');
const { verifyShiprocketApiKey } = require('../middleware/shiprocketApiKey');
const { uploadProduct, uploadErrorHandler } = require('../middleware/UploadMiddleware');
const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getLatestProducts,
  getShiprocketProducts,
  getShiprocketCollections,
  getShiprocketProductsByCollection,
} = require('../controllers/productController');

// Routes
router.get('/', getProducts);                  // Get all products
router.get('/latest', getLatestProducts);      // ✅ YEH NAYA ROUTE ADD KARO
router.get('/shiprocket/products', verifyShiprocketApiKey, getShiprocketProducts);
router.get('/shiprocket/collections', verifyShiprocketApiKey, getShiprocketCollections);
router.get('/shiprocket/collections/:collection/products', verifyShiprocketApiKey, getShiprocketProductsByCollection);
router.get('/shiprocket/products-by-collection', verifyShiprocketApiKey, getShiprocketProductsByCollection);

router.get('/:id', getProductById);            // Get product by ID

// Admin only:
router.post('/', isAdmin, uploadProduct, uploadErrorHandler, addProduct); // Add product (main + gallery)
router.put('/:id', isAdmin, uploadProduct, uploadErrorHandler, updateProduct); // Update product (fields + optional images)
router.delete('/:id', isAdmin, deleteProduct);        // Delete product

module.exports = router;
