// src/components/Admin/ManageProducts.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Central map: yahi se options aayenge
const CATEGORY_MAP = {
  men: [
    "oversize-tshirt",
    "polo-tshirt",
    "regular-tshirt",
    "regular-shirt",
    "oversize-shirt",
    "jeans",
    "trousers",
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
  customize: [
    "hoodies",
    "sweatshirt",
    "regular-coupletshirt",
    "oversize-coupletshirt",
    "couple-hoodies",
  ],
};

const MAX_GALLERY_IMAGES = 10;

const emptyProduct = {
  name: "",
  image: null,
  images: [],
  originalPrice: "",
  salePrice: "",
  stock: "",
  sizeVariants: [],
  description: "",
  details: "",
  detailsArray: [],
  washCare: "",
  washCareArray: [],
  category: "",
  subcategory: "",
  subcategories: [],
  tags: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
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
const [detailInput, setDetailInput] = useState("");
const [washCareInput, setWashCareInput] = useState("");
const [sizeDraft, setSizeDraft] = useState({ size: "", stock: "" });
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

  const formatSubcategory = (subcategory) =>
    String(subcategory || "")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const getProductSubcategories = (product) => {
    if (Array.isArray(product.subcategories) && product.subcategories.length) {
      return product.subcategories;
    }
    return product.subcategory ? [product.subcategory] : [];
  };

  const toggleSubcategory = (subcategory) => {
    setNewProduct((product) => {
      const current = product.subcategories || [];
      const next = current.includes(subcategory)
        ? current.filter((item) => item !== subcategory)
        : [...current, subcategory];

      return {
        ...product,
        subcategories: next,
        subcategory: next[0] || "",
      };
    });
  };

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
const addDetail = () => {
  if (detailInput.trim()) {
    const currentDetails = newProduct.detailsArray || [];
    setNewProduct({
      ...newProduct,
      detailsArray: [...currentDetails, detailInput.trim()],
      details: [...currentDetails, detailInput.trim()].join(",")
    });
    setDetailInput("");
  }
};

const removeDetail = (indexToRemove) => {
  const currentDetails = newProduct.detailsArray || [];
  const updatedDetails = currentDetails.filter((_, index) => index !== indexToRemove);
  setNewProduct({
    ...newProduct,
    detailsArray: updatedDetails,
    details: updatedDetails.join(",")
  });
};

const getDetailsForSubmit = () => {
  const draft = detailInput.trim();
  const details = draft
    ? [...(newProduct.detailsArray || []), draft]
    : newProduct.detailsArray || [];

  return details.map((detail) => String(detail).trim()).filter(Boolean);
};

const addWashCare = () => {
  if (washCareInput.trim()) {
    const currentWashCare = newProduct.washCareArray || [];
    setNewProduct({
      ...newProduct,
      washCareArray: [...currentWashCare, washCareInput.trim()],
      washCare: [...currentWashCare, washCareInput.trim()].join(",")
    });
    setWashCareInput("");
  }
};

const removeWashCare = (indexToRemove) => {
  const currentWashCare = newProduct.washCareArray || [];
  const updatedWashCare = currentWashCare.filter((_, index) => index !== indexToRemove);
  setNewProduct({
    ...newProduct,
    washCareArray: updatedWashCare,
    washCare: updatedWashCare.join(",")
  });
};

const getWashCareForSubmit = () => {
  const draft = washCareInput.trim();
  const washCare = draft
    ? [...(newProduct.washCareArray || []), draft]
    : newProduct.washCareArray || [];

  return washCare.map((item) => String(item).trim()).filter(Boolean);
};

const addSizeVariant = () => {
  const size = sizeDraft.size.trim().toUpperCase();
  const stock = Math.max(0, Number(sizeDraft.stock || 0));
  if (!size) return;

  setNewProduct((product) => {
    const current = product.sizeVariants || [];
    const exists = current.some((variant) => variant.size === size);
    if (exists) return product;

    return {
      ...product,
      sizeVariants: [...current, { size, stock }],
      stock: [...current, { size, stock }].reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    };
  });
  setSizeDraft({ size: "", stock: "" });
};

const updateSizeVariantStock = (size, stockValue) => {
  const stock = Math.max(0, Number(stockValue || 0));
  setNewProduct((product) => {
    const updated = (product.sizeVariants || []).map((variant) =>
      variant.size === size ? { ...variant, stock } : variant
    );
    return {
      ...product,
      sizeVariants: updated,
      stock: updated.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    };
  });
};

const removeSizeVariant = (size) => {
  setNewProduct((product) => {
    const updated = (product.sizeVariants || []).filter((variant) => variant.size !== size);
    return {
      ...product,
      sizeVariants: updated,
      stock: updated.length
        ? updated.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
        : "",
    };
  });
};
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
    setDetailInput("");
    setWashCareInput("");
    setError(null);
    resetPreviews();
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewProduct(emptyProduct);
    setDetailInput("");
    setWashCareInput("");
    setSizeDraft({ size: "", stock: "" });
    setError(null);
    resetPreviews();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    const existingVariants = product.sizeVariants?.length
      ? product.sizeVariants.map((variant) => ({
          size: String(variant.size || "").toUpperCase(),
          stock: Number(variant.stock || 0),
        }))
      : (product.sizes || []).map((size) => ({
          size: String(size || "").toUpperCase(),
          stock: 0,
        }));

    const existingDetails = product.details?.length ? product.details : product.features || [];
    const existingWashCare = product.washCare || [];
    const selectedSubcategories = getProductSubcategories(product);

    setNewProduct({
      name: product.name || "",
originalPrice: product.price?.original || "",
salePrice: product.price?.sale || "",
stock: product.stock ?? "",
sizeVariants: existingVariants,
tags: product.tags?.join(", ") || "",
metaTitle: product.seo?.metaTitle || "",
metaDescription: product.seo?.metaDescription || "",
keywords: product.seo?.keywords?.join(", ") || "",
      description: product.description || "",
      details: existingDetails.join(", "),
      detailsArray: existingDetails,
      washCare: existingWashCare.join(", "),
      washCareArray: existingWashCare,
      image: null,
      images: [],
      category: product.category || "",
      subcategory: selectedSubcategories[0] || "",
      subcategories: selectedSubcategories,
    });

    setExistingMainImage(product.image ? `${apiUrl}${product.image}` : "");
    setMainPreview(""); // only show existing until user selects new
    setGalleryPreviews([]); // fresh
    setDetailInput("");
    setWashCareInput("");
    setSizeDraft({ size: "", stock: "" });
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
    const selectedFiles = fileList ? Array.from(fileList) : [];
    const files = selectedFiles.slice(0, MAX_GALLERY_IMAGES);

    // cleanup old previews
    galleryPreviews.forEach((g) => {
      if (g.url?.startsWith("blob:")) URL.revokeObjectURL(g.url);
    });

    if (selectedFiles.length > MAX_GALLERY_IMAGES) {
      setError(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed. First ${MAX_GALLERY_IMAGES} selected images will be uploaded.`);
    } else {
      setError(null);
    }

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
      if (!newProduct.subcategories?.length) throw new Error("Please select at least one subcategory");
      const detailsForSubmit = getDetailsForSubmit();
      const washCareForSubmit = getWashCareForSubmit();
      const subcategoriesForSubmit = newProduct.subcategories || [];
      const primarySubcategory = subcategoriesForSubmit[0] || "";

      if (editingId) {
        // ✅ Update via JSON (images optional)
        await axiosAdmin.put(`/${editingId}`, {
          name: newProduct.name,
          originalPrice: newProduct.originalPrice,
salePrice: newProduct.salePrice,
stock: newProduct.stock,
sizeVariants: newProduct.sizeVariants,
tags: newProduct.tags,
metaTitle: newProduct.metaTitle,
          metaDescription: newProduct.metaDescription,
keywords: newProduct.keywords,  
          description: newProduct.description,
          details: detailsForSubmit,
          washCare: washCareForSubmit,
          category: newProduct.category,
          subcategory: primarySubcategory,
          subcategories: subcategoriesForSubmit,
        });

        // NOTE: If you want to update main/gallery images in edit mode,
        // you need backend endpoint for multipart update. Currently edit = JSON only (as you had).
      } else {
        // ✅ Create with multipart (images + fields)
        const formData = new FormData();
        formData.append("name", newProduct.name);
       formData.append("originalPrice", newProduct.originalPrice);
formData.append("salePrice", newProduct.salePrice);
formData.append("stock", newProduct.stock);
formData.append("sizeVariants", JSON.stringify(newProduct.sizeVariants || []));
formData.append("tags", newProduct.tags);
formData.append("metaTitle", newProduct.metaTitle);
formData.append("metaDescription", newProduct.metaDescription);
formData.append("keywords", newProduct.keywords);
        formData.append("description", newProduct.description);
        formData.append("category", newProduct.category);
        formData.append("subcategory", primarySubcategory);
        formData.append("subcategories", JSON.stringify(subcategoriesForSubmit));

        detailsForSubmit.forEach((detail) => formData.append("details", detail));
        washCareForSubmit.forEach((item) => formData.append("washCare", item));

        if (newProduct.image) formData.append("image", newProduct.image);

        if (newProduct.images?.length > 0) {
          newProduct.images.slice(0, MAX_GALLERY_IMAGES).forEach((img) => formData.append("images", img));
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
              className="px-4 py-2 border border-black bg-transparent cursor-pointer hover:bg-black hover:text-white text-gray-800 font-medium"
            >
              ← Back
            </button>

            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-black hover:bg-transparent hover:text-black border border-black text-white font-medium cursor-pointer shadow-sm"
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

                          {(product.category || product.subcategory || product.subcategories?.length) && (
                            <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-600">
                              {product.category}
                              {getProductSubcategories(product).length
                                ? ` / ${getProductSubcategories(product).map(formatSubcategory).join(", ")}`
                                : ""}
                            </p>
                          )}

                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span className="font-semibold">
                              Stock: {product.stock ?? 0}
                            </span>
                            {product.sizeVariants?.length > 0 ? (
                              <span>
                                Variants: {product.sizeVariants.map((variant) => `${variant.size} (${variant.stock})`).join(", ")}
                              </span>
                            ) : product.sizes?.length > 0 && (
                              <span>Sizes: {product.sizes.join(", ")}</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <p className="text-gray-900 font-semibold text-base sm:text-lg">
                           <div>
  <p className="text-gray-400 line-through text-sm">
    ₹{product.price?.original}
  </p>
  <p className="text-black font-bold">
    ₹{product.price?.sale}
  </p>
</div>
                          </p>
                        </div>
                      </div>

                      {/* actions */}
                      <div className="mt-4 flex gap-2 sm:justify-end">
                        <button
                          onClick={() => openEditModal(product)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-black hover:bg-transparent hover:text-black border-black border cursor-pointer text-white font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={isLoading}
                          className="px-4 py-2 hover:bg-black :bg-transparent text-black border-black border cursor-pointer hover:text-white font-semibold"
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
        bg-white shadow-xl border border-gray-200
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
            <div className="border border-gray-200 p-3 bg-gray-50">
              <p className="text-sm font-semibold text-gray-800 mb-2">Main Image Preview</p>
              <div className="w-full h-44 overflow-hidden bg-white border flex items-center justify-center">
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
            <div className="border border-gray-200 p-3 bg-gray-50">
              <p className="text-sm font-semibold text-gray-800 mb-2">Gallery Preview</p>

              {galleryPreviews.length === 0 ? (
                <div className="w-full h-44 bg-white border flex items-center justify-center">
                  <span className="text-xs text-gray-500">No gallery selected</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {galleryPreviews.map((g) => (
                    <div key={g.id} className="relative group overflow-hidden border bg-white">
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
                className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
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
                    subcategories: [],
                  }))
                }
                className="w-full p-3 border border-gray-300 bg-white focus:outline-none focus:border-black"
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

            {/* Subcategories */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Subcategories
              </label>
              <div className="border border-gray-300 bg-white p-3">
                {!newProduct.category ? (
                  <p className="text-sm text-gray-400">Select category first</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {subcats.map((sc) => {
                      const checked = (newProduct.subcategories || []).includes(sc);
                      return (
                        <label
                          key={sc}
                          className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm font-medium transition ${
                            checked
                              ? "border-black bg-black text-white"
                              : "border-gray-200 text-gray-700 hover:border-black"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubcategory(sc)}
                            className="h-4 w-4 accent-black"
                          />
                          <span>{formatSubcategory(sc)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                You can select multiple subcategories for one product.
              </p>
            </div>

{/* Original Price */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    Original Price (MRP)
  </label>
  <input
    type="number"
    value={newProduct.originalPrice}
    onChange={(e) =>
      setNewProduct({ ...newProduct, originalPrice: e.target.value })
    }
    className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
    required
  />
</div>

{/* Sale Price */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    Sale Price
  </label>
  <input
    type="number"
    value={newProduct.salePrice}
    onChange={(e) =>
      setNewProduct({ ...newProduct, salePrice: e.target.value })
    }
    className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
    required
  />
</div>

{/* Inventory */}
<div className="md:col-span-2 border border-gray-200 bg-gray-50 p-4">
  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">
        Inventory
      </h4>
      <p className="mt-1 text-xs text-gray-500">
        Add size-wise stock for apparel. Leave variants empty for one common stock.
      </p>
    </div>
    <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
      Total: {newProduct.sizeVariants?.length ? newProduct.stock || 0 : newProduct.stock || 0}
    </div>
  </div>

  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
    <input
      type="text"
      value={sizeDraft.size}
      onChange={(e) => setSizeDraft((draft) => ({ ...draft, size: e.target.value }))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addSizeVariant();
        }
      }}
      className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
      placeholder="Size e.g. S, M, L"
    />
    <input
      type="number"
      min="0"
      value={sizeDraft.stock}
      onChange={(e) => setSizeDraft((draft) => ({ ...draft, stock: e.target.value }))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addSizeVariant();
        }
      }}
      className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
      placeholder="Stock for this size"
    />
    <button
      type="button"
      onClick={addSizeVariant}
      className="border border-black bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-black"
    >
      Add
    </button>
  </div>

  {newProduct.sizeVariants?.length > 0 ? (
    <div className="mt-4 grid gap-2">
      {newProduct.sizeVariants.map((variant) => (
        <div
          key={variant.size}
          className="grid grid-cols-[80px_1fr_auto] items-center gap-3 border border-gray-200 bg-white p-3"
        >
          <span className="text-sm font-bold text-gray-900">{variant.size}</span>
          <input
            type="number"
            min="0"
            value={variant.stock}
            onChange={(e) => updateSizeVariantStock(variant.size, e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="button"
            onClick={() => removeSizeVariant(variant.size)}
            className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  ) : (
    <div className="mt-4">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">
        Common Stock
      </label>
      <input
        type="number"
        value={newProduct.stock}
        onChange={(e) =>
          setNewProduct({ ...newProduct, stock: e.target.value })
        }
        className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
        min="0"
        placeholder="Total stock"
      />
    </div>
  )}
</div>
{/* Tags */}
<div className="md:col-span-2">
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    Tags (comma separated)
  </label>
  <input
    type="text"
    value={newProduct.tags}
    onChange={(e) =>
      setNewProduct({ ...newProduct, tags: e.target.value })
    }
    className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
    placeholder="tshirt, cotton, summer"
  />
</div>
{/* SEO Fields */}
<div className="md:col-span-2 mt-4 border-t pt-4">
  <h4 className="text-md font-bold mb-3">SEO Settings</h4>

  <input
    type="text"
    placeholder="Meta Title"
    value={newProduct.metaTitle}
    onChange={(e) =>
      setNewProduct({ ...newProduct, metaTitle: e.target.value })
    }
    className="w-full p-3 border border-gray-300 mb-3 focus:outline-none focus:border-black"
  />

  <textarea
    placeholder="Meta Description"
    value={newProduct.metaDescription}
    onChange={(e) =>
      setNewProduct({ ...newProduct, metaDescription: e.target.value })
    }
    className="w-full p-3 border border-gray-300 mb-3 focus:outline-none focus:border-black"
  />

  <input
    type="text"
    placeholder="Keywords (comma separated)"
    value={newProduct.keywords}
    onChange={(e) =>
      setNewProduct({ ...newProduct, keywords: e.target.value })
    }
    className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
  />
</div>

            {/* Main Image - Improved */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {editingId ? "New Main Image (optional)" : "Main Image"}
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMainImageChange(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="main-image-upload"
                  required={!editingId}
                />
                <div className="w-full p-3 border border-gray-300 bg-white flex items-center justify-between">
                  <span className="text-gray-600 text-sm truncate mr-2">
                    {mainPreview ? 'Image selected' : editingId ? 'Choose new image (optional)' : 'Click to upload main image'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 text-sm font-medium border">
                    Browse
                  </span>
                </div>
              </div>
              {editingId && (
                <p className="text-xs text-gray-500 mt-1">
                  (Optional) Agar change nahi karna, to blank chhodo.
                </p>
              )}
            </div>

            {/* Gallery Images - Improved */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Gallery Images (optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleGalleryChange(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="gallery-images-upload"
                />
                <div className="w-full p-3 border border-gray-300 bg-white flex items-center justify-between">
                  <span className="text-gray-600 text-sm truncate mr-2">
                    {galleryPreviews.length > 0 
                      ? `${galleryPreviews.length} image(s) selected` 
                      : 'Click to upload multiple gallery images'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 text-sm font-medium border">
                    Browse
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can select up to {MAX_GALLERY_IMAGES} images at once
              </p>
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
                className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
                rows="5"
                required
                placeholder="Write a short product description..."
              />
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Details
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add each detail as a separate list item. Click any item to remove it.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {newProduct.detailsArray && newProduct.detailsArray.length > 0 ? (
                  newProduct.detailsArray.map((detail, index) => (
                    <span
                      key={`${detail}-${index}`}
                      onClick={() => removeDetail(index)}
                      className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      {detail}
                      <span className="text-xs ml-1">✕</span>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No details added yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={detailInput}
                  onChange={(e) => setDetailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDetail();
                    }
                  }}
                  className="flex-1 p-3 border border-gray-300 focus:outline-none focus:border-black"
                  placeholder="Type one detail and press Enter or click Add"
                />
                <button
                  type="button"
                  onClick={addDetail}
                  className="px-4 py-2 bg-black text-white font-medium hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Wash Care */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wash Care
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Add each wash care instruction as a separate list item.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {newProduct.washCareArray && newProduct.washCareArray.length > 0 ? (
                  newProduct.washCareArray.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      onClick={() => removeWashCare(index)}
                      className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      {item}
                      <span className="text-xs ml-1">✕</span>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No wash care added yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={washCareInput}
                  onChange={(e) => setWashCareInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addWashCare();
                    }
                  }}
                  className="flex-1 p-3 border border-gray-300 focus:outline-none focus:border-black"
                  placeholder="Type one wash care point and press Enter or click Add"
                />
                <button
                  type="button"
                  onClick={addWashCare}
                  className="px-4 py-2 bg-black text-white font-medium hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer - Updated buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-1 sm:p-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2.5 bg-black text-white font-medium hover:bg-white hover:text-black hover:border-black border border-transparent transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`px-5 py-2.5 font-medium text-white transition-colors ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-black hover:bg-white hover:text-black hover:border-black border border-transparent"
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
