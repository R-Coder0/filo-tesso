import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { C as CartContext, A as AuthContext, u as useWishlist, a as useUI } from "../entry-server.js";
import { FaSearch, FaChevronDown, FaCartPlus, FaHeart, FaUser, FaUserCircle, FaChevronRight } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { RiCloseFill } from "react-icons/ri";
import { e as eleven, s as six, o as one, a as seven, f as four, t as three, b as two, c as eight, d as five, i as imagefourteen, g as imagesixteen, h as imagefifteen, j as imageseventeen, k as imageeighteen, l as imagenineteen, m as imagetwenty, n as imagetwentyone, p as imagetwentytwo } from "./2-RYtUXRMA.js";
import "react-dom/server";
import "react-router-dom/server.mjs";
import "lucide-react";
import "react-fast-marquee";
import "react-hot-toast";
const imageone = "/assets/banner-BVsprJgX.png";
const logoImg = "/assets/logo-CEWxxi6L.png";
const ten = "/assets/10-YNLWB7mR.svg";
const thirteen = "/assets/13-BmjnaRSX.svg";
const imagetwentythree = "/assets/3-DHxJUMVY.svg";
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
    { label: "Shoes", path: "/products/men/shoes", img: five }
  ],
  womens: [
    { label: "Top", path: "/products/women/top", img: imagefourteen },
    { label: "Oversized", path: "/products/women/oversized", img: imagesixteen },
    { label: "Co-ord set", path: "/products/women/co-ord-set", img: imagefifteen },
    { label: "Joggers", path: "/products/women/joggers", img: imageseventeen },
    { label: "Trousers", path: "/products/women/trousers", img: imageeighteen },
    { label: "Jeans", path: "/products/women/jeans", img: imagenineteen },
    { label: "Sports", path: "/products/women/sports", img: imagetwenty }
  ],
  customize: [
    { label: "Hoodies", path: "/products/customize/hoodies", img: thirteen },
    { label: "Sweatshirt", path: "/products/customize/sweatshirt", img: ten },
    { label: "Regular T-shirt", path: "/products/customize/regular-tshirt", img: imagefourteen },
    { label: "Oversize T-shirt", path: "/products/customize/oversize-tshirt", img: three },
    { label: "Polo T-shirts", path: "/products/customize/polo-tshirt", img: imagesixteen },
    { label: "Regular CoupleTshirt", path: "/products/customize/regular-coupletshirt", img: imagetwentyone },
    { label: "Oversize CoupleTshirt", path: "/products/customize/oversize-coupletshirt", img: imagetwentytwo },
    { label: "Couple Hoodies", path: "/products/customize/couple-hoodies", img: imagetwentythree }
  ]
};
const Navbar = () => {
  const { cartItems } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { wishlist } = useWishlist();
  const [displayName, setDisplayName] = useState("");
  useEffect(() => {
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
  const apiUrl = "http://localhost:5000";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const dropdownTimeoutRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const handleCartClick = () => {
    setShowCartSidebar(true);
    setIsMenuOpen(false);
    setMobileDropdown(null);
  };
  const handleProfileClick = () => navigate(user ? "/profile" : "/login");
  const handleDropdownMouseEnter = (name) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(name);
  };
  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 180);
  };
  const handleCategoryClick = (category, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(null);
    const urls = {
      mens: "/products/men",
      womens: "/products/women",
      customize: "/products/customize"
    };
    navigate(urls[category]);
  };
  const toggleMobileDropdown = (name) => setMobileDropdown(mobileDropdown === name ? null : name);
  const handleMobileLinkClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setMobileDropdown(null);
  };
  const getUserInitials = () => {
    if (!displayName) return "";
    return displayName.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };
  const DropdownPanel = ({ children }) => /* @__PURE__ */ jsx(
    "div",
    {
      className: `absolute left-0 mt-3 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl z-[60]
                  transition-all duration-200 ${activeDropdown ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`,
      style: { width: 560, maxHeight: "70vh", overflow: "auto" },
      onMouseEnter: () => dropdownTimeoutRef.current && clearTimeout(dropdownTimeoutRef.current),
      onMouseLeave: handleDropdownMouseLeave,
      children
    }
  );
  const DropdownGrid = ({ items }) => /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-4 p-4 cursor-pointer", children: items.map((it) => /* @__PURE__ */ jsxs(
    Link,
    {
      to: it.path,
      onClick: () => setActiveDropdown(null),
      className: "group flex flex-col items-start\n                     border border-gray-200\n                     hover:border-gray-900\n                     hover:shadow-lg\n                     bg-white transition-all cursor-pointer",
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-full aspect-square overflow-hidden border border-gray-200 flex items-center justify-center", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: it.img,
            alt: it.label,
            className: "max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 w-full", children: /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-gray-900\n                         group-hover:text-gray-600 p-2", children: it.label }) })
      ]
    },
    it.path
  )) });
  const SearchComponent = React.memo(({ isMobile = false }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const inputRef = useRef(null);
    const searchTimerRef = useRef(null);
    const searchAbortRef = useRef(null);
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
            signal: controller.signal
          });
          const qLower = q.toLowerCase();
          const list = (Array.isArray(res.data) ? res.data : res.data?.products || []).sort((a, b) => {
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
    return /* @__PURE__ */ jsxs("div", { className: "w-full", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: `flex items-center rounded-full px-3 py-2 bg-gray-50 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-gray-900 ${isMobile ? "shadow-lg" : ""}`, children: [
        /* @__PURE__ */ jsx(FaSearch, { className: "text-gray-400 mr-2 text-base" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "text",
            value: query,
            autoComplete: "off",
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: "false",
            inputMode: "search",
            enterKeyHint: "search",
            placeholder: "Search products...",
            className: "w-full outline-none text-base bg-transparent text-gray-900 placeholder-gray-400",
            onChange: (e) => {
              const v = e.target.value;
              setQuery(v);
              runSearch(v);
            }
          }
        ),
        query && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setQuery("");
              setSuggestions([]);
            },
            className: "text-sm text-gray-400 hover:text-gray-900 px-1.5",
            title: "Clear",
            children: "✕"
          }
        )
      ] }),
      hasQuery && (suggestions.length > 0 || searchLoading || noResults) && /* @__PURE__ */ jsx("div", { className: `mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden ${isMobile ? "max-h-[65vh] overflow-y-auto" : "absolute left-0 right-0"} z-[70]`, children: searchLoading ? /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm text-gray-500", children: "Searching…" }) : suggestions.length > 0 ? /* @__PURE__ */ jsx("div", { className: "divide-y divide-gray-100", children: suggestions.map((p) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-3 cursor-pointer",
          onClick: () => handleSuggestionClick(p),
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: p.image ? `${apiUrl}${p.image}` : imageone,
                alt: p.name || "Product",
                className: "w-full h-full object-cover",
                onError: (e) => {
                  e.currentTarget.src = imageone;
                }
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "min-w-0", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-900 font-medium truncate", children: p.name || "Product" }) })
          ]
        },
        p._id || p.id || p.slug || p.name
      )) }) : /* @__PURE__ */ jsx("div", { className: "px-4 py-4 text-center text-sm text-gray-600", children: "No products found" }) })
    ] });
  });
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      className: "sticky top-0 w-full z-50 bg-white border-b border-gray-200",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "container mx-auto grid grid-cols-3 items-center px-4 sm:px-6 lg:px-8 py-1 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 dropdown-container", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsMenuOpen(!isMenuOpen),
                className: "lg:hidden text-2xl p-1 text-gray-900 hover:text-gray-600",
                "aria-label": "Menu",
                children: isMenuOpen ? /* @__PURE__ */ jsx(RiCloseFill, {}) : /* @__PURE__ */ jsx(GiHamburgerMenu, {})
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center space-x-8 pt-2", children: [
              /* @__PURE__ */ jsx(Link, { to: "/", className: "text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide", children: "Home" }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "relative",
                  onMouseEnter: () => handleDropdownMouseEnter("mens"),
                  onMouseLeave: handleDropdownMouseLeave,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: (e) => handleCategoryClick("mens", e),
                        className: "flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide",
                        children: [
                          /* @__PURE__ */ jsx("span", { children: "Mens" }),
                          /* @__PURE__ */ jsx(FaChevronDown, { className: `text-xs transition-transform ${activeDropdown === "mens" ? "rotate-180" : ""}` })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(DropdownPanel, { children: activeDropdown === "mens" && /* @__PURE__ */ jsx(DropdownGrid, { items: SUBCATEGORIES.mens }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "relative",
                  onMouseEnter: () => handleDropdownMouseEnter("womens"),
                  onMouseLeave: handleDropdownMouseLeave,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: (e) => handleCategoryClick("womens", e),
                        className: "flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide",
                        children: [
                          /* @__PURE__ */ jsx("span", { children: "Womens" }),
                          /* @__PURE__ */ jsx(FaChevronDown, { className: `text-xs transition-transform ${activeDropdown === "womens" ? "rotate-180" : ""}` })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(DropdownPanel, { children: activeDropdown === "womens" && /* @__PURE__ */ jsx(DropdownGrid, { items: SUBCATEGORIES.womens }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "relative",
                  onMouseEnter: () => handleDropdownMouseEnter("customize"),
                  onMouseLeave: handleDropdownMouseLeave,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: (e) => handleCategoryClick("customize", e),
                        className: "flex items-center gap-1 text-gray-900 hover:text-gray-600 text-sm font-medium uppercase tracking-wide",
                        children: [
                          /* @__PURE__ */ jsx("span", { children: "Customize" }),
                          /* @__PURE__ */ jsx(FaChevronDown, { className: `text-xs transition-transform ${activeDropdown === "customize" ? "rotate-180" : ""}` })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(DropdownPanel, { children: activeDropdown === "customize" && /* @__PURE__ */ jsx(DropdownGrid, { items: SUBCATEGORIES.customize }) })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "justify-self-center", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex items-center pt-3", children: /* @__PURE__ */ jsx("img", { src: logoImg, alt: "Filo Teso", className: "h-10 w-auto md:h-12" }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "lg:hidden p-2 text-gray-900 hover:text-gray-600",
                onClick: () => {
                  setShowSearch(true);
                  setIsMenuOpen(false);
                },
                "aria-label": "Search",
                children: /* @__PURE__ */ jsx(FaSearch, {})
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "hidden lg:block relative", children: /* @__PURE__ */ jsx("div", { className: "w-[240px]", children: /* @__PURE__ */ jsx(SearchComponent, {}) }) }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleCartClick,
                className: "relative flex items-center gap-2 text-gray-900 hover:text-gray-600 text-sm font-medium",
                "aria-label": "Cart",
                children: [
                  /* @__PURE__ */ jsx(FaCartPlus, { className: "text-xl" }),
                  itemCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-3 -right-2\n                             bg-gray-900\n                             text-white rounded-full w-4 h-4\n                             flex items-center justify-center text-xs font-medium", children: itemCount })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => navigate("/wishlist"),
                className: "hidden md:block relative text-gray-900 hover:text-gray-600 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(FaHeart, { className: "text-xl" }),
                  wishlist.length > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full", children: wishlist.length })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "md:hidden", children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleMobileLinkClick(user ? "/profile" : "/login"),
                className: "p-2 text-gray-900 hover:text-gray-600",
                children: /* @__PURE__ */ jsx(FaUser, { className: "w-5 h-5" })
              }
            ) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleProfileClick,
                className: "hidden md:flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors group",
                "aria-label": "Profile",
                children: user && displayName ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium", children: getUserInitials() }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium max-w-[100px] truncate", children: displayName.split(" ")[0] })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(FaUserCircle, { className: "text-xl text-gray-400 group-hover:text-gray-600" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Login" })
                ] })
              }
            )
          ] })
        ] }),
        showSearch && /* @__PURE__ */ jsx(
          "div",
          {
            className: "fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] lg:hidden",
            onClick: () => setShowSearch(false),
            children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: "absolute left-0 right-0 top-0 bg-white rounded-b-2xl shadow-xl p-4 pt-5",
                onClick: (e) => e.stopPropagation(),
                children: [
                  /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200 mt-6" }),
                  /* @__PURE__ */ jsx(SearchComponent, { isMobile: true }),
                  /* @__PURE__ */ jsx("div", { className: "mt-3 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setShowSearch(false),
                      className: "text-sm px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 text-gray-700",
                      children: "Close"
                    }
                  ) })
                ]
              }
            )
          }
        ),
        isMenuOpen && /* @__PURE__ */ jsxs("div", { className: "lg:hidden bg-white border-t border-gray-200 max-h-[calc(100vh-100px)] overflow-y-auto pb-20 shadow-xl", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleMobileLinkClick("/"),
              className: "block w-full text-left px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium uppercase tracking-wide border-b border-gray-100",
              children: "Home"
            }
          ),
          [
            { key: "mens", title: "Mens", items: SUBCATEGORIES.mens, mainPath: "/products/men" },
            { key: "womens", title: "Womens", items: SUBCATEGORIES.womens, mainPath: "/products/women" },
            { key: "customize", title: "Customize", items: SUBCATEGORIES.customize, mainPath: "/products/customize" }
          ].map((sec) => /* @__PURE__ */ jsxs("div", { className: "border-b border-gray-100", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => toggleMobileDropdown(sec.key),
                className: "flex items-center justify-between w-full text-left px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium uppercase tracking-wide",
                children: [
                  /* @__PURE__ */ jsx("span", { children: sec.title }),
                  /* @__PURE__ */ jsx(FaChevronRight, { className: `text-gray-400 transition-transform ${mobileDropdown === sec.key ? "rotate-90" : ""}` })
                ]
              }
            ),
            mobileDropdown === sec.key && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 py-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleMobileLinkClick(sec.mainPath),
                  className: "w-full text-left px-6 py-3 hover:bg-white transition-colors font-medium text-gray-900",
                  children: [
                    "All ",
                    sec.title
                  ]
                }
              ),
              sec.items.map((it) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleMobileLinkClick(it.path),
                  className: "w-full text-left px-6 py-3 hover:bg-white transition-colors",
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200", children: /* @__PURE__ */ jsx("img", { src: it.img || imageone, alt: it.label, className: "w-full h-full object-cover" }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-gray-700 text-sm", children: it.label })
                  ] })
                },
                it.path
              ))
            ] })
          ] }, sec.key)),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleMobileLinkClick(user ? "/profile" : "/login"),
              className: "block w-full text-left px-6 py-4 text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium",
              children: user ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium", children: getUserInitials() }),
                /* @__PURE__ */ jsx("span", { children: displayName || "Profile" })
              ] }) : "Login"
            }
          ) })
        ] })
      ]
    }
  );
};
export {
  Navbar as default
};
