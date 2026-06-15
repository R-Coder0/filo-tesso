import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ShiprocketCheckoutReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [message, setMessage] = useState(
    "Confirming your Shiprocket order..."
  );

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(location.search);
    const orderId = params.get("oid");
    const status = String(params.get("ost") || "").toUpperCase();

    if (!orderId) {
      setMessage("Shiprocket did not return an order ID.");
      return;
    }

    if (status && status !== "SUCCESS") {
      setMessage("Checkout was not completed. You can return to your cart.");
      return;
    }

    const finalizeOrder = async () => {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/payment/shiprocket-checkout/finalize`,
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const order = data.order;
        sessionStorage.removeItem("checkoutState");

        navigate("/order-confirmation", {
          replace: true,
          state: {
            orderId: order.orderNumber || order._id,
            paymentStatus: order.paymentStatus === "Paid",
            cartItems: order.products || [],
            subtotal: order.totalAmount,
            totalAmount: order.totalAmount,
            firstOrderDiscountRate: order.firstOrderDiscountRate,
            firstOrderDiscountAmount: order.firstOrderDiscountAmount,
            payableAmount: order.payableAmount,
            address: order.address,
          },
        });
      } catch (error) {
        setMessage(
          error?.response?.data?.message ||
            "We could not confirm the Shiprocket order yet. Please check My Orders."
        );
      }
    };

    finalizeOrder();
  }, [location.search, navigate, token]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-[#e7e0fb] border-t-[#6546c7]" />
        <h1 className="text-xl font-semibold text-gray-950">
          Shiprocket Checkout
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        <button
          type="button"
          onClick={() => navigate("/my-orders")}
          className="mt-6 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};

export default ShiprocketCheckoutReturn;
