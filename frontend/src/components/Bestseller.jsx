// src/components/Bestsellers.jsx
import React, { useEffect, useMemo, useRef, useState, useContext } from "react"; // useContext add kiya
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaCartPlus } from "react-icons/fa"; // FaCartPlus add kiya

// Contexts import kiye
import { CartContext } from "../context/CartContext";
import { useUI } from "../context/UIContext";

const CATEGORIES = ["men", "women", "customize"];

export default function Bestsellers({
  chunkSize = 4,
  rotateMs = 6000,
  pollMs = 30000, 
}) {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [paused, setPaused] = useState(false);

  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") return chunkSize;
    if (window.matchMedia && window.matchMedia("(min-width: 1024px)").matches) return 4;
    if (window.matchMedia && window.matchMedia("(min-width: 768px)").matches) return 3;
    return 2;
  });

  const trackRef = useRef(null);
  const rotateRef = useRef(null);
  const pollRef = useRef(null);

  const fetchAll = async (cancelToken = null) => {
    setLoading(true);
    setErr("");
    try {
      const responses = await Promise.all(
        CATEGORIES.map((cat) =>
          axios
            .get(`${apiUrl}/api/products`, {
              params: { category: cat },
              cancelToken,
            })
            .then((r) => {
              const products = Array.isArray(r.data) ? r.data : r.data?.products || [];
              return products;
            })
            .catch((error) => {
              if (axios.isCancel?.(error)) throw error;
              console.warn(`Error fetching ${cat}:`, error?.message || error);
              return [];
            })
        )
      );

      const allProducts = responses.flat();
      const seen = new Set();
      const deduped = [];
      allProducts.forEach((p) => {
        const key = p._id || p.id || `${p.name}-${p.price}-${p.image}` || null;
        if (!key) {
          deduped.push(p);
          return;
        }
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(p);
        }
      });

      const categoryWise = CATEGORIES.map((cat) =>
        deduped.filter((p) => {
          const productCategory = (p.category || p.gender || p.segment || p.type || "").toLowerCase();
          return productCategory.includes(cat);
        })
      );

      const mixed = interleave(categoryWise);
      const shuffled = knuthShuffle(mixed);

      setItems(shuffled);
    } catch (e) {
      if (!axios.isCancel?.(e)) {
        console.error("Fetch error:", e);
        setErr("Bestsellers load karne mein dikkat aa gayi.");
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const source = axios.CancelToken.source?.() ?? null;
    fetchAll(source?.token);
    return () => {
      if (source) source.cancel("Unmount");
    };
  }, [apiUrl]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchAll, pollMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [apiUrl, pollMs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqMd = window.matchMedia("(min-width: 768px)");

    const update = () => {
      if (mqLg.matches) setVisibleCount(4);
      else if (mqMd.matches) setVisibleCount(3);
      else setVisibleCount(2);
    };

    update();
    mqLg.addEventListener?.("change", update);
    mqMd.addEventListener?.("change", update);

    return () => {
      mqLg.removeEventListener("change", update);
      mqMd.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (rotateRef.current) clearInterval(rotateRef.current);
    if (paused) return;
    const track = trackRef.current;
    if (!track) return;
    if (items.length <= visibleCount) return;

    rotateRef.current = setInterval(() => {
      const width = track.clientWidth;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (Math.abs(track.scrollLeft - maxScroll) <= 2) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: width, behavior: "smooth" });
      }
    }, rotateMs);

    return () => clearInterval(rotateRef.current);
  }, [items.length, visibleCount, rotateMs, paused]);

  const goPrev = () => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    if (track.scrollLeft <= 2) {
      track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: "smooth" });
    } else {
      track.scrollBy({ left: -width, behavior: "smooth" });
    }
  };
  const goNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (Math.abs(track.scrollLeft - maxScroll) <= 2) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: width, behavior: "smooth" });
    }
  };

  return (
    <section
      className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl md:text-3xl font-semibold md:font-bold tracking-tight">Bestsellers</h2>
          <p className="text-gray-600 mt-1 text-sm md:text-md">Top picks across Men, Women and Customize</p>
        </div>

        {items.length > visibleCount && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
              onClick={goPrev}
              aria-label="Previous"
            >
              <FaChevronLeft />
            </button>
            <button
              className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
              onClick={goNext}
              aria-label="Next"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: chunkSize }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl p-3 animate-pulse">
              <div className="w-full bg-gray-200 rounded-xl h-44 sm:h-48" />
              <div className="h-4 bg-gray-200 rounded mt-3 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && err && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div>
      )}

      {!loading && !err && (
        <div className="relative">
          {items.length > visibleCount && (
            <div className="sm:hidden flex justify-between mb-3">
              <button
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
                onClick={goPrev}
                aria-label="Previous"
              >
                <FaChevronLeft />
              </button>
              <button
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
                onClick={goNext}
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            </div>
          )}

          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar"
            role="list"
            aria-label="Bestselling products"
          >
            {items.map((p, idx) => (
              <div
                key={`${p._id || p.id || idx}`}
                className="flex-shrink-0 snap-start w-40 sm:w-48 lg:w-52"
                role="listitem"
              >
                <BestCard product={p} apiUrl={apiUrl} />
              </div>
            ))}
          </div>

          {items.length > visibleCount && (
            <ResponsiveDots trackRef={trackRef} itemsLength={items.length} visibleCount={visibleCount} />
          )}
        </div>
      )}
    </section>
  );
}

/* ----------------------- BestCard Component with Cart ----------------------- */

function BestCard({ product, apiUrl }) {
  // Hooks for Cart functionality
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();

  const id = product._id || product.id;
  const name = product.name || "Product";
  const price = product.price != null ? Number(product.price) : null;
  const img = product.image ? `${apiUrl}${product.image}` : "/placeholder.png";
  const category = product.category || product.gender || product.segment || product.type || "";

  // Handle Add to Cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    if (window.innerWidth >= 768) {
      setShowCartSidebar(true);
    }
  };

  return (
    <Link
      to={`/product/${id}`}
      className="group block border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition bg-white"
    >
      {/* IMAGE SECTION */}
      <div className="relative w-full bg-white overflow-hidden rounded-t-2xl">
        <img
          src={img}
          alt={name}
          className="w-full h-44 sm:h-48 object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => (e.currentTarget.src = "/placeholder.png")}
        />

        {category && (
          <span
            className="absolute left-2 top-2 px-2 py-0.5 text-xs rounded-full bg-black text-white capitalize whitespace-nowrap z-10"
            title={category}
          >
            {category}
          </span>
        )}
      </div>

      {/* DETAILS SECTION */}
      <div className="p-3">
        <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
        
        {/* Price + Cart Button Row */}
        <div className="flex items-center justify-between mt-2">
          {price != null && (
            <div className="text-base  text-gray-900">₹{price.toFixed(2)}</div>
          )}
          
          <button 
            onClick={handleAddToCart}
            className=" p-2 rounded-full hover:scale-110 transition-colors shadow-md flex items-center justify-center z-20 relative"
            title="Add to Cart"
          >
            <FaCartPlus size={20} />
          </button>
        </div>
      </div>
    </Link>
  );
}

function ResponsiveDots({ trackRef, itemsLength, visibleCount }) {
  const [active, setActive] = useState(0);
  const pages = Math.max(1, Math.ceil(itemsLength / visibleCount));

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateActive = () => {
      const page = Math.round(track.scrollLeft / track.clientWidth);
      setActive(Math.min(page, pages - 1));
    };

    track.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => track.removeEventListener("scroll", updateActive);
  }, [trackRef, pages]);

  const goTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i === active ? "bg-black" : "bg-gray-300"}`}
          onClick={() => goTo(i)}
          aria-label={`Go to page ${i + 1}`}
        />
      ))}
    </div>
  );
}

function interleave(arrays) {
  const max = Math.max(...arrays.map((a) => a.length));
  const out = [];
  for (let i = 0; i < max; i++) {
    for (const arr of arrays) if (arr[i]) out.push(arr[i]);
  }
  return out;
}

function knuthShuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}