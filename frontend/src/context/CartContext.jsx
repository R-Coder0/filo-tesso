// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext"; // ensure AuthProvider wraps CartProvider

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Ensure AuthContext is defined
  const auth = useContext(AuthContext);
  const user = auth?.user || null;

  const [cartItems, setCartItems] = useState([]);

  // Load cart on user change or initial load
  useEffect(() => {
    if (user && user.id) {
      const saved = localStorage.getItem(`cart_${user.id}`);
      setCartItems(saved ? JSON.parse(saved) : []);
    } else {
      setCartItems([]); // reset for guests
    }
  }, [user]);

  // Persist cart when cartItems change for logged-in users
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists) {
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCartItems((prev) => prev.filter((i) => i._id !== id));

  const updateCartItemQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateCartItemQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
