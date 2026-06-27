// src/components/Navbar.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Heart, Search as SearchIcon, ShoppingBag, UserRound, X } from "lucide-react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { useWishlist } from "../context/WishlistContext";
import logoImg from "../assets/logo.png";
import { extractProducts, openProductInNewTab } from "../utils/products";
import {
  CATEGORY_LINKS_BY_GENDER,
  GENDER_TABS,
  setStoredShopGender,
} from "../utils/navigationCategories";

const SIDE_MENU_LINKS = [
  { label: "About", path: "/about" },
  { label: "Blogs", path: "/blog" },
  { label: "Contact", path: "/contact" },
  { label: "New Arrival", path: "/products?sort=newest" },
  { label: "Bestseller", path: "/products?sort=bestseller" },
];

const Navbar = () => {
  const { cartItems } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { setShowCartSidebar } = useUI();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [displayName, setDisplayName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

const [selectedGender, setSelectedGender] = useState("men");

const selectGender = (gender) => {
  const nextGender = setStoredShopGender(gender);
  setSelectedGender(nextGender);
};

useEffect(() => {
  if (location.pathname.startsWith("/products/women")) {
    selectGender("women");
  } else if (location.pathname.startsWith("/products/men")) {
    selectGender("men");
  }
}, [location.pathname]);

const categoryLinks = CATEGORY_LINKS_BY_GENDER[selectedGender];
const isProductListRoute =
  location.pathname === "/products" || location.pathname.startsWith("/products/");
const shouldShowCategoryNav = !isProductListRoute;

  const itemCount = cartItems.reduce(
    (count, item) => count + (item.quantity || 0),
    0
  );
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const storedName = localStorage.getItem("customUserName");
    setDisplayName(storedName || user?.name || "");
  }, [user]);

  useEffect(() => {
    const updateName = () => {
      const storedName = localStorage.getItem("customUserName");
      setDisplayName(storedName || user?.name || "");
    };

    window.addEventListener("storage", updateName);
    return () => window.removeEventListener("storage", updateName);
  }, [user]);

  useEffect(() => {
    if (!isMenuOpen && !showSearch) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen, showSearch]);

  const closeMenu = () => setIsMenuOpen(false);

  const getUserInitials = () => {
    if (!displayName) return "";

    return displayName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCartClick = () => {
    setShowCartSidebar(true);
    closeMenu();
  };

  const handleProfileClick = () => {
    navigate(user ? "/profile" : "/login");
    closeMenu();
  };

  const handleWishlistClick = () => {
    navigate("/wishlist");
    closeMenu();
  };

  const handleMenuSearchClick = () => {
    closeMenu();
    setShowSearch(true);
  };

const isCategoryActive = (item) => {
  const cleanPath = item.path.split("?")[0];
  return location.pathname === cleanPath;
};

  const SearchBox = React.memo(({ isMobile = false }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const inputRef = useRef(null);
    const searchTimerRef = useRef(null);
    const searchAbortRef = useRef(null);

    useEffect(() => {
      if (!isMobile || !inputRef.current) return undefined;

      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }, [isMobile]);

    const runSearch = (value) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();

      const nextQuery = String(value || "").trim();

      if (!nextQuery) {
        setSuggestions([]);
        setSearchLoading(false);
        return;
      }

      searchTimerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        searchAbortRef.current = controller;
        setSearchLoading(true);

        try {
          const response = await axios.get(`${apiUrl}/api/products`, {
            params: { q: nextQuery },
            signal: controller.signal,
          });

          const lowerQuery = nextQuery.toLowerCase();

          const list = extractProducts(response.data).sort((a, b) => {
            const aName = (a.name || "").toLowerCase();
            const bName = (b.name || "").toLowerCase();

            if (aName === lowerQuery) return -1;
            if (bName === lowerQuery) return 1;

            const aIncludes = aName.includes(lowerQuery);
            const bIncludes = bName.includes(lowerQuery);

            if (aIncludes && !bIncludes) return -1;
            if (!aIncludes && bIncludes) return 1;

            return aName.localeCompare(bName);
          });

          setSuggestions(list.slice(0, 9));
        } catch {
          setSuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      }, 260);
    };

    const clearSearch = () => {
      setQuery("");
      setSuggestions([]);
    };

    const handleSuggestionClick = (product) => {
      clearSearch();
      openProductInNewTab(product);

      if (isMobile) setShowSearch(false);
    };

    const handleSubmit = (event) => {
      event.preventDefault();

      const nextQuery = query.trim();

      if (!nextQuery) return;

      navigate(`/products?search=${encodeURIComponent(nextQuery)}`);

      if (isMobile) setShowSearch(false);
    };

    const hasQuery = query.trim().length > 0;
    const noResults = !searchLoading && hasQuery && suggestions.length === 0;

    return (
      <form className="relative w-full" onSubmit={handleSubmit}>
        <div
          className={`flex h-10 items-center border border-black bg-white px-3 transition focus-within:ring-1 focus-within:ring-black ${
            isMobile ? "h-13" : "w-full"
          }`}
        >
          <SearchIcon
            className="mr-2 h-5 w-5 shrink-0 text-black"
            strokeWidth={1.8}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            inputMode="search"
            enterKeyHint="search"
            placeholder='Search "WHITE SHIRTS"'
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              runSearch(value);
            }}
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="ml-2 flex h-8 w-8 items-center justify-center text-gray-500 hover:text-black"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasQuery && (suggestions.length > 0 || searchLoading || noResults) && (
          <div
            className={`absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-[60vh] overflow-y-auto border border-gray-200 bg-white shadow-xl ${
              isMobile ? "" : "min-w-full"
            }`}
          >
            {searchLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {suggestions.map((product) => (
                  <button
                    key={product._id || product.id || product.name}
                    type="button"
                    onClick={() => handleSuggestionClick(product)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={product.image ? `${apiUrl}${product.image}` : "/icon.png"}
                        alt={product.name || "Product"}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "/icon.png";
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {product.name || "Product"}
                      </p>

                      {product.category && (
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                          {product.category}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-sm text-gray-600">
                No products found
              </div>
            )}
          </div>
        )}
      </form>
    );
  });

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-[0_2px_14px_rgba(0,0,0,0.08)]">
        <div className="relative grid h-[72px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 border-b border-gray-200 px-3 sm:px-6 md:flex md:justify-between lg:px-8">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="group flex h-11 w-11 items-center justify-center"
            aria-label="Open menu"
          >
            <span className="flex w-7 flex-col gap-[7px]">
              <span className="h-px w-full bg-black transition group-hover:bg-gray-600" />
              <span className="h-px w-full bg-[#ef6a4d] transition group-hover:bg-black" />
              <span className="h-px w-full bg-black transition group-hover:bg-gray-600" />
            </span>
          </button>

          <Link
            to="/"
            className="inline-flex w-full max-w-[170px] items-center justify-center justify-self-center sm:max-w-[220px] md:absolute md:left-1/2 md:top-1/2 md:w-auto md:max-w-none md:-translate-x-1/2 md:-translate-y-1/2"
            aria-label="Filo Teso home"
          >
            <img
              src={logoImg}
              alt="Filo Teso"
              className="h-10 w-auto max-w-full object-contain sm:h-11 md:h-12 md:max-w-none"
            />
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-1 md:ml-auto md:gap-2">
            <div className="hidden w-[330px] xl:block">
              <SearchBox />
            </div>

            <button
              type="button"
              className="hidden h-9 w-9 cursor-pointer items-center justify-center text-black transition hover:text-gray-600 min-[430px]:flex xl:hidden"
              onClick={() => setShowSearch(true)}
              aria-label="Search"
            >
              <SearchIcon className="h-5 w-5" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={handleProfileClick}
              className="flex h-9 min-w-9 cursor-pointer items-center justify-center text-black transition hover:text-gray-600"
              aria-label={user ? "Profile" : "Login"}
            >
              {user && displayName ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
                  {getUserInitials()}
                </span>
              ) : (
                <UserRound className="h-5 w-5" strokeWidth={1.6} />
              )}
            </button>

            <button
              type="button"
              onClick={handleWishlistClick}
              className="relative hidden h-9 w-9 cursor-pointer items-center justify-center text-black transition hover:text-gray-600 md:flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" strokeWidth={1.7} />

              {wishlistCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef6a4d] px-1 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCartClick}
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center text-black transition hover:text-gray-600"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />

              {itemCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef6a4d] px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {shouldShowCategoryNav && (
        <nav className="bg-white max-w-[1700px] mx-auto">
          <div className="flex items-center gap-4 px-3 py-3 sm:px-5 lg:gap-8 lg:px-8">
            {/* Left Side: Men / Women */}
            <div className="grid h-11 md:h-12 w-[170px] md:w-[220px] shrink-0 grid-cols-2 rounded-full bg-white p-1 shadow-[0_4px_22px_rgba(0,0,0,0.14)] ring-1 ring-black">
  {GENDER_TABS.map((tab) => {
    const isActive = selectedGender === tab.value;

    return (
      <button
        key={tab.value}
        type="button"
        onClick={() => selectGender(tab.value)}
        className={`flex h-full items-center justify-center rounded-full text-sm font-black uppercase tracking-wide transition md:text-base ${
          isActive
            ? "bg-black text-white"
            : "bg-white text-black hover:bg-black hover:text-white"
        }`}
      >
        {tab.label}
      </button>
    );
  })}
            </div>

            {/* Right Side: Categories */}
            <div className="hide-scrollbar flex h-12 flex-1 items-center gap-6 overflow-x-auto whitespace-nowrap lg:justify-between lg:gap-8">
              {categoryLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`relative flex h-full items-center px-1 text-sm font-medium text-black transition hover:text-[#ef6a4d] md:text-base ${
                    isCategoryActive(item) ? "text-[#ef6a4d]" : ""
                  }`}
                >
                  {item.label}

                  <span
                    className={`absolute bottom-0 left-0 h-[3px] bg-[#ef6a4d] transition-all ${
                      isCategoryActive(item) ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

      <div
        className={`fixed inset-0 z-[90] flex transition ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <aside
          className={`h-full w-[min(82vw,420px)] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="grid h-20 grid-cols-3 items-center border-b border-gray-100 px-5">
            <button
              type="button"
              onClick={closeMenu}
              className="flex h-11 w-11 items-center justify-center text-black transition hover:text-[#ef6a4d]"
              aria-label="Close menu"
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <X className="h-7 w-7" strokeWidth={1.6} />
            </button>

            <p className="justify-self-center text-xl font-bold uppercase tracking-wide text-black">
              Menu
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="mb-5 grid gap-3">
              <button
                type="button"
                onClick={handleWishlistClick}
                className="flex w-full items-center justify-between border border-black px-4 py-3 text-sm font-bold uppercase text-black transition hover:bg-black hover:text-white"
                tabIndex={isMenuOpen ? 0 : -1}
              >
                <span className="flex items-center gap-3">
                  <Heart className="h-5 w-5" strokeWidth={1.7} />
                  Wishlist
                </span>
                {wishlistCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef6a4d] px-1.5 text-xs font-semibold text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleMenuSearchClick}
                className="flex w-full items-center gap-3 border border-gray-200 px-4 py-3 text-sm font-bold uppercase text-black transition hover:border-black"
                tabIndex={isMenuOpen ? 0 : -1}
              >
                <SearchIcon className="h-5 w-5" strokeWidth={1.8} />
                Search
              </button>
            </div>

            <nav className="space-y-1">
              {SIDE_MENU_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={closeMenu}
                  className="block border-b border-gray-100 py-4 text-lg font-medium uppercase tracking-wide text-black transition hover:text-[#ef6a4d]"
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={closeMenu}
          className={`flex-1 bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={isMenuOpen ? 0 : -1}
        />
      </div>

      {showSearch && (
        <div className="fixed inset-0 z-[95] bg-black/35 px-4 pt-5 backdrop-blur-[2px] lg:hidden">
          <div className="mx-auto max-w-xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Search
              </p>

              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="flex h-9 w-9 items-center justify-center text-black"
                aria-label="Close search"
              >
                <X className="h-6 w-6" strokeWidth={1.6} />
              </button>
            </div>

            <SearchBox isMobile />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
