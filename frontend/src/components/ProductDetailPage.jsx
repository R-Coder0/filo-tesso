// src/pages/ProductDetailPage.jsx

import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FaCheck, FaTimes, FaArrowLeft, FaChevronDown, FaChevronUp, FaShareAlt } from "react-icons/fa";
import { useWishlist } from "../context/WishlistContext";
import { Helmet } from "react-helmet-async";
import { Droplets, Heart, Maximize2, ShoppingBag, Star, User, Calendar, MessageCircle, Shield, RefreshCw, Truck, Tag } from "lucide-react";
import ProductCard from "../components/ProductCard";

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
  const [openFaq, setOpenFaq] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [imgZoom, setImgZoom] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const isWishlisted = !!product && isInWishlist(product._id);

  const refundPolicy = "We offer a 7-day return policy on all unused items in original packaging. Customized products are non-refundable unless defective. Refunds processed within 5-7 business days.";
  const shippingPolicy = "Free shipping on orders above ₹999. Standard delivery 3-5 business days. Express shipping available. Orders dispatched within 24 hours on business days.";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/products/${id}`);
        setProduct(data);
        setSelectedImage(data.image);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, apiUrl]);

  useEffect(() => {
    if (product) { fetchReviews(); fetchRelatedProducts(); }
  }, [product]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedSize]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`${apiUrl}/api/reviews/product/${id}`);
      setReviews(response.data);
    } catch (error) {
      if (error.response?.status === 404) setReviews([]);
    } finally { setReviewsLoading(false); }
  };

  const fetchRelatedProducts = async () => {
    try {
      setRelatedLoading(true);
      const { data } = await axios.get(`${apiUrl}/api/products?category=${encodeURIComponent(product.category)}`);
      setRelatedProducts((Array.isArray(data) ? data : data?.products || []).filter(p => p._id !== product._id).slice(0, 8));
    } catch { setRelatedProducts([]); }
    finally { setRelatedLoading(false); }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWishlistClick = async () => {
    if (!user || !token) { showToast("Please login to use wishlist", "error"); navigate("/login"); return; }
    setWishlistLoading(true);
    try {
      if (isWishlisted) { await removeFromWishlist(product._id); showToast("Removed from wishlist"); }
      else { await addToWishlist(product._id); showToast("Added to wishlist"); }
    } catch (error) { showToast(error.message || "Wishlist operation failed", "error"); }
    finally { setWishlistLoading(false); }
  };

  const handleAddToCart = () => {
    if (!inStock) {
      showToast("This product is out of stock", "error");
      return;
    }
    if (requiresSize && !selectedSize) {
      showToast("Please select a size", "error");
      return;
    }
    if (availableStock <= 0) {
      showToast("Selected size is out of stock", "error");
      return;
    }
    const sizeToUse = selectedSize || "";
    addToCart({ ...product, stock: availableStock, quantity, selectedSize: sizeToUse, selectedColor });
    showToast("Added to cart successfully!");
  };

  const handleBuyNow = () => {
    if (!inStock) {
      showToast("This product is out of stock", "error");
      return;
    }
    if (requiresSize && !selectedSize) {
      showToast("Please select a size", "error");
      return;
    }
    if (availableStock <= 0) {
      showToast("Selected size is out of stock", "error");
      return;
    }
    const sizeToUse = selectedSize || "";
    const isCustomize = (product.category || "").toLowerCase() === "customize";
    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, stock: availableStock, quantity, selectedSize: sizeToUse, selectedColor }],
        totalAmount: product.price?.sale * quantity,
        customUploads: { singleFile: customFile || null, isCustomize, selectedSide: isCustomize ? selectedSide : "" }
      },
    });
  };

  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    const maxQty = Math.max(1, availableStock || 1);
    if (newQty >= 1 && newQty <= maxQty) setQuantity(newQty);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !token) { setReviewError("Please login to submit a review"); return; }
    if (reviewRating === 0) { setReviewError("Please select a rating"); return; }
    if (reviewComment.trim().length < 10) { setReviewError("Review must be at least 10 characters"); return; }
    setReviewSubmitting(true); setReviewError("");
    try {
      await axios.post(`${apiUrl}/api/reviews`, { productId: id, rating: reviewRating, comment: reviewComment.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchReviews();
      setReviewRating(0); setReviewComment(""); setShowReviewForm(false);
      showToast("Review submitted successfully!");
    } catch (error) {
      setReviewError(error.response?.status === 401 ? "Session expired. Please login again." : error.response?.data?.message || "Failed to submit review");
    } finally { setReviewSubmitting(false); }
  };

  // ── Sub-components ──

  const StarRating = ({ rating, size = 16, onRatingChange, readonly = false }) => {
    const [hover, setHover] = useState(0);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" disabled={readonly}
            className={`${readonly ? "cursor-default" : "cursor-pointer"} focus:outline-none`}
            onClick={() => !readonly && onRatingChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}>
            <Star size={size} className={`${(hover || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`} />
          </button>
        ))}
      </div>
    );
  };

  const AccordionItem = ({ faqId, title, icon, children }) => {
    const isOpen = openFaq === faqId;
    return (
      <div className="border-b border-gray-100 last:border-0">
        <button onClick={() => setOpenFaq(isOpen ? "" : faqId)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-150">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">{icon}</span>
            <span className="text-sm font-semibold text-gray-800 tracking-wide uppercase">{title}</span>
          </div>
          {isOpen ? <FaChevronUp className="text-gray-400 text-xs shrink-0" /> : <FaChevronDown className="text-gray-400 text-xs shrink-0" />}
        </button>
        {isOpen && (
          <div className="px-5 pb-5 pt-1">
            <div className="text-sm text-gray-600 leading-relaxed pl-7">{children}</div>
          </div>
        )}
      </div>
    );
  };

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-black animate-spin mx-auto" />
        <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Loading Product</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
        <button onClick={() => navigate(-1)} className="bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Go Back</button>
      </div>
    </div>
  );

  const isCustomize = (product.category || "").toLowerCase() === "customize";
  const sizeVariants = Array.isArray(product.sizeVariants) ? product.sizeVariants : [];
  const availableSizes = sizeVariants.length
    ? sizeVariants.map((variant) => variant.size).filter(Boolean)
    : Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const requiresSize = availableSizes.length > 0;
  const selectedVariant = sizeVariants.find((variant) => variant.size === selectedSize);
  const availableStock = requiresSize ? Number(selectedVariant?.stock || 0) : Number(product.stock || 0);
  const inStock = product.stock > 0;
  const totalPrice = product.price?.sale * quantity;
  const discount = product.price?.original && product.price?.sale
    ? Math.round(((product.price.original - product.price.sale) / product.price.original) * 100) : 0;
  const stockLabel = product.stock === 0 ? { text: "Out of Stock", color: "text-red-500", dot: "bg-red-500" }
    : requiresSize && !selectedSize ? { text: "Select size for stock", color: "text-gray-500", dot: "bg-gray-400" }
    : availableStock === 0 ? { text: "Selected size out of stock", color: "text-red-500", dot: "bg-red-500" }
    : availableStock <= 5 ? { text: `Only ${availableStock} left`, color: "text-orange-500", dot: "bg-orange-500" }
    : { text: "In Stock", color: "text-green-600", dot: "bg-green-500" };
  const productDetails = Array.isArray(product.details) && product.details.length
    ? product.details
    : Array.isArray(product.features) ? product.features : [];
  const productWashCare = Array.isArray(product.washCare) ? product.washCare : [];
  const allImages = [...new Set([product.image, ...(product.gallery || [])].filter(Boolean))];
  const currentImage = selectedImage || allImages[0] || "";
  const selectedImageIndex = Math.max(0, allImages.findIndex((img) => img === currentImage));
  const avgRating = product?.ratings?.average || 0;
  const ratingCount = product?.ratings?.count || 0;

  return (
    <>
      <Helmet>
        <title>{product?.seo?.metaTitle || product?.name}</title>
        <meta name="description" content={product?.seo?.metaDescription || product?.description?.slice(0, 150)} />
        <meta name="keywords" content={product?.seo?.keywords?.join(", ") || `${product?.name}, buy online`} />
      </Helmet>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 shadow-lg border-l-4 bg-white transition-all duration-300 ${toast.type === "success" ? "border-green-500" : "border-red-500"}`}>
          {toast.type === "success" ? <FaCheck className="text-green-500 text-sm" /> : <FaTimes className="text-red-500 text-sm" />}
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {imgZoom && currentImage && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 p-4 md:p-8"
          onClick={() => setImgZoom(false)}
        >
          <button
            type="button"
            onClick={() => setImgZoom(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-white/30 bg-white/10 text-white transition hover:bg-white hover:text-black"
            aria-label="Close full image"
          >
            <FaTimes className="text-sm" />
          </button>
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={`${apiUrl}${currentImage}`}
              alt={`${product.name} full view`}
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">

        {/* ── Breadcrumb Bar ── */}
        <div className="bg-white border-b border-gray-200 sticky top-[76px] z-30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-11 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-xs font-semibold uppercase tracking-widest">
              <FaArrowLeft className="text-[10px]" /> Back
            </button>
            <nav className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
              <span className="hover:text-black cursor-pointer" onClick={() => navigate("/")}>Home</span>
              <span>/</span>
              <span className="hover:text-black cursor-pointer capitalize" onClick={() => navigate(`/products/${product.category}`)}>{product.category}</span>
              {product.subcategory && <><span>/</span><span className="text-gray-600 capitalize">{product.subcategory}</span></>}
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={handleWishlistClick} disabled={wishlistLoading}
                className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-semibold uppercase tracking-wider transition-all ${isWishlisted ? "bg-red-50 border-red-300 text-red-600" : "border-gray-300 text-gray-600 hover:border-gray-500 hover:text-black"} ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                {wishlistLoading ? (
                  <div className="w-3 h-3 border border-current border-t-transparent animate-spin" />
                ) : (
                  <Heart size={13} strokeWidth={2} className={isWishlisted ? "text-red-500" : ""} />
                )}
                <span className="hidden sm:inline">{isWishlisted ? "Wishlisted" : "Wishlist"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Product Section ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-8 items-start">

            {/* ── LEFT: Image Gallery ── */}
            <div className="lg:sticky lg:top-28 h-fit">
              <div className={`grid gap-3 ${allImages.length > 1 ? "lg:grid-cols-[88px_minmax(0,1fr)]" : "lg:grid-cols-1"}`}>
                {allImages.length > 1 && (
                  <div className="order-2 flex gap-2 overflow-x-auto hide-scrollbar lg:order-1 lg:max-h-[680px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
                    {allImages.map((img, idx) => {
                      const isActive = currentImage === img;
                      return (
                        <button
                          key={`${img}-${idx}`}
                          type="button"
                          onClick={() => setSelectedImage(img)}
                          className={`relative h-20 w-20 shrink-0 border bg-white transition-all duration-200 lg:h-24 lg:w-20 ${isActive
                            ? "border-black shadow-[0_0_0_1px_#000]"
                            : "border-gray-200 hover:border-gray-500"
                            }`}
                          aria-label={`View image ${idx + 1}`}
                        >
                          <img
                            src={`${apiUrl}${img}`}
                            alt={`${product.name} view ${idx + 1}`}
                            className="h-full w-full object-contain p-1.5"
                          />
                          <span className={`absolute bottom-1 left-1 h-1 w-5 ${isActive ? "bg-black" : "bg-gray-200"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="order-1 border border-gray-200 bg-white lg:order-2">
                  <div
                    className="relative flex aspect-[4/5] min-h-[360px] cursor-zoom-in items-center justify-center overflow-hidden bg-[#f7f7f4] sm:min-h-[520px]"
                    onClick={() => setImgZoom(true)}
                  >
                    {currentImage ? (
                      <img
                        src={`${apiUrl}${currentImage}`}
                        alt={product.name}
                        className="h-full w-full object-contain p-3 transition-transform duration-500 hover:scale-[1.02] sm:p-5"
                      />
                    ) : (
                      <div className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                        Image unavailable
                      </div>
                    )}

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {discount > 0 && (
                          <span className="bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                            {discount}% OFF
                          </span>
                        )}
                        {allImages.length > 1 && (
                          <span className="bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-700 shadow-sm">
                            {selectedImageIndex + 1} / {allImages.length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImgZoom(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white/90 text-gray-800 shadow-sm transition hover:border-black hover:text-black"
                        aria-label="Open full image"
                      >
                        <Maximize2 size={15} strokeWidth={1.9} />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 shadow-sm">
                      Full Product View
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust badges below image */}
              <div className="mt-3 grid grid-cols-3 border border-gray-200 bg-white divide-x divide-gray-100">
                {[
                  { icon: <Truck size={14} />, label: "Fast Delivery" },
                  { icon: <RefreshCw size={14} />, label: "7-Day Return" },
                  { icon: <Shield size={14} />, label: "100% Genuine" },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 py-3 px-2">
                    <span className="text-gray-500">{b.icon}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 text-center">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div className="space-y-0">

              {/* Category & Name */}
              <div className="bg-white border border-gray-200 p-5 pb-4">
                {(product.category || product.subcategory) && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}
                  </p>
                )}
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                  {product.name}
                </h1>

                {/* Rating row */}
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 bg-green-600 text-white px-2.5 py-1">
                    <span className="text-sm font-bold leading-none">{avgRating.toFixed(1)}</span>
                    <Star size={11} className="fill-white text-white" />
                  </div>
                  <span className="text-xs text-gray-500">{ratingCount} {ratingCount === 1 ? "Rating" : "Ratings"}</span>
                  {ratingCount > 0 && <span className="text-gray-300 text-xs">|</span>}
                  {product?.soldCount > 0 && <span className="text-xs text-gray-500">{product.soldCount} Sold</span>}
                </div>
              </div>

              {/* Price Block */}
              <div className="bg-white border-x border-b border-gray-200 px-5 py-4">
                <div className="flex items-end gap-4 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900">₹{product.price?.sale?.toLocaleString()}</span>
                  {product.price?.original && (
                    <span className="text-base text-gray-400 line-through mb-0.5">₹{product.price.original.toLocaleString()}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-base font-bold text-green-600 mb-0.5">{discount}% off</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>

                {/* Stock */}
                <div className="flex items-center gap-2 mt-3">
                  <span className={`w-2 h-2 shrink-0 ${stockLabel.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${stockLabel.color}`}>{stockLabel.text}</span>
                </div>
              </div>

              {/* Size */}
              {requiresSize && (
                <div className="bg-white border-x border-b border-gray-200 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Select Size</h3>
                    <button className="text-xs text-gray-400 hover:text-black underline underline-offset-2 transition-colors">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size, idx) => (
                      <button key={idx} onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] h-10 px-3 border text-sm font-semibold tracking-wide uppercase transition-all duration-200 ${selectedSize === size ? "border-black bg-black text-white" : "border-gray-300 text-gray-700 hover:border-gray-600 hover:text-black bg-white"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="bg-white border-x border-b border-gray-200 px-5 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-3">Quantity</h3>
                <div className="flex items-center gap-5">
                  <div className="flex items-center border border-gray-300">
                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg font-light">−</button>
                    <span className="w-10 text-center text-sm font-bold text-gray-900 border-x border-gray-300 h-9 flex items-center justify-center">{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} disabled={quantity >= (availableStock || 1)}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg font-light">+</button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: <span className="font-bold text-gray-900 text-base">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Customize Upload */}
              {isCustomize && (
                <div className="bg-white border-x border-b border-gray-200 px-5 py-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Customization</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Front Side", "Back Side", "Both Sides"].map((side) => (
                      <button key={side} onClick={() => setSelectedSide(side)}
                        className={`px-3 py-1.5 border text-xs font-semibold uppercase tracking-wide transition-colors ${selectedSide === side ? "bg-black text-white border-black" : "border-gray-300 text-gray-700 hover:border-gray-600"}`}>
                        {side}
                      </button>
                    ))}
                  </div>
                  {selectedSide && (
                    <div className="space-y-1.5">
                      <label className="block text-xs text-gray-500 font-medium">Upload design for {selectedSide.toLowerCase()}</label>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                        onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                        className="text-xs text-gray-700 cursor-pointer file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
                      <p className="text-[10px] text-gray-400">JPG, PNG, PDF supported. Will be attached to your order.</p>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Buttons */}
              <div className="bg-white border-x border-b border-gray-200 px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleAddToCart} disabled={!inStock || (requiresSize && selectedSize && availableStock <= 0)}
                    className={`flex items-center justify-center gap-2.5 py-3.5 text-xs font-bold uppercase tracking-widest border transition-all duration-200 ${!inStock || (requiresSize && selectedSize && availableStock <= 0) ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-black text-black bg-white hover:bg-gray-50"}`}>
                    <ShoppingBag size={15} strokeWidth={1.9} />
                    Add to Cart
                  </button>
                  <button onClick={handleBuyNow} disabled={!inStock || (requiresSize && selectedSize && availableStock <= 0)}
                    className={`flex items-center justify-center gap-2.5 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${!inStock || (requiresSize && selectedSize && availableStock <= 0) ? "bg-gray-300 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"}`}>
                    <ShoppingBag size={15} strokeWidth={1.9} />
                    Buy Now
                  </button>
                </div>
                {!inStock && (
                  <p className="text-center text-xs text-red-500 font-semibold mt-3">This product is currently out of stock</p>
                )}
              </div>

              {/* Accordion Info */}
              <div className="bg-white border-x border-b border-gray-200 mt-0">
                <AccordionItem faqId="description" title="Details and Description" icon={<Tag size={13} />}>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase text-gray-900">
                        Description
                      </h4>
                      <p>{product.description || "No description available."}</p>
                    </div>
                    {productDetails.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-900">
                          Details
                        </h4>
                        <ul className="list-disc space-y-1.5 pl-5">
                          {productDetails.map((detail, index) => (
                            <li key={`${detail}-${index}`}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionItem>
                <AccordionItem faqId="wash-care" title="Wash Care" icon={<Droplets size={13} />}>
                  {productWashCare.length > 0 ? (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {productWashCare.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Wash care instructions will be updated here.</p>
                  )}
                </AccordionItem>
                <AccordionItem faqId="refund" title="Return Policy" icon={<RefreshCw size={13} />}>
                  <p>{refundPolicy}</p>
                </AccordionItem>
                <AccordionItem faqId="shipping" title="Shipping Info" icon={<Truck size={13} />}>
                  <p>{shippingPolicy}</p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div id="reviews" className="max-w-7xl mx-auto px-4 md:px-6 mb-10">
          <div className="bg-white border border-gray-200 p-5 md:p-6">

            {/* Reviews Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 bg-green-600 text-white px-2.5 py-1">
                    <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
                    <Star size={11} className="fill-white text-white" />
                  </div>
                  <span className="text-sm text-gray-500">{ratingCount} {ratingCount === 1 ? "review" : "reviews"}</span>
                </div>
              </div>
              <button onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors self-start sm:self-auto">
                <MessageCircle size={13} />
                Write a Review
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="border border-gray-200 bg-gray-50 p-5 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-800 mb-4">Your Review</h3>
                {reviewError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 mb-4 font-medium">{reviewError}</div>
                )}
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">Rating *</label>
                    <StarRating rating={reviewRating} onRatingChange={setReviewRating} readonly={false} size={24} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2">Comment *</label>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience (min 10 characters)..."
                      className="w-full px-3 py-2.5 border border-gray-300 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-600 resize-none bg-white"
                      rows="4" required />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={reviewSubmitting || !user}
                      className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors ${reviewSubmitting || !user ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}>
                      {reviewSubmitting ? "Submitting..." : "Submit"}
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-700 hover:border-gray-500 hover:text-black transition-colors">
                      Cancel
                    </button>
                  </div>
                  {!user && <p className="text-xs text-gray-400">Please login to submit a review</p>}
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 py-4 border-b border-gray-100">
                    <div className="w-8 h-8 bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 w-1/4" />
                      <div className="h-3 bg-gray-200 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-semibold text-gray-500">No reviews yet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to review this product!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <div key={review._id} className="py-5 first:pt-0">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                        <User size={15} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm font-bold text-gray-900">{review.user?.name || "Anonymous"}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <StarRating rating={review.rating} readonly size={13} />
                        <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-6">
            <div className="bg-white border border-gray-200 p-5 md:p-6">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Similar Products</h2>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">You may also like</p>
                </div>
              </div>
              {relatedLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border border-gray-200 animate-pulse">
                      <div className="aspect-[3/4] bg-gray-200" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-200 w-3/4" />
                        <div className="h-3 bg-gray-200 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {relatedProducts.map((rp) => <ProductCard key={rp._id} product={rp} />)}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ProductDetailPage;
