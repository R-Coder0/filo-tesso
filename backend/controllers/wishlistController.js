const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

async function ensureWishlist(userId) {
  let wl = await Wishlist.findOne({ userId });
  if (!wl) wl = await Wishlist.create({ userId, products: [] });
  return wl;
}

// ✅ GET /api/wishlist
exports.getMyWishlist = async (req, res) => {
  const wl = await ensureWishlist(req.user._id);
  const populated = await Wishlist.findById(wl._id)
    .populate("products", "name price image category subcategory")
    .lean();

  res.json({
    count: populated.products.length,
    products: populated.products,
  });
};

// ✅ POST /api/wishlist/:productId
exports.addToWishlist = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId).select("_id");
  if (!product) return res.status(404).json({ message: "Product not found" });

  const wl = await ensureWishlist(userId);
  await Wishlist.updateOne({ _id: wl._id }, { $addToSet: { products: product._id } });

  const updated = await Wishlist.findById(wl._id).populate("products", "name price image");
  res.status(201).json({
    message: "Added to wishlist",
    count: updated.products.length,
    products: updated.products,
  });
};

// ✅ DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const wl = await ensureWishlist(req.user._id);
  await Wishlist.updateOne({ _id: wl._id }, { $pull: { products: productId } });

  const updated = await Wishlist.findById(wl._id).populate("products", "name price image");
  res.json({
    message: "Removed from wishlist",
    count: updated.products.length,
    products: updated.products,
  });
};

// ✅ DELETE /api/wishlist (clear all)
exports.clearWishlist = async (req, res) => {
  const wl = await ensureWishlist(req.user._id);
  wl.products = [];
  await wl.save();
  res.json({ message: "Wishlist cleared" });
};
