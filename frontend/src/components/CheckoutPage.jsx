// src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

/* -----------------------------
   DISCOUNT TIERS / HELPERS
------------------------------*/
const TIERS = [
  { threshold: 1000, rate: 0.05, label: "5%" },
  { threshold: 2000, rate: 0.10, label: "10%" },
  { threshold: 3000, rate: 0.15, label: "15%" },
];

// Static referral codes
const REFERRAL_CODES = {
  RISHABH10: 0.1, // 10% off
  FRIEND5: 0.05,  // 5% off
};


const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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
    discountedTotal,
  };
}

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/* -----------------------------
   MAIN COMPONENT
------------------------------*/
const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, token, updateCoins } = useContext(AuthContext);

  const apiUrl = import.meta.env.VITE_API_URL;

  // cart/price data passed from cart sidebar
  const {
    cartItems: initialCartItems,
    subtotal: initialSubtotal,
    discountRate: initialDiscountRate,
    discountAmount: initialDiscountAmount,
    totalAmount: initialFinalTotal,
    customUploads, // { isCustomize, singleFile }
  } = state || {
    cartItems: [],
    subtotal: 0,
    discountRate: 0,
    discountAmount: 0,
    totalAmount: 0,
    customUploads: null,
  };

  /* -----------------------------
     STATE
  ------------------------------*/
  const [cartItems, setCartItems] = useState(initialCartItems || []);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Saved addresses from localStorage
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [availableCoins, setAvailableCoins] = useState(user?.coinsBalance ?? 0);
  const [redeemCoins, setRedeemCoins] = useState(0);
  const [referralCode, setReferralCode] = useState("");
const [referralDiscount, setReferralDiscount] = useState(0);


  const preSelectedFile = customUploads?.singleFile || null;
  const [singleFile, setSingleFile] = useState(preSelectedFile);
  const isCustomizeOrder = customUploads?.isCustomize || false;

  /* -----------------------------
     GUARDS / INIT
  ------------------------------*/
  useEffect(() => {
    // no items -> redirect home
    if (!initialCartItems || initialCartItems.length === 0) navigate("/");
  }, [initialCartItems, navigate]);

  // Load saved addresses from localStorage
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("savedAddresses")) || [];
      setSavedAddresses(list);
    } catch {
      setSavedAddresses([]);
    }
  }, []);

  // coins availability sync
  useEffect(() => {
    if (user && typeof user.coinsBalance === "number") {
      setAvailableCoins(user.coinsBalance);
      setRedeemCoins((prev) => Math.max(0, Math.min(prev, user.coinsBalance)));
    }
  }, [user]);

  /* -----------------------------
     PRICING
  ------------------------------*/
  const { subtotal, discountRate, discountAmount, discountedTotal } = useMemo(() => {
    // re-evaluate subtotal in case qty changed here
    const sub =
      (cartItems || []).reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 0),
        0
      ) || initialSubtotal || 0;

    const { discountRate, discountAmount, discountedTotal } = computeDiscount(sub);
    return { subtotal: sub, discountRate, discountAmount, discountedTotal };
  }, [cartItems, initialSubtotal]);

  // Coins are capped to final discounted total
  const effectiveRedeem = Math.max(
    0,
    Math.min(redeemCoins || 0, availableCoins || 0, discountedTotal || 0)
  );
// Referral discount calculations
const referralAmount = Math.floor(discountedTotal * referralDiscount);
const finalAfterReferral = discountedTotal - referralAmount;
const payableAmount = Math.max(0, finalAfterReferral - effectiveRedeem);

/*   const payableAmount = Math.max(0, (discountedTotal || 0) - effectiveRedeem);
 */
  /* -----------------------------
     HANDLERS
  ------------------------------*/
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    // Auto-fill form but do not auto-submit
    setAddress({
      name: addr.fullName || "",
      phone: addr.phone || "",
      email: "", // optional; can keep user.email if you want
      street: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.pincode || "",
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


  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === productId
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item
      )
    );
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

  /* -----------------------------
     COD FLOW
  ------------------------------*/
  const handlePlaceOrder = async () => {
    if (!token) return alert("Please login to place order.");
    if (!isFormValid) return alert("Please fill in all required fields.");

    try {
      const form = new FormData();

      const products = cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        selectedSize: item.selectedSize || "",
        selectedColor: item.selectedColor || "",
      }));

      form.append("products", JSON.stringify(products));
      form.append("subtotal", String(subtotal));
      form.append("discountRate", String(discountRate));
      form.append("discountAmount", String(discountAmount));
      form.append("discountedTotal", String(discountedTotal));
      form.append("redeemCoins", String(effectiveRedeem));
      form.append("payableAmount", String(payableAmount));
      form.append("address", JSON.stringify(address));
      form.append("totalAmount", String(discountedTotal));
      
         // ✅ YEH SECTION ADD KARO - Side information
    if (customUploads?.isCustomize && customUploads.selectedSide) {
      form.append("selectedSide", customUploads.selectedSide);
    }


      if (singleFile) appendSingleFileSmart(form, singleFile);

      const { data } = await axios.post(`${apiUrl}/api/orders`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
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
        coinStatus: order.coinStatus,
      };

      navigate("/order-confirmation", { state: orderDetails });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to place order. Please try again.");
    }
  };

  /* -----------------------------
     RAZORPAY FLOW
  ------------------------------*/
  const handleOnlinePayment = async () => {
    if (!token) return alert("Please login to place order.");
    if (!isFormValid) return alert("Please fill in all required fields.");

    const res = await loadRazorpayScript();
    if (!res) return alert("Razorpay SDK failed to load. Check your connection.");

    try {
      // create order on server
      const response = await axios.post(
        `${apiUrl}/api/payment/create-order`,
        {
          amount: payableAmount,
          cartItems,
          subtotal,
          discountAmount,
          discountedTotal,
          redeemCoins: effectiveRedeem,
          address,
          totalAmount: discountedTotal,
                  // ✅ YEH LINE ADD KARO
        selectedSide: customUploads?.isCustomize ? customUploads.selectedSide : "",

        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response?.data) throw new Error("No response from server");
      const order = response.data.order || response.data;
      if (!order?.id || !order?.amount) throw new Error("Invalid order data");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount, // in paise
        currency: order.currency || "INR",
        name: "ChargeVita",
        description: "Order Payment",
        order_id: order.id,
        prefill: {
          name: address.name,
          email: address.email || user?.email || "",
          contact: address.phone,
        },
        theme: { color: "#000000" },
        handler: async function (rzpResponse) {
          try {
            // verify payment + create final order
            const verifyRes = await axios.post(
              `${apiUrl}/api/payment/verify`,
              {
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_signature: rzpResponse.razorpay_signature,
                cartItems,
                address,
                totalAmount: discountedTotal,
                redeemCoins: effectiveRedeem,
                subtotal,
                discountAmount,
                discountedTotal,
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
              coinStatus: finalOrder.coinStatus,
            };

            navigate("/order-confirmation", { state: orderDetails });
          } catch (err) {
            console.error(err);
            alert("Payment verified but order creation failed. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response?.error);
        alert(response?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Payment initialization failed.");
    }
  };

  /* -----------------------------
     RENDER
  ------------------------------*/
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-8">
        {/* LEFT: Address + Upload + Coins */}
        <div className="lg:col-span-2 space-y-8">
          {/* Saved Address Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Choose Saved Address</h2>
            {savedAddresses.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No saved addresses found. Go to your Profile to add one.
              </p>
            ) : (
              <div className="grid gap-3">
                {savedAddresses.map((addr) => {
                  const checked = selectedAddressId === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        checked ? "border-black bg-gray-50" : "border-gray-300"
                      }`}
                      onClick={() => handleSelectSavedAddress(addr)}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="savedAddress"
                          className="mt-1 mr-3 accent-black"
                          checked={checked}
                          onChange={() => handleSelectSavedAddress(addr)}
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{addr.fullName}</p>
                          <p className="text-sm text-gray-700">{addr.phone}</p>
                          <p className="text-sm text-gray-700">{addr.address}</p>
                          <p className="text-sm text-gray-700">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-sm text-gray-700">{addr.country}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Shipping Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={address.name}
                onChange={handleAddressChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={address.phone}
                onChange={handleAddressChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Email (optional)"
                value={address.email}
                onChange={handleAddressChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="text"
                name="street"
                placeholder="Street Address"
                value={address.street}
                onChange={handleAddressChange}
                className="sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={address.city}
                onChange={handleAddressChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={address.state}
                onChange={handleAddressChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
              <input
                type="text"
                name="postalCode"
                placeholder="Postal Code"
                value={address.postalCode}
                onChange={handleAddressChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>

          

          {/* Redeem Coins */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold mb-4 text-gray-900">Redeem Coins & Referral</h2>
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    {/* Coins input */}
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={Math.min(availableCoins, discountedTotal)}
        value={redeemCoins}
        onChange={(e) => {
          const v = Number(e.target.value || 0);
          setRedeemCoins(Math.max(0, Math.min(v, availableCoins, discountedTotal)));
        }}
        className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
      />
      <span className="text-sm text-gray-600">
        Available: <b>{availableCoins}</b>
      </span>
    </div>

    {/* Referral input */}
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Referral Code"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 w-40 focus:ring-2 focus:ring-black outline-none"
      />
      <button
        onClick={applyReferral}
        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition"
      >
        Apply
      </button>
    </div>
  </div>
  {referralDiscount > 0 && (
    <p className="text-sm text-green-700 mt-2">
      Referral applied ({referralDiscount * 100}% off)
    </p>
  )}
</div>

        </div>

        {/* RIGHT: Order Summary + Payments */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Order Summary</h2>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-sm">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        Qty: {item.quantity}
                        {item.selectedSize ? ` • Size: ${item.selectedSize}` : ""}
                        {item.selectedColor ? ` • Color: ${item.selectedColor}` : ""}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatINR((item.price || 0) * (item.quantity || 0))}</div>
                  </div>
                ))}

                <div className="border-t my-3" />

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount {discountRate ? `(${Math.round(discountRate * 100)}%)` : ""}</span>
                  <span className={discountAmount ? "text-green-700 font-medium" : ""}>
                    − {formatINR(discountAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>After Discount</span>
                  
                  <span>{formatINR(discountedTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
  <span>Referral Discount</span>
  <span className="text-green-700 font-medium">
    − {formatINR(referralAmount)}
  </span>
</div>

                
                <div className="flex justify-between text-sm">
                  <span>Coins Redeemed</span>
                  <span className={effectiveRedeem ? "text-green-700 font-medium" : ""}>
                    − {formatINR(effectiveRedeem)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Payable</span>
                  <span>{formatINR(payableAmount)}</span>
                </div>

                {/* Payment Actions */}
                <div className="space-y-3 mt-4">
                  {/* Online Payment Option */}
                  <button
                    onClick={handleOnlinePayment}
                    disabled={!isFormValid || !token}
                    className={`w-full group relative overflow-hidden bg-gray-900 text-white font-medium py-4 px-6 rounded-lg transition-all ${
                      !isFormValid || !token
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-800 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">Pay Online</p>
                          <p className="text-xs text-gray-300">Secure payment via Razorpay</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatINR(payableAmount)}</p>
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {/* COD Option */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!isFormValid || !token}
                    className={`w-full group bg-white border-2 border-gray-300 text-gray-900 font-medium py-4 px-6 rounded-lg transition-all ${
                      !isFormValid || !token
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-gray-900 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-900 transition-colors">
                          <svg
                            className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">Cash on Delivery</p>
                          <p className="text-xs text-gray-500">Pay at your doorstep</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatINR(payableAmount)}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
