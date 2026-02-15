// src/components/Navbar.jsx
  import React, { useContext, useState, useRef, useEffect } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import axios from "axios";
  import { CartContext } from "../context/CartContext";
  import { AuthContext } from "../context/AuthContext";
  import { useUI } from "../context/UIContext";
  import { FaCartPlus, FaUserCircle, FaChevronDown, FaChevronRight, FaSearch, FaUser } from "react-icons/fa";
  import { GiHamburgerMenu } from "react-icons/gi";
  import { RiCloseFill } from "react-icons/ri";
  import { FaHeart } from "react-icons/fa";
  import { useWishlist } from "../context/WishlistContext";

  import imageone from "../assets/banner.png";
  import logoImg from "../assets/logo.png";

  import one from "../assets/mensimage/1.png"
  import two from "../assets/mensimage/2.png"
  import three from "../assets/mensimage/3.png"
  import four from "../assets/mensimage/4.png"
  import five from "../assets/mensimage/5.png"
  import six from "../assets/mensimage/6.png"
  import seven from "../assets/mensimage/7.png"
import eight from "../assets/mensimage/8.png"
import nine from "../assets/mensimage/9.svg"
import ten from "../assets/mensimage/10.svg"
import eleven from "../assets/mensimage/11.png"
import thirteen from "../assets/mensimage/13.svg"

import imagefourteen from "../assets/womensimage/14.png"
import imagefifteen from "../assets/womensimage/15.png"
import imagesixteen from "../assets/womensimage/16.png"
import imageseventeen from "../assets/womensimage/17.png"
import imageeighteen from "../assets/womensimage/18.png"
import imagenineteen from "../assets/womensimage/19.png"
import imagetwenty from "../assets/womensimage/20.png"
import imagetwentyone from "../assets/custom/1.svg"
import imagetwentytwo from "../assets/custom/2.svg"
import imagetwentythree from "../assets/custom/3.svg"

/* URL structure: /products/men|women|customize and /products/:category/:subcategory */
const SUBCATEGORIES = {
  mens: [
    { label: "Jackets", path: "/products/men/jacket", img: eleven },
    { label: "Shirts", path: "/products/men/regular-shirt", img: six },
    { label: "Trousers", path: "/products/men/trousers", img: one },
    { label: "Jeans", path: "/products/men/jeans", img: seven },
    { label: "Polos", path: "/products/men/polo-tshirt", img: four },
    { label: "Oversize Shirt", path: "/products/men/oversize-shirt", img: three },
    { label: "Plus Size", path: "/products/men/plus-size", img: two },
    { label: "Cargos", path: "/products/men/cargos", img: eight },
    { label: "Shoes", path: "/products/men/shoes", img: five },

  ],
  womens: [
    { label: "Top", path: "/products/women/top", img: imagefourteen },
    { label: "Oversized", path: "/products/women/oversized", img: imagesixteen },
    { label: "Co-ord set", path: "/products/women/co-ord-set", img: imagefifteen },
    { label: "Joggers", path: "/products/women/joggers", img: imageseventeen },
    { label: "Trousers", path: "/products/women/trousers", img: imageeighteen },
    { label: "Jeans", path: "/products/women/jeans", img: imagenineteen },
    { label: "Sports", path: "/products/women/sports", img: imagetwenty },
  ],
  customize: [
    { label: "Hoodies", path: "/products/customize/hoodies", img: thirteen },
    { label: "Sweatshirt", path: "/products/customize/sweatshirt", img: ten },
    { label: "Regular T-shirt", path: "/products/customize/regular-tshirt", img: imagefourteen },
    { label: "Oversize T-shirt", path: "/products/customize/oversize-tshirt", img: three },
    { label: "Polo T-shirts", path: "/products/customize/polo-tshirt", img: imagesixteen },
    { label: "Regular CoupleTshirt", path: "/products/customize/regular-coupletshirt", img: imagetwentyone },
    { label: "Oversize CoupleTshirt", path: "/products/customize/oversize-coupletshirt", img: imagetwentytwo },
    { label: "Couple Hoodies", path: "/products/customize/couple-hoodies", img: imagetwentythree },
  ],
};
const Navbar = () => {
  const { cartItems } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { wishlist } = useWishlist();

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // localStorage se naam nikal lo
    const storedName = localStorage.getItem("customUserName");
    if (storedName) {
      setDisplayName(storedName);
    } else if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const updateName = () => {
      const storedName = localStorage.getItem("customUserName");
      setDisplayName(storedName || user?.name || "");
    };
    window.addEventListener("storage", updateName);
    return () => window.removeEventListener("storage", updateName);
  }, [user]);

  const { setShowCartSidebar } = useUI();
  const navigate = useNavigate();
  const itemCount = cartItems.reduce((a, c) => a + c.quantity, 0);
  const apiUrl = import.meta.env.VITE_API_URL;

  // dropdown + menus
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const dropdownTimeoutRef = useRef(null);

  // mobile search overlay
  const [showSearch, setShowSearch] = useState(false);

  // ---------- helpers ----------
  const handleCartClick = () => {
    setShowCartSidebar(true);
    setIsMenuOpen(false);
    setMobileDropdown(null);
  };

  const handleProfileClick = () => navigate(user ? "/profile" : "/login");

  // Desktop dropdown hover open/close with small delay
  const handleDropdownMouseEnter = (name) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(name);
  };

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 180);
  };

  // Category click handler
  const handleCategoryClick = (category, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(null);

    const urls = {
      mens: "/products/men",
      womens: "/products/women",
      customize: "/products/customize",
    };

    navigate(urls[category]);
  };

  // Mobile dropdown accordion
  const toggleMobileDropdown = (name) => setMobileDropdown(mobileDropdown === name ? null : name);

  const handleMobileLinkClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setMobileDropdown(null);
  };

  // Get initials for avatar
  const getUserInitials = () => {
    if (!displayName) return "";
    return displayName
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ---- dropdown panels -----------------------------------------
  const DropdownPanel = ({ children }) => (
    <div
      className={`absolute left-0 mt-3 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl z-[60]
                  transition-all duration-200 ${activeDropdown ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
      style={{ width: 560, maxHeight: "70vh", overflow: "auto" }}
      onMouseEnter={() => dropdownTimeoutRef.current && clearTimeout(dropdownTimeoutRef.current)}
      onMouseLeave={handleDropdownMouseLeave}
    >
      {children}
    </div>
  );

  // Desktop grid items as Links so click is reliable
  const DropdownGrid = ({ items }) => (
    <div className="grid grid-cols-3 gap-4 p-4 cursor-pointer">
      {items.map((it) => (
        <Link
          key={it.path}
          to={it.path}
          onClick={() => setActiveDropdown(null)}
          className="group flex flex-col items-start
                     border border-gray-200
                     hover:border-gray-900
                     hover:shadow-lg
                     bg-white transition-all cursor-pointer"
        >
          <div className="w-full aspect-square overflow-hidden border border-gray-200 flex items-center justify-center">
            <img
              src={it.img}
              alt={it.label}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="mt-1 w-full">
            <div className="text-sm font-semibold text-gray-900
                         group-hover:text-gray-600 p-2">
              {it.label}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  // ---- Search Component ----------------
  const SearchComponent = React.memo(({ isMobile = false }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const inputRef = useRef(null);
    const searchTimerRef = useRef(null);
    const searchAbortRef = useRef(null);

    // Focus input when mobile overlay mounts
    useEffect(() => {
      if (isMobile && inputRef.current) {
        const t = setTimeout(() => inputRef.current?.focus(), 120);
        return () => clearTimeout(t);
      }
    }, [isMobile]);

    const runSearch = (text) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();

      const q = (text ?? query).trim();
      if (q.length < 1) {
        setSuggestions([]);
        setSearchLoading(false);
        return;
      }

      searchTimerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        searchAbortRef.current = controller;
        setSearchLoading(true);
        try {
          const res = await axios.get(`${apiUrl}/api/products`, {
            params: { q },
            signal: controller.signal,
          });

          // Relevance sort: exact first, then contains, then alpha
          const qLower = q.toLowerCase();
          const list = (Array.isArray(res.data) ? res.data : res.data?.products || [])
            .sort((a, b) => {
              const aName = (a.name || "").toLowerCase();
              const bName = (b.name || "").toLowerCase();
              if (aName === qLower) return -1;
              if (bName === qLower) return 1;
              const aInc = aName.includes(qLower);
              const bInc = bName.includes(qLower);
              if (aInc && !bInc) return -1;
              if (!aInc && bInc) return 1;
              return aName.localeCompare(bName);
            });

          setSuggestions(list.slice(0, 9));
        } catch {
          setSuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      }, 280);
    };

    const handleSuggestionClick = (product) => {
      setQuery("");
      setSuggestions([]);
      navigate(`/product/${product._id}`);
      if (isMobile) setShowSearch(false);
    };

    const hasQuery = query.trim().length > 0;
    const noResults = !searchLoading && hasQuery && suggestions.length === 0;

    return (
      <div className="w-full" onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center rounded-full px-3 py-2 bg-gray-50 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-gray-900 ${isMobile ? "shadow-lg" : ""}`}>
          <FaSearch className="text-gray-400 mr-2 text-base" />

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
            placeholder="Search products..."
            className="w-full outline-none text-base bg-transparent text-gray-900 placeholder-gray-400"
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              runSearch(v);
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
              }}
              className="text-sm text-gray-400 hover:text-gray-900 px-1.5"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results for mobile and desktop */}
        {(hasQuery && (suggestions.length > 0 || searchLoading || noResults)) && (
          <div className={`mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden ${isMobile ? "max-h-[65vh] overflow-y-auto" : "absolute left-0 right-0"} z-[70]`}>
            {searchLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
            ) : suggestions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {suggestions.map((p) => (
                  <div
                    key={p._id || p.id || p.slug || p.name}
                    className="w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                    onClick={() => handleSuggestionClick(p)}
                  >
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                      <img
                        src={p.image ? `${apiUrl}${p.image}` : imageone}
                        alt={p.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = imageone; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 font-medium truncate">{p.name || "Product"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-sm text-gray-600">No products found</div>
            )}
          </div>
        )}
      </div>
    );
  });

  // ---- UI ------------------------------------------------------
  return (
    <nav
      className="fixed top-[0px] w-full z-50 bg-white border-b border-gray-200"
    >
      {/* 3-column grid keeps logo centered on mobile too */}
      <div className="container mx-auto grid grid-cols-3 items-center px-4 sm:px-6 lg:px-8 py-1 gap-2">
        {/* Left: hamburger on mobile + desktop categories on lg */}
        <div className="flex items-center gap-3 dropdown-container">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-2xl p-1 text-gray-900 hover:text-gray-600"
            aria-label="Menu"
          >
            {isMenuOpen ? <RiCloseFill /> : <GiHamburgerMenu />}
          </button>

          <div className="hidden lg:flex items-center space-x-8 pt-2">
            <Link to="/" className="text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide">
              Home
            </Link>

            {/* Mens */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownMouseEnter("mens")}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <button
                onClick={(e) => handleCategoryClick("mens", e)}
                className="flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide"
              >
                <span>Mens</span>
                <FaChevronDown className={`text-xs transition-transform ${activeDropdown === "mens" ? "rotate-180" : ""}`} />
              </button>
              <DropdownPanel>{activeDropdown === "mens" && <DropdownGrid items={SUBCATEGORIES.mens} />}</DropdownPanel>
            </div>

            {/* Womens */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownMouseEnter("womens")}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <button
                onClick={(e) => handleCategoryClick("womens", e)}
                className="flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide"
              >
                <span>Womens</span>
                <FaChevronDown className={`text-xs transition-transform ${activeDropdown === "womens" ? "rotate-180" : ""}`} />
              </button>
              <DropdownPanel>{activeDropdown === "womens" && <DropdownGrid items={SUBCATEGORIES.womens} />}</DropdownPanel>
            </div>

            {/* Customize */}
            <div
              className="relative"
              onMouseEnter={() => handleDropdownMouseEnter("customize")}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <button
                onClick={(e) => handleCategoryClick("customize", e)}
                className="flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide"
              >
                <span>Customize</span>
                <FaChevronDown className={`text-xs transition-transform ${activeDropdown === "customize" ? "rotate-180" : ""}`} />
              </button>
              <DropdownPanel>{activeDropdown === "customize" && <DropdownGrid items={SUBCATEGORIES.customize} />}</DropdownPanel>
            </div>
          </div>
        </div>

        {/* Center: logo image always centered */}
        <div className="justify-self-center">
          <Link to="/" className="inline-flex items-center pt-3">
            <img src={logoImg} alt="Filo Teso" className="h-14 w-auto md:h-17" />
          </Link>
        </div>

        {/* Right: search + cart + profile */}
        <div className="flex items-center justify-end gap-3">
          {/* Mobile search toggle shows full overlay */}
          <button
            className="lg:hidden p-2 text-gray-900 hover:text-gray-600"
            onClick={() => {
              setShowSearch(true);
              setIsMenuOpen(false);
            }}
            aria-label="Search"
          >
            <FaSearch />
          </button>

          {/* Desktop compact search */}
          <div className="hidden lg:block relative">
            <div className="w-[240px]">
              <SearchComponent />
            </div>
          </div>

          <button
            onClick={handleCartClick}
            className="relative flex items-center gap-2 text-gray-900 hover:text-gray-600 text-sm font-medium"
            aria-label="Cart"
          >
            <FaCartPlus className="text-xl" />
            {itemCount > 0 && (
              <span className="absolute -top-3 -right-2
                             bg-gray-900
                             text-white rounded-full w-4 h-4
                             flex items-center justify-center text-xs font-medium">
                {itemCount}
              </span>
            )}
          </button>

          {/* wishlist */}
          <button
            onClick={() => navigate("/wishlist")}
            className="hidden md:block relative text-gray-900 hover:text-gray-600 transition-colors"
          >
            <FaHeart className="text-xl" />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Mobile profile icon */}
          <div className="md:hidden">
            <button
              onClick={() => handleMobileLinkClick(user ? "/profile" : "/login")}
              className="p-2 text-gray-900 hover:text-gray-600"
            >
              <FaUser className="w-5 h-5" />
            </button>
          </div>

          {/* Profile button with improved styling */}
          <button
            onClick={handleProfileClick}
            className="hidden md:flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors group"
            aria-label="Profile"
          >
            {user && displayName ? (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  {getUserInitials()}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {displayName.split(" ")[0]}
                </span>
              </>
            ) : (
              <>
                <FaUserCircle className="text-xl text-gray-400 group-hover:text-gray-600" />
                <span className="text-sm font-medium">Login</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search overlay: fixed, full-width, pretty, and it works */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="absolute left-0 right-0 top-0 bg-white rounded-b-2xl shadow-xl p-4 pt-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* drag handle vibe */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200 mt-6" />
            <SearchComponent isMobile={true} />
            <div className="mt-3 text-right">
              <button
                onClick={() => setShowSearch(false)}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 max-h-[calc(100vh-100px)] overflow-y-auto pb-20 shadow-xl">
          <button
            onClick={() => handleMobileLinkClick("/")}
            className="block w-full text-left px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium uppercase tracking-wide border-b border-gray-100"
          >
            Home
          </button>

          {[
            { key: "mens", title: "Mens", items: SUBCATEGORIES.mens, mainPath: "/products/men" },
            { key: "womens", title: "Womens", items: SUBCATEGORIES.womens, mainPath: "/products/women" },
            { key: "customize", title: "Customize", items: SUBCATEGORIES.customize, mainPath: "/products/customize" },
          ].map((sec) => (
            <div key={sec.key} className="border-b border-gray-100">
              <button
                onClick={() => toggleMobileDropdown(sec.key)}
                className="flex items-center justify-between w-full text-left px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium uppercase tracking-wide"
              >
                <span>{sec.title}</span>
                <FaChevronRight className={`text-gray-400 transition-transform ${mobileDropdown === sec.key ? "rotate-90" : ""}`} />
              </button>
              {mobileDropdown === sec.key && (
                <div className="bg-gray-50 py-2">
                  {/* Main category link */}
                  <button
                    onClick={() => handleMobileLinkClick(sec.mainPath)}
                    className="w-full text-left px-6 py-3 hover:bg-white transition-colors font-medium text-gray-900"
                  >
                    All {sec.title}
                  </button>
                  {/* Subcategory links */}
                  {sec.items.map((it) => (
                    <button
                      key={it.path}
                      onClick={() => handleMobileLinkClick(it.path)}
                      className="w-full text-left px-6 py-3 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                          <img src={it.img || imageone} alt={it.label} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-gray-700 text-sm">{it.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div>
            <button
              onClick={() => handleMobileLinkClick(user ? "/profile" : "/login")}
              className="block w-full text-left px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  <span>{displayName || "Profile"}</span>
                </div>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;