import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { useNavigate } from "react-router-dom";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin", { replace: true });
  };
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-8 bg-white rounded-lg shadow-lg", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-6 text-gray-800", children: "Admin Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate("/admin/products"),
          className: "w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition",
          children: "Manage Products"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate("/admin/orders"),
          className: "w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition",
          children: "Manage Orders"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleLogout,
          className: "w-full bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition",
          children: "Logout"
        }
      )
    ] })
  ] }) });
};
export {
  AdminDashboard as default
};
