import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiX } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

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

  const [removingItemId, setRemovingItemId] = useState(null);

  const getCartKey = (item) =>
    `${item._id}-${item.selectedSize || ""}-${item.selectedColor || ""}`;
  const getSalePrice = (item) => item.price?.sale || item.price || 0;

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + getSalePrice(item) * (item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    navigate("/checkout", {
      state: {
        cartItems,
        subtotal,
        totalAmount: subtotal,
      },
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 overflow-y-auto"
      >
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
        </div>

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
                {cartItems.map((item) => {
                  const cartKey = getCartKey(item);
                  const salePrice = getSalePrice(item);
                  const outOfStock = Number(item.stock || 0) <= 0;
                  const atStockLimit =
                    Number(item.stock || 0) > 0 && item.quantity >= item.stock;

                  return (
                    <motion.div
                      key={cartKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 transition-opacity ${
                        removingItemId === cartKey ? "opacity-50" : ""
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
                            onClick={() => handleRemoveItem(cartKey)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            aria-label="Remove item"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {formatINR(salePrice)} each
                          {item.selectedSize ? ` - Size: ${item.selectedSize}` : ""}
                        </p>
                        {outOfStock && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            Out of stock
                          </p>
                        )}
                        {atStockLimit && (
                          <p className="mt-1 text-xs font-semibold text-orange-600">
                            Only {item.stock} available
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                            <button
                              onClick={() => changeQty(cartKey, -1, item.quantity)}
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
                              onClick={() => changeQty(cartKey, 1, item.quantity)}
                              className="px-2 py-1 hover:bg-gray-100 transition-colors rounded-r-lg"
                              disabled={outOfStock || atStockLimit}
                              aria-label="Increase quantity"
                            >
                              <FiPlus className="text-xs" />
                            </button>
                          </div>

                          <span className="font-medium text-gray-900 text-sm">
                            {formatINR(salePrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-4 -mx-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatINR(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span className="text-gray-900">{formatINR(subtotal)}</span>
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
    </>
  );
};

export default CartSidebar;
