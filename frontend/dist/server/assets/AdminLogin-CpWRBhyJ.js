import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiLock, FiEyeOff, FiEye, FiArrowRight } from "react-icons/fi";
const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = "http://localhost:5000";
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/admin/login`,
        { username, password }
      );
      if (response.data.success) {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin/dashboard", { replace: true });
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex items-center justify-center bg-black px-4", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-30 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[length:24px_24px]" }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md border border-white/15 bg-white p-8 shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-7", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-5 inline-flex h-14 w-14 items-center justify-center border border-black bg-black p-2", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/icon.png",
            alt: "Filoteso admin",
            className: "h-full w-full object-contain"
          }
        ) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-[0.35em] text-gray-500", children: "Filoteso Admin" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-2 text-3xl font-black tracking-tight text-black", children: "Sign in" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Manage products, inventory, and orders." })
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "mb-4 border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700", children: error }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 relative", children: [
          /* @__PURE__ */ jsx(FiUser, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Username",
              value: username,
              onChange: (e) => setUsername(e.target.value),
              required: true,
              className: "w-full border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm font-medium text-black outline-none transition focus:border-black"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6 relative", children: [
          /* @__PURE__ */ jsx(FiLock, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: showPassword ? "text" : "password",
              placeholder: "Password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true,
              className: "w-full border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm font-medium text-black outline-none transition focus:border-black"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-black",
              onClick: () => setShowPassword(!showPassword),
              "aria-label": showPassword ? "Hide password" : "Show password",
              children: showPassword ? /* @__PURE__ */ jsx(FiEyeOff, {}) : /* @__PURE__ */ jsx(FiEye, {})
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: loading,
            className: "flex w-full items-center justify-center gap-2 border border-black bg-black py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60",
            children: [
              loading ? "Logging in..." : "Login",
              !loading && /* @__PURE__ */ jsx(FiArrowRight, {})
            ]
          }
        )
      ] })
    ] })
  ] });
};
export {
  AdminLogin as default
};
