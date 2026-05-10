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
  const [discountInput, setDiscountInput] = useState("15");

  useEffect(() => {
    const fetchDiscountSetting = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/admin/first-order-discount`);
        const percentage = Number(data.percentage ?? 15);
        setDiscountSetting({
          enabled: Boolean(data.enabled),
          percentage,
        });
        setDiscountInput(String(percentage));
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
      const percentage = Number(data.percentage ?? nextSetting.percentage);
      setDiscountSetting({
        enabled: Boolean(data.enabled),
        percentage,
      });
      setDiscountInput(String(percentage));
      setDiscountMessage("Discount settings updated");
    } catch (err) {
      setDiscountMessage(err.response?.data?.message || "Failed to update discount");
    } finally {
      setDiscountSaving(false);
    }
  };

  const clampDiscount = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 15;
    return Math.min(100, Math.max(0, numericValue));
  };

  const handleDiscountInputChange = (value) => {
    if (value === "") {
      setDiscountInput("");
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    setDiscountInput(String(Math.min(100, Math.max(0, numericValue))));
  };

  const saveDiscountPercentage = () => {
    const percentage = clampDiscount(discountInput);
    updateDiscountSetting({
      ...discountSetting,
      percentage,
    });
  };

  const saveRangeDiscountPercentage = (value) => {
    const percentage = clampDiscount(value);
    setDiscountInput(String(percentage));
    updateDiscountSetting({
      ...discountSetting,
      percentage,
    });
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

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
              Discount Percentage
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discountInput}
                  onChange={(e) => handleDiscountInputChange(e.target.value)}
                  onBlur={() => setDiscountInput(String(clampDiscount(discountInput)))}
                  className="w-full border border-gray-300 px-3 py-2 pr-8 text-sm font-semibold outline-none focus:border-black"
                  disabled={discountSaving}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                  %
                </span>
              </div>
              <button
                type="button"
                disabled={discountSaving}
                onClick={saveDiscountPercentage}
                className="border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black disabled:opacity-50"
              >
                Save
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={clampDiscount(discountInput)}
              onChange={(e) => setDiscountInput(e.target.value)}
              onMouseUp={(e) => saveRangeDiscountPercentage(e.currentTarget.value)}
              onTouchEnd={(e) => saveRangeDiscountPercentage(e.currentTarget.value)}
              className="w-full accent-black"
              disabled={discountSaving}
            />
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              <span>0%</span>
              <span>Current: {discountSetting.percentage}%</span>
              <span>100%</span>
            </div>
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
