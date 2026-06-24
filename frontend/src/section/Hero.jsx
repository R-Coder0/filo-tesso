import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import heroOne from "../assets/background/1st.webp";
import heroTwo from "../assets/background/2nd.webp";
import heroThree from "../assets/background/3rd.webp";
import jeansImage from "../assets/background/4th.webp";

const SLIDE_DELAY = 4800;

const heroBanners = [
  {
    id: "summer-collection",
    to: "/products/men/oversize-tshirt",
    image: jeansImage,
    alt: "Filo Teso jeans collection",
    position: "object-center",
  },
  {
    id: "new-arrivals",
    to: "/products?sort=newest",
    image: heroTwo,
    alt: "Filo Teso new season looks",
    position: "object-center",
  },
  {
    id: "oversize-tshirts",
    to: "https://filoteso.co.in/product/elite-manor-polo-tee",
    image: heroThree,
    alt: "Filo Teso oversize t-shirt collection",
    position: "object-center",
  },
  {
    id: "shirts",
    to: "https://filoteso.co.in/product/butterfly-bloom-tee-mens",
    image: heroOne,
    alt: "Filo Teso shirt collection",
    position: "object-center",
  },
];

const Hero = () => {
  const trackRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToSlide = (index, behavior = "smooth") => {
    const track = trackRef.current;
    const target = track?.children[index];

    if (!track || !target) {
      setCurrentSlide(index);
      return;
    }

    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior,
    });
    setCurrentSlide(index);
  };

  const syncCurrentSlide = () => {
    const track = trackRef.current;
    if (!track) return;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - track.offsetLeft - track.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentSlide(closestIndex);
  };

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = setInterval(() => {
      const nextSlide = (currentSlide + 1) % heroBanners.length;
      scrollToSlide(nextSlide);
    }, SLIDE_DELAY);

    return () => clearInterval(timer);
  }, [currentSlide, isPaused]);

  return (
    <section
      className="bg-white pb-4"
      aria-label="Featured collections"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden">
        <div
          ref={trackRef}
          onScroll={syncCurrentSlide}
          className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-3 gap-2 lg:px-5"
        >
          {heroBanners.map((banner, index) => (
            <Link
              key={banner.id}
              to={banner.to}
              className="group relative block h-[92vw] max-h-[620px] w-[88vw] max-w-[620px] shrink-0 snap-start overflow-hidden bg-gray-100 sm:h-[600px] sm:w-[600px] xl:h-[620px] xl:w-[620px]"
              aria-label={`Shop ${banner.id.replaceAll("-", " ")}`}
            >
              <img
                src={banner.image}
                alt={banner.alt}
                className={`h-full w-full object-cover ${banner.position} transition duration-700 group-hover:scale-[1.025]`}
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index < 2 ? "high" : "auto"}
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {heroBanners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => scrollToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? "w-7 bg-[#2589f5]" : "w-2 bg-gray-300"
            }`}
            aria-label={`Go to hero banner ${index + 1}`}
            aria-current={index === currentSlide ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
