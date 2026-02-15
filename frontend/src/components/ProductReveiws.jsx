import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Star, 
  StarHalf, 
  User,
  Calendar
} from 'lucide-react';

const ProductReviews = ({ productId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch product details and reviews
  useEffect(() => {
    fetchProductAndReviews();
  }, [productId]);

  const fetchProductAndReviews = async () => {
    try {
      setLoading(true);
      // Fetch product details
      const productRes = await axios.get(`/api/products/${productId}`);
      setProduct(productRes.data);
      
      // Fetch reviews
      const reviewsRes = await axios.get(`/api/reviews/product/${productId}`);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/reviews', {
        productId,
        rating,
        comment: comment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh data
      await fetchProductAndReviews();
      
      // Reset form
      setRating(0);
      setComment('');
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Star rating display component
  const StarRating = ({ rating, size = 18, onRatingChange, readonly = false }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly}
          >
            <Star
              size={size}
              className={`${
                (hoverRating || rating) >= star 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
      
      {/* Rating Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {product?.ratings?.average?.toFixed(1) || 0}
            </div>
            <StarRating rating={product?.ratings?.average} readonly={true} size={24} />
            <div className="text-gray-600 text-sm mt-2">
              {product?.ratings?.count || 0} reviews
            </div>
          </div>
          
          <div className="md:col-span-2">
            {/* Rating breakdown */}
            {[5, 4, 3, 2, 1].map((star) => {
              const count = product?.ratings?.breakdown?.[star] || 0;
              const total = product?.ratings?.count || 1;
              const percentage = (count / total) * 100;
              
              return (
                <div key={star} className="flex items-center mb-3">
                  <div className="flex items-center w-20">
                    <span className="text-sm text-gray-600 w-6">{star}</span>
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="w-8 text-right">
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Write a Review</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating}
              readonly={false}
              size={28}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product (minimum 10 characters)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={submitLoading || !user}
            className={`px-6 py-2 rounded-md font-medium ${
              submitLoading || !user
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {submitLoading ? 'Submitting...' : 'Submit Review'}
          </button>
          
          {!user && (
            <p className="text-gray-500 text-sm mt-2">
              Please login to write a review
            </p>
          )}
        </form>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">No reviews yet</div>
          <div className="text-gray-400">Be the first to review this product!</div>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Customer Reviews ({reviews.length})
          </h3>
          
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {review.user?.avatar ? (
                        <img 
                          src={review.user.avatar} 
                          alt={review.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <User size={20} className="text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {review.user?.name || 'Anonymous'}
                      </div>
                      <StarRating rating={review.rating} readonly={true} size={16} />
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar size={14} className="mr-1" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;