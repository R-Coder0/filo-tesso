import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
/* MEN IMAGES */
import one from "../assets/mensimage/1.png";
import two from "../assets/mensimage/2.png";
import three from "../assets/mensimage/3.png";
import four from "../assets/mensimage/4.png";
import five from "../assets/mensimage/5.png";
import six from "../assets/mensimage/6.png";
import seven from "../assets/mensimage/7.png";
import eight from "../assets/mensimage/8.png";
import eleven from "../assets/mensimage/11.png";

/* WOMEN IMAGES */
import imagefourteen from "../assets/womensimage/14.png";
import imagefifteen from "../assets/womensimage/15.png";
import imagesixteen from "../assets/womensimage/16.png";
import imageseventeen from "../assets/womensimage/17.png";
import imageeighteen from "../assets/womensimage/18.png";
import imagenineteen from "../assets/womensimage/19.png";
import imagetwenty from "../assets/womensimage/20.png";

/* CUSTOM IMAGES */
import thirteen from "../assets/mensimage/13.svg";
import ten from "../assets/mensimage/10.svg";
import imagetwentyone from "../assets/custom/1.svg";
import imagetwentytwo from "../assets/custom/2.svg";
import imagetwentythree from "../assets/custom/3.svg";

const DATA = [
  {
    key: "men",
    title: "Men",
    subs: [
      { label: "Jackets", slug: "jacket", img: eleven },
      { label: "Shirts", slug: "regular-shirt", img: six },
      { label: "Trousers", slug: "trousers", img: one },
      { label: "Jeans", slug: "jeans", img: seven },
      { label: "Polos", slug: "polo-tshirt", img: four },
      { label: "Oversize Shirt", slug: "oversize-shirt", img: three },
      { label: "Plus Size", slug: "plus-size", img: two },
      { label: "Cargos", slug: "cargos", img: eight },
      { label: "Shoes", slug: "shoes", img: five },
    ],
  },
  {
    key: "women",
    title: "Women",
    subs: [
      { label: "Top", slug: "top", img: imagefourteen },
      { label: "Oversized", slug: "oversized", img: imagesixteen },
      { label: "Co-ord Set", slug: "co-ord-set", img: imagefifteen },
      { label: "Joggers", slug: "joggers", img: imageseventeen },
      { label: "Trousers", slug: "trousers", img: imageeighteen },
      { label: "Jeans", slug: "jeans", img: imagenineteen },
      { label: "Sports", slug: "sports", img: imagetwenty },
    ],
  },
  {
    key: "customize",
    title: "Customize",
    subs: [
      // { label: "Hoodies", slug: "hoodies", img: thirteen },
      // { label: "Sweatshirt", slug: "sweatshirt", img: ten },
      { label: "Regular T-shirt", slug: "regular-tshirt", img: imagefourteen },
      { label: "Oversize T-shirt", slug: "oversize-tshirt", img: three },
      { label: "Polo T-shirts", slug: "polo-tshirt", img: imagesixteen },
      { label: "Regular CoupleTshirt", slug: "regular-coupletshirt", img: imagetwentyone },
      { label: "Oversize CoupleTshirt", slug: "oversize-coupletshirt", img: imagetwentytwo },
      // { label: "Couple Hoodies", slug: "couple-hoodies", img: imagetwentythree },
    ],
  },
];


export default function CategoriesSection() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const goSub = (cat, sub) => navigate(`/products/${cat}/${sub}`);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl sm:text-3xl font-semibold tracking-tight">
          Shop by Categories
        </h2>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3">
        {DATA.map((cat) => {
          const isExpanded = expanded[cat.key];
          const visibleSubs = isExpanded ? cat.subs : cat.subs.slice(0, 6);

          return (
            <article
              key={cat.key}
              className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">{cat.title}</h3>
              </div>

              {/* Subcategories */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {visibleSubs.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => goSub(cat.key, s.slug)}
                      className="text-left border border-gray-200 rounded-xl hover:border-black hover:shadow-sm transition"
                    >
                      <div className="w-full aspect-square bg-gray-50 rounded-t-xl overflow-hidden">
                        <img
                          src={s.img}
                          alt={s.label}
                          className="h-full w-full object-cover hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-800 truncate">
                          {s.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* View More / View Less */}
                {cat.subs.length > 6 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => toggleExpand(cat.key)}
                      className="text-sm font-medium text-black border-b border-black hover:opacity-70 transition"
                    >
                      {isExpanded ? "View Less" : "View More"}
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}