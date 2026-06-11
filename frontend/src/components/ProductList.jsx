// src/components/ProductList.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  ArrowUpDown,
  Heart,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSsrData } from "../context/SsrDataContext";
import { useWishlist } from "../context/WishlistContext";
import { extractProducts, getProductPath } from "../utils/products";
import {
  CATEGORY_LINKS_BY_GENDER,
  GENDER_TABS,
  getSubcategoryFromPath,
  setStoredShopGender,
} from "../utils/navigationCategories";

const LEGACY_SUBCATEGORIES = {
  women: ["oversized"],
  men: [],
};

const titleOverrides = {
  all: "All",
  "regular-tshirt": "T-Shirts",
  "oversize-tshirt": "Oversize T-Shirts",
  "polo-tshirt": "Polo T-Shirts",
  "regular-shirt": "Shirts",
  "oversize-shirt": "Oversize Shirt",
  jeans: "Jeans",
  trousers: "Trouser",
  top: "Top",
  "co-ord-set": "Co-ord Set",
  joggers: "Joggers",
  sports: "Sports",
  oversized: "Oversized",
};

const SORT_OPTIONS = [
  { label: "POPULAR", value: "recommended" },
  { label: "NEW", value: "newest" },
  { label: "PRICE: HIGH TO LOW", value: "price-high" },
  { label: "PRICE: LOW TO HIGH", value: "price-low" },
  { label: "AVG. CUSTOMER REVIEW", value: "name" },
];

const FILTER_SECTIONS = [
  {
    key: "size",
    label: "SIZE",
    defaultOpen: false,
    visibleCount: 4,
    options: ["S", "M", "L", "XL"],
  },
  {
    key: "color",
    label: "COLOR",
    defaultOpen: false,
    options: ["BLACK", "GREY", "OLIVE", "BLUE", "NAVY", "BEIGE", "BROWN", "OFF WHITE", "KHAKI"],
  },
  {
    key: "pattern",
    label: "PATTERN",
    defaultOpen: false,
    options: ["PLAIN", "COLOURBLOCKED", "SELF-DESIGN", "TEXTURED"],
  },
  {
    key: "fit",
    label: "FIT",
    defaultOpen: false,
    options: ["REGULAR", "SLIM", "RELAXED", "BAGGY", "OVERSIZED"],
  },
  {
    key: "material",
    label: "MATERIAL",
    defaultOpen: false,
    options: ["COTTON", "DENIM", "FLEECE", "POLYESTER", "LINEN"],
  },
  {
    key: "price",
    label: "PRICE",
    defaultOpen: false,
    options: ["UNDER ₹999", "₹1000-₹1499", "₹1500-₹1999", "₹2000+"],
  },
];

const MOBILE_FILTER_SECTIONS = [
  { key: "deliveryTime", label: "DELIVERY TIME", options: [] },
  ...FILTER_SECTIONS.slice(0, 3),
  { key: "customerReview", label: "CUSTOMER REVIEW", options: [] },
  ...FILTER_SECTIONS.slice(3),
  { key: "collar", label: "COLLAR", options: [] },
];

const getEmptyFilters = () =>
  FILTER_SECTIONS.reduce((filters, section) => {
    filters[section.key] = [];
    return filters;
  }, {});

const getDefaultOpenFilters = () =>
  FILTER_SECTIONS.reduce((state, section) => {
    state[section.key] = section.defaultOpen;
    return state;
  }, {});

const normalize = (value) => String(value || "").toLowerCase().trim();

const normalizeSearchValue = (value) =>
  normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value) =>
  String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getCategoryOptions = (gender) => [
  { label: "All", value: "all" },
  ...(CATEGORY_LINKS_BY_GENDER[gender] || []).map((item) => ({
    label: item.label,
    value: getSubcategoryFromPath(item.path),
  })),
];

const getDisplayLabel = (value, fallback) =>
  titleOverrides[value] || fallback || titleCase(value);

const getSalePrice = (product) => Number(product?.price?.sale ?? product?.price ?? 0);

const getOriginalPrice = (product) => {
  if (typeof product?.price === "object") return Number(product.price?.original || 0);
  return 0;
};

const getImageSrc = (apiUrl, image) => {
  if (!image) return "https://via.placeholder.com/700x900?text=Filo+Teso";
  if (/^https?:\/\//i.test(image)) return image;
  return `${apiUrl}${image}`;
};

const getProductSearchText = (product) =>
  normalizeSearchValue(
    [
      product?.name,
      product?.description,
      product?.category,
      product?.subcategory,
      ...(Array.isArray(product?.subcategories) ? product.subcategories : []),
      ...(Array.isArray(product?.tags) ? product.tags : []),
      ...(Array.isArray(product?.details) ? product.details : []),
      ...(Array.isArray(product?.features) ? product.features : []),
      ...(Array.isArray(product?.washCare) ? product.washCare : []),
    ]
      .filter(Boolean)
      .join(" ")
  );

const getProductSizes = (product) => {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const variantSizes = Array.isArray(product?.sizeVariants)
    ? product.sizeVariants.map((variant) => variant?.size)
    : [];

  return [...sizes, ...variantSizes]
    .map((size) => String(size || "").trim().toUpperCase())
    .filter(Boolean);
};

const matchesTextFilters = (productText, selectedValues) => {
  if (!selectedValues?.length) return true;
  return selectedValues.some((value) => {
    const needle = normalizeSearchValue(value);
    return needle && productText.includes(needle);
  });
};

const matchesPriceFilter = (product, selectedPrices) => {
  if (!selectedPrices?.length) return true;

  const salePrice = getSalePrice(product);
  return selectedPrices.some((priceRange) => {
    switch (priceRange) {
      case "UNDER ₹999":
        return salePrice < 999;
      case "₹1000-₹1499":
        return salePrice >= 1000 && salePrice <= 1499;
      case "₹1500-₹1999":
        return salePrice >= 1500 && salePrice <= 1999;
      case "₹2000+":
        return salePrice >= 2000;
      default:
        return true;
    }
  });
};

const matchesProductFilters = (product, filters) => {
  const productText = getProductSearchText(product);
  const productSizes = getProductSizes(product);

  if (filters.size?.length) {
    const hasSize = filters.size.some((size) =>
      productSizes.includes(String(size || "").trim().toUpperCase())
    );
    if (!hasSize) return false;
  }

  if (!matchesTextFilters(productText, filters.color)) return false;
  if (!matchesTextFilters(productText, filters.pattern)) return false;
  if (!matchesTextFilters(productText, filters.fit)) return false;
  if (!matchesTextFilters(productText, filters.material)) return false;
  if (!matchesPriceFilter(product, filters.price)) return false;

  return true;
};

const ProductList = () => {
  const { category: catParam, subcategory: subParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_API_URL;

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
  const [sortBy, setSortBy] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(20);
  const [openFilters, setOpenFilters] = useState(getDefaultOpenFilters);
  const [expandedFilterOptions, setExpandedFilterOptions] = useState({});
  const [draftFilters, setDraftFilters] = useState(getEmptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(getEmptyFilters);
  const [mobileSheet, setMobileSheet] = useState(null);

  const validCategories = useMemo(
    () => ["all", ...GENDER_TABS.map((tab) => tab.value)],
    []
  );
  const validCat = validCategories.includes(cat);
  const categoryOptions = cat === "all" ? [] : getCategoryOptions(cat);
  const allowedSubcategories =
    cat === "all"
      ? ["all"]
      : [
          ...categoryOptions.map((item) => item.value),
          ...(LEGACY_SUBCATEGORIES[cat] || []),
        ];
  const validSub = allowedSubcategories.includes(sub);
  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("search") || params.get("q") || "";
  }, [location.search]);

  useEffect(() => {
    const nextSub = cat === "all" ? "all" : urlSub;
    setSub(nextSub);
  }, [cat, urlSub]);

  useEffect(() => {
    if (cat === "men" || cat === "women") setStoredShopGender(cat);
  }, [cat]);

  useEffect(() => {
    if (hasSsrProducts) {
      setProducts(ssrProductList.products);
      setLoading(false);
    }
  }, [hasSsrProducts, ssrProductList]);

  useEffect(() => {
    if (!validCat) {
      navigate("/products", { replace: true });
      return;
    }

    if (!validSub) {
      navigate(cat === "all" ? "/products" : `/products/${cat}`, { replace: true });
      return;
    }

    if (hasSsrProducts) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cat !== "all") params.set("category", cat);
        if (sub !== "all" && cat !== "all") params.set("subcategory", sub);

        const query = params.toString();
        const { data } = await axios.get(
          `${apiUrl}/api/products${query ? `?${query}` : ""}`
        );
        setProducts(extractProducts(data));
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiUrl, cat, sub, validCat, validSub, navigate, hasSsrProducts]);

  useEffect(() => {
    setVisibleCount(20);
  }, [cat, sub, sortBy, appliedFilters, searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    const syncPageScrollLock = () => {
      if (mediaQuery.matches) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
      }
    };

    syncPageScrollLock();
    mediaQuery.addEventListener("change", syncPageScrollLock);

    return () => {
      mediaQuery.removeEventListener("change", syncPageScrollLock);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mobileSheet) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [mobileSheet]);

  const searchedProducts = useMemo(() => {
    const query = normalizeSearchValue(searchQuery);
    if (!query) return products;

    return products.filter((product) => getProductSearchText(product).includes(query));
  }, [products, searchQuery]);

  const filteredProducts = useMemo(
    () => searchedProducts.filter((product) => matchesProductFilters(product, appliedFilters)),
    [searchedProducts, appliedFilters]
  );

  const previewFilterCount = useMemo(
    () => searchedProducts.filter((product) => matchesProductFilters(product, draftFilters)).length,
    [searchedProducts, draftFilters]
  );

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    switch (sortBy) {
      case "newest":
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case "price-low":
        return list.sort((a, b) => getSalePrice(a) - getSalePrice(b));
      case "price-high":
        return list.sort((a, b) => getSalePrice(b) - getSalePrice(a));
      case "name":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "recommended":
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const activeOption = categoryOptions.find((item) => item.value === sub);
  const pageTitle =
    searchQuery.trim()
      ? `Search Results`
      : cat === "all"
      ? "All Products"
      : sub !== "all"
        ? getDisplayLabel(sub, activeOption?.label)
        : `${titleCase(cat)} Collection`;

  const goCategory = (category) => {
    if (category === "all") navigate("/products");
    else navigate(`/products/${category}`);
  };

  const goSubcategory = (value) => {
    if (value === "all") navigate(`/products/${cat}`);
    else navigate(`/products/${cat}/${value}`);
  };

  const toggleFilterSection = (key) => {
    setOpenFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleDraftFilter = (key, value) => {
    setDraftFilters((current) => {
      const selectedValues = current[key] || [];
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];

      return { ...current, [key]: nextValues };
    });
  };

  const toggleExpandedFilterOptions = (key) => {
    setExpandedFilterOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const clearFilters = () => {
    const emptyFilters = getEmptyFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setMobileSheet(null);
  };

  const selectSort = (value) => {
    setSortBy(value);
    setMobileSheet(null);
  };

  return (
    <>
      <div className="bg-white text-gray-950 lg:hidden">
        <div className="sticky top-[72px] z-30 border-b border-gray-200 bg-white">
          <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 py-4">
            {cat === "all" ? (
              <>
                <button
                  type="button"
                  onClick={() => goCategory("all")}
                  className="shrink-0 border border-black bg-black px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-white"
                >
                  All
                </button>
                {GENDER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => goCategory(tab.value)}
                    className="shrink-0 border border-black bg-white px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-gray-950"
                  >
                    {tab.label}
                  </button>
                ))}
              </>
            ) : (
              categoryOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => goSubcategory(item.value)}
                  className={`shrink-0 border border-black px-5 py-2.5 text-sm font-medium uppercase tracking-wide ${
                    sub === item.value
                      ? "bg-black text-white"
                      : "bg-white text-gray-950"
                  }`}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>

        <section className="px-2 pb-24 pt-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200" />
                  <div className="mt-3 h-4 w-4/5 bg-gray-200" />
                  <div className="mt-2 h-4 w-1/3 bg-gray-200" />
                </div>
              ))}
            </div>
          ) : sortedProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                {visibleProducts.map((product) => (
                  <ProductTile key={product._id || product.id} product={product} apiUrl={apiUrl} />
                ))}
              </div>

              {visibleCount < sortedProducts.length && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 20)}
                    className="border border-black px-8 py-2.5 text-xs font-black uppercase tracking-wide text-black"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-gray-200 px-5 py-14 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Coming Soon
              </p>
              <h3 className="mt-3 text-xl font-black text-gray-950">
                New {pageTitle} styles are almost here
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-6 text-gray-500">
                Fresh fits for this category are being curated.
              </p>
            </div>
          )}
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-2 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setMobileSheet("filter")}
            className="flex items-center justify-center gap-3 border-r border-gray-200 text-lg font-medium text-black"
          >
            <SlidersHorizontal size={20} strokeWidth={1.7} />
            Filter
          </button>
          <button
            type="button"
            onClick={() => setMobileSheet("sort")}
            className="flex items-center justify-center gap-3 text-lg font-medium text-black"
          >
            <ArrowUpDown size={20} strokeWidth={1.7} />
            Sort
          </button>
        </div>

        <MobileSheet
          sheet={mobileSheet}
          sortBy={sortBy}
          openFilters={openFilters}
          draftFilters={draftFilters}
          expandedFilterOptions={expandedFilterOptions}
          previewFilterCount={previewFilterCount}
          onClose={() => setMobileSheet(null)}
          onSelectSort={selectSort}
          onToggleSection={toggleFilterSection}
          onToggleFilter={toggleDraftFilter}
          onToggleMore={toggleExpandedFilterOptions}
          onClear={clearFilters}
          onApply={applyFilters}
        />
      </div>

      <div className="hidden bg-white px-3 py-5 text-gray-950 sm:px-5 lg:block lg:h-[calc(100vh-72px)] lg:overflow-hidden lg:px-8">
        <div className="mx-auto flex h-full max-w-[1920px] flex-col">
          <div className="shrink-0 border-b border-gray-200 pb-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <h1 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                {pageTitle}
              </h1>

              <div className="w-full lg:w-[300px]">
                <label className="sr-only" htmlFor="category-sort">
                  Sort products
                </label>
                <select
                  id="category-sort"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-11 w-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition focus:border-black"
                >
                  <option value="recommended">Sort</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {cat === "all" ? (
                <>
                  <button
                    type="button"
                    onClick={() => goCategory("all")}
                    className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    All
                  </button>
                  {GENDER_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => goCategory(tab.value)}
                      className="border border-black bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-900 transition hover:bg-black hover:text-white"
                    >
                      {tab.label}
                    </button>
                  ))}
                </>
              ) : (
                categoryOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => goSubcategory(item.value)}
                    className={`border border-black px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                      sub === item.value
                        ? "bg-black text-white"
                        : "bg-white text-gray-900 hover:bg-black hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-5 pt-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            <FilterSidebar
              openFilters={openFilters}
              draftFilters={draftFilters}
              expandedFilterOptions={expandedFilterOptions}
              previewFilterCount={previewFilterCount}
              onToggleSection={toggleFilterSection}
              onToggleFilter={toggleDraftFilter}
              onToggleMore={toggleExpandedFilterOptions}
              onClear={clearFilters}
              onApply={applyFilters}
            />

            <section className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
              <div>
                {loading ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="aspect-[3/4] bg-gray-200" />
                        <div className="mt-3 h-4 w-4/5 bg-gray-200" />
                        <div className="mt-2 h-4 w-1/3 bg-gray-200" />
                      </div>
                    ))}
                  </div>
                ) : sortedProducts.length ? (
                  <>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {visibleProducts.map((product) => (
                        <ProductTile key={product._id || product.id} product={product} apiUrl={apiUrl} />
                      ))}
                    </div>

                    {visibleCount < sortedProducts.length && (
                      <div className="mt-10 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((count) => count + 20)}
                          className="border border-black px-10 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border border-gray-200 px-6 py-16 text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                      Coming Soon
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-gray-950">
                      New {pageTitle} styles are almost here
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-gray-500">
                      We are curating fresh drops for this category. Check back soon for new fits.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

function MobileSheet({
  sheet,
  sortBy,
  openFilters,
  draftFilters,
  expandedFilterOptions,
  previewFilterCount,
  onClose,
  onSelectSort,
  onToggleSection,
  onToggleFilter,
  onToggleMore,
  onClear,
  onApply,
}) {
  if (!sheet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 lg:hidden">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative max-h-[72vh] w-full overflow-hidden bg-white shadow-2xl">
        <div className="flex justify-center py-3">
          <div className="h-1.5 w-16 rounded-full bg-black" />
        </div>

        {sheet === "filter" ? (
          <div className="flex max-h-[calc(72vh-36px)] flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              {MOBILE_FILTER_SECTIONS.map((section) => {
                const isOpen = openFilters[section.key];
                const isExpanded = expandedFilterOptions[section.key];
                const options = Array.isArray(section.options) ? section.options : [];
                const visibleOptions =
                  section.visibleCount && !isExpanded
                    ? options.slice(0, section.visibleCount)
                    : options;

                return (
                  <div key={section.key} className="border-b border-gray-200 py-5">
                    <button
                      type="button"
                      onClick={() => onToggleSection(section.key)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="text-xl font-medium uppercase tracking-tight text-black">
                        {section.label}
                      </span>
                      <span className="text-3xl font-light leading-none text-black">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && visibleOptions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {visibleOptions.map((option) => {
                          const selected = draftFilters[section.key]?.includes(option);

                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => onToggleFilter(section.key, option)}
                              className={`min-h-10 border px-4 text-xs font-semibold uppercase tracking-wide ${
                                selected
                                  ? "border-black bg-black text-white"
                                  : "border-black bg-white text-black"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}

                        {section.visibleCount && options.length > section.visibleCount && (
                          <button
                            type="button"
                            onClick={() => onToggleMore(section.key)}
                            className="w-full pt-2 text-sm font-medium text-black"
                          >
                            {isExpanded ? "View Less" : "View More"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={onClear}
                className="h-14 border border-black bg-white text-lg font-black uppercase tracking-tight text-black"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onApply}
                className="h-14 border border-black bg-black text-lg font-black uppercase tracking-tight text-white"
              >
                Apply ({previewFilterCount})
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-[calc(72vh-36px)] overflow-y-auto px-6 pb-10">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectSort(option.value)}
                className={`block w-full border-b border-gray-200 py-5 text-left text-xl uppercase tracking-tight text-black ${
                  sortBy === option.value ? "font-black" : "font-medium"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSidebar({
  openFilters,
  draftFilters,
  expandedFilterOptions,
  previewFilterCount,
  onToggleSection,
  onToggleFilter,
  onToggleMore,
  onClear,
  onApply,
}) {
  return (
    <aside className="lg:min-h-0 lg:overflow-y-auto">
      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-black">
            Filters
          </h2>
        </div>

        {FILTER_SECTIONS.map((section) => {
          const isOpen = openFilters[section.key];
          const isExpanded = expandedFilterOptions[section.key];
          const visibleOptions =
            section.visibleCount && !isExpanded
              ? section.options.slice(0, section.visibleCount)
              : section.options;

          return (
            <div key={section.key} className="border-b border-gray-200 px-4 py-4">
              <button
                type="button"
                onClick={() => onToggleSection(section.key)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-base font-semibold uppercase tracking-tight text-black">
                  {section.label}
                </span>
                <span className="text-2xl font-light leading-none text-black">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div
                  className={`mt-4 ${
                    section.key === "size"
                      ? "grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5"
                      : "flex flex-wrap justify-center gap-2"
                  }`}
                >
                  {visibleOptions.map((option) => {
                    const selected = draftFilters[section.key]?.includes(option);

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onToggleFilter(section.key, option)}
                        className={`min-h-9 border px-3 text-xs font-semibold uppercase tracking-tight transition ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-black bg-white text-black hover:bg-black hover:text-white"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}

                  {section.visibleCount && section.options.length > section.visibleCount && (
                    <button
                      type="button"
                      onClick={() => onToggleMore(section.key)}
                      className="col-span-full text-center text-sm font-medium text-black"
                    >
                      {isExpanded ? "View Less" : "View More"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3 p-3">
          <button
            type="button"
            onClick={onClear}
            className="h-11 border border-black bg-white text-sm font-black uppercase tracking-tight text-black transition hover:bg-black hover:text-white"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onApply}
            className="h-11 border border-black bg-black text-sm font-black uppercase tracking-tight text-white transition hover:bg-white hover:text-black"
          >
            Apply ({previewFilterCount})
          </button>
        </div>
      </div>
    </aside>
  );
}

function ProductTile({ product, apiUrl }) {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const salePrice = getSalePrice(product);
  const originalPrice = getOriginalPrice(product);
  const productId = product?._id;
  const isWishlisted = Boolean(productId && isInWishlist(productId));

  const handleWishlistToggle = async () => {
    if (!productId) return;

    if (!user || !token) {
      toast.error("Please login to use wishlist");
      navigate("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(error.message || "Wishlist update failed");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden bg-gray-100">
        <Link to={getProductPath(product)} className="block">
          <div className="aspect-[3/4]">
            <img
              src={getImageSrc(apiUrl, product.image)}
              alt={product.name || "Product"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </Link>

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
            isWishlisted ? "text-[#ef6a4d]" : "text-black"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={19}
            strokeWidth={1.7}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>
      </div>

      <Link to={getProductPath(product)} className="mt-3 block min-w-0">
        <h3 className="truncate text-sm font-semibold leading-5 text-gray-900 md:text-base">
          {product.name || "Unnamed Product"}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-black text-black md:text-base">
            ₹{salePrice}
          </span>
          {originalPrice > salePrice && (
            <span className="text-xs font-medium text-gray-400 line-through">
              ₹{originalPrice}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

export default ProductList;
