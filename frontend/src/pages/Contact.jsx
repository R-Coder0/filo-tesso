import React from "react";
import ClientHelmet from "../components/ClientHelmet";
import {
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

const keywords = [
  "contact filo teso",
  "filo teso customer support",
  "contact streetwear brand india",
  "filo teso contact information",
  "customer service filo teso",
  "streetwear clothing support",
  "filo teso help",
];

const supportItems = [
  "Order updates",
  "Shipping information",
  "Exchanges or returns",
  "Product details",
  "Sizing guidance",
  "Payment issues",
];

const faqs = [
  {
    question: "How long does it usually take to get a reply?",
    answer:
      "We try to respond as quickly as possible. In most cases, you'll hear back from us within 24–48 business hours.",
  },
  {
    question: "Can I contact you before placing an order?",
    answer:
      "Of course. If you have questions about sizing, products, or anything else, feel free to reach out before making a purchase.",
  },
  {
    question: "What if I need help after receiving my order?",
    answer:
      "No problem. If you have any concerns regarding your order, simply contact us and we'll do our best to help.",
  },
  {
    question: "Do you accept collaboration requests?",
    answer:
      "Yes. We're always interested in connecting with creators, photographers, influencers, and people who genuinely love streetwear culture.",
  },
  {
    question: "What's the best way to contact Filo Teso?",
    answer:
      "Email is usually the fastest and easiest way to get in touch. We'll get back to you as soon as possible.",
  },
];

export default function ContactPage() {
  const email = "support@filoteso.co.in";
  const phoneDisplay = "+91 9310966458";
  const phoneDial = "+919310966458";
  const waLink =
    "https://wa.me/919310966458?text=Hi%20Filo%20Teso%2C%20I%20need%20help%20with%20my%20order.";

  return (
    <>
      <ClientHelmet>
        <title>Contact Filo Teso | Customer Support & Store Information</title>
        <meta
          name="title"
          content="Contact Filo Teso | Customer Support & Store Information"
        />
        <meta
          name="description"
          content="Get in touch with Filo Teso for product inquiries, order support, collaborations, or general questions. We're here to help with all your streetwear needs."
        />
        <meta name="keywords" content={keywords.join(", ")} />
        <meta
          property="og:title"
          content="Contact Filo Teso | Customer Support & Store Information"
        />
        <meta
          property="og:description"
          content="Get in touch with Filo Teso for product inquiries, order support, collaborations, or general questions. We're here to help with all your streetwear needs."
        />
        <meta property="og:url" content="https://filoteso.co.in/contact" />
        <meta
          name="twitter:title"
          content="Contact Filo Teso | Customer Support & Store Information"
        />
        <meta
          name="twitter:description"
          content="Get in touch with Filo Teso for product inquiries, order support, collaborations, or general questions. We're here to help with all your streetwear needs."
        />
        <link rel="canonical" href="https://filoteso.co.in/contact" />
      </ClientHelmet>

      <div className="bg-white text-gray-950">
        <section className="bg-black text-white">
          <div className="mx-auto max-w-[1700px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-end">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                  Contact Filo Teso
                </p>
                <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                  Contact Filo Teso
                </h1>
                <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                  Let's Talk
                </h2>
                <div className="mt-6 max-w-3xl space-y-5 text-base leading-8 text-white/78">
                  <p>
                    Whether you've got a question about a product, need help
                    with an order, or simply want to know more about Filo Teso,
                    we'd love to hear from you.
                  </p>
                  <p>
                    We're real people behind the brand, and we genuinely enjoy
                    connecting with our customers. So don't be afraid to get in
                    touch if you have any thoughts.
                  </p>
                  <p>Maybe you're unsure about sizing.</p>
                  <p>Maybe you're waiting for an order update.</p>
                  <p>
                    Maybe you just discovered Filo Teso and want to know what
                    we're all about.
                  </p>
                  <p>Whatever the reason, we're here to help.</p>
                </div>
              </div>

              <div className="border border-white/15 bg-white/8 p-6">
                <h3 className="text-2xl font-bold text-white">
                  Contact Information
                </h3>
                <div className="mt-6 space-y-5 text-sm leading-7 text-white/82">
                  <a
                    href={`mailto:${email}`}
                    className="flex items-start gap-3 transition hover:text-white"
                  >
                    <Mail className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>Email: {email}</span>
                  </a>
                  <a
                    href={`tel:${phoneDial}`}
                    className="flex items-start gap-3 transition hover:text-white"
                  >
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>Phone: {phoneDisplay}</span>
                  </a>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>
                      Business Hours: Monday to Saturday (working days) •
                      10:00 AM – 6:00 PM
                    </span>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 transition hover:text-white"
                  >
                    <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>WhatsApp : Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200">
          <div className="mx-auto grid max-w-[1700px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20">
            <div>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                Need Help With an Order?
              </h2>
              <p className="mt-5 text-base leading-8 text-gray-700">
                Online shopping should be simple, but we know questions can come
                up from time to time.
              </p>
            </div>

            <div>
              <p className="text-base leading-8 text-gray-700">
                If you need help with:
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {supportItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-900"
                  >
                    <HelpCircle className="h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-7 space-y-5 text-base leading-8 text-gray-700">
                <p>Simply message us, and we'll try our best to direct you.</p>
                <p>
                  No complicated support tickets. No automated responses that
                  make you even more perplexed.
                </p>
                <p>Just straightforward help when you need it.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-[1700px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                  A Small Brand That Actually Listens
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                  <p>
                    One of the reasons we started Filo Teso was because we
                    wanted to build more than just a clothing brand.
                  </p>
                  <p>
                    We wanted to create something people could genuinely connect
                    with.
                  </p>
                  <p>
                    Every message, suggestion, review, and piece of feedback
                    helps us improve. Whether it's a compliment, a concern, or
                    an idea you'd like to share, we appreciate hearing from the
                    people who support our journey.
                  </p>
                  <p>
                    As an expanding streetwear apparel company in India, we're
                    always learning, developing, and attempting to give our
                    clients better experiences.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                  Collaborations & Partnerships
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                  <p>
                    If you're a creator, photographer, stylist, influencer, or
                    someone who shares our love for streetwear fashion, we'd love
                    to hear from you.
                  </p>
                  <p>
                    We're always open to exploring meaningful collaborations and
                    creative partnerships that align with the Filo Teso vision.
                  </p>
                  <p>
                    Feel free to get in touch and tell us a little about
                    yourself and your idea.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200">
          <div className="mx-auto max-w-[1180px] px-4 py-14 text-center sm:px-6 lg:py-20">
            <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
              Thank You for Being Here
            </h2>
            <div className="mx-auto mt-6 max-w-4xl space-y-5 text-base leading-8 text-gray-700">
              <p>
                Every order placed, every message sent, and every person who
                chooses to support Filo Teso means a lot to us.
              </p>
              <p>
                We're still growing, still learning, and still building the
                brand we dreamed of creating.
              </p>
              <p>Thank you for being part of that journey.</p>
              <p>We look forward to hearing from you.</p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1700px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-8">
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.question} className="border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-950">
                    {faq.question}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-gray-700">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
