import React from "react";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logowhite.png";
import { CATEGORY_LINKS_BY_GENDER } from "../utils/navigationCategories";

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

      {/* SEO Content Section */}
      <div className="max-w-[1700px] mx-auto border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              Premium Streetwear Brand in India for Bold Everyday Style
            </h1>

            <div className="mt-4 space-y-4 leading-7 text-gray-400">
              <p>
                Welcome to Filo Teso.
              </p>

              <p>
                We're not here to tell you that we're changing fashion or
                reinventing streetwear. The truth is much simpler than that.
              </p>

              <p>
                We started Filo Teso because we wanted clothes that felt good to
                wear, looked different from everything else in the market, and
                actually reflected the people wearing them.
              </p>

              <p>
                As a growing streetwear clothing brand India shoppers are
                discovering, our focus has always been on creating pieces that
                combine comfort, quality, and individuality. Whether it's bold
                graphics, oversized fits, or everyday essentials, we believe
                clothing should feel like an extension of your personality—not
                just something hanging in your wardrobe.
              </p>

              <p>
                Fashion trends come and go, but confidence never goes out of
                style. That's why every collection at Filo Teso is designed with
                real people in mind. The people heading to college, grabbing
                coffee with friends, travelling on weekends, working on creative
                projects, or simply looking for something that feels authentic.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Explore Our Streetwear Collection
            </h3>

            <div className="mt-3 space-y-4 leading-7 text-gray-400">
              <p>
                When people think about streetwear, they often imagine loud
                designs and short-lived trends.
              </p>

              <p>For us, streetwear is different.</p>

              <p>
                It's about wearing what feels right. It's about comfort,
                confidence, and having the freedom to express yourself however
                you want.
              </p>

              <p>
                As a premium streetwear brand India customers can connect with,
                we focus on creating clothing that's easy to wear and hard to
                forget. Some people love minimal looks. Others prefer bold
                statement pieces. Most of us switch between both depending on
                the day.
              </p>

              <p>
                That's why our collections are designed to offer a mix of
                versatility and individuality.
              </p>

              <p>
                Whether you're looking for graphic streetwear clothing,
                oversized silhouettes, or modern everyday essentials, you'll
                find pieces designed to fit naturally into your lifestyle.
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
                  Let's be honest. Most of us have bought clothes that looked
                  amazing online but didn't feel the same after a few washes.
                  We've been there too. That's one of the reasons quality sits
                  at the centre of everything we create. From fabric selection
                  to final production, every detail matters. We want every piece
                  to feel just as good months later as it did on the first day.
                  As a streetwear clothing brand India customers can trust,
                  we're committed to creating products that aren't just stylish
                  but built to last.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Unique Graphic Designs
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  Some designs are forgotten the moment you see them. Others
                  stay with you. Our goal has always been to create designs that
                  people remember. That's why our collections of graphic tees
                  India shoppers love are built around originality rather than
                  simply following trends. Every graphic is created with the
                  idea that fashion should feel personal. Whether it's bold
                  artwork, symbolic designs, or clean modern graphics, each
                  piece is designed to help you express yourself.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Comfort Meets Contemporary Fashion
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  Comfort shouldn't be something you have to sacrifice for
                  style. That's why oversized fits have become such an important
                  part of modern streetwear clothing. Our collections are
                  designed to give you room to move, relax, and live comfortably
                  while still looking put together. Whether you're styling your
                  outfit with cargos, denim, joggers, or shorts, the goal is
                  always the same—effortless confidence.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-800 p-5">
                <h4 className="font-semibold text-white">
                  Fashion Built Around Individuality
                </h4>
                <p className="mt-2 leading-7 text-gray-400">
                  One thing we've learned is that no two people wear streetwear
                  the same way. Some prefer subtle looks. Others want to stand
                  out. Both approaches are valid. Streetwear has always been
                  about self-expression, and that's something we never want to
                  lose. Every collection is designed to give people the freedom
                  to create their own style without feeling limited by trends or
                  expectations.
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
                Graphic tees have become a huge part of streetwear fashion India
                continues to embrace.
              </p>

              <p>The reason is simple.</p>

              <p>
                They're easy to wear, versatile, and they tell a story.
              </p>

              <p>
                A great graphic tee can completely change an outfit without
                requiring much effort. That's why our collection of premium
                graphic t shirts India customers can wear every day focuses on
                balancing creativity with comfort.
              </p>

              <p>
                Whether you're pairing them with cargos, denim, shorts, or
                layering them under jackets, our designs are made to fit
                naturally into your everyday wardrobe.
              </p>

              <p>
                Our collections of Filo Teso T-Shirts, Filo Teso Oversized
                T-Shirts, and Filo Teso Graphic Tees are all built around the
                same idea: create clothing that people genuinely enjoy wearing.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              Streetwear Fashion That Reflects Your Individuality
            </h3>

            <div className="mt-3 space-y-4 leading-7 text-gray-400">
              <p>
                Streetwear has come a long way over the years.
              </p>

              <p>
                What started as a niche culture has become a global movement
                built around creativity, confidence, and individuality.
              </p>

              <p>
                At Filo Teso Streetwear, we're proud to be part of that
                movement.
              </p>

              <p>
                As an urban streetwear brand India shoppers can connect with,
                our goal isn't to chase every trend that comes along. We'd
                rather focus on creating pieces that remain relevant long after
                trends fade away.
              </p>

              <p>
                As we continue to grow as a premium fashion brand India
                customers trust, our commitment remains the same—quality
                products, original designs, and clothing that helps people feel
                confident being themselves.
              </p>

              <p>
                Because at the end of the day, great fashion isn't really about
                clothing.
              </p>

              <p>It's about how you feel when you wear it.</p>
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
