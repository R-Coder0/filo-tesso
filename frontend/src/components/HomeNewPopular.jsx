import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import {
  extractProducts,
  getProductCardImageSources,
  getProductPath,
} from "../utils/products";
import {
  CATEGORY_LINKS_BY_GENDER,
  SHOP_GENDER_CHANGE_EVENT,
  getStoredShopGender,
  getSubcategoryFromPath,
  normalizeShopGender,
} from "../utils/navigationCategories";

const PRODUCTS_PER_PAGE = 20;
const LOAD_MORE_DELAY_MS = 650;

const getProductKey = (product) =>
  String(product?._id || product?.productId || product?.id || product?.slug || "");

const mergeUniqueProducts = (currentProducts, newProducts) => {
  const seen = new Set(currentProducts.map(getProductKey).filter(Boolean));
  return [
    ...currentProducts,
    ...newProducts.filter((product) => {
      const key = getProductKey(product);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function HomeNewPopular() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [gender, setGender] = useState(() => getStoredShopGender());
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
  const loadMoreRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const requestGenerationRef = useRef(0);

  const categories = useMemo(
    () => [
      { label: "All", value: "all" },
      ...(CATEGORY_LINKS_BY_GENDER[gender] || []).map((item) => ({
        label: item.label,
        value: getSubcategoryFromPath(item.path),
      })),
    ],
    [gender]
  );

  useEffect(() => {
    setCategory("all");
  }, [gender]);

  useEffect(() => {
    const handleGenderChange = (event) => {
      setGender(normalizeShopGender(event.detail?.gender));
    };

    window.addEventListener(SHOP_GENDER_CHANGE_EVENT, handleGenderChange);
    return () => window.removeEventListener(SHOP_GENDER_CHANGE_EVENT, handleGenderChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestGeneration = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestGeneration;

    const fetchProducts = async () => {
      setLoading(true);
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
      setProducts([]);
      setPage(1);
      setHasMore(true);

      try {
        const params = new URLSearchParams({
          category: gender,
          page: "1",
          limit: String(PRODUCTS_PER_PAGE),
        });
        if (category !== "all") params.set("subcategory", category);

        const { data } = await axios.get(
          `${apiUrl}/api/products?${params.toString()}`,
          { signal: controller.signal }
        );
        const list = extractProducts(data);
        const totalPages = Number(data?.data?.total_pages || 1);

        if (isMounted && requestGenerationRef.current === requestGeneration) {
          setProducts(list);
          setHasMore(totalPages > 1);
        }
      } catch (error) {
        if (error.code === "ERR_CANCELED") return;
        console.error("Error fetching home popular products:", error);
        if (isMounted && requestGenerationRef.current === requestGeneration) {
          setProducts([]);
          setHasMore(false);
        }
      } finally {
        if (isMounted && requestGenerationRef.current === requestGeneration) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiUrl, gender, category]);

  const loadMoreProducts = useCallback(async () => {
    if (loading || isLoadingMoreRef.current || !hasMore) return;

    const requestGeneration = requestGenerationRef.current;
    const nextPage = page + 1;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      await wait(LOAD_MORE_DELAY_MS);
      if (requestGenerationRef.current !== requestGeneration) return;

      const params = new URLSearchParams({
        category: gender,
        page: String(nextPage),
        limit: String(PRODUCTS_PER_PAGE),
      });
      if (category !== "all") params.set("subcategory", category);

      const { data } = await axios.get(
        `${apiUrl}/api/products?${params.toString()}`
      );
      if (requestGenerationRef.current !== requestGeneration) return;

      const list = extractProducts(data);
      const totalPages = Number(data?.data?.total_pages || nextPage);

      setProducts((current) => mergeUniqueProducts(current, list));
      setPage(nextPage);
      setHasMore(nextPage < totalPages);
    } catch (error) {
      console.error("Error loading more home products:", error);
      toast.error("More products could not be loaded. Please try again.");
    } finally {
      if (requestGenerationRef.current === requestGeneration) {
        isLoadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [apiUrl, category, gender, hasMore, loading, page]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      !loadMoreRef.current ||
      loading ||
      !hasMore
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreProducts();
      },
      { rootMargin: "500px 0px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMoreProducts, loading]);

  const activeCategoryLabel =
    categories.find((item) => item.value === category)?.label || "All";

  const handleWishlistToggle = async (product) => {
    const productId = product?._id;
    if (!productId) return;

    if (!user || !token) {
      toast.error("Please login to use wishlist");
      navigate("/login");
      return;
    }

    setWishlistLoadingId(productId);
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(error.message || "Wishlist update failed");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  return (
    <section className="bg-white pb-6 pt-12 md:pb-8 md:pt-14">
      <div className="mx-auto max-w-[1700px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-950 md:text-3xl">
            New And Popular
          </h2>

          <div className="mt-7 flex flex-col items-center gap-5">
            <div className="hide-scrollbar flex w-full items-center gap-3 overflow-x-auto pb-1 md:justify-center">
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={`shrink-0 border px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                    category === item.value
                      ? "border-black bg-black text-white"
                      : "border-black bg-white text-gray-900 hover:bg-black hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-9">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[4/5] bg-gray-200" />
                  <div className="mt-3 h-4 w-3/4 bg-gray-200" />
                  <div className="mt-2 h-4 w-1/3 bg-gray-200" />
                </div>
              ))}
            </div>
          ) : products.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-5">
              {products.map((product) => {
                const { mainSrc, hoverSrc } = getProductCardImageSources(
                  product,
                  apiUrl,
                  "https://via.placeholder.com/600x750?text=No+Image"
                );

                return (
                <article key={product._id || product.id} className="group">
                  <div className="relative overflow-hidden bg-gray-100">
                    <Link to={getProductPath(product)} className="block">
                      <div className="relative aspect-[4/5]">
                        <img
                          src={mainSrc}
                          alt={product.name}
                          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                            hoverSrc ? "group-hover:opacity-0" : ""
                          }`}
                          loading="lazy"
                        />
                        {hoverSrc && (
                          <img
                            src={hoverSrc}
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                            loading="lazy"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleWishlistToggle(product)}
                      disabled={wishlistLoadingId === product._id}
                      className={`absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                        isInWishlist(product._id) ? "text-[#ef6a4d]" : "text-black"
                      }`}
                      aria-label={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        size={18}
                        strokeWidth={1.8}
                        fill={isInWishlist(product._id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <Link to={getProductPath(product)} className="mt-3 block">
                    <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 md:text-base">
                      {product.name || "Product"}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-black text-black md:text-base">
                        ₹{product.price?.sale || 0}
                      </span>
                      {product.price?.original ? (
                        <span className="text-xs font-medium text-gray-400 line-through">
                          ₹{product.price.original}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-gray-200 px-6 py-14 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                Coming Soon
              </p>
              <h3 className="mt-3 text-xl font-black tracking-tight text-gray-950 md:text-2xl">
                {activeCategoryLabel} styles are almost here
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-gray-500">
                We are curating fresh {gender} drops for this category. Check back soon for new fits.
              </p>
            </div>
          )}

          {!loading && products.length > 0 && hasMore && (
            <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center pt-4">
              {loadingMore ? (
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
                  Loading more products
                </div>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                  Scroll for more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
