import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);

const getLineItemTotal = (item) => {
  const quantity = Number(item?.quantity || 0);
  const unitPrice = Number(
    item?.priceAtPurchase ?? item?.price?.sale ?? item?.price ?? 0
  );
  return unitPrice * quantity;
};

const OrderConfirmationPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (!state?.orderId) {
      navigate("/"); // redirect to home if no data
    } else {
      setOrderDetails(state);
    }
  }, [state, navigate]);

  if (!orderDetails) return <div>Loading...</div>;

  const {
    orderId,
    paymentStatus,
    cartItems = [],
    subtotal,
    discountRate,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
    address,
    payableAmount,
  } = orderDetails;

  const isPaid = Boolean(paymentStatus);
  const paymentMethod = isPaid ? "Online Payment" : "Cash on Delivery";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <FaCheckCircle className="text-green-500 text-6xl mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 text-center">
            Thank you for your purchase! Your order has been successfully placed.
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-semibold text-gray-900">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold text-gray-900">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span
                className={`font-semibold ${
                  isPaid ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {isPaid ? "Paid" : "Pending (COD)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                {formatINR(subtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount{" "}
                  {discountRate
                    ? `(${Math.round(discountRate * 100)}%)`
                    : ""}
                </span>
                <span>- {formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable value:</span>
              <span className="font-semibold text-gray-900">
                {formatINR(taxableAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IGST (5%, included):</span>
              <span className="font-semibold text-gray-900">
                {formatINR(taxAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
              <span className="text-lg font-semibold text-gray-900">
                Total Payable:
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatINR(payableAmount || totalAmount)}
              </span>
            </div>
          </div>

        </div>

        {/* Ordered Items */}
        {cartItems?.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Items in Your Order
            </h2>
            <div className="divide-y divide-gray-200">
              {cartItems.map((item, index) => (
                <div key={index} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                      {item.selectedSize && ` | Size: ${item.selectedSize}`}
                      {item.selectedColor && ` | Color: ${item.selectedColor}`}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatINR(getLineItemTotal(item))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Shipping Address
          </h2>
          <div className="space-y-1 text-gray-700 text-sm">
            <p>
              <span className="font-semibold">Name: </span>
              {address?.name}
            </p>
            <p>
              <span className="font-semibold">Phone: </span>
              {address?.phone}
            </p>
            {address?.email && (
              <p>
                <span className="font-semibold">Email: </span>
                {address?.email}
              </p>
            )}
            <p>
              <span className="font-semibold">Address: </span>
              {address?.street}, {address?.city}, {address?.state} -{" "}
              {address?.postalCode}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
