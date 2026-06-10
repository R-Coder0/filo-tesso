// central source of truth
const MOVED_CUSTOMIZE_TSHIRT_SUBCATEGORIES = [
  "regular-tshirt",
  "oversize-tshirt",
  "polo-tshirt",
];

module.exports.CATEGORY_MAP = {
  men: [
    "oversize-tshirt",
    "polo-tshirt",
    "regular-tshirt",
    "regular-shirt",
    "oversize-shirt",
    "jeans",
    "trousers",
    "sneakers",
    "perfume",
    // Legacy values kept valid so older products can still be edited/saved.
    "plus-shirt",
    "plus-size",
    "shoes",
    "perfumes",
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
