// src/components/Admin/ManageProducts.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Central map: yahi se options aayenge
const CATEGORY_MAP = {
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

const emptyProduct = {
  name: "",
  image: null, // File
  images: [], // File[] (we will store as array, not FileList)
  price: "",
  description: "",
  features: "",
  category: "",
  subcategory: "",
};

const ManageProducts = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // previews
  const [mainPreview, setMainPreview] = useState(""); // url string
  const [galleryPreviews, setGalleryPreviews] = useState([]); // [{id, url, file}]
  const [existingMainImage, setExistingMainImage] = useState(""); // for edit mode existing image path

  const axiosAdmin = useMemo(() => {
    return axios.create({
      baseURL: `${apiUrl}/api/products`,
      headers: {
        authorization: import.meta.env.VITE_ADMIN_TOKEN,
      },
    });
  }, [apiUrl]);

  const subcats = newProduct.category ? CATEGORY_MAP[newProduct.category] || [] : [];

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axiosAdmin.get("/");
      setProducts(res.data);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.removeItem("fromDashboard");
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll lock when modal open
  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isModalOpen]);

  // ESC close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // cleanup object urls on unmount
  useEffect(() => {
    return () => {
      if (mainPreview?.startsWith("blob:")) URL.revokeObjectURL(mainPreview);
      galleryPreviews.forEach((g) => {
        if (g.url?.startsWith("blob:")) URL.revokeObjectURL(g.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetPreviews = () => {
    if (mainPreview?.startsWith("blob:")) URL.revokeObjectURL(mainPreview);
    galleryPreviews.forEach((g) => {
      if (g.url?.startsWith("blob:")) URL.revokeObjectURL(g.url);
    });
    setMainPreview("");
    setGalleryPreviews([]);
    setExistingMainImage("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewProduct(emptyProduct);
    setError(null);
    resetPreviews();
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewProduct(emptyProduct);
    setError(null);
    resetPreviews();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setNewProduct({
      name: product.name || "",
      price: product.price ?? "",
      description: product.description || "",
      features: product.features?.join(", ") || "",
      image: null,
      images: [],
      category: product.category || "",
      subcategory: product.subcategory || "",
    });

    setExistingMainImage(product.image ? `${apiUrl}${product.image}` : "");
    setMainPreview(""); // only show existing until user selects new
    setGalleryPreviews([]); // fresh
    setError(null);
    setIsModalOpen(true);
  };

  const handleMainImageChange = (file) => {
    // cleanup old preview
    if (mainPreview?.startsWith("blob:")) URL.revokeObjectURL(mainPreview);

    if (!file) {
      setNewProduct((p) => ({ ...p, image: null }));
      setMainPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setNewProduct((p) => ({ ...p, image: file }));
    setMainPreview(url);
  };

  const handleGalleryChange = (fileList) => {
    const files = fileList ? Array.from(fileList) : [];

    // cleanup old previews
    galleryPreviews.forEach((g) => {
      if (g.url?.startsWith("blob:")) URL.revokeObjectURL(g.url);
    });

    const mapped = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      url: URL.createObjectURL(file),
    }));

    setNewProduct((p) => ({ ...p, images: files }));
    setGalleryPreviews(mapped);
  };

  const removeGalleryItem = (id) => {
    const item = galleryPreviews.find((g) => g.id === id);
    if (item?.url?.startsWith("blob:")) URL.revokeObjectURL(item.url);

    const nextPreviews = galleryPreviews.filter((g) => g.id !== id);
    setGalleryPreviews(nextPreviews);
    setNewProduct((p) => ({ ...p, images: nextPreviews.map((x) => x.file) }));
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!newProduct.category) throw new Error("Please select a category");
      if (!newProduct.subcategory) throw new Error("Please select a subcategory");

      if (editingId) {
        // ✅ Update via JSON (images optional)
        await axiosAdmin.put(`/${editingId}`, {
          name: newProduct.name,
          price: newProduct.price,
          description: newProduct.description,
          features: newProduct.features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean),
          category: newProduct.category,
          subcategory: newProduct.subcategory,
        });

        // NOTE: If you want to update main/gallery images in edit mode,
        // you need backend endpoint for multipart update. Currently edit = JSON only (as you had).
      } else {
        // ✅ Create with multipart (images + fields)
        const formData = new FormData();
        formData.append("name", newProduct.name);
        formData.append("price", newProduct.price);
        formData.append("description", newProduct.description);
        formData.append("category", newProduct.category);
        formData.append("subcategory", newProduct.subcategory);

        newProduct.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
          .forEach((f) => formData.append("features", f));

        if (newProduct.image) formData.append("image", newProduct.image);

        if (newProduct.images?.length > 0) {
          newProduct.images.forEach((img) => formData.append("images", img));
        }

        await axiosAdmin.post(`/`, formData);
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setIsLoading(true);
    setError(null);
    try {
      await axiosAdmin.delete(`/${id}`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto py-10">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Manage Products</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add, edit, and maintain your product catalog.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-medium"
            >
              ← Back
            </button>

            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Error */}
        {error && !isModalOpen && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Product List</h3>
            <span className="text-sm text-gray-600">
              {isLoading ? "Loading..." : `${products.length} items`}
            </span>
          </div>

          {isLoading ? (
            <div className="p-6 text-gray-600">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-6 text-gray-600">No products found.</div>
          ) : (
            <div className="p-5 space-y-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* image */}
                    <div className="w-full sm:w-24 sm:h-24 h-44 rounded-lg bg-gray-100 overflow-hidden border shrink-0">
                      {product.image ? (
                        <img
                          src={`${apiUrl}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                            {product.name}
                          </h4>

                          {(product.category || product.subcategory) && (
                            <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-600">
                              {product.category}
                              {product.subcategory ? ` / ${product.subcategory}` : ""}
                            </p>
                          )}

                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <p className="text-gray-900 font-semibold text-base sm:text-lg">
                            ₹{product.price}
                          </p>
                        </div>
                      </div>

                      {/* actions */}
                      <div className="mt-4 flex gap-2 sm:justify-end">
                        <button
                          onClick={() => openEditModal(product)}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4"
            aria-modal="true"
            role="dialog"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/55"
              onClick={closeModal}
              aria-hidden="true"
            />

            {/* Panel */}
            <div
              className="
                relative w-full max-w-3xl
                bg-white rounded-2xl shadow-xl border border-gray-200
                max-h-[92vh] overflow-hidden
              "
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white p-4 sm:p-2 border-b border-gray-200 flex items-start justify-between">
                <div className="pr-8">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingId ? "Edit Product" : "Add Product"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {editingId ? "Update basic details." : "Upload image and fill product details."}
                  </p>

                  {error && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <form onSubmit={handleAddOrUpdate} encType="multipart/form-data">
                <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-140px)]">
                  {/* Previews Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    {/* Main image preview */}
                    <div className="border rounded-xl p-3 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Main Image Preview</p>
                      <div className="w-full h-44 rounded-lg overflow-hidden bg-white border flex items-center justify-center">
                        {mainPreview ? (
                          <img src={mainPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : existingMainImage ? (
                          <img
                            src={existingMainImage}
                            alt="Existing"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">No preview</span>
                        )}
                      </div>
                      {(mainPreview || existingMainImage) && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleMainImageChange(null)}
                            className="text-xs font-semibold text-gray-700 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Gallery preview */}
                    <div className="border rounded-xl p-3 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Gallery Preview</p>

                      {galleryPreviews.length === 0 ? (
                        <div className="w-full h-44 rounded-lg bg-white border flex items-center justify-center">
                          <span className="text-xs text-gray-500">No gallery selected</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {galleryPreviews.map((g) => (
                            <div key={g.id} className="relative group rounded-lg overflow-hidden border bg-white">
                              <img src={g.url} alt="Gallery" className="w-full h-20 object-cover" />
                              <button
                                type="button"
                                onClick={() => removeGalleryItem(g.id)}
                                className="
                                  absolute top-1 right-1
                                  bg-black/60 text-white text-xs
                                  rounded px-2 py-1
                                  opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                                  transition
                                "
                                title="Remove"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {galleryPreviews.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Tap ✕ to remove any image.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="e.g. Premium Oversize T-Shirt"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newProduct.category}
                        onChange={(e) =>
                          setNewProduct((p) => ({
                            ...p,
                            category: e.target.value,
                            subcategory: "",
                          }))
                        }
                        className="w-full p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="" disabled>
                          Choose category
                        </option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="customize">Customize</option>
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Subcategory
                      </label>
                      <select
                        value={newProduct.subcategory}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, subcategory: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        required
                        disabled={!newProduct.category}
                      >
                        <option value="" disabled>
                          {newProduct.category ? "Choose subcategory" : "Select category first"}
                        </option>
                        {subcats.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="0"
                        step="0.01"
                        placeholder="e.g. 999"
                      />
                    </div>

                    {/* Main Image */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {editingId ? "New Main Image (optional)" : "Main Image"}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMainImageChange(e.target.files?.[0] || null)}
                        className="w-full p-3 border rounded-lg bg-white"
                        required={!editingId}
                      />
                      {editingId && (
                        <p className="text-xs text-gray-500 mt-1">
                          (Optional) Agar change nahi karna, to blank chhodo.
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Features (comma separated)
                      </label>
                      <input
                        type="text"
                        value={newProduct.features}
                        onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="e.g. cotton, slim fit, machine-wash"
                      />
                    </div>

                    {/* Gallery Images */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Gallery Images (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleGalleryChange(e.target.files)}
                        className="w-full p-3 border rounded-lg bg-white"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, description: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="5"
                        required
                        placeholder="Write a short product description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-1 sm:p-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-white ${
                      isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isLoading ? "Processing..." : editingId ? "Update Product" : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;