import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { useSsrData } from "../context/SsrDataContext";
import { extractProducts } from "../utils/products";

const OversizeTshirtProducts = () => {
  const ssrProducts = useSsrData("homeOversizeProducts");
  const hasSsrProducts = Array.isArray(ssrProducts);
  const [products, setProducts] = useState(() => (hasSsrProducts ? ssrProducts : []));
  const [loading, setLoading] = useState(!hasSsrProducts);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (hasSsrProducts) return;

    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/products?subcategory=oversize-tshirt`
        );
        const list = extractProducts(data);
        setProducts(list.slice(0, 8));
      } catch (error) {
        console.error("Error fetching oversize t-shirt products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiUrl, hasSsrProducts]);

  return (
    <section className="relative overflow-hidden bg-white py-10 md:py-12">
      <div className="absolute inset-x-0 top-0 h-px bg-gray-200" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(0deg,#000_1px,transparent_1px)] bg-[length:36px_36px]" />

      <div className="relative max-w-[1700px] mx-auto px-4 md:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gray-400">
              Relaxed fits
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-900">
              Oversize T-shirts
            </h2>
            <div className="mt-3 h-px w-24 bg-black" />
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Link
              to="/products/men/oversize-tshirt"
              className="border border-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-black hover:text-white"
            >
              Men
            </Link>
            <Link
              to="/products/women/oversize-tshirt"
              className="border border-gray-300 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 transition hover:border-black hover:text-black"
            >
              Women
            </Link>
          </div>
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
          <div className="border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
              Coming Soon
            </p>
            <p className="mt-3 text-sm font-medium text-gray-600">
              Oversize T-shirt products will appear here once added.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default OversizeTshirtProducts;
