import { jsxs, jsx } from "react/jsx-runtime";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { C as CartContext, a as useUI } from "../entry-server.js";
import { FaEye, FaCartPlus } from "react-icons/fa";
const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();
  const navigate = useNavigate();
  const apiUrl = "http://localhost:5000";
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-500" };
    if (stock <= 5) return { text: "Low Stock", color: "text-orange-500" };
    return { text: "In Stock", color: "text-green-600" };
  };
  const stockStatus = getStockStatus(product?.stock);
  const discount = product?.price?.original && product?.price?.sale ? Math.round(
    (product.price.original - product.price.sale) / product.price.original * 100
  ) : 0;
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (product?.stock === 0) return;
    if (product?.sizeVariants?.length > 0 || product?.sizes?.length > 0) {
      navigate(`/product/${product?._id}`);
      return;
    }
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };
  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (product?.stock === 0) return;
    if (product?.sizeVariants?.length > 0 || product?.sizes?.length > 0) {
      navigate(`/product/${product?._id}`);
      return;
    }
    addToCart(product);
    window.scrollTo(0, 0);
    navigate("/checkout", {
      state: {
        cartItems: [{ ...product, quantity: 1 }],
        totalAmount: product?.price?.sale ?? 0
      }
    });
  };
  const handleViewDetails = () => {
    navigate(`/product/${product?._id}`);
  };
  const imgSrc = product?.image ? `${apiUrl}${product.image}` : "https://via.placeholder.com/600x400?text=No+Image";
  return /* @__PURE__ */ jsxs("div", { className: "group bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "relative overflow-hidden bg-gray-50",
        onClick: handleViewDetails,
        children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-[3/3] w-full", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: imgSrc,
              alt: product?.name || "Product",
              className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
              loading: "lazy"
            }
          ) }),
          discount > 0 && /* @__PURE__ */ jsxs("span", { className: "absolute top-2.5 right-2.5 bg-black text-white text-[10px] font-semibold tracking-wide px-2 py-0.5", children: [
            discount,
            "% OFF"
          ] }),
          (product?.category || product?.subcategory) && /* @__PURE__ */ jsx("div", { className: "absolute top-2.5 left-2.5", children: /* @__PURE__ */ jsxs("span", { className: "bg-white/90 text-black text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 shadow-sm", children: [
            product?.category,
            product?.subcategory ? ` / ${product.subcategory}` : ""
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-all duration-300 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300", children: /* @__PURE__ */ jsx("div", { className: "bg-white text-black p-2 shadow-md", children: /* @__PURE__ */ jsx(FaEye, { className: "text-sm" }) }) }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "px-3.5 pt-3 pb-2 flex flex-col gap-1.5 flex-1 cursor-pointer",
        onClick: handleViewDetails,
        children: [
          /* @__PURE__ */ jsx("h3", { className: "text-[13.5px] font-semibold text-gray-900 line-clamp-2 leading-snug", children: product?.name || "Unnamed Product" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-0.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-base font-bold text-gray-900 leading-none", children: [
                "₹",
                product?.price?.sale
              ] }),
              product?.price?.original && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400 line-through leading-none", children: [
                "₹",
                product?.price?.original
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `text-[11px] font-semibold ${stockStatus.color}`, children: stockStatus.text })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "px-3.5 pb-3.5 pt-1 flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleBuyNow,
          disabled: product?.stock === 0,
          className: `w-full py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors duration-200 ${product?.stock === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 active:bg-gray-700"}`,
          children: "Buy Now"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleViewDetails,
            className: "flex-1 border border-gray-300 text-gray-700 py-2 text-[11px] font-semibold uppercase tracking-widest hover:border-black hover:text-black transition-colors duration-200",
            children: "Details"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleAddToCart,
            disabled: product?.stock === 0,
            title: "Add to cart",
            className: `w-10 flex items-center justify-center border transition-colors duration-200 ${product?.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"}`,
            children: /* @__PURE__ */ jsx(FaCartPlus, { className: "text-sm" })
          }
        )
      ] })
    ] })
  ] });
};
export {
  ProductCard as P
};
