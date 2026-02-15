// central source of truth
module.exports.CATEGORY_MAP = {
  men: [
    "jacket",
    "regular-shirt",
    "trousers",
    "jeans",
    "polo-tshirt",
    "oversize-shirt",
    "plus-size",
    "cargos",
    "shoes",
  ],
  women: [
    "top",
    "oversized",
    "co-ord set",
    "joggers",
    "trousers",
    "jeans",
    "sports",
  ],
  customize: [
    "hoodies",
    "sweatshirt",
    "regular-tshirt",
    "oversize-tshirt",
    "polo-tshirt",
    "regular-coupletshirt",
    "oversize-coupletshirt",
    "couple-hoodies",
  ],
};

module.exports.ALL_CATEGORIES = Object.keys(module.exports.CATEGORY_MAP);
