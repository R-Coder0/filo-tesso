import React from "react";
import {
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

const supportItems = [
  "Order updates",
  "Shipping and delivery questions",
  "Exchange and return requests",
  "Product information",
  "Sizing guidance",
  "Payment-related concerns",
];

const faqs = [
  {
    question: "How long does it take to receive a response?",
    answer:
      "We usually reply within 24–48 business hours, and often much sooner during working days.",
  },
  {
    question: "Can I contact you before placing an order?",
    answer:
      "Absolutely. If you have questions about sizing, products, shipping, or anything else, feel free to reach out before making a purchase.",
  },
  {
    question: "What if I need help after receiving my order?",
    answer:
      "No problem. If there's an issue with your order or you need assistance after delivery, we'll do our best to help.",
  },
  {
    question: "Do you accept collaboration requests?",
    answer:
      "Yes. We're always interested in hearing from creators, photographers, influencers, and people who genuinely connect with our brand.",
  },
  {
    question: "What's the fastest way to contact Filo Teso?",
    answer:
      "Email is usually the best option for detailed queries, while WhatsApp is great for quick assistance during business hours.",
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
                  <p className="text-lg font-semibold text-white">Got a question?</p>
                  <p>
                    Whether you're checking on an order, need help choosing the
                    right size, or simply want to know more about Filo Teso,
                    we're happy to help.
                  </p>
                  <p>
                    We're a growing brand, but one thing hasn't changed since day
                    one—we genuinely enjoy hearing from the people who support us.
                  </p>
                  <p>So if something's on your mind, don't hesitate to reach out.</p>
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
                    <span>
                      <strong className="block text-white">Email</strong>
                      {email}
                    </span>
                  </a>
                  <a
                    href={`tel:${phoneDial}`}
                    className="flex items-start gap-3 transition hover:text-white"
                  >
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>
                      <strong className="block text-white">Phone</strong>
                      {phoneDisplay}
                    </span>
                  </a>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>
                      <strong className="block text-white">Business Hours</strong>
                      Monday to Saturday
                      <span className="block">10:00 AM – 6:00 PM</span>
                    </span>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 transition hover:text-white"
                  >
                    <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <span>
                      <strong className="block text-white">WhatsApp</strong>
                      Feel free to message us on WhatsApp for quick assistance
                      during business hours.
                    </span>
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
                If you're contacting us about an existing order, we're happy to
                assist with:
              </p>
            </div>

            <div>
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
                <p>
                  Just send us a message and we'll get back to you as soon as
                  possible.
                </p>
                <p>No complicated forms.</p>
                <p>No endless back-and-forth.</p>
                <p>Just straightforward support from real people.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-[1700px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                  Collaborations & Partnerships
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                  <p>
                    Are you a creator, photographer, stylist, influencer, or
                    someone who shares our love for streetwear culture?
                  </p>
                  <p>
                    We're always open to meaningful collaborations and creative
                    partnerships that align with the Filo Teso brand.
                  </p>
                  <p>
                    If you have an idea you'd like to discuss, we'd love to hear
                    from you.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                  A Quick Thank You
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                  <p>
                    Every order, message, review, and recommendation helps us grow.
                  </p>
                  <p>
                    We're grateful for everyone who chooses to support Filo Teso
                    and be part of this journey.
                  </p>
                  <p>
                    Thank you for being here.
                  </p>
                  <p>We look forward to hearing from you.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200">
          <div className="mx-auto max-w-[1180px] px-4 py-14 text-center sm:px-6 lg:py-20">
            <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
              Contact Filo Teso
            </h2>
            <div className="mx-auto mt-6 max-w-4xl space-y-5 text-base leading-8 text-gray-700">
              <p>
                Have a question about an order, product, sizing, or collaboration?
                Get in touch with the Filo Teso team. We'd love to hear from you.
              </p>
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
