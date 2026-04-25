import { jsx, jsxs } from "react/jsx-runtime";
import { useContext, useState, useRef, useEffect } from "react";
import { A as AuthContext } from "../entry-server.js";
import { useNavigate, Link } from "react-router-dom";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "axios";
import "lucide-react";
import "react-icons/fa";
import "react-fast-marquee";
import "react-hot-toast";
const Login = () => {
  const { login, googleLogin } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  useEffect(() => {
    if (scriptLoadedRef.current || window.google) {
      initializeGoogle();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("✅ Google Sign-In script loaded");
      scriptLoadedRef.current = true;
      initializeGoogle();
    };
    script.onerror = () => {
      console.error("❌ Failed to load Google Sign-In script");
      setError("Failed to load Google Sign-In. Please refresh the page.");
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode && !scriptLoadedRef.current) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  const initializeGoogle = () => {
    if (!window.google) {
      console.error("Google API not loaded yet.");
      return;
    }
    try {
      window.google.accounts.id.initialize({
        client_id: "880105524858-61qokgrlq06lteus7tsablmjoiju4q47.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        ux_mode: "popup",
        auto_select: false
      });
      console.log("✅ Google Sign-In initialized successfully");
      setTimeout(() => {
        renderGoogleButton();
      }, 100);
    } catch (err) {
      console.error("❌ Google init error:", err);
      setError("Google Sign-In initialization failed");
    }
  };
  const renderGoogleButton = () => {
    if (!window.google || !googleButtonRef.current) {
      console.log("❌ Google or button ref not available");
      return;
    }
    try {
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          width: googleButtonRef.current.offsetWidth,
          text: "continue_with",
          type: "standard",
          shape: "rectangular"
        }
      );
      console.log("✅ Google button rendered successfully");
    } catch (err) {
      console.error("❌ Google button render error:", err);
      showFallbackGoogleButton();
    }
  };
  const showFallbackGoogleButton = () => {
    if (!googleButtonRef.current) return;
    googleButtonRef.current.innerHTML = `
      <button type="button" class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium">
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    `;
    const fallbackButton = googleButtonRef.current.querySelector("button");
    if (fallbackButton) {
      fallbackButton.onclick = handleManualGoogleLogin;
    }
  };
  const handleManualGoogleLogin = () => {
    setError("Google Sign-In not available. Please try again later.");
  };
  const handleGoogleResponse = async (response) => {
    try {
      setGoogleLoading(true);
      setError("");
      if (!response.credential) {
        throw new Error("No Google credential received.");
      }
      console.log("✅ Google login successful, credential received");
      await googleLogin(response.credential);
      const dest = localStorage.getItem("redirectAfterLogin") || "/";
      localStorage.removeItem("redirectAfterLogin");
      navigate(dest);
    } catch (err) {
      console.error("❌ Google login error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Google login failed";
      setError(errorMessage);
      setTimeout(() => setError(""), 5e3);
    } finally {
      setGoogleLoading(false);
    }
  };
  useEffect(() => {
    const handleResize = () => {
      if (window.google && googleButtonRef.current) {
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
          renderGoogleButton();
        }, 250);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(window.resizeTimeout);
    };
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }
    try {
      await login(email, password);
      const dest = localStorage.getItem("redirectAfterLogin") || "/";
      localStorage.removeItem("redirectAfterLogin");
      navigate(dest);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      setTimeout(() => setError(""), 5e3);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mt-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Hello, Welcome!" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Don't have an account?" }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/register",
          className: "inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium transition-colors",
          children: "Register"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm", children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Username" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            placeholder: "Enter your email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            className: "w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500",
            disabled: loading || googleLoading
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: showPassword ? "text" : "password",
              placeholder: "Enter your password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true,
              className: "w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 pr-12",
              disabled: loading || googleLoading
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: togglePasswordVisibility,
              className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors",
              disabled: loading || googleLoading,
              children: showPassword ? (
                // Eye slash icon (hide password)
                /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m9.02 9.02l3.83 3.83M15.828 15.828l3.83-3.83" }) })
              ) : (
                // Eye icon (show password)
                /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
                ] })
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ jsx("button", { type: "button", className: "text-sm text-blue-600 hover:text-blue-700 font-medium", children: "Forgot password?" }) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading || googleLoading,
          className: `w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 ${loading || googleLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"}`,
          children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center", children: [
            /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" }),
            "Logging in..."
          ] }) : "Login"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center my-8", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-gray-300" }),
      /* @__PURE__ */ jsx("div", { className: "mx-4 text-gray-500 text-sm font-medium", children: "or login with social platforms" }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-gray-300" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(
      "div",
      {
        ref: googleButtonRef,
        className: "flex justify-center w-full",
        style: { minHeight: "44px" },
        children: googleLoading && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-gray-600", children: [
          /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" }),
          "Connecting to Google..."
        ] })
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
      "Don't have an account?",
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/register",
          className: "text-blue-600 hover:text-blue-700 font-medium transition-colors",
          children: "Register here"
        }
      )
    ] }) })
  ] }) });
};
export {
  Login as default
};
