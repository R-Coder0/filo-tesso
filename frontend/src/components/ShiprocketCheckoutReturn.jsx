import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const CHECKOUT_ORDER_ID_KEY = "shiprocketCheckoutOrderId";
const SAVED_ADDRESSES_KEY = "savedAddresses";
const FINALIZE_RETRY_DELAY_MS = 2500;
const FINALIZE_MAX_ATTEMPTS = 5;
const FAILURE_STATUSES = new Set([
  "CANCELLED",
  "CANCELED",
  "FAILED",
  "FAILURE",
  "PAYMENT_FAILED",
]);

const getFirstParam = (params, keys) => {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }

  return "";
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeAddressPart = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

const toSavedAddress = (address) => {
  if (!address?.phone || !address?.street) return null;

  return {
    id: Date.now(),
    fullName: address.name || "",
    phone: address.phone || "",
    address: address.street || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.postalCode || "",
    country: address.country || "India",
  };
};

const isSameAddress = (left, right) => {
  const keys = ["phone", "address", "city", "state", "pincode"];
  return keys.every(
    (key) => normalizeAddressPart(left?.[key]) === normalizeAddressPart(right?.[key])
  );
};

const saveCheckoutAddressToProfile = (orderAddress) => {
  const nextAddress = toSavedAddress(orderAddress);
  if (!nextAddress) return;

  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_ADDRESSES_KEY)) || [];
    const existingIndex = saved.findIndex((address) =>
      isSameAddress(address, nextAddress)
    );

    const nextList =
      existingIndex >= 0
        ? saved.map((address, index) =>
            index === existingIndex
              ? { ...address, ...nextAddress, id: address.id }
              : address
          )
        : [nextAddress, ...saved];

    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(nextList));
  } catch (error) {
    console.warn("Could not save Shiprocket address to profile:", error);
  }
};

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
    const orderId =
      getFirstParam(params, ["oid", "order_id", "orderId", "sr_order_id"]) ||
      sessionStorage.getItem(CHECKOUT_ORDER_ID_KEY);
    const status = String(
      getFirstParam(params, ["ost", "status", "order_status", "payment_status"])
    ).toUpperCase();

    if (!orderId) {
      setMessage("Shiprocket did not return an order ID.");
      return;
    }

    if (FAILURE_STATUSES.has(status)) {
      setMessage("Checkout was not completed. You can return to your cart.");
      return;
    }

    let cancelled = false;

    const finalizeOrder = async () => {
      for (let attempt = 1; attempt <= FINALIZE_MAX_ATTEMPTS; attempt += 1) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/payment/shiprocket-checkout/finalize`,
            { orderId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (cancelled) return;

          const order = data.order;
          saveCheckoutAddressToProfile(order.address);
          sessionStorage.removeItem("checkoutState");
          sessionStorage.removeItem(CHECKOUT_ORDER_ID_KEY);

          navigate("/order-confirmation", {
            replace: true,
            state: {
              orderId: order.orderNumber || order._id,
              paymentStatus: order.paymentStatus === "Paid",
              cartItems: order.products || [],
              subtotal: order.totalAmount,
              totalAmount: order.totalAmount,
              taxableAmount: order.taxableAmount,
              taxAmount: order.taxAmount,
              payableAmount: order.payableAmount,
              address: order.address,
            },
          });
          return;
        } catch (error) {
          if (cancelled) return;

          const isPending = error?.response?.status === 409;
          if (isPending && attempt < FINALIZE_MAX_ATTEMPTS) {
            setMessage(
              "Payment received. Confirming your order with Shiprocket..."
            );
            await wait(FINALIZE_RETRY_DELAY_MS);
            continue;
          }

          setMessage(
            error?.response?.data?.message ||
              "We could not confirm the Shiprocket order yet. Please check My Orders."
          );
          return;
        }
      }
    };

    finalizeOrder();

    return () => {
      cancelled = true;
    };
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
