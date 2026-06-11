const express = require('express');
const router = express.Router();
const Review = require('../models/Reveiw');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const resolveProduct = async (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return null;

  const lookup = /^[a-f\d]{24}$/i.test(value)
    ? { _id: value }
    : /^\d+$/.test(value)
      ? { productId: Number(value) }
      : { slug: slugify(value) };

  return Product.findOne(lookup).select("_id");
};

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const product = await resolveProduct(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reviews = await Review.find({ product: product._id })
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
    const product = await resolveProduct(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: product._id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create new review
    const review = new Review({
      user: req.user.id,
      product: product._id,
      rating,
      comment
    });

    await review.save();

    // Update product ratings
    await updateProductRatings(product._id);

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
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;
  
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
