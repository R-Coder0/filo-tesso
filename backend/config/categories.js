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
};

module.exports.ALL_CATEGORIES = Object.keys(module.exports.CATEGORY_MAP);
