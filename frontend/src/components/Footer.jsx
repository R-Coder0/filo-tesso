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
    { label: "All Products", to: "/products" },
  ];

  const policyLinks = [
    { label: "Terms Of Use", to: "/consumer-policies/terms-and-conditions" },
    { label: "Security", to: "/consumer-policies/security" },
    { label: "Privacy", to: "/consumer-policies/privacy" },
    { label: "Returns & Refund", to: "/consumer-policies/return-and-refund" },
    { label: "Cancellation & Returns", to: "/help/cancellation-and-returns" },
  ];

  const faqs = [
    {
      question: "What distinguishes Filo Teso from other streetwear companies?",
      answer:
        "Filo Teso combines premium quality, modern design, and comfortable fits to create apparel that stands out while remaining practical for everyday wear.",
    },
    {
      question: "Do you offer oversized T-shirts?",
      answer:
        "Yes, our collection includes oversized styles designed for comfort, versatility, and modern streetwear fashion.",
    },
    {
      question: "Are your graphic tees made with quality materials?",
      answer:
        "We focus on premium fabrics and quality craftsmanship to ensure comfort, durability, and long-lasting value.",
    },
    {
      question: "Do you deliver across India?",
      answer:
        "Yes, we provide delivery services across India so customers can enjoy our products wherever they are.",
    },
    {
      question: "Will more products be added in the future?",
      answer:
        "Absolutely. We plan to expand our collections with new categories, styles, and fashion essentials.",
    },
    {
      question: "Why choose a premium streetwear brand?",
      answer:
        "Premium streetwear offers better quality, unique designs, enhanced comfort, and greater value compared to standard fashion products.",
    },
  ];

  return (
    <footer className="w-full bg-black text-[14px] text-gray-300">
      <div className="max-w-[1700px] mx-auto grid grid-cols-1 gap-9 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-10 sm:grid-cols-2 lg:grid-cols-4 ">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center">
            <img
              src={logoImg}
              alt="Filo Teso"
              className="h-14 w-auto object-contain"
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
                <Link
                  to={link.to}
                  className="font-medium text-white hover:underline"
                >
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
                <Link
                  to={link.to}
                  className="font-medium text-white hover:underline"
                >
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

      <div className="max-w-[1700px] mx-auto border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
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

      {/* SEO Content Section */}
      <div className="max-w-[1700px] mx-auto border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              Premium Streetwear Brand in India for Bold Everyday Style
            </h1>

            <div className="mt-4 space-y-4 leading-7 text-gray-400">
              <p>
                Welcome to Filo Teso, a premium streetwear clothing brand in
                India created for individuals who value originality, confidence,
                and self-expression. As a growing streetwear clothing brand
                India shoppers can trust, we focus on delivering fashion that
                combines premium quality, contemporary design, and everyday
                comfort. Our collections are inspired by modern street culture
                and designed for people who want their clothing to reflect their
                personality.
              </p>

              <p>
                At Filo Teso, we believe fashion should be more than just
                apparel. It should help you stand out, feel confident, and
                express your unique identity. Whether you're exploring graphic
                tees, oversized fits, or future fashion collections, our goal is
                to build a streetwear clothing brand India customers proudly
                choose for quality and style.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Explore Our Streetwear Collection
            </h3>

            <div className="mt-3 space-y-4 leading-7 text-gray-400">
              <p>
                Our collection is designed for those who appreciate modern
                fashion, artistic expression, and premium craftsmanship. Every
                product is meticulously designed to ensure that comfort and style
                complement one another.
              </p>

              <p>
                As a premium streetwear brand India fashion enthusiasts can rely
                on, we focus on creating apparel that fits effortlessly into
                modern lifestyles. From bold graphic designs to relaxed
                silhouettes, our pieces are made to help you create versatile
                looks for every occasion.
              </p>

              <p>
                Whether you prefer minimal aesthetics or statement-making
                designs, Filo Teso offers streetwear clothing that allows you to
                express your individuality while maintaining comfort throughout
                the day.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Why Choose Filo Teso
            </h3>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Premium Quality You Can Feel
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  The foundation of everything we produce is quality. Our
                  garments are designed using carefully selected fabrics that
                  offer comfort, durability, and a premium feel. Every product
                  reflects our commitment to becoming a trusted streetwear
                  clothing brand India customers can depend on for lasting
                  quality.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Unique Graphic Designs
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  Our graphic tees are inspired by creativity, culture, and
                  modern fashion. Rather than following trends blindly, we focus
                  on creating distinctive designs that help our customers stand
                  out. Every piece is crafted to offer a balance of originality
                  and versatility.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Comfort Meets Contemporary Fashion
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  Modern fashion should never sacrifice comfort. Our oversized
                  fits and carefully designed silhouettes are created to provide
                  freedom of movement while maintaining a stylish and
                  contemporary appearance. This approach helps us strengthen our
                  position as a leading streetwear clothing brand India shoppers
                  can connect with.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Fashion Built Around Individuality
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  Streetwear is about self-expression. We design clothes for
                  those who wish to express their self-assurance and genuineness
                  via their fashion choices. Every collection is designed with
                  the belief that fashion should empower people to be
                  themselves.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Premium Graphic Tees Designed for Everyday Wear
            </h3>

            <div className="mt-3 space-y-4 leading-7 text-gray-400">
              <p>
                Graphic tees have become one of the most important elements of
                modern streetwear fashion India consumers love. They offer a
                simple yet powerful way to express personality while maintaining
                versatility and comfort.
              </p>

              <p>
                At Filo Teso, our graphic tees are designed to combine artistic
                creativity with premium craftsmanship. Whether styled with
                denim, cargo pants, joggers, or layered with jackets, they help
                create looks that feel effortless and modern.
              </p>

              <p>
                As our product range continues to grow, we remain committed to
                building a streetwear clothing brand India customers recognize
                for quality, originality, and innovation. Every new collection
                will continue to reflect our dedication to premium fashion and
                contemporary design.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Streetwear Fashion That Reflects Your Individuality
            </h3>

            <div className="mt-3 space-y-4 leading-7 text-gray-400">
              <p>
                Streetwear has evolved into a global movement that celebrates
                creativity, confidence, and personal style. At Filo Teso, we
                embrace this culture by creating apparel that encourages
                self-expression and individuality.
              </p>

              <p>
                Our vision is to establish a premium streetwear clothing brand
                India fashion enthusiasts turn to for unique designs,
                exceptional quality, and long-term value. We are committed to
                continuously expanding our collections while maintaining the
                standards that define our brand.
              </p>

              <p>
                As we introduce new categories, styles, and fashion essentials,
                our focus will remain on delivering clothing that helps people
                express themselves with confidence. Through innovation, quality,
                and creativity, Filo Teso aims to become a recognized
                streetwear clothing brand India shoppers associate with
                authenticity and modern fashion.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Frequently Asked Questions
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-gray-800 p-5"
                >
                  <h4 className="font-semibold text-white">{faq.question}</h4>
                  <p className="mt-2 leading-7 text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
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