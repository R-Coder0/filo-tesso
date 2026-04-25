import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useContext, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C as CartContext } from "../entry-server.js";
import { FiShoppingBag, FiX, FiGift, FiTrash2, FiMinus, FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "axios";
import "lucide-react";
import "react-icons/fa";
import "react-fast-marquee";
import "react-hot-toast";
const TIERS = [
  { threshold: 1400, rate: 0.1, label: "10% OFF" },
  { threshold: 2e3, rate: 0.15, label: "15% OFF" },
  { threshold: 3e3, rate: 0.2, label: "20% OFF" }
];
const formatINR = (n) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(n || 0);
const CartSidebar = ({ onClose }) => {
  const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } = useContext(CartContext);
  const navigate = useNavigate();
  const apiUrl = "http://localhost:5000";
  const [showGift, setShowGift] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const getCartKey = (item) => `${item._id}-${item.selectedSize || ""}-${item.selectedColor || ""}`;
  const getSalePrice = (item) => item.price?.sale || item.price || 0;
  const {
    subtotal,
    activeTier,
    nextTier,
    discountRate,
    discountAmount,
    finalTotal,
    progressPct
  } = useMemo(() => {
    const subtotalRaw = cartItems.reduce(
      (acc, item) => acc + getSalePrice(item) * (item.quantity || 0),
      0
    );
    const active = [...TIERS].filter((t) => subtotalRaw >= t.threshold).pop() || null;
    const next = TIERS.find((t) => subtotalRaw < t.threshold) || null;
    const rate = active ? active.rate : 0;
    const discount = Math.floor(subtotalRaw * rate);
    const total = Math.max(subtotalRaw - discount, 0);
    const maxThreshold = TIERS[TIERS.length - 1].threshold;
    const pct = Math.min(subtotalRaw / maxThreshold * 100, 100);
    return {
      subtotal: subtotalRaw,
      activeTier: active,
      nextTier: next,
      discountRate: rate,
      discountAmount: discount,
      finalTotal: total,
      progressPct: pct
    };
  }, [cartItems]);
  useEffect(() => {
    if (activeTier?.rate === 0.2) {
      setShowGift(true);
    }
  }, [activeTier]);
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    navigate("/checkout", {
      state: {
        cartItems,
        subtotal,
        discountRate,
        discountAmount,
        totalAmount: finalTotal,
        appliedTier: activeTier?.label || "0%"
      }
    });
    onClose();
  };
  const changeQty = (id, delta, currentQty) => {
    if (delta < 0 && currentQty <= 1) return;
    updateCartItemQuantity(id, delta);
  };
  const handleRemoveItem = (cartKey) => {
    setRemovingItemId(cartKey);
    setTimeout(() => {
      removeFromCart(cartKey);
      setRemovingItemId(null);
    }, 300);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose,
        className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "tween", duration: 0.3 },
        className: "fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 overflow-y-auto",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-white border-b border-gray-200 p-4 z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FiShoppingBag, { className: "text-gray-900 text-xl" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-gray-900", children: [
                  "Your Cart (",
                  cartItems.length,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 hover:bg-gray-100 rounded-full transition-colors",
                  "aria-label": "Close cart",
                  children: /* @__PURE__ */ jsx(FiX, { className: "text-gray-500 text-xl" })
                }
              )
            ] }),
            cartItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-gray-600 mb-2", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount Progress" }),
                /* @__PURE__ */ jsx("span", { className: `font-medium ${activeTier ? "text-green-600" : ""}`, children: activeTier ? activeTier.label : "No discount" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative w-full h-2 bg-gray-100 rounded-full overflow-hidden", children: [
                /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { width: 0 },
                    animate: { width: `${progressPct}%` },
                    transition: { duration: 0.5 },
                    className: "h-full bg-gradient-to-r from-green-400 to-green-600"
                  }
                ),
                TIERS.map((t) => {
                  const maxT = TIERS[TIERS.length - 1].threshold;
                  const left = `${t.threshold / maxT * 100}%`;
                  const achieved = subtotal >= t.threshold;
                  return /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "absolute top-0 -translate-x-1/2",
                      style: { left },
                      children: /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: `w-0.5 h-2 ${achieved ? "bg-green-700" : "bg-gray-300"}`
                        }
                      )
                    },
                    t.threshold
                  );
                })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 flex justify-between text-[10px] text-gray-500", children: TIERS.map((t) => /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("div", { className: `font-medium ${subtotal >= t.threshold ? "text-green-600" : ""}`, children: t.label }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "₹",
                  t.threshold
                ] })
              ] }, t.threshold)) }),
              nextTier ? /* @__PURE__ */ jsx("div", { className: "mt-3 p-3 bg-blue-50 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-800", children: [
                /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                  "₹",
                  nextTier.threshold - subtotal
                ] }),
                " more for",
                " ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: nextTier.label }),
                " discount!"
              ] }) }) : /* @__PURE__ */ jsx("div", { className: "mt-3 p-3 bg-green-50 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-800 font-medium flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(FiGift, { className: "text-green-600" }),
                "Max discount unlocked! 🎉"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 space-y-4", children: cartItems.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
            /* @__PURE__ */ jsx(FiShoppingBag, { className: "text-gray-300 text-5xl mb-3" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 mb-4", children: "Your cart is empty" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClose,
                className: "px-6 py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-gray-800 transition-colors",
                children: "Continue Shopping"
              }
            )
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(AnimatePresence, { children: cartItems.map((item) => {
              const cartKey = getCartKey(item);
              const salePrice = getSalePrice(item);
              const outOfStock = Number(item.stock || 0) <= 0;
              const atStockLimit = Number(item.stock || 0) > 0 && item.quantity >= item.stock;
              return /* @__PURE__ */ jsxs(
                motion.div,
                {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, x: 50 },
                  transition: { duration: 0.2 },
                  className: `flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 transition-opacity ${removingItemId === cartKey ? "opacity-50" : ""}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0", children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: `${apiUrl}${item.image}`,
                        alt: item.name,
                        className: "w-full h-full object-cover",
                        onError: (e) => {
                          e.currentTarget.src = "https://via.placeholder.com/80";
                        }
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-2", children: [
                        /* @__PURE__ */ jsx("h3", { className: "font-medium text-gray-900 truncate text-sm", children: item.name }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: () => handleRemoveItem(cartKey),
                            className: "text-gray-400 hover:text-red-500 transition-colors p-1",
                            "aria-label": "Remove item",
                            children: /* @__PURE__ */ jsx(FiTrash2, { className: "text-sm" })
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
                        formatINR(salePrice),
                        " each",
                        item.selectedSize ? ` • Size: ${item.selectedSize}` : ""
                      ] }),
                      outOfStock && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs font-semibold text-red-600", children: "Out of stock" }),
                      atStockLimit && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs font-semibold text-orange-600", children: [
                        "Only ",
                        item.stock,
                        " available"
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-2", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center border border-gray-300 rounded-lg bg-white", children: [
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => changeQty(cartKey, -1, item.quantity),
                              className: "px-2 py-1 hover:bg-gray-100 transition-colors rounded-l-lg disabled:opacity-50",
                              disabled: item.quantity <= 1,
                              "aria-label": "Decrease quantity",
                              children: /* @__PURE__ */ jsx(FiMinus, { className: "text-xs" })
                            }
                          ),
                          /* @__PURE__ */ jsx("span", { className: "w-8 text-center text-sm font-medium", children: item.quantity }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => changeQty(cartKey, 1, item.quantity),
                              className: "px-2 py-1 hover:bg-gray-100 transition-colors rounded-r-lg",
                              disabled: outOfStock || atStockLimit,
                              "aria-label": "Increase quantity",
                              children: /* @__PURE__ */ jsx(FiPlus, { className: "text-xs" })
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 text-sm", children: formatINR(salePrice * item.quantity) })
                      ] })
                    ] })
                  ]
                },
                cartKey
              );
            }) }),
            /* @__PURE__ */ jsxs("div", { className: "sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-4 -mx-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Subtotal" }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900", children: formatINR(subtotal) })
                ] }),
                discountAmount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-green-600", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Discount ",
                    activeTier && `(${activeTier.label})`
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    "− ",
                    formatINR(discountAmount)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Total" }),
                  /* @__PURE__ */ jsx("span", { className: "text-gray-900", children: formatINR(finalTotal) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleCheckout,
                    disabled: cartItems.length === 0,
                    className: "w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed",
                    children: "Proceed to Checkout"
                  }
                ),
                cartItems.length > 0 && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: clearCart,
                    className: "w-full text-sm text-gray-500 hover:text-red-500 transition-colors py-2",
                    children: "Clear Cart"
                  }
                )
              ] })
            ] })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(AnimatePresence, { children: showGift && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4",
        onClick: () => setShowGift(false),
        children: /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { scale: 0.9, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.9, opacity: 0 },
            onClick: (e) => e.stopPropagation(),
            className: "bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full",
            children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx(
                motion.div,
                {
                  animate: { rotate: [0, -10, 10, -10, 10, 0] },
                  transition: { duration: 0.5 },
                  className: "text-6xl mb-4",
                  children: "🎁"
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Congratulations! 🎉" }),
              /* @__PURE__ */ jsxs("p", { className: "text-gray-600 mb-4", children: [
                "You've unlocked ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-green-600", children: "20% discount" }),
                " and earned a",
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: " surprise gift" }),
                "!"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700", children: [
                "Use code: ",
                /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-purple-600", children: "GIFT20" })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowGift(false),
                    className: "flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors",
                    children: "Later"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setShowGift(false);
                    },
                    className: "flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors font-medium",
                    children: "Claim Now"
                  }
                )
              ] })
            ] })
          }
        )
      }
    ) })
  ] });
};
export {
  CartSidebar as default
};
