export const SHOP_GENDER_STORAGE_KEY = "filotesoShopGender";
export const SHOP_GENDER_CHANGE_EVENT = "filoteso:shop-gender-change";

export const GENDER_TABS = [
  { label: "Men", value: "men", path: "/products/men" },
  { label: "Women", value: "women", path: "/products/women" },
];

export const CATEGORY_LINKS_BY_GENDER = {
  men: [
    { label: "OverSize Tshirt", path: "/products/men/oversize-tshirt" },
    { label: "Polo Tshirt", path: "/products/men/polo-tshirt" },
    { label: "Tshirt", path: "/products/men/regular-tshirt" },
    { label: "Shirt", path: "/products/men/regular-shirt" },
    { label: "Oversize Shirt", path: "/products/men/oversize-shirt" },
    { label: "Jeans", path: "/products/men/jeans" },
    { label: "Trouser", path: "/products/men/trousers" },
  ],
  women: [
    { label: "Tshirt", path: "/products/women/regular-tshirt" },
    { label: "OverSize Tshirt", path: "/products/women/oversize-tshirt" },
    { label: "Polo Tshirt", path: "/products/women/polo-tshirt" },
    { label: "Top", path: "/products/women/top" },
    { label: "Co-ord Set", path: "/products/women/co-ord-set" },
    { label: "Joggers", path: "/products/women/joggers" },
    { label: "Trouser", path: "/products/women/trousers" },
    { label: "Jeans", path: "/products/women/jeans" },
    { label: "Sports", path: "/products/women/sports" },
  ],
};

export const normalizeShopGender = (value) =>
  value === "women" ? "women" : "men";

export const getStoredShopGender = () => {
  if (typeof window === "undefined") return "men";
  return normalizeShopGender(window.localStorage.getItem(SHOP_GENDER_STORAGE_KEY));
};

export const setStoredShopGender = (gender) => {
  const nextGender = normalizeShopGender(gender);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SHOP_GENDER_STORAGE_KEY, nextGender);
    window.dispatchEvent(
      new CustomEvent(SHOP_GENDER_CHANGE_EVENT, {
        detail: { gender: nextGender },
      })
    );
  }
  return nextGender;
};

export const getSubcategoryFromPath = (path) => {
  const segments = String(path || "").split("/").filter(Boolean);
  return segments[0] === "products" ? segments[2] || "" : "";
};
