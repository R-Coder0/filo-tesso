import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/products`);
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list.slice(0, 8));
      } catch (error) {
        console.error("Error fetching home products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiUrl]);

  return (
    <section className="relative overflow-hidden bg-white py-10 md:py-12">
      <div className="absolute inset-x-0 top-0 h-px bg-gray-200" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(0deg,#000_1px,transparent_1px)] bg-[length:36px_36px]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-400">
              Curated for you
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-900">
              Premium Collection
            </h2>
            <div className="mt-3 h-px w-24 bg-black" />
          </div>

          <Link
            to="/products"
            className="self-start border border-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-black hover:text-white md:self-auto"
          >
            View All Products
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse border border-gray-200 bg-white">
                <div className="aspect-square bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 bg-gray-200" />
                  <div className="h-3 w-1/2 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 bg-white py-12 text-center">
            <p className="text-sm font-medium text-gray-500">
              Products will appear here once added.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeProducts;
