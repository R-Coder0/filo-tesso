import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClock } from "react-icons/fa";
const formatINR = (n) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(n || 0);
const OrderConfirmationPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  useEffect(() => {
    if (!state?.orderId) {
      navigate("/");
    } else {
      setOrderDetails(state);
    }
  }, [state, navigate]);
  if (!orderDetails) return /* @__PURE__ */ jsx("div", { children: "Loading..." });
  const {
    orderId,
    paymentStatus,
    cartItems = [],
    subtotal,
    discountRate,
    discountAmount,
    totalAmount,
    address,
    coinsEarned,
    coinsRedeemed,
    payableAmount,
    coinStatus = "pending"
    // NEW: Get coin status
  } = orderDetails;
  const isPaid = Boolean(paymentStatus);
  const paymentMethod = isPaid ? "Online Payment" : "Cash on Delivery";
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl w-full bg-white shadow-xl rounded-2xl p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-8", children: [
      /* @__PURE__ */ jsx(FaCheckCircle, { className: "text-green-500 text-6xl mb-4" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Order Confirmed!" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-center", children: "Thank you for your purchase! Your order has been successfully placed." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4", children: "Order Summary" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Order ID:" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900", children: orderId })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Payment Method:" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900", children: paymentMethod })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Payment Status:" }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `font-semibold ${isPaid ? "text-green-600" : "text-yellow-600"}`,
              children: isPaid ? "Paid" : "Pending (COD)"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Subtotal:" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900", children: formatINR(subtotal) })
        ] }),
        discountAmount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-green-600", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "Discount",
            " ",
            discountRate ? `(${Math.round(discountRate * 100)}%)` : ""
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "- ",
            formatINR(discountAmount)
          ] })
        ] }),
        coinsRedeemed > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-blue-600", children: [
          /* @__PURE__ */ jsx("span", { children: "Coins Redeemed:" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "- ",
            formatINR(coinsRedeemed)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-gray-200 pt-3 mt-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-gray-900", children: "Total Payable:" }),
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-gray-900", children: formatINR(payableAmount || totalAmount) })
        ] })
      ] }),
      (coinsEarned || coinsEarned === 0) && /* @__PURE__ */ jsxs("div", { className: `mt-4 p-3 rounded-lg border ${coinStatus === "credited" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          coinStatus === "credited" ? /* @__PURE__ */ jsx(FaCheckCircle, { className: "text-green-500 text-lg" }) : /* @__PURE__ */ jsx(FaClock, { className: "text-blue-500 text-lg" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: coinStatus === "credited" ? "Coins Credited! 🎉" : "Coins Pending Credit" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 mt-1", children: coinStatus === "credited" ? `Your ${coinsEarned} coins have been added to your wallet.` : `You will earn ${coinsEarned} coins after 10 days (if order is not cancelled/returned).` })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `text-lg font-bold ${coinStatus === "credited" ? "text-green-600" : "text-blue-600"}`, children: [
            "+",
            coinsEarned
          ] })
        ] }),
        coinStatus === "pending" && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-gray-500 bg-white p-2 rounded border border-gray-200", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "🛡️ ",
            /* @__PURE__ */ jsx("strong", { children: "Coin Protection:" }),
            " Coins will be automatically credited after 10 days."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1", children: "❌ Coins will not be credited if order is cancelled or returned within 10 days." })
        ] })
      ] })
    ] }),
    cartItems?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4", children: "Items in Your Order" }),
      /* @__PURE__ */ jsx("div", { className: "divide-y divide-gray-200", children: cartItems.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "py-3 flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900", children: item.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            "Qty: ",
            item.quantity,
            item.selectedSize && ` | Size: ${item.selectedSize}`,
            item.selectedColor && ` | Color: ${item.selectedColor}`
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900", children: formatINR(item.price * item.quantity) })
      ] }, index)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-800 mb-4", children: "Shipping Address" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-gray-700 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Name: " }),
          address?.name
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Phone: " }),
          address?.phone
        ] }),
        address?.email && /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Email: " }),
          address?.email
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Address: " }),
          address?.street,
          ", ",
          address?.city,
          ", ",
          address?.state,
          " -",
          " ",
          address?.postalCode
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => navigate("/"),
        className: "px-8 py-3 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all",
        children: "Continue Shopping"
      }
    ) })
  ] }) });
};
export {
  OrderConfirmationPage as default
};
