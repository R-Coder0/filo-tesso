// src/pages/ProductDetailPage.jsx (updated sections)

import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useWishlist } from "../context/WishlistContext";
import { GoDotFill } from "react-icons/go";

import {
  FaCartPlus,
  FaShoppingBag,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaChevronDown,
  FaChevronUp,
  FaShippingFast,
  FaUndoAlt,
} from "react-icons/fa";
import {
  Star,
  User,
  Calendar,
  MessageCircle,
  Package,
  RotateCcw,
  Truck,
  Info,
} from "lucide-react";

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

const ProductDetailPage = () => {
  const { id } = useParams();
  const [selectedSide, setSelectedSide] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [customFile, setCustomFile] = useState(null);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState("description"); // 'description', 'features', 'refund', 'shipping'

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Wishlist
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWishlisted = !!product && isInWishlist(product._id);

  // Static FAQ content for refund and shipping
  const refundPolicy = {
    title: "Refund Policy",
    content: "We offer a 30-day return policy on all unused items in original packaging. Customized products are non-refundable unless defective. Refunds are processed within 5-7 business days after receiving the returned item."
  };

  const shippingPolicy = {
    title: "Shipping Policy",
    content: "Free shipping on orders above ₹999. Standard delivery takes 3-5 business days. Express shipping available at additional cost. Orders are dispatched within 24 hours on business days."
  };

  useEffect(() => {
    console.log('🔐 ProductDetailPage - Auth Context:', {
      user: user,
      token: token ? 'Present' : 'Missing',
      hasUser: !!user,
      fromAuthContext: true
    });
  }, [user, token]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/products/${id}`);
        setProduct(data);
        setSelectedImage(data.image);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, apiUrl]);

  useEffect(() => {
    if (product) {
      fetchReviews();
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`${apiUrl}/api/reviews/product/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (error.response?.status === 404) {
        setReviews([]);
      }
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      setRelatedLoading(true);
      const { data } = await axios.get(`${apiUrl}/api/products?category=${encodeURIComponent(product.category)}`);
      const filteredData = data.filter(p => p._id !== product._id);
      setRelatedProducts(filteredData);
    } catch (error) {
      console.error("Error fetching related products:", error);
      setRelatedProducts([]);
    } finally {
      setRelatedLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWishlistClick = async () => {
    if (!product) return;

    console.log('❤️ Wishlist click - Auth Status:', {
      user: user,
      token: token ? 'Present' : 'Missing',
      productId: product._id,
      isWishlisted: isWishlisted
    });

    if (!user || !token) {
      showToast("Please login to use wishlist feature", "error");
      navigate("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        showToast("Removed from wishlist", "success");
      } else {
        await addToWishlist(product._id);
        showToast("Added to wishlist", "success");
      }
    } catch (error) {
      console.error('❌ Wishlist operation failed:', error);
      showToast(error.message || "Wishlist operation failed", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    const sizeToUse = selectedSize || (product?.sizes?.[0] ?? DEFAULT_SIZES[0]);
    const productToAdd = {
      ...product,
      quantity,
      selectedSize: sizeToUse,
      selectedColor
    };
    addToCart(productToAdd);
    showToast("Added to Cart Successfully!", "success");
  };

  const handleBuyNow = () => {
    const sizeToUse = selectedSize || (product?.sizes?.[0] ?? DEFAULT_SIZES[0]);
    const productToAdd = {
      ...product,
      quantity,
      selectedSize: sizeToUse,
      selectedColor
    };

    const isCustomize = (product.category || "").toLowerCase() === "customize";

    navigate("/checkout", {
      state: {
        cartItems: [{ ...productToAdd, quantity }],
        totalAmount: product.price * quantity,
        customUploads: {
          singleFile: customFile || null,
          isCustomize,
          selectedSide: isCustomize ? selectedSide : ""
        }
      },
    });
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) setQuantity(newQuantity);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      setReviewError('Please login to submit a review');
      return;
    }

    if (reviewRating === 0) {
      setReviewError('Please select a rating');
      return;
    }

    if (reviewComment.trim().length < 10) {
      setReviewError('Review must be at least 10 characters long');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');

    try {
      await axios.post(`${apiUrl}/api/reviews`, {
        productId: id,
        rating: reviewRating,
        comment: reviewComment.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchReviews();
      setReviewRating(0);
      setReviewComment('');
      setShowReviewForm(false);
      showToast('Review submitted successfully!', 'success');

    } catch (error) {
      console.error('❌ Review submission error:', error);
      if (error.response?.status === 401) {
        setReviewError('Your session has expired. Please login again.');
      } else {
        setReviewError(error.response?.data?.message || 'Failed to submit review');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Star Rating Component (improved design)
  const StarRating = ({ rating, size = 18, onRatingChange, readonly = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none`}
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly}
          >
            <Star
              size={size}
              className={`${(hoverRating || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
                } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  const AccordionItem = ({ id, title, children, isOpen, onToggle }) => {
    return (
      <div className="border-b border-gray-300">

        {/* Header */}
        <button
          onClick={() => onToggle(isOpen ? "" : id)}
          className="w-full flex items-center justify-between px-6 py-5 text-left bg-gray-50 hover:bg-gray-100 transition"
        >
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {title}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Overview and product details
            </p>
          </div>

          {isOpen ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </button>

        {/* Content */}
        {isOpen && (
          <div className="px-6 pb-6 bg-white text-gray-700 leading-relaxed">
            {children}
          </div>
        )}
      </div>
    );
  };

  const goBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-medium tracking-wide uppercase">Loading Product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          <button
            onClick={goBack}
            className="bg-black text-white px-6 py-3 font-medium tracking-wide uppercase hover:bg-gray-800 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isCustomize = (product.category || "").toLowerCase() === "customize";
  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES;
  const totalPrice = product.price * quantity;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-white p-4 mt-20">
      {toast && (
        <div className={`fixed top-24 right-6 z-50 p-4 rounded border-l-4 shadow-lg transition-all duration-300 ${toast.type === "success"
          ? "bg-white border-green-500 text-green-800"
          : "bg-white border-red-500 text-red-800"
          }`}>
          <div className="flex items-center space-x-2">
            {toast.type === "success" ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
            >
              <FaArrowLeft className="text-sm" />
              <span className="font-medium tracking-wide uppercase text-sm">Back</span>
            </button>

            <button
              onClick={handleWishlistClick}
              disabled={wishlistLoading}
              className={`flex border py-4 px-8 font-semibold tracking-wide uppercase transition-all duration-200 items-center justify-center space-x-2 ${isWishlisted
                ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                : "border-gray-300 text-gray-700 hover:border-gray-400 hover:text-black"
                } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {wishlistLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isWishlisted ? (
                <FaHeart />
              ) : (
                <FaRegHeart />
              )}
              <span>
                {wishlistLoading ? "Processing..." : isWishlisted ? "Wishlisted" : "Add to Wishlist"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image Gallery */}
         <div className="space-y-6 lg:sticky lg:top-28 h-fit">

            <div className="aspect-square bg-gray-50 overflow-hidden">
              <img
                src={`${apiUrl}${selectedImage}`}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              <img
                src={`${apiUrl}${product.image}`}
                alt="Main"
                className={`w-20 h-20 object-cover cursor-pointer border-2 transition-colors duration-200 ${selectedImage === product.image ? "border-black" : "border-gray-200 hover:border-gray-400"
                  }`}
                onClick={() => setSelectedImage(product.image)}
              />
              {product.gallery?.map((img, idx) => (
                <img
                  key={idx}
                  src={`${apiUrl}${img}`}
                  alt={`View ${idx + 1}`}
                  className={`w-20 h-20 object-cover cursor-pointer border-2 transition-colors duration-200 ${selectedImage === img ? "border-black" : "border-gray-200 hover:border-gray-400"
                    }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {product.category && (
              <div>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 text-xs font-medium tracking-widest uppercase">
                  {product.category}
                  {product.subcategory && ` / ${product.subcategory}`}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <h1 className="text-xl md:text-4xl md:font-bold text-black leading-tight">{product.name}</h1>

              {/* Improved Rating Display */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <StarRating rating={product?.ratings?.average || 0} readonly={true} size={20} />
                  <span className="text-lg font-semibold text-gray-700">
                    {product?.ratings?.average?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <a href="#reviews" className="text-gray-600 hover:text-black transition-colors">
                  {product?.ratings?.count || 0} {product?.ratings?.count === 1 ? 'Review' : 'Reviews'}
                </a>
                <span className="text-gray-400 hidden sm:inline">•</span>
                {/* <span className="text-gray-600">{product?.soldCount || 0} Sold</span> */}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-2xl md:font-bold text-black">₹{product.price.toLocaleString()}</div>
                {/* In Stock Label - Green Color */}
                {/* <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${inStock 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span> */}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 'bg-green-100 text-green-800 border border-green-200`}>
                  <span className={`w-2 h-2 rounded-full mr-2 bg-green-500`}></span>
                  In Stock
                </span>
              </div>

            </div>

            {/* Size and Quantity - Left Right Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
              {/* Size Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-black tracking-wide uppercase">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border font-medium text-sm tracking-wide uppercase transition-colors duration-200 ${selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-700 hover:border-gray-400 hover:text-black"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-black tracking-wide uppercase">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors duration-200"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-medium text-black border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors duration-200"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-black">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customization upload */}
            {isCustomize && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-black tracking-wide uppercase">
                  Upload Reference (Image or PDF)
                </h3>

                {/* Side Selection */}
                <div className="space-y-2">
                  <label className="block text-sm text-gray-700 font-medium">
                    Choose design side:
                  </label>
                  <div className="flex gap-3">
                    {["Front Side", "Back Side", "Both Sides"].map((side) => (
                      <button
                        key={side}
                        onClick={() => setSelectedSide(side)}
                        className={`px-4 py-2 border rounded-sm text-sm font-medium transition-colors duration-200 ${selectedSide === side
                          ? "bg-black text-white border-black"
                          : "border-gray-300 text-gray-700 hover:border-gray-400 hover:text-black"
                          }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                {selectedSide && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-sm text-gray-700 font-medium">
                      Upload file for {selectedSide.toLowerCase()}:
                    </label>

                    <div className="inline-block">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                        onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                        className="text-sm text-gray-700 cursor-pointer file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 
                                   file:rounded-md file:text-sm file:font-medium 
                                   file:bg-white file:text-gray-700 hover:file:bg-gray-100 
                                   focus:file:border-pink-400 focus:file:ring-2 focus:file:ring-pink-300"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      Please upload a clear image or PDF. This file will be attached to your order.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-black text-white md:py-4 md:px-8 py-2 px-4 font-semibold tracking-wide uppercase transition-all duration-200 hover:bg-gray-800 flex items-center justify-center space-x-2"
                >
                  <FaShoppingBag className="text-lg" />
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 border border-gray-300 text-gray-700 md:py-4 md:px-8 py-2 px-4 font-semibold tracking-wide uppercase transition-all duration-200 hover:border-gray-400 hover:text-black flex items-center justify-center space-x-2"
                >
                  <FaCartPlus className="text-lg" />
                  <span className="hidden md:block">Add to Cart</span>
                  <span className="md:hidden">Add</span>
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {/* ✓ Free shipping on orders over ₹999 • ✓ 03-days return policy */}
              </div>
            </div>

            {/* FAQ Accordion Section - Description, Features, Refund, Shipping */}
            <div className="mt-8 border border-gray-300 bg-gray-50">
              <AccordionItem
                id="description"
                title="Description"
                isOpen={openFaq === "description"}
                onToggle={setOpenFaq}
              >
                <p>{product.description}</p>
              </AccordionItem>

              <AccordionItem
                id="specifications"
                title="Specifications"
                isOpen={openFaq === "specifications"}
                onToggle={setOpenFaq}
              >
                <p>Overview and product details</p>
              </AccordionItem>

              <AccordionItem
                id="refund"
                title="Refund Policy"
                isOpen={openFaq === "refund"}
                onToggle={setOpenFaq}
              >
                <p>{refundPolicy.content}</p>
              </AccordionItem>

              <AccordionItem
                id="shipping"
                title="Shipping Policy"
                isOpen={openFaq === "shipping"}
                onToggle={setOpenFaq}
              >
                <p>{shippingPolicy.content}</p>
              </AccordionItem>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-16">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
              {relatedLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((rp) => (
                    <div
                      key={rp._id}
                      onClick={() => navigate(`/product/${rp._id}`)}
                      className="cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        <img
                          src={`${apiUrl}${rp.image}`}
                          alt={rp.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{rp.name}</h3>
                        <div className="text-sm text-gray-600">₹{rp.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div id="reviews" className="mt-16 border-t border-gray-200 pt-16">
          <div className="md:max-w-4xl mx-auto">
            <div className="block md:flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Customer's Reviews</h2>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-black text-white px-6 py-2 mt-2 font-medium tracking-wide uppercase hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2"
              >
                <MessageCircle size={16} />
                <span>Write Review</span>
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Write Your Review
                  {user && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Logged in as {user.name || user.email})
                    </span>
                  )}
                </h3>

                {reviewError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating *
                    </label>
                    <StarRating
                      rating={reviewRating}
                      onRatingChange={setReviewRating}
                      readonly={false}
                      size={28}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review *
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product (minimum 10 characters)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={reviewSubmitting || !user}
                      className={`px-6 py-2 font-medium cursor-pointer ${reviewSubmitting || !user
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-black'
                        } text-white transition-colors`}
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {!user && (
                    <p className="text-gray-500 text-sm mt-2">
                      Please login to write a review
                    </p>
                  )}
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">No reviews yet</div>
                <div className="text-gray-400">Be the first to review this product!</div>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
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

                    <div className="border-t pt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;