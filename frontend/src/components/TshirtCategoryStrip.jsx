import React from "react";
import { Link } from "react-router-dom";
import menRegular from "../assets/categories/tshirt_men.png";
import menOversize from "../assets/categories/oversize_men.png";
import menPolo from "../assets/categories/polo_men.png";
import womenRegular from "../assets/womentshirt.avif";
import womenOversize from "../assets/categories/oversize_women.png";
import womenPolo from "../assets/womenpolo.avif";

const tshirtCategories = [
  {
    label: "Men Regular T-Shirt",
    to: "/products/men/regular-tshirt",
    image: menRegular,
  },
  {
    label: "Men Oversize T-Shirt",
    to: "/products/men/oversize-tshirt",
    image: menOversize,
  },
  {
    label: "Men Polo T-Shirt",
    to: "/products/men/polo-tshirt",
    image: menPolo,
  },
  {
    label: "Women Regular T-Shirt",
    to: "/products/women/regular-tshirt",
    image: womenRegular,
  },
  {
    label: "Women Oversize T-Shirt",
    to: "/products/women/oversize-tshirt",
    image: womenOversize,
  },
  {
    label: "Women Polo T-Shirt",
    to: "/products/women/polo-tshirt",
    image: womenPolo,
  },
];

export default function TshirtCategoryStrip() {
  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">
              Everyday Staples
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-950 md:text-3xl">
              Shop T-Shirts
            </h2>
          </div>
          <Link
            to="/products/men/regular-tshirt"
            className="hidden border border-black px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white sm:inline-flex"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tshirtCategories.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group block overflow-hidden bg-gray-100"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="bg-white px-2 py-3 text-center">
                <p className="truncate text-xs font-black uppercase tracking-wide text-gray-950">
                  {item.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
