// src/pages/CheckoutPage.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

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

const getStoredCheckoutState = () => {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(sessionStorage.getItem("checkoutState"));
  } catch {
    return null;
  }
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const loadShiprocketCheckout = (sellerDomain) =>
  new Promise((resolve, reject) => {
    let domainInput = document.getElementById("sellerDomain");
    if (!domainInput) {
      domainInput = document.createElement("input");
      domainInput.type = "hidden";
      domainInput.id = "sellerDomain";
      document.body.appendChild(domainInput);
    }
    domainInput.value = sellerDomain;

    if (!document.getElementById("shiprocket-checkout-styles")) {
      const stylesheet = document.createElement("link");
      stylesheet.id = "shiprocket-checkout-styles";
      stylesheet.rel = "stylesheet";
      stylesheet.href =
        "https://checkout-ui.shiprocket.com/assets/styles/shopify.css";
      document.head.appendChild(stylesheet);
    }

    if (window.HeadlessCheckout) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      "shiprocket-checkout-script"
    );
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Shiprocket Checkout SDK failed to load")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "shiprocket-checkout-script";
    script.src =
      "https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js";
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Shiprocket Checkout SDK failed to load"));
    document.body.appendChild(script);
  });

/* -----------------------------
   MAIN COMPONENT
------------------------------*/
const CheckoutPage = () => {
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const nativeCheckout =
    new URLSearchParams(location.search).get("native") === "1";
  const autoLaunchAttempted = useRef(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const checkoutState = state || getStoredCheckoutState();

  // cart/price data passed from cart sidebar
  const {
    cartItems: initialCartItems,
    subtotal: initialSubtotal,
    customUploads, // { isCustomize, singleFile }
  } = checkoutState || {
    cartItems: [],
    subtotal: 0,
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

  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [firstOrderDiscount, setFirstOrderDiscount] = useState({
    enabled: false,
    eligible: false,
    percentage: 15,
  });
  const [shiprocketOpening, setShiprocketOpening] = useState(false);
  const [shiprocketError, setShiprocketError] = useState("");


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

  useEffect(() => {
    if (!state?.cartItems?.length) return;

    const serializableState = {
      cartItems: state.cartItems,
      subtotal: state.subtotal,
      customUploads: state.customUploads
        ? {
            isCustomize: state.customUploads.isCustomize,
            selectedSide: state.customUploads.selectedSide,
          }
        : null,
    };
    sessionStorage.setItem("checkoutState", JSON.stringify(serializableState));
  }, [state]);

  // Load saved addresses from localStorage
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("savedAddresses")) || [];
      setSavedAddresses(list);
    } catch {
      setSavedAddresses([]);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchFirstOrderDiscount = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/orders/first-order-discount`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFirstOrderDiscount({
          enabled: Boolean(data.enabled),
          eligible: Boolean(data.eligible),
          percentage: Number(data.percentage || 15),
        });
      } catch {
        setFirstOrderDiscount((setting) => ({
          ...setting,
          enabled: false,
          eligible: false,
        }));
      }
    };

    fetchFirstOrderDiscount();
  }, [apiUrl, token]);

  /* -----------------------------
     PRICING
  ------------------------------*/
  const { subtotal, discountRate, discountAmount, discountedTotal } = useMemo(() => {
    const totals = (cartItems || []).reduce(
      (acc, item) => {
        const quantity = Number(item.quantity || 0);
        const salePrice = Number(item.price?.sale ?? item.price ?? 0);
        const originalPrice = Number(item.price?.original ?? salePrice);

        acc.saleTotal += salePrice * quantity;
        acc.originalTotal += Math.max(originalPrice, salePrice) * quantity;
        return acc;
      },
      { originalTotal: 0, saleTotal: 0 }
    );

    const saleTotal = totals.saleTotal || Number(initialSubtotal || 0);
    const originalTotal = totals.originalTotal || saleTotal;
    const productDiscount = Math.max(0, originalTotal - saleTotal);

    return {
      subtotal: originalTotal,
      discountRate: 0,
      discountAmount: productDiscount,
      discountedTotal: saleTotal,
    };
  }, [cartItems, initialSubtotal]);

  const saleDiscount = discountAmount;
  const firstOrderDiscountRate =
    firstOrderDiscount.enabled && firstOrderDiscount.eligible
      ? firstOrderDiscount.percentage / 100
      : 0;
  const firstOrderDiscountAmount = Math.floor(discountedTotal * firstOrderDiscountRate);
  const totalAfterFirstOrderDiscount = Math.max(0, discountedTotal - firstOrderDiscountAmount);

  // Referral discount calculations
  const referralAmount = Math.floor(totalAfterFirstOrderDiscount * referralDiscount);
  const finalAfterReferral = totalAfterFirstOrderDiscount - referralAmount;
  const payableAmount = Math.max(0, finalAfterReferral);

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
      toast.success(`Referral code applied! You got ${REFERRAL_CODES[code] * 100}% off.`);
    } else {
      setReferralDiscount(0);
      toast.error("Invalid referral code.");
    }
  };


  const updateQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === productId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(Number(item.stock || Infinity), (item.quantity || 1) + delta)
              ),
            }
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

  const openShiprocketCheckout = async (event) => {
    event?.preventDefault?.();
    if (!token) return toast.error("Please login to place order.");
    if (!cartItems.length) return toast.error("Your cart is empty.");

    setShiprocketOpening(true);
    setShiprocketError("");

    try {
      const { data } = await axios.post(
        `${apiUrl}/api/payment/shiprocket-checkout/token`,
        { cartItems },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadShiprocketCheckout(data.sellerDomain);
      if (!window.HeadlessCheckout?.addToCart) {
        throw new Error("Shiprocket Checkout is not available");
      }

      window.HeadlessCheckout.addToCart(
        event || { preventDefault() {} },
        data.token,
        {
          fallbackUrl: `${window.location.origin}/checkout?native=1`,
        }
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Shiprocket Checkout could not be opened.";
      console.error("Shiprocket Checkout failed:", error);
      setShiprocketError(message);
      toast.error(message);
    } finally {
      setShiprocketOpening(false);
    }
  };

  useEffect(() => {
    if (
      nativeCheckout ||
      autoLaunchAttempted.current ||
      !token ||
      !cartItems.length
    ) {
      return;
    }

    autoLaunchAttempted.current = true;
    openShiprocketCheckout();
  }, [nativeCheckout, token, cartItems.length]);

  /* -----------------------------
     COD FLOW
  ------------------------------*/
  const handlePlaceOrder = async () => {
    if (!token) return toast.error("Please login to place order.");
    if (!isFormValid) return toast.error("Please fill in all required fields.");

    try {
      const form = new FormData();

      const products = cartItems.map((item) => ({
        product: item._id,
        quantity: item.quantity,
        selectedSize: item.selectedSize || "",
        selectedColor: item.selectedColor || "",
      }));

      form.append("products", JSON.stringify(products));
      form.append("discountRate", String(discountRate));
      form.append("discountedTotal", String(discountedTotal));
      form.append("payableAmount", String(payableAmount));
      form.append("address", JSON.stringify(address));

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

      const order = data.order || data;

      const orderDetails = {
        orderId: order.orderNumber || order._id || "COD" + Date.now(),
        paymentStatus: order.paymentStatus === "Paid",
        cartItems,
        subtotal,
        discountRate,
        discountAmount,
        totalAmount: discountedTotal,
        firstOrderDiscountRate: order.firstOrderDiscountRate ?? firstOrderDiscountRate,
        firstOrderDiscountAmount: order.firstOrderDiscountAmount ?? firstOrderDiscountAmount,
        address,
        payableAmount: order.payableAmount ?? payableAmount,
      };

      navigate("/order-confirmation", { state: orderDetails });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to place order. Please try again.");
    }
  };

  /* -----------------------------
     RAZORPAY FLOW
  ------------------------------*/
  const handleOnlinePayment = async () => {
    if (!token) return toast.error("Please login to place order.");
    if (!isFormValid) return toast.error("Please fill in all required fields.");

    const res = await loadRazorpayScript();
    if (!res) return toast.error("Razorpay SDK failed to load. Check your connection.");

    try {
      // create order on server
      const response = await axios.post(
        `${apiUrl}/api/payment/create-order`,
        {
          cartItems,
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
        name: "Filoteso",
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
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const out = verifyRes?.data || {};
            const finalOrder = out.order || out;
            const orderDetails = {
              orderId: finalOrder.orderNumber || finalOrder._id || order.id,
              paymentStatus: true,
              cartItems,
              subtotal,
              discountRate,
              discountAmount,
              totalAmount: discountedTotal,
              firstOrderDiscountRate: finalOrder.firstOrderDiscountRate ?? firstOrderDiscountRate,
              firstOrderDiscountAmount: finalOrder.firstOrderDiscountAmount ?? firstOrderDiscountAmount,
              address,
              payableAmount,
            };

            navigate("/order-confirmation", { state: orderDetails });
          } catch (err) {
            console.error(err);
            toast.error("Payment verified but order creation failed. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response?.error);
        toast.error(response?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Payment initialization failed.");
    }
  };

  /* -----------------------------
     RENDER
  ------------------------------*/
  if (!nativeCheckout) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-[#f8f7fb] to-white px-4 py-16">
        <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-[#e7e3f2] bg-white shadow-[0_24px_80px_rgba(42,28,77,0.12)]">
          <div className="bg-gradient-to-r from-[#5f3dc4] via-[#7253d6] to-[#8b6de9] px-8 py-10 text-white">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
              Filo Teso
            </p>
            <h1 className="text-3xl font-semibold">Shiprocket Checkout</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              Secure one-click checkout with saved addresses, UPI, cards and
              Cash on Delivery.
            </p>
          </div>

          <div className="px-8 py-9">
            <div className="mb-7 flex items-center justify-between rounded-2xl bg-[#f7f5fc] px-5 py-4">
              <div>
                <p className="text-sm text-gray-500">Order total</p>
                <p className="mt-1 text-2xl font-semibold text-gray-950">
                  {formatINR(payableAmount)}
                </p>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#6546c7] shadow-sm">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </div>
            </div>

            {shiprocketError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {shiprocketError}
              </div>
            )}

            <button
              type="button"
              onClick={openShiprocketCheckout}
              disabled={shiprocketOpening || !token}
              className="w-full rounded-xl bg-[#6546c7] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[#6546c7]/20 transition hover:bg-[#583bb5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {shiprocketOpening
                ? "Opening Shiprocket Checkout..."
                : "Continue with Shiprocket Checkout"}
            </button>

            <p className="mt-4 text-center text-xs text-gray-500">
              Powered by Shiprocket Checkout
            </p>

            {shiprocketError && (
              <button
                type="button"
                onClick={() =>
                  navigate("/checkout?native=1", { state: checkoutState })
                }
                className="mt-4 w-full text-sm font-medium text-gray-600 underline underline-offset-4"
              >
                Use fallback checkout
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-8">
        {/* LEFT: Address + Upload + Referral */}
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
                      className={`border rounded-lg p-4 cursor-pointer transition ${checked ? "border-black bg-gray-50" : "border-gray-300"
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



          {/* Referral */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Referral Code</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                      {Number(item.stock || 0) <= 0 && (
                        <div className="mt-1 text-xs font-semibold text-red-600">
                          Out of stock
                        </div>
                      )}
                      {Number(item.stock || 0) > 0 && item.quantity >= item.stock && (
                        <div className="mt-1 text-xs font-semibold text-orange-600">
                          Only {item.stock} available
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-semibold">{formatINR((item.price?.sale || 0) * (item.quantity || 0))}</div>
                  </div>
                ))}

                <div className="border-t my-3" />

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Product Discount</span>
                  <span className="text-green-700 font-medium">
                    − {formatINR(saleDiscount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>After Discount</span>

                  <span>{formatINR(discountedTotal)}</span>
                </div>
                {firstOrderDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>First Order Discount ({firstOrderDiscount.percentage}%)</span>
                    <span className="text-green-700 font-medium">
                      − {formatINR(firstOrderDiscountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Referral Discount</span>
                  <span className="text-green-700 font-medium">
                    − {formatINR(referralAmount)}
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
                    className={`w-full group relative overflow-hidden bg-gray-900 text-white font-medium py-4 px-6 rounded-lg transition-all ${!isFormValid || !token
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

                  {/* COD temporarily hidden */}
                  {/* Divider
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  COD Option
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!isFormValid || !token}
                    className={`w-full group bg-white border-2 border-gray-300 text-gray-900 font-medium py-4 px-6 rounded-lg transition-all ${!isFormValid || !token
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
                  */}
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
