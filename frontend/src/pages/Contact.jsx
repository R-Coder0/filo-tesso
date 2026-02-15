import React from "react";
import { Link } from "react-router-dom";

export default function ContactPage() {
  const phoneDisplay = "+91 6307694248";
  const phoneDial = "+916307694248";
  const email = "filoteso.rk@gmail.com";
  const instagram =
    "https://www.instagram.com/filoteso.co.in?igsh=MTZweGhoOGxxemtuZw%3D%3D&utm_source=qr";

  const waText = "Hi Filo Teso, I need help with my order.";
  const waLink = `https://wa.me/916307694248?text=${encodeURIComponent(waText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="text-sm text-gray-600">
          Need help with an order, delivery, payment, or returns? Reach out using any option below.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contact card */}
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Customer Support</h2>

          <div className="mt-4 space-y-4 text-sm text-gray-700">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Email</div>
              <Link to={`mailto:${email}`} className="font-semibold text-gray-900 hover:underline">
                {email}
              </Link>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Phone</div>
              <Link to={`tel:${phoneDial}`} className="font-semibold text-gray-900 hover:underline">
                {phoneDisplay}
              </Link>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-xs text-gray-500">WhatsApp</div>
              <Link
                to={waLink}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gray-900 hover:underline"
              >
                Chat on WhatsApp
              </Link>
              <div className="mt-1 text-xs text-gray-500">
                Fastest support for order-related queries.
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Instagram</div>
              <Link
                to={instagram}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gray-900 hover:underline"
              >
                @filoteso.co.in
              </Link>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Tip: Please keep your <span className="font-semibold">Order ID / Order Code</span> handy for faster support.
          </div>
        </div>

        {/* Quick help card */}
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Quick Help</h2>
          <p className="mt-2 text-sm text-gray-600">
            You may find answers quickly in these pages:
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to="/help/payments"
              className="rounded-2xl border p-4 hover:bg-gray-50"
            >
              <div className="text-sm font-semibold text-gray-900">Payments</div>
              <div className="mt-1 text-xs text-gray-500">UPI, Cards, COD, failed payments</div>
            </Link>

            <Link
              to="/help/shipping"
              className="rounded-2xl border p-4 hover:bg-gray-50"
            >
              <div className="text-sm font-semibold text-gray-900">Shipping</div>
              <div className="mt-1 text-xs text-gray-500">Delivery timelines, tracking</div>
            </Link>

            <Link
              to="/help/cancellation-and-returns"
              className="rounded-2xl border p-4 hover:bg-gray-50"
            >
              <div className="text-sm font-semibold text-gray-900">Cancellation & Returns</div>
              <div className="mt-1 text-xs text-gray-500">Return eligibility, refunds</div>
            </Link>

            <Link
              to="/help/faqs"
              className="rounded-2xl border p-4 hover:bg-gray-50"
            >
              <div className="text-sm font-semibold text-gray-900">FAQ</div>
              <div className="mt-1 text-xs text-gray-500">Common questions</div>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Support Hours</div>
            <div className="mt-1 text-xs text-gray-600">
              Monday to Saturday (working days) • 10:00 AM – 6:00 PM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}