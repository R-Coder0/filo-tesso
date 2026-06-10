// src/components/LatestProducts.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ShoppingBag } from "lucide-react";
import { CartContext } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { useSsrData } from "../context/SsrDataContext";
import { extractProducts, getProductPath } from "../utils/products";

const LatestProducts = () => {
  const ssrProducts = useSsrData("homeLatestProducts");
  const hasSsrProducts = Array.isArray(ssrProducts);
  const [latestProducts, setLatestProducts] = useState(() =>
    hasSsrProducts ? ssrProducts : []
  );
  const [loading, setLoading] = useState(!hasSsrProducts);

  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();

  const apiUrl = import.meta.env.VITE_API_URL;
  const trackRef = useRef(null);

  useEffect(() => {
    if (hasSsrProducts) return;
    fetchLatestProducts();
  }, [hasSsrProducts]);

  const fetchLatestProducts = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/products/latest?limit=20`);
      setLatestProducts(extractProducts(response.data));
    } catch (error) {
      console.error("Error fetching latest products:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollLeft = () => {
    trackRef.current.scrollBy({ left: -280, behavior: "smooth" });
  };

  const scrollRight = () => {
    trackRef.current.scrollBy({ left: 280, behavior: "smooth" });
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-500" };
    if (stock <= 5) return { text: "Low Stock", color: "text-orange-500" };
    return { text: "In Stock", color: "text-green-600" };
  };

  const getDiscount = (original, sale) => {
    if (!original || !sale) return 0;
    return Math.round(((original - sale) / original) * 100);
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };

  return (
    <section className="py-8 max-w-[1700px] mx-auto px-4 md:px-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            New Arrivals
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest">
            Just landed
          </p>
        </div>

        <Link
          to="/products?sort=newest"
          className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 hover:text-black border-b border-gray-300 hover:border-black pb-0.5 transition-colors duration-200"
        >
          View All →
        </Link>
      </div>

      {/* ── Skeleton Loader ── */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-44 sm:w-52 lg:w-64 flex-shrink-0 animate-pulse">
              <div className="bg-gray-200 aspect-[3/4] w-full mb-2" />
              <div className="bg-gray-200 h-3 w-3/4 mb-1.5" />
              <div className="bg-gray-200 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : latestProducts.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">
          No new products available.
        </p>
      ) : (
        <div className="relative group/slider">

          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 hover:border-black items-center justify-center shadow-sm hover:shadow transition-all duration-200"
          >
            <FaChevronLeft className="text-xs text-gray-600" />
          </button>

          {/* ── Products Track ── */}
          <div
            ref={trackRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-1 snap-x snap-mandatory hide-scrollbar"
          >
            {latestProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const discount = getDiscount(product.price?.original, product.price?.sale);

              return (
                <div
                  key={product._id}
                  className="w-44 sm:w-52 lg:w-64 flex-shrink-0 snap-start bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 flex flex-col group"
                >
                  {/* Image */}
                  <Link
                    to={getProductPath(product)}
                    className="block relative overflow-hidden bg-gray-50"
                  >
                    <div className="aspect-[3/4] w-full">
                      <img
                        src={`${apiUrl}${product.image}`}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>

                    {/* NEW badge */}
                    <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                      New
                    </span>

                    {/* Discount badge */}
                    {discount > 0 && (
                      <span className="absolute top-2 right-2 bg-white border border-gray-200 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 tracking-wide">
                        {discount}% OFF
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <Link
                    to={getProductPath(product)}
                    className="px-3 pt-2.5 pb-1 flex flex-col gap-1 flex-1"
                  >
                    {product.category && (
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 truncate">
                        {product.category}
                      </p>
                    )}

                    <h3 className="font-sans text-[14px] font-bold text-black line-clamp-2 leading-snug">
                      {product.name}
                    </h3>

                    {/* Price row */}
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{product.price?.sale}
                        </span>
                        {product.price?.original && (
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{product.price?.original}
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] font-semibold ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </div>
                  </Link>

                  {/* Cart Button */}
                  <div className="px-3 pb-3 pt-1">
                    <button
                      disabled={product.stock === 0}
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${
                        product.stock === 0
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"
                      }`}
                    >
                      <ShoppingBag size={13} strokeWidth={1.9} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 hover:border-black items-center justify-center shadow-sm hover:shadow transition-all duration-200"
          >
            <FaChevronRight className="text-xs text-gray-600" />
          </button>
        </div>
      )}
    </section>
  );
};

export default LatestProducts;
