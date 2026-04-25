import { jsx, jsxs } from "react/jsx-runtime";
import { useContext, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { A as AuthContext } from "../entry-server.js";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "lucide-react";
import "react-icons/fa";
import "react-fast-marquee";
import "react-hot-toast";
const TIERS = [
  { threshold: 1e3, rate: 0.05, label: "5%" },
  { threshold: 2e3, rate: 0.1, label: "10%" },
  { threshold: 3e3, rate: 0.15, label: "15%" }
];
const REFERRAL_CODES = {
  RISHABH10: 0.1,
  // 10% off
  FRIEND5: 0.05
  // 5% off
};
const formatINR = (n) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(n || 0);
function computeDiscount(subtotal) {
  const active = [...TIERS].filter((t) => subtotal >= t.threshold).pop() || null;
  const rate = active ? active.rate : 0;
  const discountAmount = Math.floor(subtotal * rate);
  const discountedTotal = Math.max(subtotal - discountAmount, 0);
  return {
    activeTier: active,
    discountRate: rate,
    discountAmount,
    discountedTotal
  };
}
const loadRazorpayScript = () => new Promise((resolve) => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});
const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, token, updateCoins } = useContext(AuthContext);
  const apiUrl = "http://localhost:5000";
  const {
    cartItems: initialCartItems,
    subtotal: initialSubtotal,
    discountRate: initialDiscountRate,
    discountAmount: initialDiscountAmount,
    totalAmount: initialFinalTotal,
    customUploads
    // { isCustomize, singleFile }
  } = state || {
    cartItems: [],
    subtotal: 0,
    discountRate: 0,
    discountAmount: 0,
    totalAmount: 0,
    customUploads: null
  };
  const [cartItems, setCartItems] = useState(initialCartItems || []);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    postalCode: ""
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [availableCoins, setAvailableCoins] = useState(user?.coinsBalance ?? 0);
  const [redeemCoins, setRedeemCoins] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const preSelectedFile = customUploads?.singleFile || null;
  const [singleFile, setSingleFile] = useState(preSelectedFile);
  customUploads?.isCustomize || false;
  useEffect(() => {
    if (!initialCartItems || initialCartItems.length === 0) navigate("/");
  }, [initialCartItems, navigate]);
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("savedAddresses")) || [];
      setSavedAddresses(list);
    } catch {
      setSavedAddresses([]);
    }
  }, []);
  useEffect(() => {
    if (user && typeof user.coinsBalance === "number") {
      setAvailableCoins(user.coinsBalance);
      setRedeemCoins((prev) => Math.max(0, Math.min(prev, user.coinsBalance)));
    }
  }, [user]);
  const saleBaseTotal = (cartItems || []).reduce(
    (acc, item) => acc + (item.price?.sale || 0) * (item.quantity || 0),
    0
  );
  const { subtotal, discountRate, discountAmount, discountedTotal } = useMemo(() => {
    const sub = (cartItems || []).reduce(
      (acc, item) => acc + (item.price?.original || item.price?.sale || 0) * (item.quantity || 0),
      0
    ) || initialSubtotal || 0;
    const { discountRate: discountRate2, discountAmount: discountAmount2 } = computeDiscount(saleBaseTotal);
    const discountedTotal2 = saleBaseTotal - discountAmount2;
    return { subtotal: sub, discountRate: discountRate2, discountAmount: discountAmount2, discountedTotal: discountedTotal2 };
  }, [cartItems, initialSubtotal]);
  const saleDiscount = (cartItems || []).reduce(
    (acc, item) => acc + ((item.price?.original || 0) - (item.price?.sale || 0)) * (item.quantity || 0),
    0
  );
  const effectiveRedeem = Math.max(
    0,
    Math.min(redeemCoins || 0, availableCoins || 0, discountedTotal || 0)
  );
  const referralAmount = Math.floor(discountedTotal * referralDiscount);
  const finalAfterReferral = discountedTotal - referralAmount;
  const payableAmount = Math.max(0, finalAfterReferral - effectiveRedeem);
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setAddress({
      name: addr.fullName || "",
      phone: addr.phone || "",
      email: "",
      // optional; can keep user.email if you want
      street: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.pincode || ""
    });
  };
  const applyReferral = () => {
    const code = referralCode.trim().toUpperCase();
    if (REFERRAL_CODES[code]) {
      setReferralDiscount(REFERRAL_CODES[code]);
      alert(`Referral code applied! You got ${REFERRAL_CODES[code] * 100}% off.`);
    } else {
      setReferralDiscount(0);
      alert("Invalid referral code.");
    }
  };
  const appendSingleFileSmart = (form, file) => {
    if (!file) return;
    const type = (file.type || "").toLowerCase();
    if (type.includes("pdf")) {
      form.append("customPdf", file);
    } else {
      form.append("customImage", file);
    }
  };
  const isFormValid = useMemo(() => {
    const required = ["name", "phone", "street", "city", "state", "postalCode"];
    return required.every((k) => (address[k] || "").trim() !== "");
  }, [address]);
  const handlePlaceOrder = async () => {
    if (!token) return alert("Please login to place order.");
    if (!isFormValid) return alert("Please fill in all required fields.");
    try {
      const form = new FormData();
      const products = cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        selectedSize: item.selectedSize || "",
        selectedColor: item.selectedColor || ""
      }));
      form.append("products", JSON.stringify(products));
      form.append("discountRate", String(discountRate));
      form.append("discountedTotal", String(discountedTotal));
      form.append("redeemCoins", String(effectiveRedeem));
      form.append("payableAmount", String(payableAmount));
      form.append("address", JSON.stringify(address));
      if (customUploads?.isCustomize && customUploads.selectedSide) {
        form.append("selectedSide", customUploads.selectedSide);
      }
      if (singleFile) appendSingleFileSmart(form, singleFile);
      const { data } = await axios.post(`${apiUrl}/api/orders`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      if (typeof data.coinsBalance === "number") {
        setAvailableCoins(data.coinsBalance);
        updateCoins(data.coinsBalance);
      }
      const order = data.order || data;
      const orderDetails = {
        orderId: order._id || "COD" + Date.now(),
        paymentStatus: order.paymentStatus === "Paid",
        cartItems,
        subtotal,
        discountRate,
        discountAmount,
        totalAmount: discountedTotal,
        address,
        coinsEarned: order.coinsEarned,
        coinsRedeemed: order.coinsRedeemed ?? effectiveRedeem,
        payableAmount: order.payableAmount ?? payableAmount,
        coinStatus: order.coinStatus
      };
      navigate("/order-confirmation", { state: orderDetails });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to place order. Please try again.");
    }
  };
  const handleOnlinePayment = async () => {
    if (!token) return alert("Please login to place order.");
    if (!isFormValid) return alert("Please fill in all required fields.");
    const res = await loadRazorpayScript();
    if (!res) return alert("Razorpay SDK failed to load. Check your connection.");
    try {
      const response = await axios.post(
        `${apiUrl}/api/payment/create-order`,
        {
          cartItems,
          redeemCoins: effectiveRedeem,
          address,
          totalAmount: discountedTotal,
          // ✅ YEH LINE ADD KARO
          selectedSide: customUploads?.isCustomize ? customUploads.selectedSide : ""
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response?.data) throw new Error("No response from server");
      const order = response.data.order || response.data;
      if (!order?.id || !order?.amount) throw new Error("Invalid order data");
      const options = {
        key: "rzp_test_5VP8aQsRZd71M5",
        amount: order.amount,
        // in paise
        currency: order.currency || "INR",
        name: "ChargeVita",
        description: "Order Payment",
        order_id: order.id,
        prefill: {
          name: address.name,
          email: address.email || user?.email || "",
          contact: address.phone
        },
        theme: { color: "#000000" },
        handler: async function(rzpResponse) {
          try {
            const verifyRes = await axios.post(
              `${apiUrl}/api/payment/verify`,
              {
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_signature: rzpResponse.razorpay_signature,
                cartItems,
                address,
                redeemCoins: effectiveRedeem
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const out = verifyRes?.data || {};
            if (typeof out.coinsBalance === "number") {
              setAvailableCoins(out.coinsBalance);
              updateCoins(out.coinsBalance);
            }
            const finalOrder = out.order || out;
            const orderDetails = {
              orderId: finalOrder._id || order.id,
              paymentStatus: true,
              cartItems,
              subtotal,
              discountRate,
              discountAmount,
              totalAmount: discountedTotal,
              address,
              coinsEarned: finalOrder.coinsEarned,
              coinsRedeemed: finalOrder.coinsRedeemed ?? effectiveRedeem,
              payableAmount,
              coinStatus: finalOrder.coinStatus
            };
            navigate("/order-confirmation", { state: orderDetails });
          } catch (err) {
            console.error(err);
            alert("Payment verified but order creation failed. Please contact support.");
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function(response2) {
        console.error("Razorpay payment failed:", response2?.error);
        alert(response2?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Payment initialization failed.");
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-b from-gray-50 to-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900", children: "Choose Saved Address" }),
        savedAddresses.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "No saved addresses found. Go to your Profile to add one." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: savedAddresses.map((addr) => {
          const checked = selectedAddressId === addr.id;
          return /* @__PURE__ */ jsx(
            "label",
            {
              className: `border rounded-lg p-4 cursor-pointer transition ${checked ? "border-black bg-gray-50" : "border-gray-300"}`,
              onClick: () => handleSelectSavedAddress(addr),
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    name: "savedAddress",
                    className: "mt-1 mr-3 accent-black",
                    checked,
                    onChange: () => handleSelectSavedAddress(addr)
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: addr.fullName }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700", children: addr.phone }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700", children: addr.address }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700", children: [
                    addr.city,
                    ", ",
                    addr.state,
                    " - ",
                    addr.pincode
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700", children: addr.country })
                ] })
              ] })
            },
            addr.id
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900", children: "Shipping Information" }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "name",
              placeholder: "Full Name",
              value: address.name,
              onChange: handleAddressChange,
              className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "phone",
              placeholder: "Phone Number",
              value: address.phone,
              onChange: handleAddressChange,
              className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              name: "email",
              placeholder: "Email (optional)",
              value: address.email,
              onChange: handleAddressChange,
              className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "street",
              placeholder: "Street Address",
              value: address.street,
              onChange: handleAddressChange,
              className: "sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "city",
              placeholder: "City",
              value: address.city,
              onChange: handleAddressChange,
              className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "state",
              placeholder: "State",
              value: address.state,
              onChange: handleAddressChange,
              className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "postalCode",
              placeholder: "Postal Code",
              value: address.postalCode,
              onChange: handleAddressChange,
              className: "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900", children: "Redeem Coins & Referral" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 0,
                max: Math.min(availableCoins, discountedTotal),
                value: redeemCoins,
                onChange: (e) => {
                  const v = Number(e.target.value || 0);
                  setRedeemCoins(Math.max(0, Math.min(v, availableCoins, discountedTotal)));
                },
                className: "w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600", children: [
              "Available: ",
              /* @__PURE__ */ jsx("b", { children: availableCoins })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Referral Code",
                value: referralCode,
                onChange: (e) => setReferralCode(e.target.value),
                className: "border border-gray-300 rounded-lg px-3 py-2 w-40 focus:ring-2 focus:ring-black outline-none"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyReferral,
                className: "bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition",
                children: "Apply"
              }
            )
          ] })
        ] }),
        referralDiscount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-700 mt-2", children: [
          "Referral applied (",
          referralDiscount * 100,
          "% off)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4 text-gray-900", children: "Order Summary" }),
      cartItems.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "Your cart is empty." }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        cartItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-900 truncate", children: item.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500", children: [
              "Qty: ",
              item.quantity,
              item.selectedSize ? ` • Size: ${item.selectedSize}` : "",
              item.selectedColor ? ` • Color: ${item.selectedColor}` : ""
            ] }),
            Number(item.stock || 0) <= 0 && /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs font-semibold text-red-600", children: "Out of stock" }),
            Number(item.stock || 0) > 0 && item.quantity >= item.stock && /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs font-semibold text-orange-600", children: [
              "Only ",
              item.stock,
              " available"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: formatINR((item.price?.sale || 0) * (item.quantity || 0)) })
        ] }, item._id)),
        /* @__PURE__ */ jsx("div", { className: "border-t my-3" }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
          /* @__PURE__ */ jsx("span", { children: formatINR(subtotal) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { children: "Product Discount" }),
          /* @__PURE__ */ jsxs("span", { className: "text-green-700 font-medium", children: [
            "− ",
            formatINR(saleDiscount)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { children: "After Discount" }),
          /* @__PURE__ */ jsx("span", { children: formatINR(discountedTotal) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { children: "Referral Discount" }),
          /* @__PURE__ */ jsxs("span", { className: "text-green-700 font-medium", children: [
            "− ",
            formatINR(referralAmount)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { children: "Coins Redeemed" }),
          /* @__PURE__ */ jsxs("span", { className: effectiveRedeem ? "text-green-700 font-medium" : "", children: [
            "− ",
            formatINR(effectiveRedeem)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-semibold", children: [
          /* @__PURE__ */ jsx("span", { children: "Payable" }),
          /* @__PURE__ */ jsx("span", { children: formatINR(payableAmount) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 mt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleOnlinePayment,
              disabled: !isFormValid || !token,
              className: `w-full group relative overflow-hidden bg-gray-900 text-white font-medium py-4 px-6 rounded-lg transition-all ${!isFormValid || !token ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800 hover:shadow-md"}`,
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-white/10 p-2 rounded-lg", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2,
                      d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    }
                  ) }) }),
                  /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Pay Online" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-300", children: "Secure payment via Razorpay" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: formatINR(payableAmount) }) })
              ] })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-grow border-t border-gray-200" }),
            /* @__PURE__ */ jsx("span", { className: "flex-shrink mx-4 text-xs text-gray-400 uppercase tracking-wider", children: "or" }),
            /* @__PURE__ */ jsx("div", { className: "flex-grow border-t border-gray-200" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handlePlaceOrder,
              disabled: !isFormValid || !token,
              className: `w-full group bg-white border-2 border-gray-300 text-gray-900 font-medium py-4 px-6 rounded-lg transition-all ${!isFormValid || !token ? "opacity-50 cursor-not-allowed" : "hover:border-gray-900 hover:shadow-md"}`,
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-gray-100 p-2 rounded-lg group-hover:bg-gray-900 transition-colors", children: /* @__PURE__ */ jsx(
                    "svg",
                    {
                      className: "w-5 h-5 text-gray-700 group-hover:text-white transition-colors",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        }
                      )
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Cash on Delivery" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Pay at your doorstep" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: formatINR(payableAmount) }) })
              ] })
            }
          )
        ] })
      ] })
    ] }) })
  ] }) });
};
export {
  CheckoutPage as default
};
