import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { P as ProductCard } from "./ProductCard-CLVku5xX.js";
import { useParams, useNavigate } from "react-router-dom";
import { FaFilter, FaSearch } from "react-icons/fa";
import "../entry-server.js";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "lucide-react";
import "react-fast-marquee";
import "react-hot-toast";
const CATS = ["all", "men", "women", "customize"];
const SUB_MAP = {
  men: [
    "all",
    "jacket",
    "regular-shirt",
    "trousers",
    "jeans",
    "polo-tshirt",
    "oversize-shirt",
    "plus-size",
    "cargos",
    "shoes"
  ],
  women: [
    "all",
    "top",
    "oversized",
    "co-ord set",
    "joggers",
    "trousers",
    "jeans",
    "sports"
  ],
  customize: [
    "all",
    "hoodies",
    "sweatshirt",
    "regular-tshirt",
    "oversize-tshirt",
    "couple-tshirt",
    "regular-coupletshirt",
    "oversize-coupletshirt",
    "couple-hoodies"
  ]
};
const normalize = (v) => String(v || "").toLowerCase().trim();
const ProductList = () => {
  const { category: catParam, subcategory: subParam } = useParams();
  const navigate = useNavigate();
  const cat = normalize(catParam) || "all";
  const urlSub = normalize(subParam) || "all";
  const [sub, setSub] = useState(urlSub);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const apiUrl = "http://localhost:5000";
  const validCat = useMemo(() => CATS.includes(cat), [cat]);
  const validSub = useMemo(() => {
    if (cat === "all") return sub === "all";
    const allowed = SUB_MAP[cat] || [];
    return allowed.includes(sub);
  }, [cat, sub]);
  useEffect(() => {
    const nextSub = urlSub;
    if (cat === "all") {
      setSub("all");
      return;
    }
    const allowed = SUB_MAP[cat] || ["all"];
    setSub(allowed.includes(nextSub) ? nextSub : "all");
  }, [cat, urlSub]);
  const goCategory = (c) => {
    if (c === "all") navigate("/products");
    else navigate(`/products/${c}`);
  };
  const goSubcategory = (s) => {
    if (s === "all") navigate(`/products/${cat}`);
    else navigate(`/products/${cat}/${s}`);
  };
  useEffect(() => {
    if (!validCat) {
      navigate("/products", { replace: true });
      return;
    }
    if (!validSub) {
      navigate(`/products/${cat}`, { replace: true });
      return;
    }
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (cat !== "all") q.set("category", cat);
        if (sub !== "all" && cat !== "all") q.set("subcategory", sub);
        const qs = q.toString() ? `?${q}` : "";
        const { data } = await axios.get(`${apiUrl}/api/products${qs}`);
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [apiUrl, cat, sub, validCat, validSub, navigate]);
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(
      (product) => product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "name":
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });
    return filtered;
  }, [products, searchTerm, sortBy]);
  useEffect(() => {
    setVisibleCount(20);
  }, [cat, sub, searchTerm, sortBy]);
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);
  const getCategoryLabel = (category) => {
    const labels = {
      all: "All Products",
      men: "Men's",
      women: "Women's",
      customize: "Customize"
    };
    return labels[category] || titleCase(category);
  };
  const getSubcategoryLabel = (subcategory) => {
    const labels = {
      all: "All Items",
      "regular-tshirt": "Regular T-Shirt",
      "oversize-tshirt": "Oversize T-Shirt",
      "polo-tshirt": "Polo T-Shirt",
      "formal-shirt": "Formal Shirt",
      "regular-shirt": "Regular Shirt",
      jeans: "Jeans",
      joggers: "Joggers",
      jacket: "Jacket",
      trousers: "Trousers",
      "oversize-shirt": "Oversize Shirt",
      "plus-size": "Plus Size",
      cargos: "Cargos",
      shoes: "Shoes",
      top: "Top",
      oversized: "Oversized",
      "co-ord set": "Co-ord Set",
      "co-ord-set": "Co-ord Set",
      sports: "Sports",
      hoodies: "Hoodies",
      jackets: "Jackets",
      sweatshirt: "Sweatshirt",
      "couple-tshirt": "Couple T-Shirt",
      "regular-coupletshirt": "Regular Couple T-Shirt",
      "oversize-coupletshirt": "Oversize Couple T-Shirt",
      "couple-hoodies": "Couple Hoodies"
    };
    return labels[subcategory] || titleCase(subcategory);
  };
  const categoryTitle = getCategoryLabel(cat);
  const subcategoryTitle = getSubcategoryLabel(sub);
  const heading = cat === "all" ? "Premium Collection" : sub !== "all" ? `${categoryTitle} ${subcategoryTitle} Collection` : `${categoryTitle} Collection`;
  const eyebrow = cat === "all" ? "All Categories" : sub !== "all" ? `${categoryTitle} / ${subcategoryTitle}` : categoryTitle;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-black border-b border-gray-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 opacity-45", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[length:42px_42px]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_42%,rgba(255,255,255,0.16)_42.5%,transparent_43%,transparent_100%)] bg-[length:90px_90px]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-px bg-white/25" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-1/2 w-px bg-white/10" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 h-px bg-white/20" }),
      /* @__PURE__ */ jsx("div", { className: "relative container mx-auto px-6 lg:px-8 py-9 md:py-11", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-3 text-[11px] md:text-xs font-bold uppercase tracking-[0.35em] text-white/60", children: eyebrow }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-black text-white tracking-wide leading-tight", children: heading }),
        /* @__PURE__ */ jsx("div", { className: "mx-auto mt-5 h-px w-32 bg-white/40" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-white/70 font-semibold tracking-[0.22em] uppercase text-xs md:text-sm", children: "Premium fits, cleaner details, better everyday style" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6 lg:px-8 py-8", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-12", children: cat === "all" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4 overflow-x-auto pb-2 hide-scrollbar", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 text-sm text-gray-500 font-medium tracking-wide uppercase", children: [
          /* @__PURE__ */ jsx(FaFilter, { className: "text-xs" }),
          /* @__PURE__ */ jsx("span", { children: "Categories:" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex space-x-2", children: CATS.map((c) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => goCategory(c),
            className: `px-6 py-2 font-medium text-sm tracking-wide uppercase transition-all duration-200 whitespace-nowrap ${cat === c ? "bg-black text-white" : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-black"}`,
            children: getCategoryLabel(c)
          },
          c
        )) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4 overflow-x-auto pb-2 ", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 text-sm text-gray-500 font-medium tracking-wide uppercase", children: [
          /* @__PURE__ */ jsx(FaFilter, { className: "text-xs" }),
          /* @__PURE__ */ jsx("span", { children: "Filter:" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex space-x-2", children: (SUB_MAP[cat] || ["all"]).map((s) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => goSubcategory(s),
            className: `px-6 py-2 font-medium text-sm tracking-wide uppercase transition-all duration-200 whitespace-nowrap ${sub === s ? "bg-black text-white" : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-black"}`,
            children: getSubcategoryLabel(s)
          },
          s
        )) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
          /* @__PURE__ */ jsx(FaSearch, { className: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search products...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "w-full pl-12 pr-4 py-3 border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors duration-200"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700 tracking-wide uppercase", children: "Sort By:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: sortBy,
              onChange: (e) => setSortBy(e.target.value),
              className: "px-4 py-3 border border-gray-300 text-gray-700 bg-white focus:outline-none focus:border-gray-500 transition-colors duration-200",
              children: [
                /* @__PURE__ */ jsx("option", { value: "name", children: "Name" }),
                /* @__PURE__ */ jsx("option", { value: "price-low", children: "Price: Low to High" }),
                /* @__PURE__ */ jsx("option", { value: "price-high", children: "Price: High to Low" })
              ]
            }
          )
        ] })
      ] }),
      !loading && /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 font-medium", children: [
        filteredProducts.length,
        " ",
        filteredProducts.length === 1 ? "Product" : "Products",
        " Found",
        searchTerm && /* @__PURE__ */ jsxs("span", { className: "ml-2", children: [
          'for "',
          /* @__PURE__ */ jsx("span", { className: "text-black font-semibold", children: searchTerm }),
          '"'
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center pt-10", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 font-medium tracking-wide uppercase", children: "Loading Products..." })
      ] }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "\r\n        grid\r\n        grid-cols-2\r\n        sm:grid-cols-3\r\n        md:grid-cols-4\r\n        lg:grid-cols-4\r\n        gap-6\r\n      ",
            children: visibleProducts.map((prod) => /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(ProductCard, { product: prod }) }, prod._id || prod.id))
          }
        ),
        filteredProducts.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full text-center py-10", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(FaSearch, { className: "text-2xl text-gray-400" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-700", children: "No Products Found" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: searchTerm ? `No products match your search "${searchTerm}". Try adjusting your search terms.` : "No products available in this selection at the moment." }),
          searchTerm && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSearchTerm(""),
              className: "mt-4 px-6 py-2 bg-black text-white font-medium tracking-wide uppercase hover:bg-gray-800 transition-colors duration-200",
              children: "Clear Search"
            }
          )
        ] }) })
      ] }),
      visibleCount < filteredProducts.length && /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-10", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setVisibleCount((prev) => prev + 20),
          className: "\r\n        px-10\r\n        py-3\r\n        border\r\n        border-black\r\n        text-black\r\n        font-medium\r\n        tracking-wide\r\n        uppercase\r\n        hover:bg-black\r\n        hover:text-white\r\n        transition-all\r\n        duration-300\r\n      ",
          children: "Load More"
        }
      ) })
    ] })
  ] });
};
function titleCase(str) {
  return String(str).split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}
export {
  ProductList as default
};
