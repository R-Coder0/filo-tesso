import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaCartPlus, FaWallet, FaMedal } from "react-icons/fa";
import { C as CartContext, a as useUI } from "../entry-server.js";
import { e as eleven, s as six, o as one, a as seven, f as four, t as three, b as two, c as eight, d as five, i as imagefourteen, g as imagesixteen, h as imagefifteen, j as imageseventeen, k as imageeighteen, l as imagenineteen, m as imagetwenty, n as imagetwentyone, p as imagetwentytwo } from "./2-RYtUXRMA.js";
import { P as ProductCard } from "./ProductCard-CLVku5xX.js";
import { GiClothes, GiTShirt } from "react-icons/gi";
import { RiTShirt2Line } from "react-icons/ri";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "lucide-react";
import "react-fast-marquee";
import "react-hot-toast";
const imageone = "/assets/HOO-CeFzlFXk.webp";
const imagetwo = "/assets/HOO2-Bx-b1O51.webp";
const imagethree = "/assets/HOO3-3_71ZZVh.webp";
const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { id: 1, image: imageone },
    { id: 2, image: imagetwo },
    { id: 3, image: imagethree }
  ];
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  useEffect(() => {
    const timer = setInterval(nextSlide, 5e3);
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsxs("section", { className: "relative h- lg:h-[60vh] md:h-[400px] h-[200px] overflow-hidden bg-white", children: [
    /* @__PURE__ */ jsx("div", { className: "relative h-full", children: slides.map((slide, index) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`,
        children: /* @__PURE__ */ jsx(
          "img",
          {
            src: slide.image,
            alt: `Slide ${slide.id}`,
            className: "w-full md:h-full h-[210px] md:object-cover"
          }
        )
      },
      slide.id
    )) }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3", children: slides.map((_, index) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setCurrentSlide(index),
        className: `w-3 h-3 transition-all duration-300 rounded-full ${index === currentSlide ? "bg-white scale-125" : "bg-white bg-opacity-50 hover:bg-opacity-75"}`
      },
      index
    )) })
  ] });
};
const CATEGORIES = ["men", "women", "customize"];
function Bestsellers({
  chunkSize = 4,
  rotateMs = 6e3,
  pollMs = 3e4
}) {
  const apiUrl = "http://localhost:5000";
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") return chunkSize;
    if (window.matchMedia("(min-width: 1024px)").matches) return 4;
    if (window.matchMedia("(min-width: 768px)").matches) return 3;
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
        CATEGORIES.map(
          (cat) => axios.get(`${apiUrl}/api/products`, {
            params: { category: cat },
            cancelToken
          }).then((r) => Array.isArray(r.data) ? r.data : r.data?.products || []).catch((error) => {
            if (axios.isCancel?.(error)) throw error;
            console.warn(`Error fetching ${cat}:`, error?.message);
            return [];
          })
        )
      );
      const allProducts = responses.flat();
      const seen = /* @__PURE__ */ new Set();
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
      const categoryWise = CATEGORIES.map(
        (cat) => deduped.filter(
          (p) => (p.category || p.gender || p.segment || p.type || "").toLowerCase().includes(cat)
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
    const source = axios.CancelToken.source?.() ?? null;
    fetchAll(source?.token);
    return () => source?.cancel("Unmount");
  }, [apiUrl]);
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchAll, pollMs);
    return () => clearInterval(pollRef.current);
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
    mqLg.addEventListener("change", update);
    mqMd.addEventListener("change", update);
    return () => {
      mqLg.removeEventListener("change", update);
      mqMd.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (rotateRef.current) clearInterval(rotateRef.current);
    if (paused) return;
    const track = trackRef.current;
    if (!track || items.length <= visibleCount) return;
    rotateRef.current = setInterval(() => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (Math.abs(track.scrollLeft - maxScroll) <= 2) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
      }
    }, rotateMs);
    return () => clearInterval(rotateRef.current);
  }, [items.length, visibleCount, rotateMs, paused]);
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
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: "max-w-7xl mx-auto px-4 md:px-6 pt-10",
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onTouchStart: () => setPaused(true),
      onTouchEnd: () => setPaused(false),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between mb-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-bold text-gray-900 tracking-tight", children: "Bestsellers" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-0.5 uppercase tracking-widest", children: "Top picks across Men, Women & Customize" })
          ] }),
          items.length > visibleCount && /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: goPrev,
                "aria-label": "Previous",
                className: "w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black shadow-sm hover:shadow transition-all duration-200",
                children: /* @__PURE__ */ jsx(FaChevronLeft, { className: "text-xs text-gray-600" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: goNext,
                "aria-label": "Next",
                className: "w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black shadow-sm hover:shadow transition-all duration-200",
                children: /* @__PURE__ */ jsx(FaChevronRight, { className: "text-xs text-gray-600" })
              }
            )
          ] })
        ] }),
        loading && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: Array.from({ length: chunkSize }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 animate-pulse", children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-[3/4] w-full bg-gray-200" }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-3 bg-gray-200 w-3/4" }),
            /* @__PURE__ */ jsx("div", { className: "h-3 bg-gray-200 w-1/2" })
          ] })
        ] }, i)) }),
        !loading && err && /* @__PURE__ */ jsx("div", { className: "p-4 border border-red-200 bg-red-50 text-red-600 text-sm", children: err }),
        !loading && !err && /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          items.length > visibleCount && /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex justify-between mb-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: goPrev,
                className: "w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black",
                children: /* @__PURE__ */ jsx(FaChevronLeft, { className: "text-xs" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: goNext,
                className: "w-8 h-8 flex items-center justify-center bg-white border border-gray-300 hover:border-black",
                children: /* @__PURE__ */ jsx(FaChevronRight, { className: "text-xs" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              ref: trackRef,
              className: "flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar",
              role: "list",
              "aria-label": "Bestselling products",
              children: items.map((p, idx) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: "flex-shrink-0 snap-start w-44 sm:w-52 lg:w-64",
                  role: "listitem",
                  children: /* @__PURE__ */ jsx(BestCard, { product: p, apiUrl })
                },
                p._id || p.id || idx
              ))
            }
          ),
          items.length > visibleCount && /* @__PURE__ */ jsx(
            ResponsiveDots,
            {
              trackRef,
              itemsLength: items.length,
              visibleCount
            }
          )
        ] })
      ]
    }
  );
}
function BestCard({ product, apiUrl }) {
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();
  const id = product._id || product.id;
  const name = product.name || "Product";
  const img = product.image ? `${apiUrl}${product.image}` : "/placeholder.png";
  const category = product.category || product.gender || product.segment || product.type || "";
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-500" };
    if (stock <= 5) return { text: "Low Stock", color: "text-orange-500" };
    return { text: "In Stock", color: "text-green-600" };
  };
  const stockStatus = getStockStatus(product.stock);
  const discount = product.price?.original && product.price?.sale ? Math.round((product.price.original - product.price.sale) / product.price.original * 100) : 0;
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };
  return /* @__PURE__ */ jsxs("div", { className: "group bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 flex flex-col", children: [
    /* @__PURE__ */ jsxs(Link, { to: `/product/${id}`, className: "block relative overflow-hidden bg-gray-50", children: [
      /* @__PURE__ */ jsx("div", { className: "aspect-[3/4] w-full", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: img,
          alt: name,
          className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
          onError: (e) => e.currentTarget.src = "/placeholder.png",
          loading: "lazy"
        }
      ) }),
      category && /* @__PURE__ */ jsx("span", { className: "absolute top-2 left-2 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5", children: category }),
      discount > 0 && /* @__PURE__ */ jsxs("span", { className: "absolute top-2 right-2 bg-white border border-gray-200 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 tracking-wide", children: [
        discount,
        "% OFF"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Link, { to: `/product/${id}`, className: "px-3 pt-2.5 pb-1 flex flex-col gap-1 flex-1", children: [
      category && /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-400 truncate", children: category }),
      /* @__PURE__ */ jsx("h3", { className: "text-[12.5px] font-semibold text-gray-900 line-clamp-2 leading-snug", children: name }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-0.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-gray-900", children: [
            "₹",
            product.price?.sale
          ] }),
          product.price?.original && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-gray-400 line-through", children: [
            "₹",
            product.price?.original
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `text-[10px] font-semibold ${stockStatus.color}`, children: stockStatus.text })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-3 pb-3 pt-1", children: /* @__PURE__ */ jsxs(
      "button",
      {
        disabled: product.stock === 0,
        onClick: handleAddToCart,
        className: `w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${product.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"}`,
        children: [
          /* @__PURE__ */ jsx(FaCartPlus, { className: "text-xs" }),
          "Add to Cart"
        ]
      }
    ) })
  ] });
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
    trackRef.current?.scrollTo({ left: i * trackRef.current.clientWidth, behavior: "smooth" });
  };
  return /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-1.5 mt-5", children: Array.from({ length: pages }).map((_, i) => /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => goTo(i),
      "aria-label": `Go to page ${i + 1}`,
      className: `h-1.5 transition-all duration-300 ${i === active ? "w-5 bg-black" : "w-1.5 bg-gray-300 hover:bg-gray-400"}`
    },
    i
  )) });
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
    const j = Math.random() * (i + 1) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
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
      { label: "Shoes", slug: "shoes", img: five }
    ]
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
      { label: "Sports", slug: "sports", img: imagetwenty }
    ]
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
      { label: "Oversize CoupleTshirt", slug: "oversize-coupletshirt", img: imagetwentytwo }
      // { label: "Couple Hoodies", slug: "couple-hoodies", img: imagetwentythree },
    ]
  }
];
function CategoriesSection() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const goSub = (cat, sub) => navigate(`/products/${cat}/${sub}`);
  return /* @__PURE__ */ jsxs("section", { className: "container mx-auto px-4 sm:px-6 lg:px-8 py-10", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("h2", { className: "text-xl sm:text-3xl font-semibold tracking-tight", children: "Shop by Categories" }) }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3", children: DATA.map((cat) => {
      const isExpanded = expanded[cat.key];
      const visibleSubs = isExpanded ? cat.subs : cat.subs.slice(0, 6);
      return /* @__PURE__ */ jsxs(
        "article",
        {
          className: "border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition",
          children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center p-4 border-b border-gray-200", children: /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: cat.title }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: visibleSubs.map((s) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => goSub(cat.key, s.slug),
                  className: "text-left border border-gray-200 rounded-xl hover:border-black hover:shadow-sm transition",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "w-full aspect-square bg-gray-50 rounded-t-xl overflow-hidden", children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: s.img,
                        alt: s.label,
                        className: "h-full w-full object-cover hover:scale-105 transition duration-300"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("div", { className: "px-2 py-2", children: /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-gray-800 truncate", children: s.label }) })
                  ]
                },
                s.slug
              )) }),
              cat.subs.length > 6 && /* @__PURE__ */ jsx("div", { className: "mt-4 text-center", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => toggleExpand(cat.key),
                  className: "text-sm font-medium text-black border-b border-black hover:opacity-70 transition",
                  children: isExpanded ? "View Less" : "View More"
                }
              ) })
            ] })
          ]
        },
        cat.key
      );
    }) })
  ] });
}
const LatestProducts = () => {
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const { setShowCartSidebar } = useUI();
  const apiUrl = "http://localhost:5000";
  const trackRef = useRef(null);
  useEffect(() => {
    fetchLatestProducts();
  }, []);
  const fetchLatestProducts = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/products/latest?limit=20`);
      setLatestProducts(response.data);
    } catch (error) {
      console.error("Error fetching latest products:", error);
    } finally {
      setLoading(false);
    }
  };
  const scrollLeft = () => {
    trackRef.current.scrollBy({ left: -280, behavior: "smooth" });
  };
  const scrollRight = () => {
    trackRef.current.scrollBy({ left: 280, behavior: "smooth" });
  };
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-500" };
    if (stock <= 5) return { text: "Low Stock", color: "text-orange-500" };
    return { text: "In Stock", color: "text-green-600" };
  };
  const getDiscount = (original, sale) => {
    if (!original || !sale) return 0;
    return Math.round((original - sale) / original * 100);
  };
  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addToCart(product);
    if (window.innerWidth >= 768) setShowCartSidebar(true);
  };
  return /* @__PURE__ */ jsxs("section", { className: "py-8 max-w-7xl mx-auto px-4 md:px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl md:text-2xl font-bold text-gray-900 tracking-tight", children: "New Arrivals" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-0.5 uppercase tracking-widest", children: "Just landed" })
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/products?sort=newest",
          className: "text-[11px] font-semibold uppercase tracking-widest text-gray-500 hover:text-black border-b border-gray-300 hover:border-black pb-0.5 transition-colors duration-200",
          children: "View All →"
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex gap-3 overflow-x-auto pb-2", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsxs("div", { className: "w-44 flex-shrink-0 animate-pulse", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-gray-200 aspect-[3/4] w-full mb-2" }),
      /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-3 w-3/4 mb-1.5" }),
      /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-3 w-1/2" })
    ] }, i)) }) : latestProducts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-gray-400 text-sm py-10", children: "No new products available." }) : /* @__PURE__ */ jsxs("div", { className: "relative group/slider", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: scrollLeft,
          className: "hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 hover:border-black items-center justify-center shadow-sm hover:shadow transition-all duration-200",
          children: /* @__PURE__ */ jsx(FaChevronLeft, { className: "text-xs text-gray-600" })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: trackRef,
          className: "flex gap-3 overflow-x-auto scroll-smooth pb-1 snap-x snap-mandatory hide-scrollbar",
          children: latestProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            const discount = getDiscount(product.price?.original, product.price?.sale);
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "w-44 sm:w-52 flex-shrink-0 snap-start bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 flex flex-col group",
                children: [
                  /* @__PURE__ */ jsxs(
                    Link,
                    {
                      to: `/product/${product._id}`,
                      className: "block relative overflow-hidden bg-gray-50",
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "aspect-[3/4] w-full", children: /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: `${apiUrl}${product.image}`,
                            alt: product.name,
                            className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                            loading: "lazy"
                          }
                        ) }),
                        /* @__PURE__ */ jsx("span", { className: "absolute top-2 left-2 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5", children: "New" }),
                        discount > 0 && /* @__PURE__ */ jsxs("span", { className: "absolute top-2 right-2 bg-white border border-gray-200 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 tracking-wide", children: [
                          discount,
                          "% OFF"
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    Link,
                    {
                      to: `/product/${product._id}`,
                      className: "px-3 pt-2.5 pb-1 flex flex-col gap-1 flex-1",
                      children: [
                        product.category && /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-400 truncate", children: product.category }),
                        /* @__PURE__ */ jsx("h3", { className: "text-[12.5px] font-semibold text-gray-900 line-clamp-2 leading-snug", children: product.name }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-0.5", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
                            /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-gray-900", children: [
                              "₹",
                              product.price?.sale
                            ] }),
                            product.price?.original && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-gray-400 line-through", children: [
                              "₹",
                              product.price?.original
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: `text-[10px] font-semibold ${stockStatus.color}`, children: stockStatus.text })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "px-3 pb-3 pt-1", children: /* @__PURE__ */ jsxs(
                    "button",
                    {
                      disabled: product.stock === 0,
                      onClick: (e) => handleAddToCart(e, product),
                      className: `w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-widest border transition-colors duration-200 ${product.stock === 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black hover:bg-gray-50"}`,
                      children: [
                        /* @__PURE__ */ jsx(FaCartPlus, { className: "text-xs" }),
                        "Add to Cart"
                      ]
                    }
                  ) })
                ]
              },
              product._id
            );
          })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: scrollRight,
          className: "hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 hover:border-black items-center justify-center shadow-sm hover:shadow transition-all duration-200",
          children: /* @__PURE__ */ jsx(FaChevronRight, { className: "text-xs text-gray-600" })
        }
      )
    ] })
  ] });
};
const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = "http://localhost:5000";
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/products`);
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list.slice(0, 8));
      } catch (error) {
        console.error("Error fetching home products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [apiUrl]);
  return /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-white py-10 md:py-12", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-px bg-gray-200" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(0deg,#000_1px,transparent_1px)] bg-[length:36px_36px]" }),
    /* @__PURE__ */ jsxs("div", { className: "relative max-w-7xl mx-auto px-4 md:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.28em] text-gray-400", children: "Curated for you" }),
          /* @__PURE__ */ jsx("h2", { className: "mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-900", children: "Premium Collection" }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 h-px w-24 bg-black" })
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/products",
            className: "self-start border border-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-black hover:text-white md:self-auto",
            children: "View All Products"
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", children: Array.from({ length: 8 }).map((_, index) => /* @__PURE__ */ jsxs("div", { className: "animate-pulse border border-gray-200 bg-white", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-square bg-gray-200" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-3 w-3/4 bg-gray-200" }),
          /* @__PURE__ */ jsx("div", { className: "h-3 w-1/2 bg-gray-200" })
        ] })
      ] }, index)) }) : products.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6", children: products.map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product._id)) }) : /* @__PURE__ */ jsx("div", { className: "border border-gray-200 bg-white py-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-500", children: "Products will appear here once added." }) })
    ] })
  ] });
};
const img1 = "/assets/4-BgUe-CHf.jpg";
const img2 = "/assets/5-w0l8fQNp.jpg";
const img3 = "/assets/9-jfWD0rbB.jpg";
const img4 = "/assets/10-mDAjhx2N.jpg";
function OurStory() {
  return /* @__PURE__ */ jsx("section", { className: "w-full bg-white py-2", children: /* @__PURE__ */ jsx("div", { className: "mx-auto px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-start", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/2 bg-white text-gray-800 p-5 flex flex-col justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm tracking-widest uppercase text-gray-800", children: "Filoteso — Our Philosophy" }),
        /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm md:text-base leading-relaxed text-gray-800 max-w-xl", children: "Filoteso believes style is personal but confidence is universal. For men, we focus on structure, strength, and effortless sharpness. For women, we focus on grace, confidence, and freedom of movement. Every collection is thoughtfully designed — not copy-paste fashion, but independently created pieces crafted with attention to fit, comfort, and real-world wear. We combine high-quality fabrics, clean stitching, and durable construction to deliver everyday premium fashion without luxury-level pricing. Our designs move easily between office, casual outings, travel, and street style — adapting to your lifestyle effortlessly. No over-branding. No fake hype. Just honest fashion made to last." }),
        /* @__PURE__ */ jsx("p", { className: "mt-6 text-lg font-serif italic text-gray-900", children: "“Confidence isn’t worn. It’s carried.”" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-5 gap-4 items-center text-center", children: [
        /* @__PURE__ */ jsx(Feature, { icon: /* @__PURE__ */ jsx(FaWallet, { size: 24 }), label: "Pocket Friendly" }),
        /* @__PURE__ */ jsx(Feature, { icon: /* @__PURE__ */ jsx(GiClothes, { size: 24 }), label: "Street Wear" }),
        /* @__PURE__ */ jsx(Feature, { icon: /* @__PURE__ */ jsx(RiTShirt2Line, { size: 24 }), label: "New Designs" }),
        /* @__PURE__ */ jsx(Feature, { icon: /* @__PURE__ */ jsx(FaMedal, { size: 24 }), label: "Quality Assured" }),
        /* @__PURE__ */ jsx(Feature, { icon: /* @__PURE__ */ jsx(GiTShirt, { size: 24 }), label: "Daily Comfort" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/2 relative", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-full", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-4 pt-2 md:p-4 items-stretch", children: [
        /* @__PURE__ */ jsx("img", { src: img1, alt: "model 1", className: "object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" }),
        /* @__PURE__ */ jsx("img", { src: img2, alt: "model 2", className: "object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" }),
        /* @__PURE__ */ jsx("img", { src: img3, alt: "model 3", className: "object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" }),
        /* @__PURE__ */ jsx("img", { src: img4, alt: "model 4", className: "object-cover w-full h-[15rem] md:h-[20rem] rounded-sm shadow-md" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "bg-black/60 text-white text-sm md:text-base uppercase tracking-widest px-6 py-3 rounded-t-lg backdrop-blur-lg", children: "Perfect for all occasions" }) })
    ] })
  ] }) }) });
}
function Feature({ icon, label }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-black", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-white/10 rounded-full p-3 w-12 h-12 flex items-center justify-center", children: icon }),
    /* @__PURE__ */ jsx("span", { className: "mt-2 text-xs md:text-sm text-black", children: label })
  ] });
}
[
  {
    _id: "1",
    user: { name: "Saket Patel", avatarUrl: null },
    rating: 5,
    text: "I am so happy to find affordable, efficient and super friendly support. Highly recommended!",
    source: "facebook",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    _id: "2",
    user: { name: "H R", avatarUrl: null },
    rating: 4,
    text: "Amazing service and fast delivery. The product quality is top notch.",
    source: "google",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
function ShoppingExperience() {
  return /* @__PURE__ */ jsx("section", { className: "w-full bg-white py-6", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto px-6 lg:px-14", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-semibold text-black mb-6", children: "The Filoteso Shopping Experience" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-800 leading-relaxed text-sm md:text-base", children: "At Filoteso, shopping is designed to feel effortless, refined, and entirely on your terms. Our direct-to-consumer approach allows us to stay close to what matters — quality, clarity, and accessibility. By removing unnecessary layers, we ensure that every collection reaches you exactly as intended: thoughtfully designed, fairly priced, and uncompromised in detail. Whether you’re browsing from home, planning your next office look, or searching for versatile essentials that transition across seasons, our digital platform is built for simplicity. Clean navigation, detailed product views, accurate fits, and elevated presentation allow you to explore confidently — without pressure or confusion. At the same time, we believe modern fashion should offer flexibility. Online convenience, smooth doorstep delivery, and reliable exchange processes come together to create a unified experience. Filoteso adapts to your pace and preference, ensuring that no matter how you choose to shop, the journey feels seamless, consistent, and premium. Because true style isn’t just about what you wear — it’s about how effortlessly you access it." })
  ] }) });
}
const badges = [
  {
    label: "Cash on Delivery",
    sub: "Pay when you receive",
    icon: /* @__PURE__ */ jsxs("svg", { width: "36", height: "36", viewBox: "0 0 28 28", fill: "none", children: [
      /* @__PURE__ */ jsx("rect", { x: "4", y: "7", width: "20", height: "14", rx: "2", stroke: "currentColor", strokeWidth: "1.4" }),
      /* @__PURE__ */ jsx("path", { d: "M4 11h20", stroke: "currentColor", strokeWidth: "1.4" }),
      /* @__PURE__ */ jsx("rect", { x: "7", y: "14.5", width: "6", height: "2.5", rx: "1", fill: "currentColor", opacity: "0.5" }),
      /* @__PURE__ */ jsx("circle", { cx: "20.5", cy: "15.75", r: "2", stroke: "currentColor", strokeWidth: "1.2" })
    ] })
  },
  {
    label: "Fast Delivery",
    sub: "Quick & reliable shipping",
    icon: /* @__PURE__ */ jsxs("svg", { width: "36", height: "36", viewBox: "0 0 28 28", fill: "none", children: [
      /* @__PURE__ */ jsx("path", { d: "M5 14c0-5 3-8 9-8s9 3 9 8", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }),
      /* @__PURE__ */ jsx("rect", { x: "4", y: "13", width: "4", height: "7", rx: "1.5", stroke: "currentColor", strokeWidth: "1.4" }),
      /* @__PURE__ */ jsx("rect", { x: "20", y: "13", width: "4", height: "7", rx: "1.5", stroke: "currentColor", strokeWidth: "1.4" }),
      /* @__PURE__ */ jsx("path", { d: "M20 20c0 2-1.5 3-3 3h-2", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" })
    ] })
  },
  {
    label: "7-Day Returns",
    sub: "Hassle-free return policy",
    icon: /* @__PURE__ */ jsxs("svg", { width: "36", height: "36", viewBox: "0 0 28 28", fill: "none", children: [
      /* @__PURE__ */ jsx("path", { d: "M14 5l2 4 5 .5-3.5 3.5 1 5L14 16l-4.5 2 1-5L7 9.5l5-.5 2-4z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }),
      /* @__PURE__ */ jsx("path", { d: "M10 19l-3 4M18 19l3 4", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" })
    ] })
  },
  {
    label: "100% Genuine",
    sub: "Authentic products only",
    icon: /* @__PURE__ */ jsxs("svg", { width: "36", height: "36", viewBox: "0 0 28 28", fill: "none", children: [
      /* @__PURE__ */ jsx("path", { d: "M14 4l7 3v7c0 4-3 7-7 9-4-2-7-5-7-9V7l7-3z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }),
      /* @__PURE__ */ jsx("path", { d: "M10.5 14l2.5 2.5 4.5-5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
    ] })
  }
];
function TrustStrip() {
  return /* @__PURE__ */ jsx("div", { className: "w-full border-y border-gray-200 bg-white py-3", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-center divide-x divide-gray-200", children: badges.map((badge, i) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex items-center gap-3 px-6 py-2 flex-1 min-w-[150px] max-w-[260px]",
      children: [
        /* @__PURE__ */ jsx("div", { className: "text-gray-700 shrink-0", children: badge.icon }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-800 leading-tight", children: badge.label }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: badge.sub })
        ] })
      ]
    },
    i
  )) }) });
}
const Home = () => {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Hero, {}),
    /* @__PURE__ */ jsx(CategoriesSection, {}),
    /* @__PURE__ */ jsx(TrustStrip, {}),
    /* @__PURE__ */ jsx(LatestProducts, {}),
    /* @__PURE__ */ jsx(Bestsellers, {}),
    /* @__PURE__ */ jsx(HomeProducts, {}),
    /* @__PURE__ */ jsx(OurStory, {}),
    /* @__PURE__ */ jsx(ShoppingExperience, {})
  ] });
};
export {
  Home as default
};
