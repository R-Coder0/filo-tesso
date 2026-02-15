// src/context/WishlistContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    console.log('🔄 WishlistProvider - Auth Status:', {
      user: user,
      token: token ? 'Present' : 'Missing',
      hasUser: !!user
    });
    
    if (token && user) {
      fetchWishlist();
    } else {
      // Agar user logged out hai toh wishlist clear kar do
      setWishlist([]);
    }
  }, [token, user]);

  const fetchWishlist = async () => {
    if (!token || !user) {
      console.warn('🚫 Cannot fetch wishlist - No token or user');
      return;
    }

    setLoading(true);
    try {
      console.log('📥 Fetching wishlist...');
      const { data } = await axios.get(`${apiUrl}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Wishlist fetched successfully:', data.products?.length || 0, 'items');
      setWishlist(data.products || []);
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn("⚠️ Not authorized to fetch wishlist, please login again.");
      } else {
        console.error("❌ Error fetching wishlist:", err.response?.data || err);
      }
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    console.log('➕ Add to wishlist called:', { productId, user: user, token: token ? 'Present' : 'Missing' });
    
    if (!token || !user) {
      console.warn("⚠️ User not logged in, cannot add to wishlist.");
      throw new Error('Please login to add items to wishlist');
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${apiUrl}/api/wishlist/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Added to wishlist successfully');
      setWishlist(data.products || []);
      return data;
    } catch (err) {
      console.error("❌ Error adding to wishlist:", err.response?.data || err);
      
      if (err.response?.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      } else if (err.response?.status === 400) {
        throw new Error(err.response?.data?.message || 'Product already in wishlist');
      } else {
        throw new Error(err.response?.data?.message || 'Failed to add to wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    console.log('➖ Remove from wishlist called:', { productId, user: user, token: token ? 'Present' : 'Missing' });
    
    if (!token || !user) {
      console.warn("⚠️ User not logged in, cannot remove from wishlist.");
      throw new Error('Please login to manage wishlist');
    }

    setLoading(true);
    try {
      const { data } = await axios.delete(`${apiUrl}/api/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Removed from wishlist successfully');
      setWishlist(data.products || []);
      return data;
    } catch (err) {
      console.error("❌ Error removing from wishlist:", err.response?.data || err);
      
      if (err.response?.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      } else {
        throw new Error(err.response?.data?.message || 'Failed to remove from wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item?._id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{ 
        wishlist, 
        addToWishlist, 
        removeFromWishlist, 
        fetchWishlist,
        isInWishlist,
        loading 
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};