import React from "react";

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

export default function HomeSeoContent() {
  return (
    <section className="bg-white border-t border-gray-200 text-gray-800">
      <div className="mx-auto max-w-[1700px] px-4 py-10 sm:px-6 lg:px-8">
        <article className="prose prose-sm max-w-none prose-headings:text-gray-950 prose-p:leading-7 prose-p:text-gray-700">
          <h1 className="text-xl font-black tracking-tight md:text-2xl">
            Premium Streetwear Brand in India for Bold Everyday Style
          </h1>

          <p>
            Welcome to Filo Teso, a premium streetwear clothing brand in India
            created for individuals who value originality, confidence, and
            self-expression. As a growing streetwear clothing brand India
            shoppers can trust, we focus on delivering fashion that combines
            premium quality, contemporary design, and everyday comfort. Our
            collections are inspired by modern street culture and designed for
            people who want their clothing to reflect their personality.
          </p>

          <p>
            At Filo Teso, we believe fashion should be more than just apparel.
            It should help you stand out, feel confident, and express your
            unique identity. Whether you are exploring graphic tees, oversized
            fits, or future fashion collections, our goal is to build a
            streetwear clothing brand India customers proudly choose for quality
            and style.
          </p>

          <h2>Explore Our Streetwear Collection</h2>
          <p>
            Our collection is designed for those who appreciate modern fashion,
            artistic expression, and premium craftsmanship. Every product is
            meticulously designed to ensure that comfort and style complement
            one another.
          </p>
          <p>
            As a premium streetwear brand India fashion enthusiasts can rely on,
            we focus on creating apparel that fits effortlessly into modern
            lifestyles. From bold graphic designs to relaxed silhouettes, our
            pieces are made to help you create versatile looks for every
            occasion.
          </p>
          <p>
            Whether you prefer minimal aesthetics or statement-making designs,
            Filo Teso offers streetwear clothing that allows you to express your
            individuality while maintaining comfort throughout the day.
          </p>

          <h2>Why Choose Filo Teso</h2>
          <h3>Premium Quality You Can Feel</h3>
          <p>
            The foundation of everything we produce is quality. Our garments are
            designed using carefully selected fabrics that offer comfort,
            durability, and a premium feel. Every product reflects our
            commitment to becoming a trusted streetwear clothing brand India
            customers can depend on for lasting quality.
          </p>

          <h3>Unique Graphic Designs</h3>
          <p>
            Our graphic tees are inspired by creativity, culture, and modern
            fashion. Rather than following trends blindly, we focus on creating
            distinctive designs that help our customers stand out. Every piece
            is crafted to offer a balance of originality and versatility.
          </p>

          <h3>Comfort Meets Contemporary Fashion</h3>
          <p>
            Modern fashion should never sacrifice comfort. Our oversized fits
            and carefully designed silhouettes are created to provide freedom of
            movement while maintaining a stylish and contemporary appearance.
            This approach helps us strengthen our position as a leading
            streetwear clothing brand India shoppers can connect with.
          </p>

          <h3>Fashion Built Around Individuality</h3>
          <p>
            Streetwear is about self-expression. We design clothes for those who
            wish to express their self-assurance and genuineness through their
            fashion choices. Every collection is designed with the belief that
            fashion should empower people to be themselves.
          </p>

          <h2>Premium Graphic Tees Designed for Everyday Wear</h2>
          <p>
            Graphic tees have become one of the most important elements of
            modern streetwear fashion India consumers love. They offer a simple
            yet powerful way to express personality while maintaining
            versatility and comfort.
          </p>
          <p>
            At Filo Teso, our graphic tees are designed to combine artistic
            creativity with premium craftsmanship. Whether styled with denim,
            cargo pants, joggers, or layered with jackets, they help create
            looks that feel effortless and modern.
          </p>
          <p>
            As our product range continues to grow, we remain committed to
            building a streetwear clothing brand India customers recognize for
            quality, originality, and innovation. Every new collection will
            continue to reflect our dedication to premium fashion and
            contemporary design.
          </p>

          <h2>Streetwear Fashion That Reflects Your Individuality</h2>
          <p>
            Streetwear has evolved into a global movement that celebrates
            creativity, confidence, and personal style. At Filo Teso, we embrace
            this culture by creating apparel that encourages self-expression and
            individuality.
          </p>
          <p>
            Our vision is to establish a premium streetwear clothing brand India
            fashion enthusiasts turn to for unique designs, exceptional quality,
            and long-term value. We are committed to continuously expanding our
            collections while maintaining the standards that define our brand.
          </p>
          <p>
            As we introduce new categories, styles, and fashion essentials, our
            focus will remain on delivering clothing that helps people express
            themselves with confidence. Through innovation, quality, and
            creativity, Filo Teso aims to become a recognized streetwear
            clothing brand India shoppers associate with authenticity and modern
            fashion.
          </p>

          <h2>Frequently Asked Questions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="border border-gray-200 p-4">
                <h3 className="mt-0 text-sm font-black text-gray-950">
                  {faq.question}
                </h3>
                <p className="mb-0 text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
