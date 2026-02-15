import React, { useContext, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FiShoppingBag, FiX, FiPlus, FiMinus, FiTrash2, FiGift } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const TIERS = [
  { threshold: 1400, rate: 0.10, label: "10% OFF" },
  { threshold: 2000, rate: 0.15, label: "15% OFF" },
  { threshold: 3000, rate: 0.20, label: "20% OFF" },
];

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const CartSidebar = ({ onClose }) => {
  const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } =
    useContext(CartContext);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [showGift, setShowGift] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);

  // ---- money math
  const {
    subtotal,
    activeTier,
    nextTier,
    discountRate,
    discountAmount,
    finalTotal,
    progressPct,
  } = useMemo(() => {
    const subtotalRaw = cartItems.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
      0
    );

    const active = [...TIERS].filter((t) => subtotalRaw >= t.threshold).pop() || null;
    const next = TIERS.find((t) => subtotalRaw < t.threshold) || null;
    const rate = active ? active.rate : 0;
    const discount = Math.floor(subtotalRaw * rate);
    const total = Math.max(subtotalRaw - discount, 0);

    const maxThreshold = TIERS[TIERS.length - 1].threshold;
    const pct = Math.min((subtotalRaw / maxThreshold) * 100, 100);

    return {
      subtotal: subtotalRaw,
      activeTier: active,
      nextTier: next,
      discountRate: rate,
      discountAmount: discount,
      finalTotal: total,
      progressPct: pct,
    };
  }, [cartItems]);

  // Trigger gift popup at 20% tier
  useEffect(() => {
    if (activeTier?.rate === 0.20) {
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
        appliedTier: activeTier?.label || "0%",
      },
    });
    onClose();
  };

  const changeQty = (id, delta, currentQty) => {
    if (delta < 0 && currentQty <= 1) return;
    updateCartItemQuantity(id, delta);
  };

  const handleRemoveItem = (id) => {
    setRemovingItemId(id);
    setTimeout(() => {
      removeFromCart(id);
      setRemovingItemId(null);
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="text-gray-900 text-xl" />
              <h2 className="text-lg font-semibold text-gray-900">
                Your Cart ({cartItems.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close cart"
            >
              <FiX className="text-gray-500 text-xl" />
            </button>
          </div>

          {/* Discount progress */}
          {cartItems.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Discount Progress</span>
                <span className={`font-medium ${activeTier ? "text-green-600" : ""}`}>
                  {activeTier ? activeTier.label : "No discount"}
                </span>
              </div>

              <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-green-400 to-green-600"
                />
                
                {/* Tier markers */}
                {TIERS.map((t) => {
                  const maxT = TIERS[TIERS.length - 1].threshold;
                  const left = `${(t.threshold / maxT) * 100}%`;
                  const achieved = subtotal >= t.threshold;
                  return (
                    <div
                      key={t.threshold}
                      className="absolute top-0 -translate-x-1/2"
                      style={{ left }}
                    >
                      <div
                        className={`w-0.5 h-2 ${
                          achieved ? "bg-green-700" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                {TIERS.map((t) => (
                  <div key={t.threshold} className="text-center">
                    <div className={`font-medium ${subtotal >= t.threshold ? "text-green-600" : ""}`}>
                      {t.label}
                    </div>
                    <div>₹{t.threshold}</div>
                  </div>
                ))}
              </div>

              {nextTier ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">₹{nextTier.threshold - subtotal}</span> more for{" "}
                    <span className="font-semibold">{nextTier.label}</span> discount!
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                    <FiGift className="text-green-600" />
                    Max discount unlocked! 🎉
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FiShoppingBag className="text-gray-300 text-5xl mb-3" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 transition-opacity ${
                      removingItemId === item._id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img
                        src={`${apiUrl}${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/80";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatINR(item.price)} each
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                          <button
                            onClick={() => changeQty(item._id, -1, item.quantity)}
                            className="px-2 py-1 hover:bg-gray-100 transition-colors rounded-l-lg disabled:opacity-50"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <FiMinus className="text-xs" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => changeQty(item._id, 1, item.quantity)}
                            className="px-2 py-1 hover:bg-gray-100 transition-colors rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <FiPlus className="text-xs" />
                          </button>
                        </div>

                        <span className="font-medium text-gray-900 text-sm">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Cart Summary */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-4 -mx-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatINR(subtotal)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {activeTier && `(${activeTier.label})`}</span>
                      <span className="font-medium">− {formatINR(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span className="text-gray-900">{formatINR(finalTotal)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Proceed to Checkout
                  </button>
                  
                  {cartItems.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors py-2"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Gift Popup */}
      <AnimatePresence>
        {showGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowGift(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  🎁
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Congratulations! 🎉
                </h3>
                
                <p className="text-gray-600 mb-4">
                  You've unlocked <span className="font-semibold text-green-600">20% discount</span> and earned a 
                  <span className="font-semibold"> surprise gift</span>!
                </p>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    Use code: <span className="font-mono font-bold text-purple-600">GIFT20</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGift(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={() => {
                      setShowGift(false);
                      // Add your gift claim logic here
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
                  >
                    Claim Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartSidebar;