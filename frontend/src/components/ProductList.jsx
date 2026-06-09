// src/components/ProductList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import { useNavigate, useParams } from "react-router-dom";
import { FaFilter, FaSearch } from "react-icons/fa";
import { useSsrData } from "../context/SsrDataContext";

const CATS = ["all", "men", "women", "customize"];

// These MUST match the slugs you use in Navbar.jsx
const SUB_MAP = {
  men: [
    "all",
    "regular-tshirt",
    "oversize-tshirt",
    "polo-tshirt",
    "jacket",
    "regular-shirt",
    "trousers",
    "jeans",
    "oversize-shirt",
    "plus-size",
    "cargos",
    "shoes",
  ],
  women: [
    "all",
    "regular-tshirt",
    "oversize-tshirt",
    "polo-tshirt",
    "top",
    "oversized",
    "co-ord-set",
    "joggers",
    "trousers",
    "jeans",
    "sports",
  ],
  customize: [
    "all",
    "hoodies",
    "sweatshirt",
    "regular-coupletshirt",
    "oversize-coupletshirt",
    "couple-hoodies"
  ],
};

const normalize = (v) => String(v || "").toLowerCase().trim();

const ProductList = () => {
  const { category: catParam, subcategory: subParam } = useParams();
  const navigate = useNavigate();

  const cat = normalize(catParam) || "all";
  const urlSub = normalize(subParam) || "all";
  const ssrProductList = useSsrData("productList");
  const routeKey = `${cat}:${urlSub}`;
  const hasSsrProducts =
    ssrProductList?.routeKey === routeKey &&
    Array.isArray(ssrProductList.products);

  const [sub, setSub] = useState(urlSub);
  const [products, setProducts] = useState(() =>
    hasSsrProducts ? ssrProductList.products : []
  );
  const [loading, setLoading] = useState(!hasSsrProducts);
  const [visibleCount, setVisibleCount] = useState(20);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const apiUrl = import.meta.env.VITE_API_URL;

  // validity derived from current URL
  const validCat = useMemo(() => CATS.includes(cat), [cat]);

  // sub is valid if:
  // - category is "all" and sub is "all", or
  // - sub exists in the map for that category
  const validSub = useMemo(() => {
    if (cat === "all") return sub === "all";
    const allowed = SUB_MAP[cat] || [];
    return allowed.includes(sub);
  }, [cat, sub]);

  // keep sub in sync with URL changes, and if category changes to one
  // that doesn’t include current sub, snap to "all"
  useEffect(() => {
    const nextSub = urlSub;
    if (cat === "all") {
      setSub("all");
      return;
    }
    const allowed = SUB_MAP[cat] || ["all"];
    setSub(allowed.includes(nextSub) ? nextSub : "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, urlSub]);

  // navigate helpers
  const goCategory = (c) => {
    if (c === "all") navigate("/products");
    else navigate(`/products/${c}`);
  };

  const goSubcategory = (s) => {
    if (s === "all") navigate(`/products/${cat}`);
    else navigate(`/products/${cat}/${s}`);
  };

  // guard invalids + fetch
  useEffect(() => {
    // if category is bogus, send to /products
    if (!validCat) {
      navigate("/products", { replace: true });
      return;
    }

    // if sub is bogus for this category, normalize to /products/:cat
    if (!validSub) {
      navigate(`/products/${cat}`, { replace: true });
      return;
    }

    if (hasSsrProducts) return;

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
  }, [apiUrl, cat, sub, validCat, validSub, navigate, hasSsrProducts]);

  // Filter + sort on client
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      customize: "Customize",
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
      "couple-hoodies": "Couple Hoodies",
    };
    return labels[subcategory] || titleCase(subcategory);
  };

  const categoryTitle = getCategoryLabel(cat);
  const subcategoryTitle = getSubcategoryLabel(sub);
  const heading =
    cat === "all"
      ? "Premium Collection"
      : sub !== "all"
        ? `${categoryTitle} ${subcategoryTitle} Collection`
        : `${categoryTitle} Collection`;
  const eyebrow =
    cat === "all"
      ? "All Categories"
      : sub !== "all"
        ? `${categoryTitle} / ${subcategoryTitle}`
        : categoryTitle;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-black border-b border-gray-900">
        <div className="absolute inset-0 opacity-45">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[length:42px_42px]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_42%,rgba(255,255,255,0.16)_42.5%,transparent_43%,transparent_100%)] bg-[length:90px_90px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />

        <div className="relative container mx-auto px-6 lg:px-8 py-9 md:py-11">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-[11px] md:text-xs font-bold uppercase tracking-[0.35em] text-white/60">
              {eyebrow}
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide leading-tight">
              {heading}
            </h1>
            <div className="mx-auto mt-5 h-px w-32 bg-white/40" />
            <p className="mt-4 text-white/70 font-semibold tracking-[0.22em] uppercase text-xs md:text-sm">
              Premium fits, cleaner details, better everyday style
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 lg:px-8 py-8">
        {/* Navigation Pills */}
        <div className="mb-12">
          {cat === "all" ? (
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex items-center space-x-1 text-sm text-gray-500 font-medium tracking-wide uppercase">
                <FaFilter className="text-xs" />
                <span>Categories:</span>
              </div>
              <div className="flex space-x-2">
                {CATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => goCategory(c)}
                    className={`px-6 py-2 font-medium text-sm tracking-wide uppercase transition-all duration-200 whitespace-nowrap ${cat === c
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-black"
                      }`}
                  >
                    {getCategoryLabel(c)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 ">
              <div className="flex items-center space-x-1 text-sm text-gray-500 font-medium tracking-wide uppercase">
                <FaFilter className="text-xs" />
                <span>Filter:</span>
              </div>
              <div className="flex space-x-2">
                {(SUB_MAP[cat] || ["all"]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => goSubcategory(s)}
                    className={`px-6 py-2 font-medium text-sm tracking-wide uppercase transition-all duration-200 whitespace-nowrap ${sub === s
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-black"
                      }`}
                  >
                    {getSubcategoryLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search and Sort Bar */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors duration-200"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700 tracking-wide uppercase">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 text-gray-700 bg-white focus:outline-none focus:border-gray-500 transition-colors duration-200"
            >
              <option value="name">Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Count */}
        {!loading && (filteredProducts.length > 0 || searchTerm) && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"} Found
              {searchTerm && (
                <span className="ml-2">
                  for "<span className="text-black font-semibold">{searchTerm}</span>"
                </span>
              )}
            </p>
          </div>
        )}

        {/* Loading State or Product Horizontal Scroll Grid */}
        {/* Loading State or Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center pt-10">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 font-medium tracking-wide uppercase">
                Loading Products...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div
              className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-4
        gap-2
      "
            >
              {visibleProducts.map((prod) => (
                <div key={prod._id || prod.id}>
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="mx-auto max-w-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12">
                  {searchTerm ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <FaSearch className="text-2xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700">
                        No Products Found
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        No products match your search "{searchTerm}". Try adjusting your search terms.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <p className="text-xs font-bold uppercase tracking-[0.35em] text-gray-500">
                        Coming Soon
                      </p>
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                        New styles are on the way
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {sub !== "all"
                          ? `${categoryTitle} ${subcategoryTitle}`
                          : categoryTitle}{" "}
                        collection is getting stocked soon.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                        <button
                          onClick={() => navigate("/products")}
                          className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                        >
                          Explore All
                        </button>
                        <button
                          onClick={() => navigate("/")}
                          className="px-6 py-3 border border-black text-black text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                        >
                          Back Home
                        </button>
                      </div>
                    </div>
                  )}
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-6 px-6 py-2 bg-black text-white font-medium tracking-wide uppercase hover:bg-gray-800 transition-colors duration-200"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {/* Load More Button */}
{visibleCount < filteredProducts.length && (
  <div className="flex justify-center mt-10">
    <button
      onClick={() => setVisibleCount((prev) => prev + 20)}
      className="
        px-10
        py-3
        border
        border-black
        text-black
        font-medium
        tracking-wide
        uppercase
        hover:bg-black
        hover:text-white
        transition-all
        duration-300
      "
    >
      Load More
    </button>
  </div>
)}


      </div>
    </div>
  );
};

export default ProductList;

function titleCase(str) {
  return String(str)
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
