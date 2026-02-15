import React from "react";
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";

const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  if (!wishlist.length) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-gray-600">
        <p className="text-lg font-medium">Your wishlist is empty 💔</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-black text-white px-6 py-3 font-semibold uppercase tracking-wide hover:bg-gray-800"
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 container mx-auto px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => (
          <div
            key={item._id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <img
              src={`${import.meta.env.VITE_API_URL}${item.image}`}
              alt={item.name}
              onClick={() => navigate(`/product/${item._id}`)}
              className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
            />
            <div className="p-3 space-y-1">
              <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
              <p className="text-gray-600">₹{item.price}</p>
              <button
                onClick={() => removeFromWishlist(item._id)}
                className="w-full mt-2 py-2 text-sm border border-gray-300 hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
