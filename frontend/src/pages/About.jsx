import React from "react";
import ClientHelmet from "../components/ClientHelmet";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/1hero.webp";
import storyImage from "../assets/storyimage/5.jpg";
import detailImage from "../assets/2hero.webp";

const keywords = [
  "about filo teso",
  "filo teso streetwear",
  "streetwear clothing brand india",
  "premium streetwear brand india",
  "indian streetwear brand",
  "filo teso clothing",
  "premium graphic tees india",
  "oversized t shirts india",
  "modern streetwear fashion",
];

const qualityPoints = [
  "Premium fabrics selected for everyday comfort",
  "Oversized fits made for movement and relaxed styling",
  "Graphic artwork created around originality and identity",
  "Products designed with long-term wear in mind",
];

const brandValues = [
  {
    title: "Quality first",
    text: "Every Filo Teso product is built around comfort, fabric feel, printing detail, and durability.",
  },
  {
    title: "Design with meaning",
    text: "Our graphics and silhouettes are made to feel bold, modern, and personal rather than temporary.",
  },
  {
    title: "Individuality always",
    text: "Some people prefer minimal looks. Others love statement pieces. We create for both moods.",
  },
];

export default function AboutPage() {
  return (
    <>
      <ClientHelmet>
        <title>
          About Filo Teso | Premium Streetwear Clothing Brand in India
        </title>
        <meta
          name="title"
          content="About Filo Teso | Premium Streetwear Clothing Brand in India"
        />
        <meta
          name="description"
          content="Learn about Filo Teso, a premium streetwear clothing brand in India focused on oversized T-shirts, graphic tees, quality craftsmanship, and modern streetwear fashion."
        />
        <meta name="keywords" content={keywords.join(", ")} />
        <meta
          property="og:title"
          content="About Filo Teso | Premium Streetwear Clothing Brand in India"
        />
        <meta
          property="og:description"
          content="Learn about Filo Teso, a premium streetwear clothing brand in India focused on oversized T-shirts, graphic tees, quality craftsmanship, and modern streetwear fashion."
        />
        <meta
          name="twitter:title"
          content="About Filo Teso | Premium Streetwear Clothing Brand in India"
        />
        <meta
          name="twitter:description"
          content="Learn about Filo Teso, a premium streetwear clothing brand in India focused on oversized T-shirts, graphic tees, quality craftsmanship, and modern streetwear fashion."
        />
      </ClientHelmet>

      <div className="bg-white text-gray-950">
        <section className="relative min-h-[58vh] overflow-hidden bg-black text-white">
          <img
            src={heroImage}
            alt="Filo Teso streetwear clothing"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative mx-auto flex min-h-[58vh] max-w-[1700px] items-end px-4 pb-14 pt-28 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                About Filo Teso
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                About Filo Teso - A Premium Streetwear Clothing Brand in India
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
                Filo Teso Streetwear is built for people who want clothing that
                feels premium, looks unique, and stays comfortable enough for
                everyday life.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100"
                >
                  Explore clothing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 border border-white/55 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white hover:text-black"
                >
                  Contact us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200">
          <div className="mx-auto grid max-w-[1700px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-20">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
                Our Story
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                Filo Teso was not created because the world needed another
                clothing brand.
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                <p>It started with a simple idea.</p>
                <p>
                  Why is it so difficult to find clothing that feels premium,
                  looks unique, and still feels comfortable enough to wear every
                  day?
                </p>
                <p>
                  Most options available were either basic and forgettable or
                  expensive without offering anything truly different. We felt
                  there was room for something better - something that combined
                  quality, creativity, and individuality.
                </p>
                <p>
                  That is how Filo Teso was born. Today, Filo Teso is growing
                  as a streetwear clothing brand in India focused on creating
                  pieces that help people express themselves through fashion.
                </p>
                <p>
                  We believe clothing should be more than something you wear. It
                  should represent your personality, confidence, and identity.
                </p>
              </div>
            </div>

            <div className="min-h-[420px] overflow-hidden bg-gray-100">
              <img
                src={storyImage}
                alt="Filo Teso clothing story"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-[1700px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
                  Why We Started
                </p>
                <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                  Streetwear became more than just a trend.
                </h2>
              </div>

              <div className="space-y-5 text-base leading-8 text-gray-700">
                <p>
                  We noticed that fashion was changing. People were moving away
                  from uncomfortable fits and fast-fashion trends that lasted
                  only a few weeks.
                </p>
                <p>
                  They were seeking apparel that seemed genuine and represented
                  their true selves. Streetwear became a culture - a way for
                  people to communicate without saying a word.
                </p>
                <p>
                  As an Indian streetwear brand, our goal is to create designs
                  that feel bold, modern, and meaningful while maintaining the
                  quality customers expect from a premium streetwear brand in
                  India.
                </p>
                <p>
                  Every design, graphic, and collection is created with the
                  belief that great fashion should make people feel confident the
                  moment they put it on.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {brandValues.map((value) => (
                <div
                  key={value.title}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <Sparkles className="h-5 w-5 text-[#ef6a4d]" />
                  <h3 className="mt-5 text-xl font-bold text-gray-950">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    {value.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200">
          <div className="mx-auto grid max-w-[1700px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
            <div className="order-2 min-h-[420px] overflow-hidden bg-gray-100 lg:order-1">
              <img
                src={detailImage}
                alt="Modern streetwear fashion by Filo Teso"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="order-1 flex flex-col justify-center lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
                Our Approach
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                Filo Teso clothing is designed around comfort, originality, and
                self-expression.
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                <p>
                  At Filo Teso Streetwear, we do not believe in creating
                  clothing simply to follow trends. We focus on creating pieces
                  that people genuinely enjoy wearing.
                </p>
                <p>
                  Our objective is to blend comfort with modern streetwear
                  style, whether it is through roomy forms, striking designs, or
                  everyday essentials.
                </p>
                <p>
                  We are aware that each person has a unique style. Some people
                  prefer minimal looks. Others love bold graphics and
                  eye-catching designs.
                </p>
                <p>
                  From oversized fits to premium graphic artwork, every piece is
                  designed to help people stand out while staying comfortable.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black text-white">
          <div className="mx-auto max-w-[1700px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
                  Quality Comes First
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                  Great streetwear is not just about appearance.
                </h2>
                <p className="mt-5 text-base leading-8 text-white/75">
                  It is about how it feels every time you wear it. Whether you
                  are shopping for oversized T-shirts in India or looking for
                  premium graphic tees in India, every piece should feel as good
                  after months of wear as it did on day one.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {qualityPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/5 p-5"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ef6a4d]" />
                    <p className="text-sm leading-7 text-white/80">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200">
          <div className="mx-auto max-w-[1180px] px-4 py-14 text-center sm:px-6 lg:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
              More Than Just a Clothing Brand
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
              We are building a community around creativity, confidence, and
              self-expression.
            </h2>
            <div className="mx-auto mt-6 max-w-4xl space-y-5 text-base leading-8 text-gray-700">
              <p>
                Every order, every customer, and every piece of feedback helps
                us continue improving and growing. As Filo Teso continues to
                evolve, our focus remains the same: create premium streetwear
                that people genuinely love wearing.
              </p>
              <p>
                No shortcuts. No compromises. Only quality items, significant
                designs, and a dedication to enhancing our customers'
                experience.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:py-20">
            <div className="border-l-4 border-[#ef6a4d] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
                The Future of Filo Teso
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                This is only the beginning.
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                <p>
                  We are constantly working on new collections, new ideas, and
                  new ways to bring fresh energy into modern streetwear fashion.
                </p>
                <p>
                  As we grow, our mission remains simple: to become a trusted
                  premium streetwear brand in India known for quality,
                  originality, and timeless design.
                </p>
                <p>
                  Whether you have recently discovered Filo Teso or have been
                  supporting us from the start, we are grateful to have you as
                  part of this journey.
                </p>
                <p className="font-semibold text-gray-950">
                  Thank you for being here. Welcome to Filo Teso.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
