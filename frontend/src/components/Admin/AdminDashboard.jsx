import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [discountSetting, setDiscountSetting] = useState({
    enabled: true,
    percentage: 15,
  });
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");

  useEffect(() => {
    const fetchDiscountSetting = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/admin/first-order-discount`);
        setDiscountSetting({
          enabled: Boolean(data.enabled),
          percentage: Number(data.percentage || 15),
        });
      } catch {
        setDiscountMessage("Could not load discount settings");
      }
    };

    fetchDiscountSetting();
  }, [apiUrl]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin", { replace: true });
  };

  const updateDiscountSetting = async (nextSetting) => {
    setDiscountSaving(true);
    setDiscountMessage("");
    try {
      const { data } = await axios.put(
        `${apiUrl}/api/admin/first-order-discount`,
        nextSetting,
        { headers: { authorization: import.meta.env.VITE_ADMIN_TOKEN } }
      );
      setDiscountSetting({
        enabled: Boolean(data.enabled),
        percentage: Number(data.percentage || nextSetting.percentage),
      });
      setDiscountMessage("Discount settings updated");
    } catch (err) {
      setDiscountMessage(err.response?.data?.message || "Failed to update discount");
    } finally {
      setDiscountSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Admin Dashboard
        </h1>

        <div className="mb-6 rounded-lg border border-gray-200 p-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">First Order Discount</h2>
              <p className="mt-1 text-sm text-gray-500">
                Applies only on a customer's first order.
              </p>
            </div>
            <button
              type="button"
              disabled={discountSaving}
              onClick={() =>
                updateDiscountSetting({
                  ...discountSetting,
                  enabled: !discountSetting.enabled,
                })
              }
              className={`min-w-14 px-3 py-1.5 text-xs font-semibold uppercase ${
                discountSetting.enabled
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-600"
              } disabled:opacity-50`}
            >
              {discountSetting.enabled ? "On" : "Off"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[10, 15, 20].map((percentage) => (
              <button
                key={percentage}
                type="button"
                disabled={discountSaving}
                onClick={() =>
                  updateDiscountSetting({
                    ...discountSetting,
                    percentage,
                  })
                }
                className={`border px-3 py-2 text-sm font-semibold ${
                  discountSetting.percentage === percentage
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-gray-700 hover:border-black"
                } disabled:opacity-50`}
              >
                {percentage}%
              </button>
            ))}
          </div>

          {discountMessage && (
            <p className="mt-3 text-xs text-gray-500">{discountMessage}</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="w-full bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition"
          >
            Manage Products
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
            className="w-full border border-black text-black px-6 py-3 rounded hover:bg-black hover:text-white transition"
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
