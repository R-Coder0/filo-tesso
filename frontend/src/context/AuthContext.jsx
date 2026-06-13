// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext();
const isBrowser = typeof window !== "undefined";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(isBrowser);

  // ✅ Load auth safely from localStorage
  useEffect(() => {
    const loadAuth = async () => {
      if (!isBrowser) {
        setLoading(false);
        return;
      }

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

  // ✅ Refresh profile if token exists
  // ✅ Refresh profile if token exists (TEMPORARY FIX)
useEffect(() => {
  const refreshProfile = async () => {
    try {
      if (!token) {
        console.log("❌ No token available for profile refresh");
        return;
      }

      console.log("🔄 Refreshing user profile with token...");
      
      // ✅ Temporary: Skip profile refresh if we already have user data
      if (user && user.name && user.email) {
        console.log("✅ User data already present, skipping refresh");
        return;
      }

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("✅ Profile refresh response:", data);
      
      const freshUser = {
        id: data.id || data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      };
      
      console.log("✅ Fresh user data:", freshUser);
      setUser(freshUser);
      
      // ✅ Update localStorage with fresh data
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
      // Don't logout on profile refresh failure - use existing data
      console.log("🔄 Using existing user data from initial login");
    }
  };

  if (token) {
    refreshProfile();
  }
}, [token]);

  // ✅ Save auth (with validation)
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
      phone: userData.phone,
    };

    console.log("✅ Normalized user data:", normalized);
    
    setUser(normalized);
    setToken(jwtToken);
    localStorage.setItem("auth", JSON.stringify({ user: normalized, token: jwtToken }));
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
    
    console.log("✅ Auth saved successfully");
  };

  // ✅ Login
  // ✅ FIXED LOGIN FUNCTION
const login = async (identifier, password) => {
  console.log("🔐 Logging in with:", identifier);
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/users/login`,
    { identifier, password }
  );
  console.log("✅ Login response:", res.data);
  
  // ✅ FIX: Direct destructuring use karo
  const { user: userData, token: jwtToken } = res.data;
  
  saveAuth(userData, jwtToken);
  return userData;
};

  // ✅ Register
  const register = async (name, email, password, phone = "") => {
    console.log("📝 Registering user:", name, email);
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/users/register`,
      { name, email, password, phone }
    );
    console.log("✅ Register response:", res.data);
    const { user: userData, token: jwtToken } = res.data;
    saveAuth(userData, jwtToken);
    return userData;
  };

  // ✅ Google Login
  const googleLogin = async (googleToken) => {
    console.log("🔐 Google login with token");
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/users/google-login`,
      { token: googleToken }
    );
    console.log("✅ Google login response:", res.data);
    const { user: userData, token: jwtToken } = res.data;
    saveAuth(userData, jwtToken);
    return userData;
  };

  // ✅ Logout
  const logout = () => {
    console.log("🚪 Logging out...");
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => useContext(AuthContext);
