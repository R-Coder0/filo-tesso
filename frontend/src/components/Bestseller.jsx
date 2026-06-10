// src/components/Bestsellers.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ShoppingBag } from "lucide-react";
import { CartContext } from "../context/CartContext";
import { useUI } from "../context/UIContext";
import { useSsrData } from "../context/SsrDataContext";
import { extractProducts, getProductPath } from "../utils/products";

const CATEGORIES = ["men", "women"];

export default function Bestsellers({
  chunkSize = 4,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const ssrProducts = useSsrData("homeBestsellerProducts");
  const hasSsrProducts = Array.isArray(ssrProducts);

  const [loading, setLoading] = useState(!hasSsrProducts);
  const [err, setErr] = useState("");
  const [items, setItems] = useState(() => (hasSsrProducts ? ssrProducts : []));

  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") return chunkSize;
    if (window.matchMedia("(min-width: 1024px)").matches) return 4;
    if (window.matchMedia("(min-width: 768px)").matches) return 3;
    return 2;
  });

  const trackRef = useRef(null);

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
            .then((r) => extractProducts(r.data))
            .catch((error) => {
              if (axios.isCancel?.(error)) throw error;
              console.warn(`Error fetching ${cat}:`, error?.message);
              return [];
            })
        )
      );

      const allProducts = responses.flat();
      const seen = new Set();
      const deduped = [];
      allProducts.forEach((p) => {
        const key = p._id || p.id || `${p.name}-${p.price}-${p.image}` || null;
        if (!key) { deduped.push(p); return; }
        if (!seen.has(key)) { seen.add(key); deduped.push(p); }
      });

      const categoryWise = CATEGORIES.map((cat) =>
        deduped.filter((p) =>
          (p.category || p.gender || p.segment || p.type || "").toLowerCase().includes(cat)
        )
      );

      setItems(knuthShuffle(interleave(categoryWise)));
    } catch (e) {
      if (!axios.isCancel?.(e)) {
        setErr("Could not load bestsellers.");
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSsrProducts) return;

    const source = axios.CancelToken.source?.() ?? null;
    fetchAll(source?.token);
    return () => source?.cancel("Unmount");
  }, [apiUrl, hasSsrProducts]);

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
    mqLg.addEventListener("change", update);
    mqMd.addEventListener("change", update);
    return () => { mqLg.removeEventListener("change", update); mqMd.removeEventListener("change", update); };
  }, []);

  const goPrev = () => {
    const track = trackRef.current;
    if (!track) return;
    if (track.scrollLeft <= 2) {
      track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: "smooth" });
    } else {
      track.scrollBy({ left: -track.clientWidth, behavior: "smooth" });
    }
  };

  const goNext = () => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (Math.abs(track.scrollLeft - maxScroll) <= 2) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
    }
  };

  return (
    <section className="max-w-[1700px] mx-auto px-4 md:px-6 pt-10">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Bestsellers
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest">
            Top picks across Men & Women
          </p>
        </div>

        {items.length > visibleCount && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={goPrev}
              aria-label="Previous"
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black shadow-sm hover:shadow transition-all duration-200"
            >
              <FaChevronLeft className="text-xs text-gray-600" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next"
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black shadow-sm hover:shadow transition-all duration-200"
            >
              <FaChevronRight className="text-xs text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* ── Skeleton ── */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: chunkSize }).map((_, i) => (
            <div key={i} className="border border-gray-200 animate-pulse">
              <div className="aspect-[3/4] w-full bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 w-3/4" />
                <div className="h-3 bg-gray-200 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && err && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-600 text-sm">
          {err}
        </div>
      )}

      {/* ── Products ── */}
      {!loading && !err && (
        <div className="relative">
          {/* Mobile arrows */}
          {items.length > visibleCount && (
            <div className="sm:hidden flex justify-between mb-3">
              <button
                onClick={goPrev}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                onClick={goNext}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          )}

          <div
            ref={trackRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar"
            role="list"
            aria-label="Bestselling products"
          >
            {items.map((p, idx) => (
              <div
                key={p._id || p.id || idx}
                className="flex-shrink-0 snap-start w-44 sm:w-52 lg:w-64"
                role="listitem"
              >
                <BestCard product={p} apiUrl={apiUrl} />
              </div>
            ))}
          </div>

          {items.length > visibleCount && (
            <ResponsiveDots
              trackRef={trackRef}
              itemsLength={items.length}
              visibleCount={visibleCount}
            />
          )}
        </div>
      )}
    </section>
  );
}

/* ── BestCard ── */
function BestCard({ product, apiUrl }) {
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();

  const id = product._id || product.id || product.productId;
  const name = product.name || "Product";
  const img = product.image ? `${apiUrl}${product.image}` : "/placeholder.png";
  const category = product.category || product.gender || product.segment || product.type || "";

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-500" };
    if (stock <= 5) return { text: "Low Stock", color: "text-orange-500" };
    return { text: "In Stock", color: "text-green-600" };
  };

  const stockStatus = getStockStatus(product.stock);

  const discount =
    product.price?.original && product.price?.sale
      ? Math.round(((product.price.original - product.price.sale) / product.price.original) * 100)
      : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };

  return (
    <div className="group bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 flex flex-col">

      {/* Image */}
      <Link to={getProductPath(product)} className="block relative overflow-hidden bg-gray-50">
        <div className="aspect-[3/4] w-full">
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
            loading="lazy"
          />
        </div>

        {/* Category badge — top left */}
        {category && (
          <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
            {category}
          </span>
        )}

        {/* Discount badge — top right */}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-white border border-gray-200 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 tracking-wide">
            {discount}% OFF
          </span>
        )}
      </Link>

      {/* Info */}
      <Link to={getProductPath(product)} className="px-3 pt-2.5 pb-1 flex flex-col gap-1 flex-1">
        {category && (
          <p className="text-[10px] uppercase tracking-widest text-gray-400 truncate">
            {category}
          </p>
        )}

        <h3 className="font-sans text-[14px] font-bold text-black line-clamp-2 leading-snug">
          {name}
        </h3>

        {/* Price row */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-gray-900">
              ₹{product.price?.sale}
            </span>
            {product.price?.original && (
              <span className="text-[10px] text-gray-400 line-through">
                ₹{product.price?.original}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </div>
      </Link>

      {/* Cart button */}
      <div className="px-3 pb-3 pt-1">
        <button
          disabled={product.stock === 0}
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${
            product.stock === 0
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"
          }`}
        >
          <ShoppingBag size={13} strokeWidth={1.9} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

/* ── Dots ── */
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
    trackRef.current?.scrollTo({ left: i * trackRef.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex justify-center gap-1.5 mt-5">
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          onClick={() => goTo(i)}
          aria-label={`Go to page ${i + 1}`}
          className={`h-1.5 transition-all duration-300 ${
            i === active ? "w-5 bg-black" : "w-1.5 bg-gray-300 hover:bg-gray-400"
          }`}
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
