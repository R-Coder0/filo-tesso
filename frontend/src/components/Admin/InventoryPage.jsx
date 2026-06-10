import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, Boxes, RefreshCw, Save, Search } from "lucide-react";
import { extractProducts } from "../../utils/products";

const stockStatus = (stock) => {
  const value = Number(stock || 0);
  if (value <= 0) return { label: "Out of Stock", className: "text-red-600" };
  if (value <= 5) return { label: "Low Stock", className: "text-orange-600" };
  return { label: "In Stock", className: "text-green-700" };
};

export default function InventoryPage() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const axiosAdmin = useMemo(
    () =>
      axios.create({
        baseURL: `${apiUrl}/api/products`,
        headers: {
          authorization: import.meta.env.VITE_ADMIN_TOKEN,
        },
      }),
    [apiUrl]
  );

  const fetchProducts = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await axiosAdmin.get("/");
      const list = extractProducts(data);
      setProducts(list);
      const nextDrafts = {};
      list.forEach((product) => {
        nextDrafts[product._id] = {
          stock: Number(product.stock || 0),
          sizeVariants: Array.isArray(product.sizeVariants)
            ? product.sizeVariants.map((variant) => ({
                size: String(variant.size || "").toUpperCase(),
                stock: Number(variant.stock || 0),
              }))
            : [],
        };
      });
      setDrafts(nextDrafts);
    } catch {
      setMessage("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      const stock = Number(drafts[product._id]?.stock ?? product.stock ?? 0);
      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.subcategory?.toLowerCase().includes(search);

      if (!matchesSearch) return false;
      if (filter === "low") return stock > 0 && stock <= 5;
      if (filter === "out") return stock <= 0;
      return true;
    });
  }, [drafts, filter, products, query]);

  const totals = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        const stock = Number(drafts[product._id]?.stock ?? product.stock ?? 0);
        acc.units += stock;
        if (stock <= 0) acc.out += 1;
        else if (stock <= 5) acc.low += 1;
        return acc;
      },
      { units: 0, low: 0, out: 0 }
    );
  }, [drafts, products]);

  const updateCommonStock = (productId, value) => {
    const stock = Math.max(0, Number(value || 0));
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] || {}),
        stock,
      },
    }));
  };

  const updateVariantStock = (productId, size, value) => {
    const stock = Math.max(0, Number(value || 0));
    setDrafts((current) => {
      const draft = current[productId] || { stock: 0, sizeVariants: [] };
      const sizeVariants = (draft.sizeVariants || []).map((variant) =>
        variant.size === size ? { ...variant, stock } : variant
      );
      const totalStock = sizeVariants.reduce(
        (sum, variant) => sum + Number(variant.stock || 0),
        0
      );
      return {
        ...current,
        [productId]: {
          ...draft,
          sizeVariants,
          stock: totalStock,
        },
      };
    });
  };

  const saveProduct = async (product) => {
    const draft = drafts[product._id];
    if (!draft) return;

    setSavingId(product._id);
    setMessage("");
    try {
      await axiosAdmin.put(`/${product._id}`, {
        stock: draft.stock,
        sizeVariants: draft.sizeVariants || [],
      });
      setProducts((current) =>
        current.map((item) =>
          item._id === product._id
            ? {
                ...item,
                stock: draft.stock,
                sizeVariants: draft.sizeVariants || [],
              }
            : item
        )
      );
      setMessage(`Inventory saved for ${product.name}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save inventory");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
            Stock Control
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-950 md:text-3xl">
            Inventory Management
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center justify-center gap-2 border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Total Units
          </p>
          <p className="mt-3 text-2xl font-bold text-gray-950">{totals.units}</p>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Low Stock
          </p>
          <p className="mt-3 text-2xl font-bold text-orange-600">{totals.low}</p>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Out of Stock
          </p>
          <p className="mt-3 text-2xl font-bold text-red-600">{totals.out}</p>
        </div>
      </div>

      <div className="border border-gray-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, category, subcategory..."
              className="w-full border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-black"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {[
              ["all", "All"],
              ["low", "Low Stock"],
              ["out", "Out of Stock"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`whitespace-nowrap border px-4 py-2 text-sm font-semibold ${
                  filter === value
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-gray-700 hover:border-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          <AlertTriangle size={16} />
          {message}
        </div>
      )}

      {loading ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">
          Loading inventory...
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const draft = drafts[product._id] || {
              stock: product.stock || 0,
              sizeVariants: [],
            };
            const status = stockStatus(draft.stock);
            const hasVariants = draft.sizeVariants?.length > 0;

            return (
              <div key={product._id} className="border border-gray-200 bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-[80px_minmax(0,1fr)_minmax(260px,0.75fr)_auto] lg:items-center">
                  <div className="h-20 w-20 overflow-hidden border border-gray-200 bg-gray-50">
                    {product.image ? (
                      <img
                        src={`${apiUrl}${product.image}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Boxes size={22} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-gray-950">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                      {product.category}
                      {product.subcategories?.length
                        ? ` / ${product.subcategories.join(", ")}`
                        : product.subcategory
                          ? ` / ${product.subcategory}`
                          : ""}
                    </p>
                    <p className={`mt-2 text-xs font-bold uppercase ${status.className}`}>
                      {status.label}
                    </p>
                  </div>

                  <div>
                    {hasVariants ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {draft.sizeVariants.map((variant) => (
                          <label
                            key={variant.size}
                            className="block border border-gray-200 px-2 py-2"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                              {variant.size}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(event) =>
                                updateVariantStock(
                                  product._id,
                                  variant.size,
                                  event.target.value
                                )
                              }
                              className="mt-1 w-full border border-gray-300 px-2 py-1.5 text-sm font-semibold outline-none focus:border-black"
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                          Common Stock
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={draft.stock}
                          onChange={(event) =>
                            updateCommonStock(product._id, event.target.value)
                          }
                          className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => saveProduct(product)}
                    disabled={savingId === product._id}
                    className="inline-flex h-10 items-center justify-center gap-2 border border-black bg-black px-4 text-sm font-semibold text-white hover:bg-white hover:text-black disabled:opacity-50"
                  >
                    <Save size={16} />
                    {savingId === product._id ? "Saving" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}

          {!filteredProducts.length && (
            <div className="border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No products match this inventory filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
