import React, { useState } from 'react';
import { Star, Send, CheckCircle, MessageSquare, Lightbulb, User } from 'lucide-react';

export default function ReviewSubmissionPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    review: '',
    suggestions: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!formData.name || !formData.email || !formData.review) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Submitted:', { ...formData, rating });
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', review: '', suggestions: '' });
      setRating(0);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold mb-2">Share Your Experience</h1>
          <p className="text-gray-600 text-lg">Your feedback helps us improve and serve you better</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {submitted ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Thank You!</h2>
            <p className="text-gray-600 text-lg">
              Your review has been submitted successfully. We appreciate your feedback!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rating Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-gray-900" />
                <h2 className="text-2xl font-bold">Rate Your Experience</h2>
              </div>
              
              <div className="flex justify-center gap-4 py-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'fill-gray-900 text-gray-900'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-gray-600">
                  {rating === 0 && 'Click to rate'}
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-gray-900" />
                <h2 className="text-2xl font-bold">Your Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Review Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-gray-900" />
                <h2 className="text-2xl font-bold">Your Review</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your experience *
                </label>
                <textarea
                  name="review"
                  value={formData.review}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Share your thoughts about our website, products, or services..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Suggestions Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="w-6 h-6 text-gray-900" />
                <h2 className="text-2xl font-bold">Suggestions for Improvement</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How can we make our website better? (Optional)
                </label>
                <textarea
                  name="suggestions"
                  value={formData.suggestions}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Share your ideas, feature requests, or areas where we can improve..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 text-lg shadow-sm"
            >
              <Send className="w-5 h-5" />
              Submit Review
            </button>

            <p className="text-center text-gray-500 text-sm">
              * Required fields
            </p>
          </div>
        )}
      </div>
    </div>
  );
}