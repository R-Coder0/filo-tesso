import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Admin Dashboard
        </h1>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
          >
            Manage Products
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
            className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
          >
            Manage Orders
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
