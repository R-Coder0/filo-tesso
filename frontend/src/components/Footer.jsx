import React from "react";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logowhite.png";
import { CATEGORY_LINKS_BY_GENDER } from "../utils/navigationCategories";

export default function Footer({ showSeoContent = false }) {
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

  const policyLinks = [
    { label: "Terms Of Use", to: "/consumer-policies/terms-and-conditions" },
    { label: "Security", to: "/consumer-policies/security" },
    { label: "Privacy", to: "/consumer-policies/privacy" },
    { label: "Returns & Refund", to: "/consumer-policies/return-and-refund" },
    { label: "Cancellation & Returns", to: "/help/cancellation-and-returns" },
  ];

  const faqs = [
    {
      question: "What makes Filo Teso different from other streetwear brands in India?",
      answer:
        "Filo Teso focuses on premium-quality fabrics, original graphic designs, comfortable oversized fits, and clothing designed for everyday wear rather than short-term trends.",
    },
    {
      question: "Do you offer oversized T-shirts?",
      answer:
        "Yes. Oversized T-shirts are a key part of our collection and are designed to deliver both comfort and a modern streetwear aesthetic.",
    },
    {
      question: "Are your graphic tees made with quality materials?",
      answer:
        "Yes. We use carefully selected fabrics and focus on quality craftsmanship to ensure comfort, durability, and long-lasting wear.",
    },
    {
      question: "Can I style Filo Teso clothing for everyday outfits?",
      answer:
        "Absolutely. Our oversized T-shirts and graphic tees pair well with cargos, denim, joggers, shorts, and other casual wardrobe essentials.",
    },
    {
      question: "Do you deliver across India?",
      answer:
        "Yes. We offer delivery across India so customers can enjoy Filo Teso products wherever they are.",
    },
  ];

  return (
    <footer className="w-full bg-black text-[14px] text-gray-300">
      <div className="max-w-[1700px] mx-auto grid grid-cols-1 gap-9 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-10 sm:grid-cols-2 lg:grid-cols-5 ">
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
            Men Category
          </h3>

          <ul className="mt-4 space-y-2.5">
            <li>
              <Link
                to="/products/men"
                className="font-medium text-white hover:underline"
              >
                All Men
              </Link>
            </li>
            {CATEGORY_LINKS_BY_GENDER.men.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
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
            Women Category
          </h3>

          <ul className="mt-4 space-y-2.5">
            <li>
              <Link
                to="/products/women"
                className="font-medium text-white hover:underline"
              >
                All Women
              </Link>
            </li>
            {CATEGORY_LINKS_BY_GENDER.women.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
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
              href="mailto:support@filoteso.co.in"
              className="flex items-center gap-3 font-medium text-white hover:underline"
            >
              <Mail className="h-4 w-4 text-gray-500" />
              support@filoteso.co.in
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

      {/* Long-form homepage content intentionally stays off inner pages. */}
      {showSeoContent && (
        <section className="mx-auto max-w-[1700px] border-b border-gray-800 px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-9 leading-7 text-gray-400">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                Premium Streetwear Clothing Brand in India
              </h1>
              <div className="mt-4 space-y-4">
                <p>Welcome to Filo Teso.</p>
                <p>
                  We didn't start Filo Teso to chase fashion trends. We started
                  it because we wanted clothing that felt good, looked different,
                  and stayed relevant long after the hype faded.
                </p>
                <p>
                  Like most people, we've bought T-shirts that looked amazing
                  online but felt disappointing once they arrived. Sometimes the
                  quality wasn't there. Sometimes the fit felt off. And sometimes
                  the design looked exactly like everything else already
                  available.
                </p>
                <p>That experience pushed us to create something different.</p>
                <p>
                  Today, Filo Teso is a growing streetwear clothing brand in India
                  focused on premium quality, original design, and everyday
                  comfort. From oversized T-shirts and graphic tees to modern
                  wardrobe essentials, every piece is created with the belief that
                  fashion should feel personal.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Why Choose Filo Teso?
              </h2>
              <div className="mt-4 grid gap-5 lg:grid-cols-3">
                <article className="rounded-2xl border border-gray-800 p-5">
                  <h3 className="font-semibold text-white">
                    Premium Quality That Lasts
                  </h3>
                  <div className="mt-2 space-y-3">
                    <p>Good clothing shouldn't stop feeling good after a few washes.</p>
                    <p>
                      That's why quality remains one of the most important parts
                      of everything we create. From fabric selection to final
                      production, we focus on the details that make a difference
                      over time.
                    </p>
                    <p>
                      Our goal is simple: create clothing that you'll still enjoy
                      wearing months from now, not just on the day it arrives.
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl border border-gray-800 p-5">
                  <h3 className="font-semibold text-white">
                    Original Graphic Designs
                  </h3>
                  <div className="mt-2 space-y-3">
                    <p>Streetwear has always been about self-expression.</p>
                    <p>
                      Some graphics catch your attention for a moment. Others stay
                      with you.
                    </p>
                    <p>
                      At Filo Teso, we focus on creating original designs that feel
                      authentic, wearable, and meaningful. Instead of following
                      every trend, we prefer creating graphics that people
                      genuinely connect with.
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl border border-gray-800 p-5">
                  <h3 className="font-semibold text-white">
                    Comfortable Oversized Fits
                  </h3>
                  <div className="mt-2 space-y-3">
                    <p>
                      A great oversized T-shirt is about more than just a larger
                      size.
                    </p>
                    <p>The fit, proportions, fabric, and overall feel all matter.</p>
                    <p>
                      Our oversized styles are designed to offer comfort without
                      compromising on appearance. Whether paired with cargos,
                      denim, joggers, or shorts, they are built to fit naturally
                      into everyday life.
                    </p>
                  </div>
                </article>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Modern Streetwear Designed for Everyday Life
              </h2>
              <div className="mt-3 space-y-4">
                <p>Streetwear has evolved far beyond a fashion trend.</p>
                <p>
                  Today, it's a reflection of creativity, confidence, and
                  individuality.
                </p>
                <p>
                  For some people, that means clean and minimal outfits. For
                  others, it's bold graphics and statement pieces. Most of us move
                  between both depending on the day.
                </p>
                <p>
                  That's why our collections are designed to be versatile. Whether
                  you're heading to college, meeting friends, travelling, working
                  on creative projects, or simply enjoying a relaxed weekend, our
                  pieces are made to fit seamlessly into your lifestyle.
                </p>
                <p>
                  As a premium streetwear brand India customers continue to
                  discover, our focus remains on creating clothing that feels
                  effortless to wear while maintaining a distinct identity.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Graphic Tees Made for Everyday Wear
              </h2>
              <div className="mt-3 space-y-4">
                <p>
                  Graphic T-shirts have become one of the defining elements of
                  modern streetwear fashion.
                </p>
                <p>The reason is simple.</p>
                <p>
                  They're versatile, comfortable, and allow people to express
                  themselves without overcomplicating their style.
                </p>
                <p>
                  Our collection of graphic tees combines creative design with
                  everyday wearability. Each piece is created to work effortlessly
                  with the rest of your wardrobe while still bringing its own
                  personality.
                </p>
                <p>
                  Whether styled with denim, cargos, joggers, or layered under
                  jackets, Filo Teso graphic tees are designed to become the pieces
                  you reach for again and again.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Streetwear That Feels Personal
              </h2>
              <div className="mt-3 space-y-4">
                <p>
                  One thing we've learned is that no two people wear streetwear the
                  same way.
                </p>
                <p>Some people prefer subtle styles.</p>
                <p>Others enjoy standing out.</p>
                <p>Neither approach is right or wrong.</p>
                <p>That's what makes streetwear culture so interesting.</p>
                <p>
                  At its core, it's about freedom of expression and creating your
                  own identity rather than following someone else's.
                </p>
                <p>That's the philosophy behind every Filo Teso collection.</p>
                <p>We're not here to tell people how they should dress.</p>
                <p>
                  We're here to create clothing that helps them feel comfortable,
                  confident, and authentic in their own way.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Built for the Long Run
              </h2>
              <div className="mt-3 space-y-4">
                <p>Fashion trends will continue to change.</p>
                <p>New styles will appear. Others will disappear.</p>
                <p>
                  What won't change is our commitment to quality, creativity, and
                  comfort.
                </p>
                <p>
                  As Filo Teso continues to grow, we'll keep focusing on what
                  matters most—creating premium streetwear that people genuinely
                  enjoy wearing.
                </p>
                <p>
                  Explore our latest collection and discover oversized T-shirts,
                  graphic tees, and modern streetwear designed for everyday life.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Frequently Asked Questions
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {faqs.map((faq) => (
                  <article
                    key={faq.question}
                    className="rounded-2xl border border-gray-800 p-5"
                  >
                    <h3 className="font-semibold text-white">{faq.question}</h3>
                    <p className="mt-2">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
