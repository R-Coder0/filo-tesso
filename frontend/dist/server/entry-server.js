import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { createContext, useState, useEffect, useContext, useMemo, lazy, memo, Suspense, StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import axios from "axios";
import { useNavigate, Link, useLocation, Routes, Route } from "react-router-dom";
import { Coins, Package, Loader, Ban, Calendar, CreditCard, Clock, Image, FileText, XCircle, CheckCircle, User, LogOut, Edit2, Plus, MapPin, Trash2, Search, X, Phone, Mail, Instagram, Star, MessageSquare, Lightbulb, Send } from "lucide-react";
import { FaHeart, FaHandshake, FaPaperPlane } from "react-icons/fa";
import "react-fast-marquee";
import "react-hot-toast";
const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const stored = localStorage.getItem("auth");
        console.log("🔄 Loading auth from storage:", stored);
        if (stored) {
          const parsed = JSON.parse(stored);
          const storedUser = parsed?.user;
          const storedToken = parsed?.token;
          if (storedToken && typeof storedToken === "string" && storedToken !== "undefined") {
            console.log("✅ Valid token found, setting auth...");
            setUser(storedUser);
            setToken(storedToken);
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          } else {
            console.warn("❌ Invalid token found in storage, clearing...");
            localStorage.removeItem("auth");
          }
        }
      } catch (err) {
        console.warn("⚠️ Error parsing stored auth, clearing...", err);
        localStorage.removeItem("auth");
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        if (!token) {
          console.log("❌ No token available for profile refresh");
          return;
        }
        console.log("🔄 Refreshing user profile with token...");
        if (user && user.name && user.email) {
          console.log("✅ User data already present, skipping refresh");
          return;
        }
        const { data } = await axios.get(`${"http://localhost:5000"}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Profile refresh response:", data);
        const freshUser = {
          id: data.id || data._id,
          name: data.name,
          email: data.email,
          coinsBalance: Number(data.coinsBalance ?? 0)
        };
        console.log("✅ Fresh user data:", freshUser);
        setUser(freshUser);
        const stored = localStorage.getItem("auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            "auth",
            JSON.stringify({ ...parsed, user: freshUser })
          );
          console.log("✅ LocalStorage updated with fresh user data");
        }
      } catch (err) {
        console.warn("⚠️ Failed to refresh profile:", err?.response?.data || err.message);
        console.log("🔄 Using existing user data from initial login");
      }
    };
    if (token) {
      refreshProfile();
    }
  }, [token]);
  const saveAuth = (userData, jwtToken) => {
    console.log("💾 Saving auth data:", { userData, jwtToken });
    if (!jwtToken || typeof jwtToken !== "string" || jwtToken === "undefined") {
      console.error("❌ Invalid token received:", jwtToken);
      return;
    }
    const normalized = {
      id: userData.id || userData._id,
      name: userData.name,
      email: userData.email,
      coinsBalance: Number(userData.coinsBalance ?? 0)
    };
    console.log("✅ Normalized user data:", normalized);
    setUser(normalized);
    setToken(jwtToken);
    localStorage.setItem("auth", JSON.stringify({ user: normalized, token: jwtToken }));
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
    console.log("✅ Auth saved successfully");
  };
  const login = async (email, password) => {
    console.log("🔐 Logging in with:", email);
    const res = await axios.post(
      `${"http://localhost:5000"}/api/users/login`,
      { email, password }
    );
    console.log("✅ Login response:", res.data);
    const { user: userData, token: jwtToken } = res.data;
    saveAuth(userData, jwtToken);
    return userData;
  };
  const register = async (name, email, password) => {
    console.log("📝 Registering user:", name, email);
    const res = await axios.post(
      `${"http://localhost:5000"}/api/users/register`,
      { name, email, password }
    );
    console.log("✅ Register response:", res.data);
    const { user: userData, token: jwtToken } = res.data;
    saveAuth(userData, jwtToken);
    return userData;
  };
  const googleLogin = async (googleToken) => {
    console.log("🔐 Google login with token");
    const res = await axios.post(
      `${"http://localhost:5000"}/api/users/google-login`,
      { token: googleToken }
    );
    console.log("✅ Google login response:", res.data);
    const { user: userData, token: jwtToken } = res.data;
    saveAuth(userData, jwtToken);
    return userData;
  };
  const logout = () => {
    console.log("🚪 Logging out...");
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };
  const updateCoins = (newBalance) => {
    if (typeof newBalance !== "number") return;
    setUser((prev) => {
      const updated = prev ? { ...prev, coinsBalance: newBalance } : { coinsBalance: newBalance };
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          "auth",
          JSON.stringify({
            ...parsed,
            user: { ...parsed.user, coinsBalance: newBalance }
          })
        );
      }
      return updated;
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600", children: "Loading..." })
    ] }) });
  }
  return /* @__PURE__ */ jsx(
    AuthContext.Provider,
    {
      value: {
        user,
        token,
        login,
        register,
        googleLogin,
        logout,
        updateCoins
      },
      children
    }
  );
};
const CartContext = createContext();
const CartProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const user = auth?.user || null;
  const [cartItems, setCartItems] = useState([]);
  useEffect(() => {
    if (user && user.id) {
      const saved = localStorage.getItem(`cart_${user.id}`);
      setCartItems(saved ? JSON.parse(saved) : []);
    } else {
      setCartItems([]);
    }
  }, [user]);
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);
  const getCartKey = (item) => `${item._id || item.product}-${item.selectedSize || ""}-${item.selectedColor || ""}`;
  const addToCart = (product) => {
    setCartItems((prev) => {
      const incomingQty = Math.max(1, Number(product.quantity || 1));
      const maxStock = Number(product.stock || 0);
      if (maxStock <= 0) return prev;
      const productKey = getCartKey(product);
      const exists = prev.find((i) => getCartKey(i) === productKey);
      if (exists) {
        return prev.map(
          (i) => getCartKey(i) === productKey ? { ...i, quantity: Math.min(maxStock, (i.quantity || 1) + incomingQty) } : i
        );
      }
      return [...prev, { ...product, quantity: Math.min(maxStock, incomingQty) }];
    });
  };
  const removeFromCart = (id) => setCartItems((prev) => prev.filter((i) => i._id !== id && getCartKey(i) !== id));
  const updateCartItemQuantity = (id, delta) => {
    setCartItems(
      (prev) => prev.map(
        (i) => i._id === id || getCartKey(i) === id ? { ...i, quantity: Math.max(1, Math.min(Number(i.stock || Infinity), i.quantity + delta)) } : i
      )
    );
  };
  const clearCart = () => setCartItems([]);
  return /* @__PURE__ */ jsx(
    CartContext.Provider,
    {
      value: { cartItems, addToCart, removeFromCart, updateCartItemQuantity, clearCart },
      children
    }
  );
};
const UIContext = createContext();
const UIProvider = ({ children }) => {
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  return /* @__PURE__ */ jsx(UIContext.Provider, { value: { showCartSidebar, setShowCartSidebar }, children });
};
const useUI = () => useContext(UIContext);
const WishlistContext = createContext();
const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);
  const apiUrl = "http://localhost:5000";
  useEffect(() => {
    console.log("🔄 WishlistProvider - Auth Status:", {
      user,
      token: token ? "Present" : "Missing",
      hasUser: !!user
    });
    if (token && user) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [token, user]);
  const fetchWishlist = async () => {
    if (!token || !user) {
      console.warn("🚫 Cannot fetch wishlist - No token or user");
      return;
    }
    setLoading(true);
    try {
      console.log("📥 Fetching wishlist...");
      const { data } = await axios.get(`${apiUrl}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("✅ Wishlist fetched successfully:", data.products?.length || 0, "items");
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
    console.log("➕ Add to wishlist called:", { productId, user, token: token ? "Present" : "Missing" });
    if (!token || !user) {
      console.warn("⚠️ User not logged in, cannot add to wishlist.");
      throw new Error("Please login to add items to wishlist");
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${apiUrl}/api/wishlist/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Added to wishlist successfully");
      setWishlist(data.products || []);
      return data;
    } catch (err) {
      console.error("❌ Error adding to wishlist:", err.response?.data || err);
      if (err.response?.status === 401) {
        throw new Error("Your session has expired. Please login again.");
      } else if (err.response?.status === 400) {
        throw new Error(err.response?.data?.message || "Product already in wishlist");
      } else {
        throw new Error(err.response?.data?.message || "Failed to add to wishlist");
      }
    } finally {
      setLoading(false);
    }
  };
  const removeFromWishlist = async (productId) => {
    console.log("➖ Remove from wishlist called:", { productId, user, token: token ? "Present" : "Missing" });
    if (!token || !user) {
      console.warn("⚠️ User not logged in, cannot remove from wishlist.");
      throw new Error("Please login to manage wishlist");
    }
    setLoading(true);
    try {
      const { data } = await axios.delete(`${apiUrl}/api/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("✅ Removed from wishlist successfully");
      setWishlist(data.products || []);
      return data;
    } catch (err) {
      console.error("❌ Error removing from wishlist:", err.response?.data || err);
      if (err.response?.status === 401) {
        throw new Error("Your session has expired. Please login again.");
      } else {
        throw new Error(err.response?.data?.message || "Failed to remove from wishlist");
      }
    } finally {
      setLoading(false);
    }
  };
  const isInWishlist = (productId) => {
    return wishlist.some((item) => item?._id === productId);
  };
  return /* @__PURE__ */ jsx(
    WishlistContext.Provider,
    {
      value: {
        wishlist,
        addToWishlist,
        removeFromWishlist,
        fetchWishlist,
        isInWishlist,
        loading
      },
      children
    }
  );
};
const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
const MyOrders$1 = () => {
  const { user, token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [orderToReturn, setOrderToReturn] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [returningOrderId, setReturningOrderId] = useState(null);
  const apiUrl = "http://localhost:5000";
  useEffect(() => {
    const fetch2 = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${apiUrl}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const sortedOrders = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (e) {
        console.error(e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetch2();
  }, [user, token, apiUrl]);
  const cancelOrder = async (orderId, reason) => {
    try {
      setCancellingOrderId(orderId);
      const { data } = await axios.patch(
        `${apiUrl}/api/orders/${orderId}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map(
          (order) => order._id === orderId ? data.order : order
        );
        return updatedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      setOrderToCancel(null);
      setCancellationReason("");
      setCancellingOrderId(null);
      alert(data.message);
    } catch (error) {
      console.error("Cancellation failed:", error);
      setCancellingOrderId(null);
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };
  const handleReturnRequest = async (orderId, reason) => {
    try {
      setReturningOrderId(orderId);
      const { data } = await axios.patch(
        `${apiUrl}/api/orders/${orderId}/return`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map(
          (order) => order._id === orderId ? data.order : order
        );
        return updatedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      setOrderToReturn(null);
      setReturnReason("");
      setReturningOrderId(null);
      alert(data.message);
    } catch (error) {
      console.error("Return request failed:", error);
      setReturningOrderId(null);
      alert(error.response?.data?.message || "Failed to request return");
    }
  };
  const isNewOrder = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = (/* @__PURE__ */ new Date()).getTime();
    const hoursDifference = (currentTime - orderTime) / (1e3 * 60 * 60);
    return hoursDifference <= 24;
  };
  const canReturnOrder = (order) => {
    if (order.orderStatus !== "delivered") return false;
    if (order.returnRequested) return false;
    const deliveredTime = new Date(order.updatedAt).getTime();
    const currentTime = (/* @__PURE__ */ new Date()).getTime();
    const hoursDifference = (currentTime - deliveredTime) / (1e3 * 60 * 60);
    return hoursDifference <= 24;
  };
  const derivedCoinsFromOrders = useMemo(() => {
    try {
      return (orders || []).reduce(
        (sum, o) => sum + (Number(o?.coinsEarned) || 0) - (Number(o?.coinsRedeemed) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [orders]);
  const coinBalance = typeof user?.coinsBalance === "number" ? user.coinsBalance : derivedCoinsFromOrders;
  const getCoinStatusInfo = (order) => {
    const coinStatus = order.coinStatus || "pending";
    const coinCreditDate = order.coinCreditDate ? new Date(order.coinCreditDate) : null;
    const now = /* @__PURE__ */ new Date();
    switch (coinStatus) {
      case "credited":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          text: "Coins Credited",
          description: `${order.coinsEarned} coins added to your wallet`
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          text: "Coins Cancelled",
          description: "Order was cancelled/returned"
        };
      case "pending":
      default:
        const daysRemaining = coinCreditDate ? Math.ceil((coinCreditDate - now) / (1e3 * 60 * 60 * 24)) : 10;
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          text: "Coins Pending",
          description: daysRemaining > 0 ? `Will be credited in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}` : "Will be credited today"
        };
    }
  };
  const getOrderStatusInfo = (order) => {
    if (order.cancelled) {
      switch (order.cancellationStatus) {
        case "requested":
          return {
            color: "text-orange-600",
            text: "Cancellation Requested"
          };
        case "approved":
          return {
            color: "text-red-600",
            text: "Cancelled"
          };
        case "rejected":
          return {
            color: "text-yellow-600",
            text: "Cancellation Rejected"
          };
        default:
          return {
            color: "text-orange-600",
            text: "Cancellation Pending"
          };
      }
    }
    const orderStatus = order.orderStatus || "pending";
    const paymentStatus = order.paymentStatus || "Pending";
    if (["cancelled", "returned"].includes(orderStatus)) {
      return {
        color: "text-red-600",
        text: orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)
      };
    }
    if (orderStatus === "delivered") {
      return {
        color: "text-green-600",
        text: "Delivered"
      };
    }
    if (paymentStatus === "Paid") {
      return {
        color: "text-blue-600",
        text: orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1) || "Processing"
      };
    }
    return {
      color: "text-yellow-600",
      text: paymentStatus
    };
  };
  const canCancelOrder = (order) => {
    if (order.cancelled) return false;
    const status = (order.orderStatus || "pending").toLowerCase();
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    return cancellableStatuses.includes(status);
  };
  const CancelOrderModal = () => {
    if (!orderToCancel) return null;
    const isCancelling = cancellingOrderId === orderToCancel._id;
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-6 max-w-md w-full", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: isCancelling ? "Cancelling Order..." : "Cancel Order?" }),
      !isCancelling ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-gray-600 mb-4", children: [
          "Are you sure you want to cancel order #",
          orderToCancel._id?.slice(-8),
          "?"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Reason for cancellation" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: cancellationReason,
              onChange: (e) => setCancellationReason(e.target.value),
              className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent",
              disabled: isCancelling,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select a reason" }),
                /* @__PURE__ */ jsx("option", { value: "changed-mind", children: "Changed my mind" }),
                /* @__PURE__ */ jsx("option", { value: "found-cheaper", children: "Found better price elsewhere" }),
                /* @__PURE__ */ jsx("option", { value: "delivery-time", children: "Delivery time too long" }),
                /* @__PURE__ */ jsx("option", { value: "wrong-item", children: "Ordered wrong item" }),
                /* @__PURE__ */ jsx("option", { value: "other", children: "Other reason" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setOrderToCancel(null);
                setCancellationReason("");
              },
              disabled: isCancelling,
              className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              children: "Go Back"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => cancelOrder(orderToCancel._id, cancellationReason),
              disabled: !cancellationReason || isCancelling,
              className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2",
              children: isCancelling ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }),
                "Cancelling..."
              ] }) : "Cancel Order"
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-4", children: [
        /* @__PURE__ */ jsx(Loader, { className: "w-8 h-8 animate-spin text-red-600 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Processing your cancellation request..." })
      ] })
    ] }) });
  };
  const ReturnOrderModal = () => {
    if (!orderToReturn) return null;
    const isReturning = returningOrderId === orderToReturn._id;
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-6 max-w-md w-full", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: isReturning ? "Requesting Return..." : "Request Return?" }),
      !isReturning ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-gray-600 mb-4", children: [
          "Are you sure you want to return order #",
          orderToReturn._id?.slice(-8),
          "?",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-600", children: "Return window: 24 hours from delivery" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Reason for return" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: returnReason,
              onChange: (e) => setReturnReason(e.target.value),
              className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              disabled: isReturning,
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select a reason" }),
                /* @__PURE__ */ jsx("option", { value: "wrong-item", children: "Wrong item received" }),
                /* @__PURE__ */ jsx("option", { value: "defective", children: "Product is defective" }),
                /* @__PURE__ */ jsx("option", { value: "not-as-described", children: "Not as described" }),
                /* @__PURE__ */ jsx("option", { value: "size-issue", children: "Size doesn't fit" }),
                /* @__PURE__ */ jsx("option", { value: "changed-mind", children: "Changed my mind" }),
                /* @__PURE__ */ jsx("option", { value: "other", children: "Other reason" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setOrderToReturn(null);
                setReturnReason("");
              },
              disabled: isReturning,
              className: "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              children: "Go Back"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleReturnRequest(orderToReturn._id, returnReason),
              disabled: !returnReason || isReturning,
              className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2",
              children: isReturning ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }),
                "Requesting..."
              ] }) : "Request Return"
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-4", children: [
        /* @__PURE__ */ jsx(Loader, { className: "w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Processing your return request..." })
      ] })
    ] }) });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-18", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "My Orders" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Track and manage your purchases" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-full shadow-lg", children: [
          /* @__PURE__ */ jsx(Coins, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-lg", children: coinBalance }),
          /* @__PURE__ */ jsx("span", { className: "text-sm opacity-90", children: "Coins" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Package, { className: "w-10 h-10 text-gray-400 animate-pulse" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Loading your orders…" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Hold your horses. Or your wallet." })
      ] })
    ] }) });
  }
  if (!orders.length) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-18", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "My Orders" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Track and manage your purchases" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-full shadow-lg", children: [
          /* @__PURE__ */ jsx(Coins, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-lg", children: coinBalance }),
          /* @__PURE__ */ jsx("span", { className: "text-sm opacity-90", children: "Coins" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Package, { className: "w-10 h-10 text-gray-400" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No orders yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Your order history will appear here once you make a purchase" })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "My Orders" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Track orders and coin status" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 sm:mt-0 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-full shadow-lg", children: [
          /* @__PURE__ */ jsx(Coins, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-lg", children: coinBalance }),
          /* @__PURE__ */ jsx("span", { className: "text-sm opacity-90", children: "Coins Available" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: orders.map((order) => {
        const coinStatusInfo = getCoinStatusInfo(order);
        const orderStatusInfo = getOrderStatusInfo(order);
        const CoinStatusIcon = coinStatusInfo.icon;
        const isThisOrderCancelling = cancellingOrderId === order._id;
        const isThisOrderReturning = returningOrderId === order._id;
        const isNew = isNewOrder(order.createdAt);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 relative",
            children: [
              isNew && /* @__PURE__ */ jsx("div", { className: "absolute -top-0 -left-0 bg-green-500 text-white px-3 rounded-full text-xs font-bold z-10 flex items-center gap-1", children: "NEW" }),
              /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 text-white" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-white/70 text-xs font-medium uppercase tracking-wider", children: "Order ID" }),
                    /* @__PURE__ */ jsx("p", { className: "text-white font-mono text-sm", children: order._id })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${orderStatusInfo.color} bg-white/20`, children: orderStatusInfo.text }),
                  canReturnOrder(order) && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setOrderToReturn(order),
                      disabled: isThisOrderReturning,
                      className: "flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      children: [
                        isThisOrderReturning ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Package, { className: "w-3 h-3" }),
                        isThisOrderReturning ? "Returning..." : "Return"
                      ]
                    }
                  ),
                  canCancelOrder(order) && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setOrderToCancel(order),
                      disabled: isThisOrderCancelling,
                      className: "flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      children: [
                        isThisOrderCancelling ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Ban, { className: "w-3 h-3" }),
                        isThisOrderCancelling ? "Cancelling..." : "Cancel"
                      ]
                    }
                  )
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
                order.returnRequested && /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg mb-4", children: [
                  "Return ",
                  order.returnStatus,
                  order.returnReason && ` - ${order.returnReason}`
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-gray-600" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-medium", children: "Order Date" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-gray-900", children: [
                        new Date(order.createdAt).toLocaleDateString(),
                        isNew && /* @__PURE__ */ jsx("span", { className: "ml-2 text-green-600 text-xs font-medium", children: "(New)" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-gray-600" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-medium", children: "Total Amount" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-gray-900", children: [
                        "₹",
                        order.totalAmount
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Coins, { className: "w-5 h-5 text-gray-600" }) }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-medium", children: "Coins Activity" }),
                      /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-gray-900", children: [
                        /* @__PURE__ */ jsxs("span", { className: "text-green-600", children: [
                          "+",
                          order.coinsEarned
                        ] }),
                        " / ",
                        /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                          "-",
                          order.coinsRedeemed
                        ] })
                      ] })
                    ] })
                  ] })
                ] }),
                order.cancelled && /* @__PURE__ */ jsx("div", { className: `${order.cancellationStatus === "requested" ? "bg-orange-50 border-orange-200" : order.cancellationStatus === "approved" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"} border rounded-xl p-4 mb-6`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(Clock, { className: `w-5 h-5 ${order.cancellationStatus === "requested" ? "text-orange-600" : order.cancellationStatus === "approved" ? "text-red-600" : "text-yellow-600"}` }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxs("span", { className: `text-sm font-semibold ${order.cancellationStatus === "requested" ? "text-orange-600" : order.cancellationStatus === "approved" ? "text-red-600" : "text-yellow-600"}`, children: [
                        order.cancellationStatus === "requested" && "Cancellation Requested",
                        order.cancellationStatus === "approved" && "Order Cancelled",
                        order.cancellationStatus === "rejected" && "Cancellation Rejected"
                      ] }),
                      order.cancelledAt && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
                        "(",
                        new Date(order.cancelledAt).toLocaleDateString(),
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [
                      order.cancellationStatus === "requested" && "Your cancellation request is under review. Admin will process it shortly.",
                      order.cancellationStatus === "approved" && `Your order has been cancelled. ${order.coinsRedeemed > 0 ? `${order.coinsRedeemed} coins have been refunded to your account.` : ""}`,
                      order.cancellationStatus === "rejected" && "Your cancellation request was rejected. Please contact support for more details."
                    ] }),
                    order.cancellationReason && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mt-1", children: [
                      /* @__PURE__ */ jsx("strong", { children: "Reason:" }),
                      " ",
                      order.cancellationReason
                    ] })
                  ] })
                ] }) }),
                order.coinsEarned > 0 && /* @__PURE__ */ jsx("div", { className: `${coinStatusInfo.bgColor} ${coinStatusInfo.borderColor} border rounded-xl p-4 mb-6`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(CoinStatusIcon, { className: `w-5 h-5 ${coinStatusInfo.color}` }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: `text-sm font-semibold ${coinStatusInfo.color}`, children: coinStatusInfo.text }),
                      order.coinCreditDate && coinStatusInfo.text === "Coins Pending" && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
                        "(until ",
                        new Date(order.coinCreditDate).toLocaleDateString(),
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: coinStatusInfo.description })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: `text-lg font-bold ${coinStatusInfo.color}`, children: [
                    "+",
                    order.coinsEarned
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-4 mb-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Subtotal" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900", children: [
                      "₹",
                      order.totalAmount
                    ] })
                  ] }),
                  order.coinsRedeemed > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Coins Redeemed" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-green-600", children: [
                      "-₹",
                      order.coinsRedeemed
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-2 border-t border-gray-200", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-base font-semibold text-gray-900", children: "Amount Paid" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-gray-900", children: [
                      "₹",
                      order.payableAmount
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4", children: "Order Items" }),
                  /* @__PURE__ */ jsx("div", { className: "space-y-3", children: order.products.map((p, i) => /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors",
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0", children: /* @__PURE__ */ jsx(Package, { className: "w-6 h-6 text-gray-400" }) }),
                        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                          /* @__PURE__ */ jsx("h5", { className: "font-semibold text-gray-900 mb-1", children: p.product?.name || "Unknown Product" }),
                          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600", children: [
                            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                              "Qty: ",
                              p.quantity
                            ] }),
                            p.selectedSize && /* @__PURE__ */ jsxs("span", { children: [
                              "Size: ",
                              p.selectedSize
                            ] }),
                            p.selectedColor && /* @__PURE__ */ jsxs("span", { children: [
                              "Color: ",
                              p.selectedColor
                            ] })
                          ] })
                        ] })
                      ]
                    },
                    i
                  )) })
                ] }),
                (order.customizationUploads?.image || order.customizationUploads?.pdf) && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-4", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3", children: "Customization" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
                    order.customizationUploads?.image && /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: `${apiUrl}${order.customizationUploads.image}`,
                          alt: "Customization",
                          className: "w-24 h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-gray-900 transition-colors"
                        }
                      ),
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Image, { className: "w-6 h-6 text-white" }) })
                    ] }),
                    order.customizationUploads?.pdf && /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: `${apiUrl}${order.customizationUploads.pdf}`,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all group",
                        children: [
                          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5" }),
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "View PDF" })
                        ]
                      }
                    )
                  ] })
                ] })
              ] })
            ]
          },
          order._id
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(CancelOrderModal, {}),
    /* @__PURE__ */ jsx(ReturnOrderModal, {}),
    " "
  ] });
};
const MyOrders$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: MyOrders$1
}, Symbol.toStringTag, { value: "Module" }));
const AddressForm = ({ onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: ""
  });
  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address)
      return alert("Please fill all required fields");
    onSave(formData);
    onClose();
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-semibold text-gray-900", children: initialData ? "Edit Address" : "Add New Address" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "text-gray-500 hover:text-gray-900 transition-colors p-1",
          children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-4 sm:p-6 space-y-4", children: [
      [
        { label: "Full Name", name: "fullName", required: true },
        { label: "Phone Number", name: "phone", type: "tel", required: true },
        { label: "Address", name: "address", required: true },
        { label: "City", name: "city" },
        { label: "State", name: "state" },
        { label: "Pincode", name: "pincode" },
        { label: "Country", name: "country" }
      ].map((f) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1.5", children: [
          f.label,
          " ",
          f.required && /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: f.type || "text",
            name: f.name,
            value: formData[f.name],
            onChange: handleChange,
            className: "w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
            placeholder: `Enter ${f.label.toLowerCase()}`
          }
        )
      ] }, f.name)),
      /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "w-full bg-black text-white py-3 sm:py-3.5 rounded-lg  transition-all font-medium text-sm sm:text-base shadow-sm",
          children: "Save Address"
        }
      ) })
    ] })
  ] }) });
};
function Profile() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pendingCoins, setPendingCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const apiUrl = "http://localhost:5000";
  console.log("🔍 Profile Component - Current User:", user);
  console.log("🔍 Profile Component - User Name:", user?.name);
  console.log("🔍 Profile Component - User Email:", user?.email);
  console.log("🔍 Profile Component - Token:", token ? "Present" : "Missing");
  useEffect(() => {
    console.log("🔄 User data updated:", user);
  }, [user]);
  useEffect(() => {
    const checkLocalStorage = () => {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("📦 Direct localStorage check:", parsed.user);
        if (!user?.name && parsed.user?.name) {
          console.log("🔄 Using localStorage data as fallback");
        }
      }
    };
    checkLocalStorage();
  }, [user]);
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || "");
  const [orderId, setOrderId] = useState("");
  const [activeTab, setActiveTab] = useState("account");
  const handleSaveName = async () => {
    console.log("💾 Saving name:", tempName);
    if (!tempName.trim()) {
      alert("Name cannot be empty");
      return;
    }
    try {
      setUpdating(true);
      const storedAuth = localStorage.getItem("auth");
      console.log("📦 Stored auth before update:", storedAuth);
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        const updatedAuth = {
          ...parsed,
          user: {
            ...parsed.user,
            name: tempName.trim()
          }
        };
        localStorage.setItem("auth", JSON.stringify(updatedAuth));
        console.log("✅ LocalStorage updated with new name:", tempName.trim());
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      setEditingName(false);
    } catch (error) {
      console.error("❌ Profile update error:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };
  useEffect(() => {
    if (user?.name) {
      setTempName(user.name);
      console.log("🔄 TempName updated to:", user.name);
    }
  }, [user?.name]);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedAddresses")) || [];
    setAddresses(saved);
    console.log("🏠 Addresses loaded:", saved.length);
  }, []);
  const saveToStorage = (list) => {
    localStorage.setItem("savedAddresses", JSON.stringify(list));
    setAddresses(list);
    console.log("💾 Addresses saved to localStorage:", list.length);
  };
  const handleSave = (data) => {
    if (editingAddress) {
      const updated = addresses.map(
        (a) => a.id === editingAddress.id ? { ...data, id: a.id } : a
      );
      saveToStorage(updated);
    } else {
      saveToStorage([...addresses, { ...data, id: Date.now() }]);
    }
    setEditingAddress(null);
    setShowForm(false);
  };
  const handleDelete = (id) => {
    if (window.confirm("Delete this address?")) {
      saveToStorage(addresses.filter((a) => a.id !== id));
    }
  };
  useEffect(() => {
    const fetchPendingCoins = async () => {
      try {
        console.log("🔄 Fetching pending coins...");
        const { data } = await axios.get(`${apiUrl}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const pending = (data || []).reduce(
          (total, order) => order.coinStatus === "pending" ? total + order.coinsEarned : total,
          0
        );
        setPendingCoins(pending);
        console.log("💰 Pending coins:", pending);
      } catch (error) {
        console.error("❌ Error fetching pending coins:", error);
        setPendingCoins(0);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchPendingCoins();
  }, [user, token, apiUrl]);
  if (!user) {
    console.log("🚫 No user found, redirecting to login");
    navigate("/login", { replace: true });
    return null;
  }
  const coins = Number(user?.coinsBalance ?? 0);
  console.log("🪙 Current coins balance:", coins);
  const NavButton = ({ active, onClick, children, danger }) => /* @__PURE__ */ jsx(
    "button",
    {
      onClick,
      className: [
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-blue-50 text-blue-600" : danger ? "text-gray-700 hover:bg-red-50 hover:text-red-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
      ].join(" "),
      children
    }
  );
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50 pb-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "sticky top-[76px] z-40 bg-white shadow-sm lg:hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold text-gray-900", children: "My Account" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              console.log("🚪 Logging out...");
              logout();
              navigate("/", { replace: true });
            },
            className: "text-red-600 text-sm font-medium",
            children: "Logout"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-4 pb-3 flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("account"),
            className: `flex-1 px-3 py-2 text-sm rounded-md border ${activeTab === "account" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"}`,
            children: "Account"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("orders"),
            className: `flex-1 px-3 py-2 text-sm rounded-md border ${activeTab === "orders" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"}`,
            children: "My Orders"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 pt-0 sm:pt-6 lg:pt-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:grid lg:grid-cols-12 lg:gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden lg:block lg:col-span-3", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm overflow-hidden sticky top-24", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-semibold", children: (user?.name || "U").charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Hello," }),
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 truncate", children: user?.name || "No Name" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("nav", { className: "p-3 space-y-1", children: [
            /* @__PURE__ */ jsxs(
              NavButton,
              {
                active: activeTab === "orders",
                onClick: () => setActiveTab("orders"),
                children: [
                  /* @__PURE__ */ jsx(Package, { className: "w-4 h-4" }),
                  "My Orders"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              NavButton,
              {
                active: activeTab === "account",
                onClick: () => setActiveTab("account"),
                children: [
                  /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
                  "Account Settings"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              NavButton,
              {
                danger: true,
                onClick: () => {
                  console.log("🚪 Logging out...");
                  logout();
                  navigate("/", { replace: true });
                },
                children: [
                  /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                  "Logout"
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-9", children: [
          activeTab === "account" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "lg:hidden bg-black px-4 py-6 mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-xl font-bold border-2 border-white/30", children: (user?.name || "U").charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: !editingName ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: user?.name || "No Name" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingName(true),
                      className: "text-white/80 hover:text-white",
                      children: /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-blue-100 text-sm mt-0.5", children: user?.email })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: tempName,
                    onChange: (e) => setTempName(e.target.value),
                    className: "w-full px-3 py-2 rounded-lg text-white text-sm",
                    disabled: updating,
                    placeholder: "Enter your name"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleSaveName,
                      disabled: updating,
                      className: "px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium disabled:opacity-50",
                      children: updating ? "Saving..." : "Save"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setEditingName(false);
                        setTempName(user?.name || "");
                      },
                      disabled: updating,
                      className: "px-3 py-1.5 bg-white/20 text-white rounded-md text-xs font-medium disabled:opacity-50",
                      children: "Cancel"
                    }
                  )
                ] })
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "hidden lg:block bg-white rounded-lg shadow-sm p-6 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold", children: (user?.name || "U").charAt(0).toUpperCase() }),
                /* @__PURE__ */ jsx("div", { children: !editingName ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: user?.name || "No Name" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setEditingName(true),
                        className: "text-gray-400 hover:text-gray-600",
                        children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: user?.email })
                ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: tempName,
                      onChange: (e) => setTempName(e.target.value),
                      className: "border border-gray-300 rounded-lg px-3 py-2 text-sm w-64",
                      disabled: updating,
                      placeholder: "Enter your name"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleSaveName,
                      disabled: updating,
                      className: "px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50",
                      children: updating ? "Saving..." : "Save"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setEditingName(false);
                        setTempName(user?.name || "");
                      },
                      disabled: updating,
                      className: "px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50",
                      children: "Cancel"
                    }
                  )
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-3", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setActiveTab("orders"),
                    className: "inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all font-medium text-gray-900",
                    children: [
                      /* @__PURE__ */ jsx(Package, { className: "w-4 h-4" }),
                      "My Orders"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      console.log("🚪 Logging out...");
                      logout();
                      navigate("/", { replace: true });
                    },
                    className: "inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 transition-all font-medium shadow-sm hover:shadow",
                    children: [
                      /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                      "Logout"
                    ]
                  }
                )
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 px-4 sm:px-0 mb-2 sm:mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center", children: /* @__PURE__ */ jsx(Coins, { className: "w-4 h-4 text-amber-600" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Available" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xl sm:text-2xl font-bold text-gray-900", children: coins.toLocaleString() }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Coins" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-orange-600" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Pending" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xl sm:text-2xl font-bold text-gray-900", children: loading ? "..." : pendingCoins.toLocaleString() }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Coins" })
              ] }),
              /* @__PURE__ */ jsxs("div", { onClick: () => window.open("/wishlist"), className: "bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 col-span-2 lg:col-span-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center", children: /* @__PURE__ */ jsx(FaHeart, { className: "w-4 h-4 text-red-500" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Wishlist" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xl sm:text-2xl font-bold text-green-600", children: "Favourites" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm mx-0 sm:mx-0 mb-2 sm:mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-base sm:text-lg font-semibold text-gray-900", children: "Saved Addresses" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-gray-500 mt-0.5", children: "Manage delivery locations" })
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setEditingAddress(null);
                      setShowForm(true);
                    },
                    className: "flex items-center gap-1.5 sm:gap-2 bg-black text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" }),
                      /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Add Address" }),
                      /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Add" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "p-4 sm:p-6", children: addresses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx(MapPin, { className: "w-8 h-8 text-gray-400" }) }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm font-medium", children: "No addresses saved" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-xs mt-1", children: "Add your first delivery address" })
              ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3 sm:space-y-4", children: addresses.map((addr) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between mb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 text-sm sm:text-base mb-1", children: addr.fullName }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: addr.phone })
                    ] }) }),
                    /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-700 mb-3 leading-relaxed", children: [
                      /* @__PURE__ */ jsx("p", { children: addr.address }),
                      /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
                        addr.city,
                        ", ",
                        addr.state,
                        " - ",
                        addr.pincode
                      ] }),
                      addr.country && /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: addr.country })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-3 border-t border-gray-100", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => {
                            setEditingAddress(addr);
                            setShowForm(true);
                          },
                          className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium",
                          children: [
                            /* @__PURE__ */ jsx(Edit2, { className: "w-3.5 h-3.5" }),
                            "Edit"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleDelete(addr.id),
                          className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium",
                          children: [
                            /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }),
                            "Delete"
                          ]
                        }
                      )
                    ] })
                  ]
                },
                addr.id
              )) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm mx-0 sm:mx-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200", children: [
                /* @__PURE__ */ jsx("h2", { className: "text-base sm:text-lg font-semibold text-gray-900", children: "Track Your Order" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-gray-500 mt-0.5", children: "Enter Shiprocket Order ID" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "p-4 sm:p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Enter Order ID",
                    className: "flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                    value: orderId,
                    onChange: (e) => setOrderId(e.target.value)
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (!orderId.trim()) return alert("Please enter an order ID");
                      window.open(
                        `https://shiprocket.co/tracking/${orderId.trim()}`,
                        "_blank"
                      );
                    },
                    className: "flex items-center justify-center gap-2 bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap",
                    children: [
                      /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
                      "Track Order"
                    ]
                  }
                )
              ] }) })
            ] })
          ] }),
          activeTab === "orders" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm p-4 sm:p-6", children: /* @__PURE__ */ jsx(MyOrders$1, { token, apiUrl, embedded: true }) })
        ] })
      ] }),
      showForm && /* @__PURE__ */ jsx(
        AddressForm,
        {
          onSave: handleSave,
          onClose: () => setShowForm(false),
          initialData: editingAddress
        }
      )
    ] })
  ] });
}
const logoImg = "/assets/logowhite-BlwFA03m.png";
function Footer() {
  const quickLinks = [
    { label: "Contact Us", to: "/contact" },
    {
      label: "Help Center",
      to: "https://wa.me/916307694248?text=Hello%20I%20need%20Help",
      external: true
    },
    { label: "Collaboration", to: "/collabration" },
    { label: "Payments", to: "/help/payments" },
    { label: "Shipping", to: "/help/shipping" },
    { label: "FAQ", to: "/help/faqs" }
  ];
  const categoryLinks = [
    { label: "Men", to: "/products/men" },
    { label: "Women", to: "/products/women" },
    { label: "Customize", to: "/products/customize" },
    { label: "All Products", to: "/products" }
  ];
  const policyLinks = [
    { label: "Terms Of Use", to: "/consumer-policies/terms-and-conditions" },
    { label: "Security", to: "/consumer-policies/security" },
    { label: "Privacy", to: "/consumer-policies/privacy" },
    { label: "Returns & Refund", to: "/consumer-policies/return-and-refund" },
    { label: "Cancellation & Returns", to: "/help/cancellation-and-returns" }
  ];
  return /* @__PURE__ */ jsxs("footer", { className: "w-full bg-black text-[14px] text-gray-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto grid grid-cols-1 gap-9 border-b border-gray-800 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-sm", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex items-center", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: logoImg,
            alt: "Filo Teso",
            className: "h-14 w-autoobject-contain"
          }
        ) }),
        /* @__PURE__ */ jsx("h3", { className: "mt-5 text-[13px] font-semibold uppercase tracking-wide text-gray-400", children: "About" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 leading-relaxed text-gray-300", children: "Filo Teso brings everyday fashion, custom wear, and curated styles together with a simple shopping experience." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-semibold uppercase tracking-wide text-gray-400", children: "Category" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2.5", children: categoryLinks.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: link.to, className: "font-medium text-white hover:underline", children: link.label }) }, link.to)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-semibold uppercase tracking-wide text-gray-400", children: "Policies" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2.5", children: policyLinks.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: link.to, className: "font-medium text-white hover:underline", children: link.label }) }, link.to)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-[13px] font-semibold uppercase tracking-wide text-gray-400", children: "Contact Details" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3 text-gray-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "mt-0.5 h-4 w-4 shrink-0 text-gray-500" }),
            /* @__PURE__ */ jsx("p", { className: "leading-relaxed", children: "Registered Office, India" })
          ] }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "tel:+916307694248",
              className: "flex items-center gap-3 font-medium text-white hover:underline",
              children: [
                /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4 text-gray-500" }),
                "+91 6307694248"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "mailto:filoteso.rk@gmail.com",
              className: "flex items-center gap-3 font-medium text-white hover:underline",
              children: [
                /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4 text-gray-500" }),
                "filoteso.rk@gmail.com"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsx("h4", { className: "mb-3 text-[13px] font-semibold uppercase tracking-wide text-gray-400", children: "Social" }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://www.instagram.com/filoteso.co.in?igsh=MTZweGhoOGxxemtuZw%3D%3D&utm_source=qr",
              target: "_blank",
              rel: "noreferrer",
              "aria-label": "Instagram",
              className: "inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-300 transition hover:border-white hover:text-white",
              children: /* @__PURE__ */ jsx(Instagram, { size: 18 })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto border-b border-gray-800 px-6 py-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-gray-400 md:text-left", children: "Quick Links" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start", children: quickLinks.map(
        (link) => link.external ? /* @__PURE__ */ jsx(
          "a",
          {
            href: link.to,
            target: "_blank",
            rel: "noreferrer",
            className: "font-medium text-white hover:underline",
            children: link.label
          },
          link.to
        ) : /* @__PURE__ */ jsx(
          Link,
          {
            to: link.to,
            className: "font-medium text-white hover:underline",
            children: link.label
          },
          link.to
        )
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "container mx-auto px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-between gap-3 text-[13px] text-gray-400 md:flex-row", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-gray-400", children: [
        "© 2026",
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: "Filo Teso | All rights are reserved." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-2 md:justify-end", children: /* @__PURE__ */ jsx("img", { src: "/payment.svg", alt: "payments", className: "h-5 w-auto" }) })
    ] }) })
  ] });
}
function ReviewSubmissionPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    review: "",
    suggestions: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    if (!formData.name || !formData.email || !formData.review) {
      alert("Please fill in all required fields");
      return;
    }
    console.log("Submitted:", { ...formData, rating });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", review: "", suggestions: "" });
      setRating(0);
    }, 3e3);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50 text-gray-900", children: [
    /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-6 py-16", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-2", children: "Share Your Experience" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", children: "Your feedback helps us improve and serve you better" })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto px-6 py-12", children: submitted ? /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-full mb-6", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-12 h-12 text-white" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold mb-3", children: "Thank You!" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-lg", children: "Your review has been submitted successfully. We appreciate your feedback!" })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 rounded-2xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsx(Star, { className: "w-6 h-6 text-gray-900" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Rate Your Experience" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-4 py-8", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setRating(star),
            onMouseEnter: () => setHoveredRating(star),
            onMouseLeave: () => setHoveredRating(0),
            className: "transition-transform hover:scale-110 focus:outline-none",
            children: /* @__PURE__ */ jsx(
              Star,
              {
                className: `w-12 h-12 transition-colors ${star <= (hoveredRating || rating) ? "fill-gray-900 text-gray-900" : "text-gray-300 hover:text-gray-400"}`
              }
            )
          },
          star
        )) }),
        /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
          rating === 0 && "Click to rate",
          rating === 1 && "Poor",
          rating === 2 && "Fair",
          rating === 3 && "Good",
          rating === 4 && "Very Good",
          rating === 5 && "Excellent"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 rounded-2xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsx(User, { className: "w-6 h-6 text-gray-900" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your Information" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Full Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "name",
                value: formData.name,
                onChange: handleInputChange,
                placeholder: "John Doe",
                className: "w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                name: "email",
                value: formData.email,
                onChange: handleInputChange,
                placeholder: "john@example.com",
                className: "w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 rounded-2xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsx(MessageSquare, { className: "w-6 h-6 text-gray-900" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your Review" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Tell us about your experience *" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "review",
              value: formData.review,
              onChange: handleInputChange,
              rows: "6",
              placeholder: "Share your thoughts about our website, products, or services...",
              className: "w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors resize-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-gray-200 rounded-2xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsx(Lightbulb, { className: "w-6 h-6 text-gray-900" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Suggestions for Improvement" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "How can we make our website better? (Optional)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "suggestions",
              value: formData.suggestions,
              onChange: handleInputChange,
              rows: "5",
              placeholder: "Share your ideas, feature requests, or areas where we can improve...",
              className: "w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors resize-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleSubmit,
          className: "w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 text-lg shadow-sm",
          children: [
            /* @__PURE__ */ jsx(Send, { className: "w-5 h-5" }),
            "Submit Review"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-center text-gray-500 text-sm", children: "* Required fields" })
    ] }) })
  ] });
}
const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  if (!wishlist.length) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center text-gray-600", children: [
      /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "Your wishlist is empty 💔" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate("/"),
          className: "mt-4 bg-black text-white px-6 py-3 font-semibold uppercase tracking-wide hover:bg-gray-800",
          children: "Go Shopping"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-white container mx-auto px-6 lg:px-8 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-8", children: "My Wishlist" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6", children: wishlist.map((item) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition",
        children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: `${"http://localhost:5000"}${item.image}`,
              alt: item.name,
              onClick: () => navigate(`/product/${item._id}`),
              className: "w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-800 truncate", children: item.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
              "₹",
              item.price
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => removeFromWishlist(item._id),
                className: "w-full mt-2 py-2 text-sm border border-gray-300 hover:bg-gray-50",
                children: "Remove"
              }
            )
          ] })
        ]
      },
      item._id
    )) })
  ] });
};
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
};
const Collaborate = () => {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_UGLUGrJdOmFYjjm_ZL895Blc7e5c-63bb6hEs8lNUlHwL4JjqpSo-QRNLYApQtqCWg/exec";
  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    email: "",
    phone: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        // Cors mode 'no-cors' zaroori hai Google Scripts ke liye client side se
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      setFormData({
        name: "",
        brandName: "",
        email: "",
        phone: "",
        message: ""
      });
      alert("Thanks for contacting! We will get back to you soon.");
    } catch (error) {
      console.error("Error!", error.message);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl w-full space-y-8 bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-100", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto h-16 w-16 bg-black text-white rounded-full flex items-center justify-center text-3xl mb-4", children: /* @__PURE__ */ jsx(FaHandshake, {}) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-extrabold text-gray-900 tracking-tight", children: "Let's Collaborate" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-lg text-gray-600", children: [
        "Join hands with ",
        /* @__PURE__ */ jsx("span", { className: "font-bold text-black", children: "Filo Teso" }),
        ". Fill the form below and let's create magic together."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Full Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "name",
              name: "name",
              type: "text",
              required: true,
              value: formData.name,
              onChange: handleChange,
              className: "mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors",
              placeholder: "John Doe"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "brandName", className: "block text-sm font-medium text-gray-700", children: "Brand / Instagram Handle" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "brandName",
              name: "brandName",
              type: "text",
              required: true,
              value: formData.brandName,
              onChange: handleChange,
              className: "mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors",
              placeholder: "@yourbrand"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email Address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              name: "email",
              type: "email",
              required: true,
              value: formData.email,
              onChange: handleChange,
              className: "mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors",
              placeholder: "you@example.com"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700", children: "Phone Number" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "phone",
              name: "phone",
              type: "tel",
              value: formData.phone,
              onChange: handleChange,
              className: "mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors",
              placeholder: "+91 98765 43210"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700", children: "Collaboration Proposal / Message" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "message",
            name: "message",
            rows: "4",
            required: true,
            value: formData.message,
            onChange: handleChange,
            className: "mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-colors resize-none",
            placeholder: "Tell us how you want to collaborate..."
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: `group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${loading ? "opacity-70 cursor-not-allowed" : ""}`,
          children: loading ? /* @__PURE__ */ jsxs("span", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxs("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
              /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
              /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
            ] }),
            "Sending..."
          ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center", children: [
            "Submit Proposal ",
            /* @__PURE__ */ jsx(FaPaperPlane, { className: "ml-2" })
          ] })
        }
      ) })
    ] })
  ] }) });
};
function CancellationAndReturnsPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Cancellation & Returns" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "At ",
          /* @__PURE__ */ jsx("strong", { children: "Filo Teso" }),
          ", we strive to provide a smooth and transparent shopping experience. This policy explains how order cancellations, returns, replacements, and refunds are handled. By placing an order on our website, you agree to the terms outlined below."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Order Cancellation" }),
        /* @__PURE__ */ jsx("p", { children: "You may request cancellation of an order only before it is shipped or dispatched. Once an order has been shipped, cancellation requests may not be accepted." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "If a cancellation is approved, any prepaid amount will be refunded to the original payment method as per applicable timelines." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. Return Eligibility" }),
        /* @__PURE__ */ jsx("p", { children: "Returns are accepted only for eligible products and within the return window mentioned on the product page or order details. To be eligible for a return:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "The product must be unused and in original condition" }),
          /* @__PURE__ */ jsx("li", { children: "Original packaging, tags, and accessories must be intact" }),
          /* @__PURE__ */ jsx("li", { children: "Invoice or proof of purchase must be provided" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Non-Returnable Items" }),
        /* @__PURE__ */ jsx("p", { children: "Certain products may be non-returnable due to hygiene, safety, or regulatory reasons. Such items will be clearly marked as non-returnable on the product page or at checkout." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Valid Reasons for Returns" }),
        /* @__PURE__ */ jsx("p", { children: "Returns or replacements are generally accepted in cases of:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Damaged product received" }),
          /* @__PURE__ */ jsx("li", { children: "Incorrect product delivered" }),
          /* @__PURE__ */ jsx("li", { children: "Missing items in the package" }),
          /* @__PURE__ */ jsx("li", { children: "Manufacturing defects" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
          "Such issues must be reported within ",
          /* @__PURE__ */ jsx("strong", { children: "24 hours" }),
          " of delivery, along with supporting photos or unboxing videos."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. Return Request Process" }),
        /* @__PURE__ */ jsx("p", { children: "You can request a return through your account under “My Orders” (where available) or by contacting our support team with:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Order ID / Order Code" }),
          /* @__PURE__ */ jsx("li", { children: "Product details" }),
          /* @__PURE__ */ jsx("li", { children: "Reason for return" }),
          /* @__PURE__ */ jsx("li", { children: "Photos or videos (mandatory for damage/defect cases)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Return Pickup & Inspection" }),
        /* @__PURE__ */ jsx("p", { children: "Once a return request is approved, a pickup may be arranged through our courier partners. After pickup, the returned item may undergo inspection to verify eligibility. If the item does not meet return conditions, the return may be rejected and sent back to you." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Refund Timelines" }),
        /* @__PURE__ */ jsx("p", { children: "Refunds are processed after successful cancellation or return approval. Typical timelines are:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "UPI / Debit / Credit Cards / Net Banking: 3–7 working days" }),
          /* @__PURE__ */ jsx("li", { children: "Cash on Delivery (COD): Refund to bank account after verification" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Actual timelines may vary depending on your bank or payment provider." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "9. Replacement Policy" }),
        /* @__PURE__ */ jsx("p", { children: "In certain cases, a replacement may be offered instead of a refund, subject to product availability. If replacement is not possible, a refund will be processed as per this policy." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "10. Contact Support" }),
        /* @__PURE__ */ jsx("p", { children: "For any questions regarding cancellations, returns, or refunds, please contact our support team with your order details." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-2xl border bg-gray-50 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Filo Teso Support" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "Email: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "filoteso.rk@gmail.com" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function FAQPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "FAQ" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border bg-white p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Orders" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-gray-700", children: [
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "How do I place an order?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 leading-relaxed text-gray-700", children: "Browse products, add items to your cart, and proceed to checkout. Enter your delivery details and choose a payment method to confirm the order." })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "Can I cancel my order after placing it?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 leading-relaxed text-gray-700", children: [
              "You can request cancellation only before the order is shipped/dispatch. Once shipped, cancellation may not be possible. Please refer to our",
              " ",
              /* @__PURE__ */ jsx(Link, { to: "/help/return-refund", className: "text-blue-700 hover:underline", children: "Cancellation & Returns" }),
              " ",
              "page for details."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "Where can I check my order status?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 leading-relaxed text-gray-700", children: [
              "You can check your order status in your account under",
              " ",
              /* @__PURE__ */ jsx(Link, { to: "/user/orders", className: "text-blue-700 hover:underline", children: "My Orders" }),
              "."
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border bg-white p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Payments" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-gray-700", children: [
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "What payment methods do you accept?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 leading-relaxed text-gray-700", children: [
              "We accept UPI, Debit/Credit Cards, Net Banking, and Cash on Delivery (COD) where available. More details are available on the",
              " ",
              /* @__PURE__ */ jsx(Link, { to: "/help/payments", className: "text-blue-700 hover:underline", children: "Payments" }),
              " ",
              "page."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "My payment failed but money got debited. What should I do?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 leading-relaxed text-gray-700", children: "In most cases, banks reverse the amount automatically within 3–7 working days. If the amount is not reversed within this time, please contact your bank first and then reach out to our support team with transaction details." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border bg-white p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Shipping" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-gray-700", children: [
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "How long does delivery take?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 leading-relaxed text-gray-700", children: [
              "Delivery timelines depend on your location and courier partner. As a general estimate, deliveries may take 2–10 working days. For more, visit our",
              " ",
              /* @__PURE__ */ jsx(Link, { to: "/help/shipping", className: "text-blue-700 hover:underline", children: "Shipping" }),
              " ",
              "page."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "How can I track my order?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 leading-relaxed text-gray-700", children: [
              "If tracking is available, you will receive details via SMS/Email, and you can also check updates in",
              " ",
              /* @__PURE__ */ jsx(Link, { to: "/user/orders", className: "text-blue-700 hover:underline", children: "My Orders" }),
              "."
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border bg-white p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Returns & Refunds" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-gray-700", children: [
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "How do I request a return?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 leading-relaxed text-gray-700", children: [
              "You can request a return from your order section (if available) or by contacting support with your Order ID, product details, and reason. Please review our",
              " ",
              /* @__PURE__ */ jsx(Link, { to: "/help/return-refund", className: "text-blue-700 hover:underline", children: "Cancellation, Returns & Refunds" }),
              " ",
              "policy."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border p-4", children: [
            /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-semibold text-gray-900 flex items-center justify-between", children: [
              "When will I get my refund?",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 group-open:rotate-180 transition", children: "▾" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 leading-relaxed text-gray-700", children: "Refunds are typically processed within 3–7 working days after approval. Timelines may vary depending on bank/payment provider." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border bg-gray-50 p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Need help?" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700", children: "If you still have questions, contact us:" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 text-sm text-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            "Email:",
            " ",
            /* @__PURE__ */ jsx("a", { className: "font-semibold text-blue-700 hover:underline", to: "mailto:filoteso.rk@gmail.com", children: "filoteso.rk@gmail.com" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1", children: [
            "Phone:",
            " ",
            /* @__PURE__ */ jsx("a", { className: "font-semibold text-blue-700 hover:underline", to: "tel:+919879511957", children: "+91 98795 11957" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function PaymentsHelpPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Payments" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Accepted Payment Methods" }),
        /* @__PURE__ */ jsx("p", { children: "Felo Teso offers multiple secure and convenient payment options to make your shopping experience smooth. You can choose from the following methods at checkout:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "UPI (Google Pay, PhonePe, Paytm, BHIM, etc.)" }),
          /* @__PURE__ */ jsx("li", { children: "Debit Cards" }),
          /* @__PURE__ */ jsx("li", { children: "Credit Cards" }),
          /* @__PURE__ */ jsx("li", { children: "Net Banking" }),
          /* @__PURE__ */ jsx("li", { children: "Cash on Delivery (COD) – available on select locations/products" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Payment Security" }),
        /* @__PURE__ */ jsx("p", { children: "All online payments on Felo Teso are processed through secure and trusted payment gateway partners. We do not store your card details, CVV, or banking credentials on our servers." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Please never share your OTP, UPI PIN, or card details with anyone, including people claiming to represent Felo Teso." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. Cash on Delivery (COD)" }),
        /* @__PURE__ */ jsx("p", { children: "Cash on Delivery may be available for certain products and delivery locations. Availability of COD is determined automatically at checkout based on your pincode and order value." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Please ensure someone is available at the delivery address to make the payment at the time of delivery." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Payment Failures" }),
        /* @__PURE__ */ jsx("p", { children: "If your payment fails but the amount is debited from your bank account, the amount is usually reversed automatically by your bank within 3–7 working days." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "In case of repeated failures, we recommend trying a different payment method or contacting your bank for assistance." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Refunds" }),
        /* @__PURE__ */ jsx("p", { children: "Refunds for cancelled or returned orders are processed to the original mode of payment used at checkout." }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "UPI / Cards / Net Banking: 3–7 working days" }),
          /* @__PURE__ */ jsx("li", { children: "Cash on Delivery: Refund processed to bank account after verification" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Refund timelines may vary depending on your bank or payment provider." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. Price & Payment Disputes" }),
        /* @__PURE__ */ jsx("p", { children: "If you notice any discrepancy in pricing or payment amount, please contact our support team immediately with your order details. We will review and resolve the issue at the earliest." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Fraud Prevention" }),
        /* @__PURE__ */ jsx("p", { children: "Felo Teso reserves the right to cancel or hold orders if a transaction appears suspicious or fraudulent. Additional verification may be requested in such cases to protect customers." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Need Help?" }),
        /* @__PURE__ */ jsx("p", { children: "If you have any questions regarding payments, refunds, or billing, feel free to reach out to us." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-2xl border bg-gray-50 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Contact Support" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "Email: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "filoteso.rk@gmail.com" }),
            /* @__PURE__ */ jsx("br", {})
          ] })
        ] })
      ] })
    ] })
  ] });
}
function ShippingHelpPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Shipping" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Shipping Coverage" }),
        /* @__PURE__ */ jsx("p", { children: "We currently ship to select locations across India. Shipping availability and delivery timelines are shown at checkout based on your pincode." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Order Processing Time" }),
        /* @__PURE__ */ jsx("p", { children: "Orders are usually processed within 24–48 working hours after confirmation (excluding Sundays and public holidays). Processing may take longer during high-demand periods, sales, or unforeseen events." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. Estimated Delivery Timelines" }),
        /* @__PURE__ */ jsx("p", { children: "Delivery timelines depend on your location and courier partner. As a general guide:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Metro / Tier-1 cities: 2–5 working days" }),
          /* @__PURE__ */ jsx("li", { children: "Other cities / towns: 3–7 working days" }),
          /* @__PURE__ */ jsx("li", { children: "Remote areas: 5–10 working days" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "These are estimated timelines and may vary due to logistics, weather, strikes, or other circumstances beyond our control." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Shipping Charges" }),
        /* @__PURE__ */ jsx("p", { children: "Shipping charges (if applicable) are calculated at checkout based on order value, product type, and delivery location. Any shipping fees will be clearly displayed before you complete payment." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Order Tracking" }),
        /* @__PURE__ */ jsx("p", { children: "Once your order is shipped, you may receive tracking details via SMS/Email (if available). You can also check order status in your account under “My Orders”." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. Delivery Attempts" }),
        /* @__PURE__ */ jsx("p", { children: "Our courier partners generally attempt delivery 2–3 times. If a delivery fails due to incorrect address, customer unavailability, or refusal to accept the package, the shipment may be returned to us. In such cases, re-shipping charges may apply." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Address Changes" }),
        /* @__PURE__ */ jsx("p", { children: "Address changes can only be requested before the order is shipped. Once shipped, changes may not be possible. Please contact support as early as possible with your order details." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Damaged / Missing Packages" }),
        /* @__PURE__ */ jsx("p", { children: "If you receive a package that appears damaged, tampered, or missing items, please contact support within 24 hours of delivery with photos/videos and your order details. We will investigate and provide a suitable resolution as per our policy." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "9. Need Help?" }),
        /* @__PURE__ */ jsx("p", { children: "For shipping-related questions, delays, or delivery support, please contact us." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-2xl border bg-gray-50 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Contact Support" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "Email: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "filoteso.rk@gmail.com" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function PrivacyPolicyPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Privacy Policy" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "This Privacy Policy describes how ",
          /* @__PURE__ */ jsx("strong", { children: "Filo Teso" }),
          " ",
          "(“we”, “us”, “our”) collects, uses, shares, and protects your personal information when you use our website and services. By using our platform, you consent to the practices described in this policy."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Information We Collect" }),
        /* @__PURE__ */ jsx("p", { children: "We may collect the following categories of information:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Identity & Contact:" }),
            " name, phone number, email address."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Delivery Information:" }),
            " shipping address, city, state, pincode, landmark (if provided)."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Order & Transaction:" }),
            " products purchased, order history, invoices, payment status."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Technical:" }),
            " IP address, browser type, device information, pages visited, usage data (cookies/analytics)."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Support:" }),
            " messages or information shared with our customer support team."
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3", children: "We do not intentionally collect sensitive personal data unless it is necessary for providing our services." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. How We Use Your Information" }),
        /* @__PURE__ */ jsx("p", { children: "We use your information for purposes including:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Processing orders, payments, deliveries, and returns." }),
          /* @__PURE__ */ jsx("li", { children: "Communicating order updates and service-related information." }),
          /* @__PURE__ */ jsx("li", { children: "Providing customer support and resolving disputes." }),
          /* @__PURE__ */ jsx("li", { children: "Improving our website, products, and user experience." }),
          /* @__PURE__ */ jsx("li", { children: "Preventing fraud, enforcing our Terms, and maintaining platform security." }),
          /* @__PURE__ */ jsx("li", { children: "Complying with legal and regulatory obligations." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Cookies & Tracking Technologies" }),
        /* @__PURE__ */ jsx("p", { children: "We may use cookies and similar technologies to enhance your browsing experience, remember preferences, and analyze traffic. You can control cookies through your browser settings. Disabling cookies may impact some site features." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Sharing of Information" }),
        /* @__PURE__ */ jsx("p", { children: "We may share your information only as necessary, including with:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Logistics/Delivery Partners" }),
            " for shipping your orders."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Payment Gateway Partners" }),
            " to process payments securely (we do not store full card details)."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Service Providers" }),
            " (hosting, analytics, customer support tools) who work under confidentiality obligations."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Legal/Regulatory Authorities" }),
            " when required by law, court order, or to protect our rights."
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3", children: "We do not sell your personal information to third parties." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. Data Security" }),
        /* @__PURE__ */ jsx("p", { children: "We implement reasonable security measures to protect your information from unauthorized access, misuse, loss, alteration, or disclosure. However, no online system is completely secure. Please protect your account credentials and do not share OTPs/passwords." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Data Retention" }),
        /* @__PURE__ */ jsx("p", { children: "We retain your information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. When no longer required, we take reasonable steps to delete or anonymize the data." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Your Choices & Rights" }),
        /* @__PURE__ */ jsx("p", { children: "You may request access, correction, or deletion of your personal information, subject to legal and operational limitations. You may also opt out of non-essential marketing communications where applicable." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "9. Third-Party Links" }),
        /* @__PURE__ */ jsx("p", { children: "Our website may contain links to third-party websites. We are not responsible for the privacy practices of those sites. Please review their policies before providing any information." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "10. Children’s Privacy" }),
        /* @__PURE__ */ jsx("p", { children: "Our services are not directed to children under 18. We do not knowingly collect personal information from minors." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "11. Changes to This Policy" }),
        /* @__PURE__ */ jsx("p", { children: "We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised “Last updated” date." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "12. Contact Us" }),
        /* @__PURE__ */ jsx("p", { children: "For questions or requests related to this Privacy Policy, contact us at:" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-2xl border bg-gray-50 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Filo Teso" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "Email: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "filoteso.rk@gmail.com" }),
            /* @__PURE__ */ jsx("br", {})
          ] })
        ] })
      ] })
    ] })
  ] });
}
function ReturnsAndRefundsPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Cancellation, Returns & Refunds" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "We aim to ensure a smooth shopping experience at ",
          /* @__PURE__ */ jsx("strong", { children: "Filo Teso" }),
          ". This policy explains the rules for order cancellation, returns, replacements, and refunds. By placing an order, you agree to the terms below."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Order Cancellation" }),
        /* @__PURE__ */ jsx("p", { children: "You can request cancellation only before the order is shipped/dispatch. Once shipped, cancellation is not guaranteed. If cancellation is accepted, refunds (if applicable) will be initiated to the original payment method." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. Return Eligibility" }),
        /* @__PURE__ */ jsx("p", { children: "Returns are accepted only for eligible products and within the permitted return window shown on the product page or order details. To be eligible, items must be:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Unused, unwashed, and in original condition" }),
          /* @__PURE__ */ jsx("li", { children: "With original packaging, tags, and accessories (if any)" }),
          /* @__PURE__ */ jsx("li", { children: "Accompanied by invoice / proof of purchase" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Non-Returnable / Non-Refundable Items" }),
        /* @__PURE__ */ jsx("p", { children: "Certain items may not be eligible for return or refund due to hygiene, safety, or regulatory reasons. Such exclusions (if any) will be mentioned on the product page and/or at checkout." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Return Reasons Covered" }),
        /* @__PURE__ */ jsx("p", { children: "We typically support returns/refunds for:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Damaged product received" }),
          /* @__PURE__ */ jsx("li", { children: "Wrong item delivered" }),
          /* @__PURE__ */ jsx("li", { children: "Missing item(s) in the package" }),
          /* @__PURE__ */ jsx("li", { children: "Defective product (manufacturing defect)" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
          "For damage/defect/missing items, please report within ",
          /* @__PURE__ */ jsx("strong", { children: "24 hours" }),
          " ",
          "of delivery with unboxing photos/videos."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. How to Request a Return" }),
        /* @__PURE__ */ jsx("p", { children: "You can initiate a return request from your account under “My Orders” (if available) or by contacting support with:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Order ID / Order Code" }),
          /* @__PURE__ */ jsx("li", { children: "Product name and quantity" }),
          /* @__PURE__ */ jsx("li", { children: "Reason for return" }),
          /* @__PURE__ */ jsx("li", { children: "Photos/videos (mandatory for damage/defect/missing)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Return Pickup & Inspection" }),
        /* @__PURE__ */ jsx("p", { children: "If return pickup is approved, our courier partner will attempt pickup at your address. After pickup, the item may be inspected to verify eligibility. If the product does not meet the policy conditions, the return may be rejected and shipped back to you." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Refund Process & Timelines" }),
        /* @__PURE__ */ jsx("p", { children: "Once the return is approved (or cancellation is confirmed), refunds are initiated to the original payment method. Typical timelines:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "UPI / Cards / Net Banking: 3–7 working days" }),
          /* @__PURE__ */ jsx("li", { children: "COD Orders: Refund to bank account after verification" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Timelines may vary depending on banks/payment providers." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "9. Replacement (If Applicable)" }),
        /* @__PURE__ */ jsx("p", { children: "In certain cases, replacement may be offered instead of refund (subject to stock availability). If replacement is not available, we will process a refund as per policy." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "10. Contact Support" }),
        /* @__PURE__ */ jsx("p", { children: "For return/refund related queries, please contact us with your order details." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-2xl border bg-gray-50 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Filo Teso Support" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "Email: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "filoteso.rk@gmail.com" }),
            /* @__PURE__ */ jsx("br", {})
          ] })
        ] })
      ] })
    ] })
  ] });
}
function SecurityPolicyPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Security Policy" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Overview" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "At ",
          /* @__PURE__ */ jsx("strong", { children: "Filo Teso" }),
          ", we take the security of your personal information and transactions seriously. This Security Policy explains the measures we use to help protect your data and how you can help keep your account secure."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Secure Communication" }),
        /* @__PURE__ */ jsx("p", { children: "We use industry-standard security measures such as HTTPS/TLS to help protect data transmitted between your browser and our servers. You should always ensure the website URL begins with “https://” before entering any sensitive information." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. Payment Security" }),
        /* @__PURE__ */ jsx("p", { children: "We do not store your full card details on our servers. Payments are processed through secure, compliant payment gateway partners. Please follow on-screen instructions carefully while making payments and do not share OTPs or banking credentials with anyone." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Data Access & Controls" }),
        /* @__PURE__ */ jsx("p", { children: "Access to personal data is restricted to authorized personnel only and is provided strictly on a need-to-know basis. We also apply reasonable safeguards to reduce the risk of unauthorized access, alteration, disclosure, or destruction of data." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Account Protection" }),
        /* @__PURE__ */ jsx("p", { children: "You are responsible for maintaining the confidentiality of your login details. We recommend:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Using a strong, unique password." }),
          /* @__PURE__ */ jsx("li", { children: "Not sharing your password or OTP with anyone." }),
          /* @__PURE__ */ jsx("li", { children: "Logging out from shared/public devices." }),
          /* @__PURE__ */ jsx("li", { children: "Updating your password if you suspect unauthorized activity." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. Fraud Prevention & Suspicious Activity" }),
        /* @__PURE__ */ jsx("p", { children: "We may monitor transactions for unusual or suspicious behavior and may temporarily hold or cancel orders if fraud is suspected. If we detect potential unauthorized access to your account, we may request additional verification." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Device & Browser Safety" }),
        /* @__PURE__ */ jsx("p", { children: "Your device security also matters. Please keep your operating system, browser, and antivirus up to date. Avoid using unknown networks when making purchases, and never save card or password information on public devices." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Security Limitations" }),
        /* @__PURE__ */ jsx("p", { children: "While we implement reasonable safeguards, no method of transmission over the internet is 100% secure. Filo Teso cannot guarantee absolute security; however, we continuously improve our security practices to reduce risks." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "9. Reporting Security Issues" }),
        /* @__PURE__ */ jsx("p", { children: "If you believe your account has been compromised or you have identified a potential security vulnerability, please notify us immediately. Provide as much detail as possible so we can investigate." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-2xl border bg-gray-50 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: "Contact Security Team" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "Email: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "filoteso.rk@gmail.com" }),
            /* @__PURE__ */ jsx("br", {}),
            "Phone: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "+91 98795 11957" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "10. Policy Updates" }),
        /* @__PURE__ */ jsx("p", { children: "We may update this Security Policy from time to time to reflect improvements in our practices or changes in legal requirements. The updated version will be posted on this page with a revised “Last updated” date." })
      ] })
    ] })
  ] });
}
function TermsAndServicesPage() {
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-12", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Terms & Conditions" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-8", children: "Last updated: January 2025" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8 text-sm text-gray-700 leading-relaxed", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "1. Introduction" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Welcome to ",
          /* @__PURE__ */ jsx("strong", { children: "Filo Teso" }),
          ". These Terms & Conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms. If you do not agree, please do not use our services."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "2. Eligibility" }),
        /* @__PURE__ */ jsx("p", { children: "You must be at least 18 years old or accessing the website under the supervision of a parent or legal guardian to make a purchase on Filo Teso." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "3. Account & User Responsibilities" }),
        /* @__PURE__ */ jsx("p", { children: "You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account. Filo Teso shall not be liable for any loss arising from unauthorized account usage." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "4. Product Information & Pricing" }),
        /* @__PURE__ */ jsx("p", { children: "We strive to provide accurate product descriptions, pricing, and availability. However, errors may occur. Filo Teso reserves the right to correct any errors and cancel orders if required." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "5. Orders & Payments" }),
        /* @__PURE__ */ jsx("p", { children: "All orders placed are subject to acceptance and availability. Payments must be made through approved payment methods. In case of payment failure, the order may be cancelled automatically." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "6. Shipping & Delivery" }),
        /* @__PURE__ */ jsx("p", { children: "Delivery timelines are estimates and may vary due to logistics or external factors. Filo Teso is not liable for delays beyond its reasonable control." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "7. Cancellation, Returns & Refunds" }),
        /* @__PURE__ */ jsx("p", { children: "Cancellation and return policies are governed by our dedicated Cancellation & Returns Policy. Refunds, if applicable, will be processed to the original mode of payment within a reasonable timeframe." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "8. Intellectual Property" }),
        /* @__PURE__ */ jsx("p", { children: "All content on this website, including text, images, logos, and designs, is the property of Filo Teso and is protected by applicable intellectual property laws. Unauthorized use is strictly prohibited." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "9. Limitation of Liability" }),
        /* @__PURE__ */ jsx("p", { children: "Filo Teso shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "10. Privacy" }),
        /* @__PURE__ */ jsx("p", { children: "Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "11. Governing Law & Jurisdiction" }),
        /* @__PURE__ */ jsx("p", { children: "These terms shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of Indian courts." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "12. Contact Information" }),
        /* @__PURE__ */ jsx("p", { children: "For any questions or concerns regarding these Terms & Conditions, please contact us at:" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 font-medium text-gray-900", children: [
          "Email: filoteso.rk@gmail.com",
          /* @__PURE__ */ jsx("br", {})
        ] })
      ] })
    ] })
  ] });
}
function ContactPage() {
  const phoneDisplay = "+91 6307694248";
  const phoneDial = "+916307694248";
  const email = "filoteso.rk@gmail.com";
  const instagram = "https://www.instagram.com/filoteso.co.in?igsh=MTZweGhoOGxxemtuZw%3D%3D&utm_source=qr";
  const waText = "Hi Filo Teso, I need help with my order.";
  const waLink = `https://wa.me/916307694248?text=${encodeURIComponent(waText)}`;
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Contact Us" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Need help with an order, delivery, payment, or returns? Reach out using any option below." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 gap-6 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border bg-white p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Customer Support" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4 text-sm text-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gray-50 p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "Email" }),
            /* @__PURE__ */ jsx(Link, { to: `mailto:${email}`, className: "font-semibold text-gray-900 hover:underline", children: email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gray-50 p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "Phone" }),
            /* @__PURE__ */ jsx(Link, { to: `tel:${phoneDial}`, className: "font-semibold text-gray-900 hover:underline", children: phoneDisplay })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gray-50 p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "WhatsApp" }),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: waLink,
                target: "_blank",
                rel: "noreferrer",
                className: "font-semibold text-gray-900 hover:underline",
                children: "Chat on WhatsApp"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-500", children: "Fastest support for order-related queries." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gray-50 p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "Instagram" }),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: instagram,
                target: "_blank",
                rel: "noreferrer",
                className: "font-semibold text-gray-900 hover:underline",
                children: "@filoteso.co.in"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 text-xs text-gray-500", children: [
          "Tip: Please keep your ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Order ID / Order Code" }),
          " handy for faster support."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border bg-white p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Quick Help" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600", children: "You may find answers quickly in these pages:" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/help/payments",
              className: "rounded-2xl border p-4 hover:bg-gray-50",
              children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-gray-900", children: "Payments" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-500", children: "UPI, Cards, COD, failed payments" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/help/shipping",
              className: "rounded-2xl border p-4 hover:bg-gray-50",
              children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-gray-900", children: "Shipping" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-500", children: "Delivery timelines, tracking" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/help/cancellation-and-returns",
              className: "rounded-2xl border p-4 hover:bg-gray-50",
              children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-gray-900", children: "Cancellation & Returns" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-500", children: "Return eligibility, refunds" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/help/faqs",
              className: "rounded-2xl border p-4 hover:bg-gray-50",
              children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-gray-900", children: "FAQ" }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-500", children: "Common questions" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-gray-900", children: "Support Hours" }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-600", children: "Monday to Saturday (working days) • 10:00 AM – 6:00 PM" })
        ] })
      ] })
    ] })
  ] });
}
const Navbar = lazy(() => import("./assets/navBar-CAQfIMMr.js"));
const Home = lazy(() => import("./assets/Home-CmRxsuev.js"));
const ProductList = lazy(() => import("./assets/ProductList-DzjLaSE3.js"));
const ProductDetail = lazy(() => import("./assets/ProductDetailPage-BYgqlHZj.js"));
const CheckoutPage = lazy(() => import("./assets/CheckoutPage-DnGV3vvU.js"));
const OrderConfirm = lazy(() => import("./assets/OrderConfirmationPage-ntuK7zyB.js"));
const Login = lazy(() => import("./assets/Login-DWPo13gu.js"));
const Register = lazy(() => import("./assets/Register-lhkHFg-P.js"));
const MyOrders = lazy(() => Promise.resolve().then(() => MyOrders$2));
const AdminLogin = lazy(() => import("./assets/AdminLogin-CpWRBhyJ.js"));
const AdminDashboard = lazy(() => import("./assets/AdminDashboard-DewKayZK.js"));
const ManageProducts = lazy(() => import("./assets/ManageProducts-G_mGZ5sj.js"));
const ManageOrders = lazy(() => import("./assets/ManageOrders-Dj1asJSe.js"));
const CartSidebar = lazy(() => import("./assets/CartSidebar-_3JQIPVG.js"));
const RequireAuth = lazy(() => import("./assets/RequireAuth-DmXfHgsZ.js"));
const ProtectedRoute = lazy(() => import("./assets/ProtectedRoutes-BC_onWP6.js"));
const LoadingSpinner = memo(() => /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" }) }));
const NotFoundPage = memo(() => /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
  /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-4", children: "Page Not Found" }),
  /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "The page you're looking for doesn't exist." })
] }) }));
function App() {
  const { showCartSidebar, setShowCartSidebar } = useUI();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs(Suspense, { fallback: /* @__PURE__ */ jsx(LoadingSpinner, {}), children: [
    !isAdminRoute && /* @__PURE__ */ jsx(Navbar, {}),
    showCartSidebar && /* @__PURE__ */ jsx(CartSidebar, { onClose: () => setShowCartSidebar(false) }),
    /* @__PURE__ */ jsx(ScrollToTop, {}),
    /* @__PURE__ */ jsx("main", { children: /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Home, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/products", element: /* @__PURE__ */ jsx(ProductList, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/products/:category", element: /* @__PURE__ */ jsx(ProductList, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/products/:category/:subcategory", element: /* @__PURE__ */ jsx(ProductList, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/product/:id", element: /* @__PURE__ */ jsx(ProductDetail, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/order-confirmation", element: /* @__PURE__ */ jsx(OrderConfirm, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(Login, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/register", element: /* @__PURE__ */ jsx(Register, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/profile", element: /* @__PURE__ */ jsx(Profile, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/reveiw", element: /* @__PURE__ */ jsx(ReviewSubmissionPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/wishlist", element: /* @__PURE__ */ jsx(WishlistPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/collabration", element: /* @__PURE__ */ jsx(Collaborate, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/help/cancellation-and-returns", element: /* @__PURE__ */ jsx(CancellationAndReturnsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/help/faqs", element: /* @__PURE__ */ jsx(FAQPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/help/payments", element: /* @__PURE__ */ jsx(PaymentsHelpPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/help/shipping", element: /* @__PURE__ */ jsx(ShippingHelpPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/consumer-policies/privacy", element: /* @__PURE__ */ jsx(PrivacyPolicyPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/consumer-policies/return-and-refund", element: /* @__PURE__ */ jsx(ReturnsAndRefundsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/consumer-policies/security", element: /* @__PURE__ */ jsx(SecurityPolicyPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/consumer-policies/terms-and-conditions", element: /* @__PURE__ */ jsx(TermsAndServicesPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/contact", element: /* @__PURE__ */ jsx(ContactPage, {}) }),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "/checkout",
          element: /* @__PURE__ */ jsx(RequireAuth, { children: /* @__PURE__ */ jsx(CheckoutPage, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "/my-orders",
          element: /* @__PURE__ */ jsx(RequireAuth, { children: /* @__PURE__ */ jsx(MyOrders, {}) })
        }
      ),
      /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(AdminLogin, {}) }),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "/admin/dashboard",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { needsLoginSource: true, children: /* @__PURE__ */ jsx(AdminDashboard, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "/admin/products",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { needsDashboardSource: true, children: /* @__PURE__ */ jsx(ManageProducts, {}) })
        }
      ),
      /* @__PURE__ */ jsx(
        Route,
        {
          path: "/admin/orders",
          element: /* @__PURE__ */ jsx(ProtectedRoute, { needsDashboardSource: true, children: /* @__PURE__ */ jsx(ManageOrders, {}) })
        }
      ),
      /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(NotFoundPage, {}) })
    ] }) }),
    !isAdminRoute && /* @__PURE__ */ jsx(Footer, {})
  ] }) }) });
}
function render(url, options) {
  return renderToPipeableStream(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(StaticRouter, { location: url, children: /* @__PURE__ */ jsxs(CartProvider, { children: [
      "  ",
      /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(UIProvider, { children: /* @__PURE__ */ jsx(WishlistProvider, { children: /* @__PURE__ */ jsx(App, {}) }) }) })
    ] }) }) }),
    options
  );
}
export {
  AuthContext as A,
  CartContext as C,
  useUI as a,
  render,
  useWishlist as u
};
