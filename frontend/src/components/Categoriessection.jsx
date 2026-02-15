import React from "react";
import { useNavigate } from "react-router-dom";

// Swap these with your real assets if you’ve got them.
import imageone from "../assets/mens.png";
import imagetwo from "../assets/women.png"
import imagethree from "../assets/banner.png"
import imagefour from "../assets/womentshirt.avif"
import imagefive from "../assets/womenpolo.avif"
import imagesix from "../assets/womenoversize.avif"
import regular from "../assets/regulartshirt.avif";
import oversize from "../assets/oversizetshirt.avif";
import polo from "../assets/Polo.avif";
import formal from "../assets/formal.jpeg";
import jeans from "../assets/jeans.webp";
import joggers from "../assets/joggers.webp";
import jacket from "../assets/jacket.jpeg";
import hoodies from "../assets/hoodies.avif";
import sweartshirt from "../assets/womensimage/5.svg"
/**
 * Slugs match ProductList.jsx and Navbar.jsx
 * Paths:
 *  - /products/:category
 *  - /products/:category/:subcategory
 */
const DATA = [
  {
    key: "men",
    title: "Men",
    cover: imageone,
    ctaBg: "bg-black",
    ctaText: "text-white",
    subs: [
      { label: "Regular T-shirt", slug: "regular-tshirt", img: regular },
      { label: "Oversize T-shirt", slug: "oversize-tshirt", img: oversize },
      { label: "Polo T-shirt", slug: "polo-tshirt", img: polo },
      { label: "Formal Shirt", slug: "formal-shirt", img: formal },
      { label: "Jeans", slug: "jeans", img: jeans },
      { label: "Joggers", slug: "joggers", img: joggers },
      { label: "Jacket", slug: "jacket", img: jacket },
      { label: "Hoodies", slug: "hoodies", img: hoodies },
    ],
  },
  {
    key: "women",
    title: "Women",
    cover: imagetwo,
    ctaBg: "bg-pink-600",
    ctaText: "text-white",
    subs: [
      { label: "Regular T-shirt", slug: "regular-tshirt", img: imagefour },
      { label: "Polo T-shirt", slug: "polo-tshirt", img: imagefive },
      { label: "Oversize T-shirt", slug: "oversize-tshirt", img: imagesix },
      { label: "Jeans", slug: "jeans", img: imageone },
      { label: "Jackets", slug: "jackets", img: imageone },
      { label: "Hoodies", slug: "hoodies", img: imageone },
    ],
  },
  {
    key: "customize",
    title: "Customize",
    cover: imagethree,
    ctaBg: "bg-indigo-600",
    ctaText: "text-white",
    subs: [
      { label: "Hoodies", slug: "hoodies", img: hoodies },
      { label: "Sweatshirt", slug: "sweatshirt", img: sweartshirt },
      { label: "Regular T-shirt", slug: "regular-tshirt", img: regular },
      { label: "Oversize T-shirt", slug: "oversize-tshirt", img: imageone },
      { label: "Couple T-shirt", slug: "couple-tshirt", img: imageone },
    ],
  },
];

export default function CategoriesSection({ showCount = 3 }) {
  const navigate = useNavigate();

  const goAll = (cat) => navigate(cat === "all" ? "/products" : `/products/${cat}`);
  const goSub = (cat, sub) => navigate(`/products/${cat}/${sub}`);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl sm:text-3xl md:font-bold font-semibold tracking-tight">Shop by Categories</h2>
        <p className="text-gray-600 mt-1 text-sm md:text-md">Only the highlights. The rest is behind “View All.”</p>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
        {DATA.map((cat) => {
          const topSubs = (cat.subs || []).slice(0, showCount);
          return (
            <article
              key={cat.key}
              className="group border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition"
            >
              {/* Hero image with overlay */}
              <div className="relative">
                <div className="w-full aspect-[16/9] bg-gray-50">
                  <img
                    src={cat.cover}
                    alt={cat.title}
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute left-4 bottom-4">
                  <h3 className="text-white text-xl font-semibold drop-shadow">{cat.title}</h3>
                </div>

                <button
                  onClick={() => goAll(cat.key)}
                  className={`absolute right-4 bottom-4 px-4 py-2 rounded-full text-sm font-medium ${cat.ctaBg} ${cat.ctaText} hover:opacity-90 transition`}
                >
                  Shop All
                </button>
              </div>

              {/* Subcategories preview (only 3) */}
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Popular in {cat.title}</h4>

                <div className="grid grid-cols-3 gap-3">
                  {topSubs.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => goSub(cat.key, s.slug)}
                      className="text-left border border-gray-200 rounded-xl hover:border-black hover:shadow-sm transition group"
                      title={s.label}
                    >
                      <div className="w-full aspect-square bg-gray-50 rounded-t-xl overflow-hidden">
                        <img
                          src={s.img || imageone}
                          alt={s.label}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-800 truncate">{s.label}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* View All button under subcategories */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => goAll(cat.key)}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50"
                    aria-label={`View all ${cat.title} subcategories`}
                  >
                    View All
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
