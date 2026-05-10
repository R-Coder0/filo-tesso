// central source of truth
const MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES = [
  "regular-tshirt",
  "oversize-tshirt",
  "polo-tshirt",
];

module.exports.CATEGORY_MAP = {
  men: [
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
    "hoodies",
    "sweatshirt",
    "regular-coupletshirt",
    "oversize-coupletshirt",
    "couple-hoodies",
  ],
};

module.exports.ALL_CATEGORIES = Object.keys(module.exports.CATEGORY_MAP);
module.exports.MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES = MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES;
