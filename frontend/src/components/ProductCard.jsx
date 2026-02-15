import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { FaCartPlus, FaEye } from "react-icons/fa";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    addToCart(product);
    window.scrollTo(0, 0);
    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, quantity: 1 }],
        totalAmount: product?.price ?? 0,
      },
    });
  };

  const handleViewDetails = () => {
    navigate(`/product/${product?._id}`);
  };

  const imgSrc = product?.image
    ? `${apiUrl}${product.image}`
    : "https://via.placeholder.com/600x400?text=No+Image";

  const priceText =
    typeof product?.price === "number"
      ? `Rs ${product.price}.00`
      : `Rs ${Number(product?.price || 0)}`;

  return (
    <div className="group bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-md cursor-pointer rounded-md">
      
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-md" onClick={handleViewDetails}>
        <div className="aspect-[4/5] bg-gray-50">
          <img
            src={imgSrc}
            alt={product?.name || "Product"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Hover View Icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
          <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
            <button className="bg-white text-black p-2 shadow-md hover:bg-gray-100">
              <FaEye className="text-md" />
            </button>
          </div>
        </div>

        {/* Category Badge */}
        {(product?.category || product?.subcategory) && (
          <div className="absolute top-3 left-3">
            <span className="bg-white text-black text-xs px-2 py-1 font-medium uppercase shadow-sm rounded">
              {product?.category}
              {product?.subcategory ? ` / ${product.subcategory}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-2" onClick={handleViewDetails}>
        <h3 className="text-md font-semibold text-black line-clamp-2 leading-snug">
          {product?.name || "Unnamed Product"}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{priceText}</span>
          <span className="text-xs text-gray-500 uppercase">Premium</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-4 pb-4 space-y-2">
        <button
          onClick={handleBuyNow}
          className="w-full bg-black text-white py-2.5 font-medium uppercase text-sm hover:bg-gray-900 transition"
        >
          Buy Now
        </button>

        <div className="flex space-x-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 text-sm font-medium uppercase hover:border-gray-400 hover:text-black transition"
          >
            Details
          </button>

          <button
            onClick={handleAddToCart}
            className="bg-gray-100 text-black p-2.5 hover:bg-gray-200 transition"
            title="Add to Cart"
          >
            <FaCartPlus className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
