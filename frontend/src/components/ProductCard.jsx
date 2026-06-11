import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { FaEye } from "react-icons/fa";
import { ShoppingBag } from "lucide-react";
import { getProductCardImageSources, getProductPath } from "../utils/products";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-500" };
    if (stock <= 5) return { text: "Low Stock", color: "text-orange-500" };
    return { text: "In Stock", color: "text-green-600" };
  };

  const stockStatus = getStockStatus(product?.stock);

  const discount =
    product?.price?.original && product?.price?.sale
      ? Math.round(
          ((product.price.original - product.price.sale) /
            product.price.original) *
            100
        )
      : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (product?.stock === 0) return;
    if (product?.sizeVariants?.length > 0 || product?.sizes?.length > 0) {
      navigate(getProductPath(product));
      return;
    }
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (product?.stock === 0) return;
    if (product?.sizeVariants?.length > 0 || product?.sizes?.length > 0) {
      navigate(getProductPath(product));
      return;
    }
    addToCart(product);
    window.scrollTo(0, 0);
    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, quantity: 1 }],
        totalAmount: product?.price?.sale ?? 0,
      },
    });
  };

  const handleViewDetails = () => {
    navigate(getProductPath(product));
  };

  const { mainSrc, hoverSrc } = getProductCardImageSources(
    product,
    apiUrl,
    "https://via.placeholder.com/600x400?text=No+Image"
  );
  const productSubcategories = Array.isArray(product?.subcategories) && product.subcategories.length
    ? product.subcategories
    : product?.subcategory
      ? [product.subcategory]
      : [];
  const categoryBadge = [product?.category, ...productSubcategories]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="group bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">

      {/* ── IMAGE ── */}
      <div
        className="relative overflow-hidden bg-gray-50"
        onClick={handleViewDetails}
      >
        {/* Fixed aspect ratio — image fills the box, no distortion */}
        <div className="relative aspect-[4/5] w-full">
          <img
            src={mainSrc}
            alt={product?.name || "Product"}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              hoverSrc ? "group-hover:opacity-0" : ""
            }`}
            loading="lazy"
          />
          {hoverSrc && (
            <img
              src={hoverSrc}
              alt={product?.name || "Product"}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Discount badge — top right */}
        {discount > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-black text-white text-[10px] font-semibold tracking-wide px-2 py-0.5">
            {discount}% OFF
          </span>
        )}

        {/* Category badge — top left */}
        {/* {categoryBadge && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-block max-w-[170px] truncate bg-white/90 text-black text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 shadow-sm sm:max-w-[220px]">
              {categoryBadge}
            </span>
          </div>
        )} */}

        {/* Hover overlay with eye icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <div className="translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-white text-black p-2 shadow-md">
              <FaEye className="text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO ── */}
      <div
        className="px-3.5 pt-3 pb-2 flex flex-col gap-1.5 flex-1 cursor-pointer"
        onClick={handleViewDetails}
      >
        {/* Product name */}
        <h3 className="font-sans text-[15px] font-bold text-black line-clamp-2 leading-snug">
          {product?.name || "Unnamed Product"}
        </h3>

        {/* Price row — MRP left, Sale price right */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900 leading-none">
              ₹{product?.price?.sale}
            </span>
            {product?.price?.original && (
              <span className="text-xs text-gray-400 line-through leading-none">
                ₹{product?.price?.original}
              </span>
            )}
          </div>

          {/* Stock status — pushed right */}
          <span className={`text-[11px] font-semibold ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </div>
      </div>

      {/* ── BUTTONS ── */}
      <div className="px-3.5 pb-3.5 pt-1 flex flex-col gap-2">
        {/* Buy Now */}
        <button
          onClick={handleBuyNow}
          disabled={product?.stock === 0}
          className={`w-full py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors duration-200 ${
            product?.stock === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800 active:bg-gray-700"
          }`}
        >
          Buy Now
        </button>

        {/* Details + Cart */}
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 border border-gray-300 text-gray-700 py-2 text-[11px] font-semibold uppercase tracking-widest hover:border-black hover:text-black transition-colors duration-200"
          >
            Details
          </button>

          <button
            onClick={handleAddToCart}
            disabled={product?.stock === 0}
            title="Add to cart"
            className={`w-10 flex items-center justify-center border transition-colors duration-200 ${
              product?.stock === 0
                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"
            }`}
          >
            <ShoppingBag size={15} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
