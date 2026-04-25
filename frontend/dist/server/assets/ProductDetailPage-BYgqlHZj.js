import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C as CartContext, A as AuthContext, u as useWishlist } from "../entry-server.js";
import axios from "axios";
import { FaCheck, FaTimes, FaArrowLeft, FaHeart, FaRegHeart, FaCartPlus, FaShoppingBag, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import { Truck, RefreshCw, Shield, Star, Tag, MessageCircle, User, Calendar } from "lucide-react";
import { P as ProductCard } from "./ProductCard-CLVku5xX.js";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "react-fast-marquee";
import "react-hot-toast";
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
  const apiUrl = "http://localhost:5000";
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
    if (product) {
      fetchReviews();
      fetchRelatedProducts();
    }
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
    } finally {
      setReviewsLoading(false);
    }
  };
  const fetchRelatedProducts = async () => {
    try {
      setRelatedLoading(true);
      const { data } = await axios.get(`${apiUrl}/api/products?category=${encodeURIComponent(product.category)}`);
      setRelatedProducts((Array.isArray(data) ? data : data?.products || []).filter((p) => p._id !== product._id).slice(0, 8));
    } catch {
      setRelatedProducts([]);
    } finally {
      setRelatedLoading(false);
    }
  };
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3e3);
  };
  const handleWishlistClick = async () => {
    if (!user || !token) {
      showToast("Please login to use wishlist", "error");
      navigate("/login");
      return;
    }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        showToast("Removed from wishlist");
      } else {
        await addToWishlist(product._id);
        showToast("Added to wishlist");
      }
    } catch (error) {
      showToast(error.message || "Wishlist operation failed", "error");
    } finally {
      setWishlistLoading(false);
    }
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
    const isCustomize2 = (product.category || "").toLowerCase() === "customize";
    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, stock: availableStock, quantity, selectedSize: sizeToUse, selectedColor }],
        totalAmount: product.price?.sale * quantity,
        customUploads: { singleFile: customFile || null, isCustomize: isCustomize2, selectedSide: isCustomize2 ? selectedSide : "" }
      }
    });
  };
  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    const maxQty = Math.max(1, availableStock || 1);
    if (newQty >= 1 && newQty <= maxQty) setQuantity(newQty);
  };
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      setReviewError("Please login to submit a review");
      return;
    }
    if (reviewRating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    if (reviewComment.trim().length < 10) {
      setReviewError("Review must be at least 10 characters");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await axios.post(`${apiUrl}/api/reviews`, { productId: id, rating: reviewRating, comment: reviewComment.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchReviews();
      setReviewRating(0);
      setReviewComment("");
      setShowReviewForm(false);
      showToast("Review submitted successfully!");
    } catch (error) {
      setReviewError(error.response?.status === 401 ? "Session expired. Please login again." : error.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };
  const StarRating = ({ rating, size = 16, onRatingChange, readonly = false }) => {
    const [hover, setHover] = useState(0);
    return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        disabled: readonly,
        className: `${readonly ? "cursor-default" : "cursor-pointer"} focus:outline-none`,
        onClick: () => !readonly && onRatingChange?.(star),
        onMouseEnter: () => !readonly && setHover(star),
        onMouseLeave: () => !readonly && setHover(0),
        children: /* @__PURE__ */ jsx(Star, { size, className: `${(hover || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors` })
      },
      star
    )) });
  };
  const AccordionItem = ({ faqId, title, icon, children }) => {
    const isOpen = openFaq === faqId;
    return /* @__PURE__ */ jsxs("div", { className: "border-b border-gray-100 last:border-0", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setOpenFaq(isOpen ? "" : faqId),
          className: "w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-150",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: icon }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gray-800 tracking-wide uppercase", children: title })
            ] }),
            isOpen ? /* @__PURE__ */ jsx(FaChevronUp, { className: "text-gray-400 text-xs shrink-0" }) : /* @__PURE__ */ jsx(FaChevronDown, { className: "text-gray-400 text-xs shrink-0" })
          ]
        }
      ),
      isOpen && /* @__PURE__ */ jsx("div", { className: "px-5 pb-5 pt-1", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600 leading-relaxed pl-7", children }) })
    ] });
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-white flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 border-2 border-gray-200 border-t-black animate-spin mx-auto" }),
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold tracking-widest uppercase text-gray-400", children: "Loading Product" })
  ] }) });
  if (!product) return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-white flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Product Not Found" }),
    /* @__PURE__ */ jsx("button", { onClick: () => navigate(-1), className: "bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors", children: "Go Back" })
  ] }) });
  const isCustomize = (product.category || "").toLowerCase() === "customize";
  const sizeVariants = Array.isArray(product.sizeVariants) ? product.sizeVariants : [];
  const availableSizes = sizeVariants.length ? sizeVariants.map((variant) => variant.size).filter(Boolean) : Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const requiresSize = availableSizes.length > 0;
  const selectedVariant = sizeVariants.find((variant) => variant.size === selectedSize);
  const availableStock = requiresSize ? Number(selectedVariant?.stock || 0) : Number(product.stock || 0);
  const inStock = product.stock > 0;
  const totalPrice = product.price?.sale * quantity;
  const discount = product.price?.original && product.price?.sale ? Math.round((product.price.original - product.price.sale) / product.price.original * 100) : 0;
  const stockLabel = product.stock === 0 ? { text: "Out of Stock", color: "text-red-500", dot: "bg-red-500" } : requiresSize && !selectedSize ? { text: "Select size for stock", color: "text-gray-500", dot: "bg-gray-400" } : availableStock === 0 ? { text: "Selected size out of stock", color: "text-red-500", dot: "bg-red-500" } : availableStock <= 5 ? { text: `Only ${availableStock} left`, color: "text-orange-500", dot: "bg-orange-500" } : { text: "In Stock", color: "text-green-600", dot: "bg-green-500" };
  const allImages = [product.image, ...product.gallery || []];
  const avgRating = product?.ratings?.average || 0;
  const ratingCount = product?.ratings?.count || 0;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: product?.seo?.metaTitle || product?.name }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: product?.seo?.metaDescription || product?.description?.slice(0, 150) }),
      /* @__PURE__ */ jsx("meta", { name: "keywords", content: product?.seo?.keywords?.join(", ") || `${product?.name}, buy online` })
    ] }),
    toast && /* @__PURE__ */ jsxs("div", { className: `fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 shadow-lg border-l-4 bg-white transition-all duration-300 ${toast.type === "success" ? "border-green-500" : "border-red-500"}`, children: [
      toast.type === "success" ? /* @__PURE__ */ jsx(FaCheck, { className: "text-green-500 text-sm" }) : /* @__PURE__ */ jsx(FaTimes, { className: "text-red-500 text-sm" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gray-800", children: toast.message })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-gray-200 sticky top-[76px] z-30", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 md:px-6 h-11 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => navigate(-1), className: "flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-xs font-semibold uppercase tracking-widest", children: [
          /* @__PURE__ */ jsx(FaArrowLeft, { className: "text-[10px]" }),
          " Back"
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex items-center gap-1.5 text-xs text-gray-400", children: [
          /* @__PURE__ */ jsx("span", { className: "hover:text-black cursor-pointer", onClick: () => navigate("/"), children: "Home" }),
          /* @__PURE__ */ jsx("span", { children: "/" }),
          /* @__PURE__ */ jsx("span", { className: "hover:text-black cursor-pointer capitalize", onClick: () => navigate(`/products/${product.category}`), children: product.category }),
          product.subcategory && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: "/" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-600 capitalize", children: product.subcategory })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleWishlistClick,
            disabled: wishlistLoading,
            className: `flex items-center gap-2 px-3 py-1.5 border text-xs font-semibold uppercase tracking-wider transition-all ${isWishlisted ? "bg-red-50 border-red-300 text-red-600" : "border-gray-300 text-gray-600 hover:border-gray-500 hover:text-black"} ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`,
            children: [
              wishlistLoading ? /* @__PURE__ */ jsx("div", { className: "w-3 h-3 border border-current border-t-transparent animate-spin" }) : isWishlisted ? /* @__PURE__ */ jsx(FaHeart, { className: "text-red-500 text-xs" }) : /* @__PURE__ */ jsx(FaRegHeart, { className: "text-xs" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: isWishlisted ? "Wishlisted" : "Wishlist" })
            ]
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 md:px-6 py-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-8 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:sticky lg:top-28 h-fit", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative aspect-[2/2] overflow-hidden bg-gray-50 cursor-zoom-in", onClick: () => setImgZoom(!imgZoom), children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: `${apiUrl}${selectedImage}`,
                  alt: product.name,
                  className: "w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                }
              ),
              discount > 0 && /* @__PURE__ */ jsxs("span", { className: "absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1", children: [
                discount,
                "% OFF"
              ] })
            ] }),
            allImages.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex gap-2 p-3 border-t border-gray-100 overflow-x-auto hide-scrollbar", children: allImages.map((img, idx) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedImage(img),
                className: `shrink-0 w-16 h-16 border-2 transition-colors duration-200 overflow-hidden ${selectedImage === img ? "border-black" : "border-gray-200 hover:border-gray-400"}`,
                children: /* @__PURE__ */ jsx("img", { src: `${apiUrl}${img}`, alt: `View ${idx + 1}`, className: "w-full h-full object-cover" })
              },
              idx
            )) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-3 border border-gray-200 bg-white divide-x divide-gray-100", children: [
            { icon: /* @__PURE__ */ jsx(Truck, { size: 14 }), label: "Fast Delivery" },
            { icon: /* @__PURE__ */ jsx(RefreshCw, { size: 14 }), label: "7-Day Return" },
            { icon: /* @__PURE__ */ jsx(Shield, { size: 14 }), label: "100% Genuine" }
          ].map((b, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1.5 py-3 px-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: b.icon }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-gray-600 text-center", children: b.label })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 p-5 pb-4", children: [
            (product.category || product.subcategory) && /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2", children: [
              product.category,
              product.subcategory ? ` / ${product.subcategory}` : ""
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-2xl font-bold text-gray-900 leading-snug", children: product.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-green-600 text-white px-2.5 py-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold leading-none", children: avgRating.toFixed(1) }),
                /* @__PURE__ */ jsx(Star, { size: 11, className: "fill-white text-white" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
                ratingCount,
                " ",
                ratingCount === 1 ? "Rating" : "Ratings"
              ] }),
              ratingCount > 0 && /* @__PURE__ */ jsx("span", { className: "text-gray-300 text-xs", children: "|" }),
              product?.soldCount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
                product.soldCount,
                " Sold"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border-x border-b border-gray-200 px-5 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-4 flex-wrap", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-3xl font-bold text-gray-900", children: [
                "₹",
                product.price?.sale?.toLocaleString()
              ] }),
              product.price?.original && /* @__PURE__ */ jsxs("span", { className: "text-base text-gray-400 line-through mb-0.5", children: [
                "₹",
                product.price.original.toLocaleString()
              ] }),
              discount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-base font-bold text-green-600 mb-0.5", children: [
                discount,
                "% off"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Inclusive of all taxes" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-3", children: [
              /* @__PURE__ */ jsx("span", { className: `w-2 h-2 shrink-0 ${stockLabel.dot}` }),
              /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase tracking-widest ${stockLabel.color}`, children: stockLabel.text })
            ] })
          ] }),
          requiresSize && /* @__PURE__ */ jsxs("div", { className: "bg-white border-x border-b border-gray-200 px-5 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-widest text-gray-700", children: "Select Size" }),
              /* @__PURE__ */ jsx("button", { className: "text-xs text-gray-400 hover:text-black underline underline-offset-2 transition-colors", children: "Size Guide" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: availableSizes.map((size, idx) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedSize(size),
                className: `min-w-[44px] h-10 px-3 border text-sm font-semibold tracking-wide uppercase transition-all duration-200 ${selectedSize === size ? "border-black bg-black text-white" : "border-gray-300 text-gray-700 hover:border-gray-600 hover:text-black bg-white"}`,
                children: size
              },
              idx
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border-x border-b border-gray-200 px-5 py-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-widest text-gray-700 mb-3", children: "Quantity" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center border border-gray-300", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleQuantityChange(-1),
                    disabled: quantity <= 1,
                    className: "w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg font-light",
                    children: "−"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "w-10 text-center text-sm font-bold text-gray-900 border-x border-gray-300 h-9 flex items-center justify-center", children: quantity }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleQuantityChange(1),
                    disabled: quantity >= (availableStock || 1),
                    className: "w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg font-light",
                    children: "+"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-500", children: [
                "Total: ",
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-900 text-base", children: [
                  "₹",
                  totalPrice.toLocaleString()
                ] })
              ] })
            ] })
          ] }),
          isCustomize && /* @__PURE__ */ jsxs("div", { className: "bg-white border-x border-b border-gray-200 px-5 py-4 space-y-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold uppercase tracking-widest text-gray-700", children: "Customization" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["Front Side", "Back Side", "Both Sides"].map((side) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedSide(side),
                className: `px-3 py-1.5 border text-xs font-semibold uppercase tracking-wide transition-colors ${selectedSide === side ? "bg-black text-white border-black" : "border-gray-300 text-gray-700 hover:border-gray-600"}`,
                children: side
              },
              side
            )) }),
            selectedSide && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs text-gray-500 font-medium", children: [
                "Upload design for ",
                selectedSide.toLowerCase()
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: ".jpg,.jpeg,.png,.webp,.gif,.pdf",
                  onChange: (e) => setCustomFile(e.target.files?.[0] || null),
                  className: "text-xs text-gray-700 cursor-pointer file:mr-3 file:px-3 file:py-1.5 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400", children: "JPG, PNG, PDF supported. Will be attached to your order." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border-x border-b border-gray-200 px-5 py-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleAddToCart,
                  disabled: !inStock || requiresSize && selectedSize && availableStock <= 0,
                  className: `flex items-center justify-center gap-2.5 py-3.5 text-xs font-bold uppercase tracking-widest border transition-all duration-200 ${!inStock || requiresSize && selectedSize && availableStock <= 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-black text-black bg-white hover:bg-gray-50"}`,
                  children: [
                    /* @__PURE__ */ jsx(FaCartPlus, { className: "text-sm" }),
                    "Add to Cart"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleBuyNow,
                  disabled: !inStock || requiresSize && selectedSize && availableStock <= 0,
                  className: `flex items-center justify-center gap-2.5 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${!inStock || requiresSize && selectedSize && availableStock <= 0 ? "bg-gray-300 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"}`,
                  children: [
                    /* @__PURE__ */ jsx(FaShoppingBag, { className: "text-sm" }),
                    "Buy Now"
                  ]
                }
              )
            ] }),
            !inStock && /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-red-500 font-semibold mt-3", children: "This product is currently out of stock" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border-x border-b border-gray-200 mt-0", children: [
            /* @__PURE__ */ jsx(AccordionItem, { faqId: "description", title: "Description", icon: /* @__PURE__ */ jsx(Tag, { size: 13 }), children: /* @__PURE__ */ jsx("p", { children: product.description || "No description available." }) }),
            /* @__PURE__ */ jsx(AccordionItem, { faqId: "specifications", title: "Specifications", icon: /* @__PURE__ */ jsx(MessageCircle, { size: 13 }), children: /* @__PURE__ */ jsx("p", { children: "Material, fit and fabric details will be updated here." }) }),
            /* @__PURE__ */ jsx(AccordionItem, { faqId: "refund", title: "Return Policy", icon: /* @__PURE__ */ jsx(RefreshCw, { size: 13 }), children: /* @__PURE__ */ jsx("p", { children: refundPolicy }) }),
            /* @__PURE__ */ jsx(AccordionItem, { faqId: "shipping", title: "Shipping Info", icon: /* @__PURE__ */ jsx(Truck, { size: 13 }), children: /* @__PURE__ */ jsx("p", { children: shippingPolicy }) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { id: "reviews", className: "max-w-7xl mx-auto px-4 md:px-6 mb-10", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 p-5 md:p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-gray-900", children: "Customer Reviews" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 bg-green-600 text-white px-2.5 py-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: avgRating.toFixed(1) }),
                /* @__PURE__ */ jsx(Star, { size: 11, className: "fill-white text-white" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
                ratingCount,
                " ",
                ratingCount === 1 ? "review" : "reviews"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowReviewForm(!showReviewForm),
              className: "flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors self-start sm:self-auto",
              children: [
                /* @__PURE__ */ jsx(MessageCircle, { size: 13 }),
                "Write a Review"
              ]
            }
          )
        ] }),
        showReviewForm && /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 bg-gray-50 p-5 mb-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-widest text-gray-800 mb-4", children: "Your Review" }),
          reviewError && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 mb-4 font-medium", children: reviewError }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitReview, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2", children: "Rating *" }),
              /* @__PURE__ */ jsx(StarRating, { rating: reviewRating, onRatingChange: setReviewRating, readonly: false, size: 24 })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2", children: "Comment *" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: reviewComment,
                  onChange: (e) => setReviewComment(e.target.value),
                  placeholder: "Share your experience (min 10 characters)...",
                  className: "w-full px-3 py-2.5 border border-gray-300 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-600 resize-none bg-white",
                  rows: "4",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: reviewSubmitting || !user,
                  className: `px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors ${reviewSubmitting || !user ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`,
                  children: reviewSubmitting ? "Submitting..." : "Submit"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowReviewForm(false),
                  className: "px-6 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-700 hover:border-gray-500 hover:text-black transition-colors",
                  children: "Cancel"
                }
              )
            ] }),
            !user && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: "Please login to submit a review" })
          ] })
        ] }),
        reviewsLoading ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsxs("div", { className: "animate-pulse flex gap-3 py-4 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-gray-200 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-3 bg-gray-200 w-1/4" }),
            /* @__PURE__ */ jsx("div", { className: "h-3 bg-gray-200 w-3/4" })
          ] })
        ] }, i)) }) : reviews.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-10", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-500", children: "No reviews yet" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Be the first to review this product!" })
        ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-gray-100", children: reviews.map((review) => /* @__PURE__ */ jsx("div", { className: "py-5 first:pt-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200", children: /* @__PURE__ */ jsx(User, { size: 15, className: "text-gray-500" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-gray-900", children: review.user?.name || "Anonymous" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-gray-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Calendar, { size: 10 }),
                new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(StarRating, { rating: review.rating, readonly: true, size: 13 }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 leading-relaxed mt-2", children: review.comment })
          ] })
        ] }) }, review._id)) })
      ] }) }),
      relatedProducts.length > 0 && /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 md:px-6 mt-8 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 p-5 md:p-6", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-end justify-between mb-5", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-gray-900 tracking-tight", children: "Similar Products" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-400 mt-0.5", children: "You may also like" })
        ] }) }),
        relatedLoading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 animate-pulse", children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-[3/4] bg-gray-200" }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-3 bg-gray-200 w-3/4" }),
            /* @__PURE__ */ jsx("div", { className: "h-3 bg-gray-200 w-1/2" })
          ] })
        ] }, i)) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", children: relatedProducts.map((rp) => /* @__PURE__ */ jsx(ProductCard, { product: rp }, rp._id)) })
      ] }) })
    ] })
  ] });
};
export {
  ProductDetailPage as default
};
