// src/context/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import axios from "axios";

export const AuthContext = createContext();
const isBrowser = typeof window !== "undefined";
const AUTH_STORAGE_KEY = "auth";
const TOKEN_EXPIRY_SKEW_MS = 30 * 1000;

const decodeJwtPayload = (jwtToken) => {
  if (!isBrowser || !jwtToken || typeof jwtToken !== "string") return null;

  try {
    const payload = jwtToken.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const getTokenExpiry = (jwtToken) => {
  const payload = decodeJwtPayload(jwtToken);
  const expiresAt = Number(payload?.exp) * 1000;
  return Number.isFinite(expiresAt) ? expiresAt : 0;
};

const isExpiredToken = (jwtToken) => {
  const expiresAt = getTokenExpiry(jwtToken);
  return !expiresAt || expiresAt <= Date.now() + TOKEN_EXPIRY_SKEW_MS;
};

const normalizeUser = (userData = {}) => ({
  id: userData.id || userData._id,
  name: userData.name,
  email: userData.email,
  phone: userData.phone,
});

const rememberCurrentRoute = () => {
  if (!isBrowser) return;

  const currentRoute = `${window.location.pathname}${window.location.search}`;
  if (!["/login", "/register"].includes(window.location.pathname)) {
    localStorage.setItem("redirectAfterLogin", currentRoute);
  }
};

const getAuthorizationHeader = (headers) => {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return headers.get("Authorization") || headers.get("authorization") || "";
  }

  return headers.Authorization || headers.authorization || "";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(isBrowser);

  const clearAuthState = useCallback((rememberRoute = false) => {
    if (rememberRoute) rememberCurrentRoute();

    setUser(null);
    setToken(null);

    if (isBrowser) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    delete axios.defaults.headers.common["Authorization"];
  }, []);

  // ✅ Load auth safely from localStorage
  useEffect(() => {
    const loadAuth = async () => {
      if (!isBrowser) {
        setLoading(false);
        return;
      }

      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        console.log("🔄 Loading auth from storage:", stored);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          const storedUser = parsed?.user;
          const storedToken = parsed?.token;

          if (storedToken && typeof storedToken === "string" && storedToken !== "undefined") {
            if (isExpiredToken(storedToken)) {
              console.warn("❌ Stored token expired, clearing auth...");
              clearAuthState();
              return;
            }

            console.log("✅ Valid token found, setting auth...");
            setUser(storedUser);
            setToken(storedToken);
            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          } else {
            console.warn("❌ Invalid token found in storage, clearing...");
            clearAuthState();
          }
        }
      } catch (err) {
        console.warn("⚠️ Error parsing stored auth, clearing...", err);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, [clearAuthState]);

  useEffect(() => {
    if (!isBrowser || !token) return undefined;

    const expiresAt = getTokenExpiry(token);
    const msUntilExpiry = expiresAt - Date.now() - TOKEN_EXPIRY_SKEW_MS;

    if (!expiresAt || msUntilExpiry <= 0) {
      clearAuthState(true);
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      console.warn("❌ Session expired, logging out...");
      clearAuthState(true);
    }, msUntilExpiry);

    return () => window.clearTimeout(timerId);
  }, [token, clearAuthState]);

  useEffect(() => {
    if (!isBrowser) return undefined;

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const requestHeaders = error?.config?.headers || {};
        const requestAuthHeader = getAuthorizationHeader(requestHeaders);
        const defaultAuthHeader =
          axios.defaults.headers.common["Authorization"];
        const authHeader = requestAuthHeader || defaultAuthHeader;
        const usedUserToken =
          typeof authHeader === "string" && authHeader.startsWith("Bearer ");

        if (status === 401 && usedUserToken) {
          console.warn("❌ Auth request failed with 401, logging out...");
          clearAuthState(true);
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, [clearAuthState]);

  // ✅ Refresh profile if token exists
useEffect(() => {
  const refreshProfile = async () => {
    try {
      if (!token) {
        console.log("❌ No token available for profile refresh");
        return;
      }

      console.log("🔄 Refreshing user profile with token...");

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
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ ...parsed, user: freshUser })
        );
        console.log("✅ LocalStorage updated with fresh user data");
      }
    } catch (err) {
      console.warn("⚠️ Failed to refresh profile:", err?.response?.data || err.message);
      if (err?.response?.status !== 401) {
        console.log("🔄 Using existing user data from initial login");
      }
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

    if (isExpiredToken(jwtToken)) {
      console.error("❌ Expired token received:", jwtToken);
      clearAuthState();
      return;
    }

    const normalized = normalizeUser(userData);

    console.log("✅ Normalized user data:", normalized);
    
    setUser(normalized);
    setToken(jwtToken);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: normalized, token: jwtToken }));
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

  const updateProfile = async (profileData) => {
    if (!token) {
      throw new Error("Please login again to update your profile.");
    }

    const { data } = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/users/profile`,
      profileData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const freshUser = normalizeUser(data.user || data);
    setUser(freshUser);

    if (isBrowser) {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ ...parsed, user: freshUser })
        );
      }
    }

    return freshUser;
  };

  // ✅ Logout
  const logout = () => {
    console.log("🚪 Logging out...");
    clearAuthState();
    if (isBrowser) {
      localStorage.removeItem("redirectAfterLogin");
      window.location.href = "/login";
    }
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
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => useContext(AuthContext);
