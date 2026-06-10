import React from "react";

export default function HomeDiscountBanner() {
  return (
    <section className="bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[900px] overflow-hidden">
        <img
          src="/discount.png"
          alt="Discount offer"
          className="block w-full object-cover"
          loading="lazy"
        />
      </div>
    </section>
  );
}
