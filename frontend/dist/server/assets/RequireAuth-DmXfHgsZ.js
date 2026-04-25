import { jsx } from "react/jsx-runtime";
import { useContext } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { A as AuthContext } from "../entry-server.js";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "axios";
import "lucide-react";
import "react-icons/fa";
import "react-fast-marquee";
import "react-hot-toast";
const RequireAuth = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (!user) {
    localStorage.setItem("redirectAfterLogin", location.pathname);
    return /* @__PURE__ */ jsx(Navigate, { to: "/login", replace: true });
  }
  return children;
};
export {
  RequireAuth as default
};
