import React from "react";
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  openProductInNewTab,
  resolveImageSrc,
} from "../utils/products";

const getSalePrice = (item) =>
  typeof item?.price === "object" ? item.price?.sale : item?.price;

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(error.message || "Could not remove product");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (!wishlist.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center text-gray-600">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Heart className="h-7 w-7" strokeWidth={1.7} />
        </div>
        <p className="text-lg font-medium">Your wishlist is empty</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-full bg-black px-6 py-3 font-semibold uppercase tracking-wide text-white hover:bg-gray-800"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-[60vh] bg-white px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">My Wishlist</h1>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {wishlist.map((item) => (
          <article
            key={item._id}
            className="group overflow-hidden border border-gray-200 bg-white transition hover:shadow-lg"
          >
            <img
              src={resolveImageSrc(apiUrl, item.image)}
              alt={item.name || "Wishlist product"}
              onClick={() => openProductInNewTab(item)}
              className="aspect-[4/5] w-full cursor-pointer object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="space-y-1 p-3">
              <h3 className="truncate font-semibold text-gray-800">{item.name}</h3>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">
                  ₹{getSalePrice(item) ?? 0}
                </span>
                {item.price?.original ? (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{item.price.original}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item._id)}
                className="mt-3 w-full border border-black py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
