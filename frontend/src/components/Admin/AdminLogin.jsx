import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-6">
          <div className="flex justify-center text-5xl text-blue-600 mb-3">
            <MdAdminPanelSettings />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Admin Login
          </h2>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-100 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="mb-4 relative">
            <FiUser className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="mb-6 relative">
            <FiLock className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div
              className="absolute right-3 top-3.5 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
