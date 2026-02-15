const express = require('express');
const router = express.Router();
const Review = require('../models/Reveiw');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a review
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create new review
    const review = new Review({
      user: req.user.id,
      product: productId,
      rating,
      comment
    });

    await review.save();

    // Update product ratings
    await updateProductRatings(productId);

    // Populate user info before sending response
    await review.populate('user', 'name');

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product ratings function
const updateProductRatings = async (productId) => {
  const reviews = await Review.find({ product: productId });
  
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    breakdown[review.rating]++;
  });

  await Product.findByIdAndUpdate(productId, {
    'ratings.average': averageRating,
    'ratings.count': totalReviews,
    'ratings.breakdown': breakdown
  });
};

module.exports = router;