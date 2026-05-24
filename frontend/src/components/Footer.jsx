import React from "react";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logowhite.png";

export default function Footer() {
  const quickLinks = [
    { label: "Contact Us", to: "/contact" },
    {
      label: "Help Center",
      to: "https://wa.me/916307694248?text=Hello%20I%20need%20Help",
      external: true,
    },
    { label: "Collaboration", to: "/collabration" },
    { label: "Payments", to: "/help/payments" },
    { label: "Shipping", to: "/help/shipping" },
    { label: "FAQ", to: "/help/faqs" },
  ];

  const categoryLinks = [
    { label: "Men", to: "/products/men" },
    { label: "Women", to: "/products/women" },
    { label: "Customize", to: "/products/customize" },
    { label: "All Products", to: "/products" },
  ];

  const policyLinks = [
    { label: "Terms Of Use", to: "/consumer-policies/terms-and-conditions" },
    { label: "Security", to: "/consumer-policies/security" },
    { label: "Privacy", to: "/consumer-policies/privacy" },
    { label: "Returns & Refund", to: "/consumer-policies/return-and-refund" },
    { label: "Cancellation & Returns", to: "/help/cancellation-and-returns" },
  ];

  return (
    <footer className="w-full bg-black text-[14px] text-gray-300">
      <div className="container mx-auto grid grid-cols-1 gap-9 border-b border-gray-800 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center">
            <img
              src={logoImg}
              alt="Filo Teso"
              className="h-14 w-autoobject-contain"
            />
          </Link>
          <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
            About
          </h3>
          <p className="mt-3 leading-relaxed text-gray-300">
            Filo Teso brings everyday fashion, custom wear, and curated styles
            together with a simple shopping experience.
          </p>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">
            Category
          </h3>
          <ul className="mt-4 space-y-2.5">
            {categoryLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="font-medium text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">
            Policies
          </h3>
          <ul className="mt-4 space-y-2.5">
            {policyLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="font-medium text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">
            Contact Details
          </h3>
          <div className="mt-4 space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
              <p className="leading-relaxed">Okhla, New Delhi, India</p>
            </div>
            <a
              href="tel:+919310966458"
              className="flex items-center gap-3 font-medium text-white hover:underline"
            >
              <Phone className="h-4 w-4 text-gray-500" />
              +91 9310966458
            </a>
            <a
              href="mailto:filoteso.rk@gmail.com"
              className="flex items-center gap-3 font-medium text-white hover:underline"
            >
              <Mail className="h-4 w-4 text-gray-500" />
              filoteso.rk@gmail.com
            </a>
          </div>

          <div className="mt-5">
            <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gray-400">
              Social
            </h4>
            <a
              href="https://www.instagram.com/filoteso.co.in/?hl=en"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-300 transition hover:border-white hover:text-white"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto border-b border-gray-800 px-6 py-4">
        <h3 className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-gray-400 md:text-left">
          Quick Links
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
          {quickLinks.map((link) =>
            link.external ? (
              <a
                key={link.to}
                href={link.to}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-white hover:underline"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className="font-medium text-white hover:underline"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-3">
        <div className="flex flex-col items-center justify-between gap-3 text-[13px] text-gray-400 md:flex-row">
          <p className="text-gray-400">
            © 2026{" "}
            <span className="font-medium text-white">
              Filo Teso | All rights are reserved.
            </span>
          </p>

          <div className="flex items-center justify-center gap-2 md:justify-end">
            <img src="/payment.svg" alt="payments" className="h-5 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}
