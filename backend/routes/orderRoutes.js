// routes/orderRoutes.js
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  deleteOrder,
  manualCreditCoins,
  cancelOrder, // NEW IMPORT
  getCancellationRequests, // NEW IMPORT
  updateCancellationStatus,
  requestReturn,
  getReturnRequests,
  updateReturnStatus, // NEW IMPORT
} = require('../controllers/orderController');
const { isAdmin, protect } = require('../middleware/authMiddleware');
const { uploadOrder } = require('../middleware/UploadMiddleware');

// User: create a new order
router.post('/', protect, uploadOrder, createOrder);

// User: fetch logged-in user's orders
router.get('/my-orders', protect, getMyOrders);

// User: cancel order
router.patch('/:orderId/cancel', protect, cancelOrder); // NEW ROUTE

// Admin: fetch all orders
router.get('/admin', isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product');
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Admin: get cancellation requests
router.get('/admin/cancellation-requests', isAdmin, getCancellationRequests); // NEW ROUTE

// Admin: update cancellation status
router.patch('/admin/:orderId/cancellation-status', isAdmin, updateCancellationStatus); // NEW ROUTE

// Admin: update an order's payment status
router.post('/update-status', isAdmin, updateOrderStatus);

// Admin: manual coin credit endpoint
router.post('/manual-credit-coins', isAdmin, manualCreditCoins);

// Admin: delete an order by ID
router.delete('/:id', isAdmin, deleteOrder);

// User: request return
router.patch('/:orderId/return', protect, requestReturn); // NEW ROUTE

// Admin: get return requests
router.get('/admin/return-requests', isAdmin, getReturnRequests); // NEW ROUTE

// Admin: update return status
router.patch('/admin/:orderId/return-status', isAdmin, updateReturnStatus); // NEW ROUTE

module.exports = router;