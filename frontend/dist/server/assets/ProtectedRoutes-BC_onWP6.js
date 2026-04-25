import { jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem("isAdmin");
  if (!isAdmin) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/admin", replace: true });
  }
  return children;
};
export {
  ProtectedRoute as default
};
