import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../assets/1hero.webp";
import storyImage from "../assets/storyimage/5.jpg";
import detailImage from "../assets/2hero.webp";

export default function AboutPage() {
  return (
    <div className="bg-white text-gray-950">
      <section className="relative min-h-[58vh] overflow-hidden bg-black text-white">
        <img
          src={heroImage}
          alt="About Filo Teso premium streetwear clothing brand in India"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative mx-auto flex min-h-[58vh] max-w-[1700px] items-end px-4 pb-14 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              About Filo Teso
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              About Filo Teso – A Premium Streetwear Clothing Brand in India
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
              Filo Teso didn't begin with a business plan. It started with a
              simple frustration.
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
              Filo Teso didn't begin with a business plan.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
              <p>It started with a simple frustration.</p>
              <p>
                Finding a T-shirt that looked good, felt comfortable, and still
                held up after months of wear was harder than it should have been.
                Some pieces had great designs but disappointing quality. Others
                were comfortable but lacked personality.
              </p>
              <p>Everything felt like a compromise.</p>
              <p>
                So instead of waiting for someone else to create the kind of
                clothing we wanted to wear, we decided to build it ourselves.
              </p>
              <p className="font-semibold text-gray-950">
                That's how Filo Teso began.
              </p>
            </div>
          </div>

          <div className="min-h-[420px] overflow-hidden bg-gray-100">
            <img
              src={storyImage}
              alt="The story behind Filo Teso streetwear"
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
                Our Vision
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                The Idea Behind the Brand
              </h2>
            </div>

            <div className="space-y-5 text-base leading-8 text-gray-700">
              <p>
                From the beginning, the goal wasn't to create another fashion
                label.
              </p>
              <p>
                We wanted to create clothing that people would actually enjoy
                wearing in real life.
              </p>
              <p>The kind of oversized T-shirt you reach for without thinking.</p>
              <p>
                The graphic tee that becomes your favourite after a few wears.
              </p>
              <p>
                The pieces that feel just as relevant six months later as they
                did on the day you bought them.
              </p>
              <p>Fashion trends come and go.</p>
              <p>Personal style stays.</p>
              <p>
                That's the philosophy that continues to guide every collection we
                release.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200">
        <div className="mx-auto grid max-w-[1700px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
          <div className="order-2 min-h-[420px] overflow-hidden bg-gray-100 lg:order-1">
            <img
              src={detailImage}
              alt="Modern Indian streetwear by Filo Teso"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="order-1 flex flex-col justify-center lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
              Individuality
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
              Why Streetwear?
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
              <p>Because streetwear has never really been about clothes.</p>
              <p>It's about identity.</p>
              <p>It's about the freedom to wear something that feels like you.</p>
              <p>
                Some people express themselves through music. Some through
                photography, art, design, travel, or creativity. Fashion becomes
                part of that story.
              </p>
              <p>
                That's what attracted us to streetwear culture in the first
                place.
              </p>
              <p>Not the hype.</p>
              <p>Not the trends.</p>
              <p>The individuality.</p>
              <p>
                As an Indian streetwear brand, we want to create pieces that allow
                people to express themselves naturally rather than follow what
                everyone else is wearing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-[1700px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
            Our Approach
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            What We Focus On
          </h2>
          <p className="mt-4 text-base leading-8 text-white/75">
            We keep things simple.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <article className="rounded-lg border border-white/15 bg-white/5 p-6">
              <h3 className="text-xl font-bold text-white">Quality First</h3>
              <div className="mt-4 space-y-4 text-base leading-8 text-white/75">
                <p>
                  We've all experienced buying something online that looked
                  amazing in photos and disappointing in person.
                </p>
                <p>
                  That's not the experience we want people to have with Filo
                  Teso.
                </p>
                <p>
                  From fabric selection to fit and finishing, we focus on creating
                  products that feel premium from the moment they arrive and
                  continue to feel good over time.
                </p>
              </div>
            </article>

            <article className="rounded-lg border border-white/15 bg-white/5 p-6">
              <h3 className="text-xl font-bold text-white">
                Comfort Without Compromise
              </h3>
              <div className="mt-4 space-y-4 text-base leading-8 text-white/75">
                <p>Comfort isn't an extra feature.</p>
                <p>It should be expected.</p>
                <p>
                  Whether it's our oversized fits or everyday essentials, every
                  piece is designed to move naturally with your lifestyle.
                </p>
              </div>
            </article>

            <article className="rounded-lg border border-white/15 bg-white/5 p-6">
              <h3 className="text-xl font-bold text-white">Original Design</h3>
              <div className="mt-4 space-y-4 text-base leading-8 text-white/75">
                <p>We don't create products simply because they're trending.</p>
                <p>
                  Our focus is on graphics, concepts, and designs that feel
                  authentic to the brand and meaningful to the people wearing
                  them.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ef6a4d]">
            Community
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
            More Than Just Clothing
          </h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
            <p>
              One of the most rewarding parts of building Filo Teso has been
              seeing people connect with the brand.
            </p>
            <p>
              Every order, message, review, and piece of feedback reminds us that
              we're not simply creating products.
            </p>
            <p>We're building relationships.</p>
            <p>
              And while we're still growing, that's something we never want to
              lose.
            </p>
            <p>
              The connection between the people who wear the brand and the people
              who create it.
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
              Looking Ahead
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
              <p>We're still at the beginning of this journey.</p>
              <p>
                There are new collections we want to launch, new ideas we want to
                explore, and new ways we want to push our creativity.
              </p>
              <p>
                But regardless of how much we grow, the mission remains the same.
              </p>
              <p>
                Create high-quality streetwear that people genuinely enjoy
                wearing.
              </p>
              <p>No unnecessary hype.</p>
              <p>No shortcuts.</p>
              <p>
                Just thoughtful design, comfortable fits, and a commitment to
                doing things the right way.
              </p>
              <p>Thank you for being part of the journey.</p>
              <p className="font-semibold text-gray-950">
                Welcome to Filo Teso.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
