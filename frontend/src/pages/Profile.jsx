import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  User,
  Package,
  LogOut,
  Heart,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Mail,
  Phone,
} from "lucide-react";
import MyOrders from "./MyOrders";
import { showToastConfirm } from "../utils/toastConfirm";
import { useWishlist } from "../context/WishlistContext";

const AddressForm = ({ onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address)
      return toast.error("Please fill all required fields");
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-0 sm:items-center sm:px-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white shadow-2xl sm:max-w-xl sm:rounded-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-gray-950 sm:text-lg">
            {initialData ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {[
            { label: "Full Name", name: "fullName", required: true },
            { label: "Phone Number", name: "phone", type: "tel", required: true },
            { label: "Address", name: "address", required: true, wide: true },
            { label: "City", name: "city" },
            { label: "State", name: "state" },
            { label: "Pincode", name: "pincode" },
            { label: "Country", name: "country" },
          ].map((f) => (
            <div key={f.name} className={f.wide ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={f.type || "text"}
                name={f.name}
                value={formData[f.name]}
                onChange={handleChange}
                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                placeholder={`Enter ${f.label.toLowerCase()}`}
              />
            </div>
          ))}
          <div className="pt-2 sm:col-span-2">
            <button
              type="submit"
              className="h-11 w-full rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Profile() {
  const { user, logout, token, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const { wishlist } = useWishlist();

  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [orderId, setOrderId] = useState("");

  const [activeTab, setActiveTab] = useState("account");

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      toast.success("Profile updated successfully");
      setEditingProfile(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
    });
  }, [user?.name, user?.phone]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedAddresses")) || [];
    setAddresses(saved);
  }, []);

  const saveToStorage = (list) => {
    localStorage.setItem("savedAddresses", JSON.stringify(list));
    setAddresses(list);
  };

  const handleSave = (data) => {
    if (editingAddress) {
      const updated = addresses.map((a) =>
        a.id === editingAddress.id ? { ...data, id: a.id } : a
      );
      saveToStorage(updated);
    } else {
      saveToStorage([...addresses, { ...data, id: Date.now() }]);
    }
    setEditingAddress(null);
    setShowForm(false);
  };

  const deleteAddress = (id) => {
    saveToStorage(addresses.filter((a) => a.id !== id));
    toast.success("Address deleted successfully");
  };

  const handleDelete = (id) => {
    showToastConfirm({
      title: "Delete this address?",
      message: "This saved address will be removed from your profile.",
      confirmText: "Delete",
      confirmClassName: "bg-red-600 hover:bg-red-700",
      onConfirm: () => deleteAddress(id),
    });
  };

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const displayInitial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  const contactPhone = user?.phone || "Not added";
  const primaryAddress = addresses[0];

  const NavButton = ({ active, onClick, children, danger }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        active
          ? "bg-gray-950 text-white"
          : danger
          ? "text-gray-600 hover:bg-red-50 hover:text-red-700"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-950",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-10">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Account
            </p>
            <h1 className="mt-1 text-xl font-semibold text-gray-950 sm:text-2xl">
              Profile & Orders
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 lg:hidden"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="sticky top-[76px] z-40 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="grid grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              activeTab === "account"
                ? "bg-white text-gray-950 shadow-sm"
                : "text-gray-600"
            }`}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              activeTab === "orders"
                ? "bg-white text-gray-950 shadow-sm"
                : "text-gray-600"
            }`}
          >
            My Orders
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gray-950 text-base font-semibold text-white">
                    {displayInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">
                      {user?.name || "No Name"}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>

              <nav className="p-3 space-y-1">
                <NavButton
                  active={activeTab === "account"}
                  onClick={() => setActiveTab("account")}
                >
                  <User className="w-4 h-4" />
                  Account Settings
                </NavButton>
                <NavButton
                  active={activeTab === "orders"}
                  onClick={() => setActiveTab("orders")}
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </NavButton>
                <NavButton
                  danger
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </NavButton>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {activeTab === "account" && (
              <div className="space-y-5">
                <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-950 text-xl font-semibold text-white">
                        {displayInitial}
                      </div>
                      <div className="min-w-0">
                        {!editingProfile ? (
                          <>
                            <div className="flex items-center gap-2">
                              <h2 className="truncate text-xl font-semibold text-gray-950 sm:text-2xl">
                                {user?.name || "No Name"}
                              </h2>
                              <button
                                type="button"
                                onClick={() => setEditingProfile(true)}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-950"
                                aria-label="Edit profile"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                              <span className="flex min-w-0 items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate">{user?.email || "No email"}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                                {contactPhone}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                            <label className="grid gap-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Name
                              </span>
                              <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) =>
                                  setProfileForm((current) => ({
                                    ...current,
                                    name: e.target.value,
                                  }))
                                }
                                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                                disabled={updating}
                                placeholder="Enter your name"
                              />
                            </label>
                            <label className="grid gap-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Phone
                              </span>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={profileForm.phone}
                                onChange={(e) =>
                                  setProfileForm((current) => ({
                                    ...current,
                                    phone: e.target.value,
                                  }))
                                }
                                className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                                disabled={updating}
                                placeholder="10-digit mobile number"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSaveProfile}
                                disabled={updating}
                                className="h-11 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                              >
                                {updating ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProfile(false);
                                  setProfileForm({
                                    name: user?.name || "",
                                    phone: user?.phone || "",
                                  });
                                }}
                                disabled={updating}
                                className="h-11 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-950 hover:text-gray-950"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </button>
                    </div>
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => navigate("/wishlist")}
                    className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-950"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Wishlist
                      </p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50">
                        <Heart className="h-4 w-4 text-rose-600" strokeWidth={1.8} />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-950">
                      {wishlist.length.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">Saved styles</p>
                  </button>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Addresses
                      </p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50">
                        <MapPin className="h-4 w-4 text-blue-700" strokeWidth={1.8} />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-950">{addresses.length}</p>
                    <p className="mt-1 text-sm text-gray-500">Delivery locations</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Default
                      </p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50">
                        <Package className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
                      </div>
                    </div>
                    <p className="truncate text-base font-semibold text-gray-950">
                      {primaryAddress?.city || "Not set"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">Primary delivery city</p>
                  </div>
                </div>

                {/* Saved Addresses */}
                <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div>
                      <h2 className="text-base font-semibold text-gray-950">
                        Saved Addresses
                      </h2>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Manage delivery locations
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(null);
                        setShowForm(true);
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-gray-950 px-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Address</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    {addresses.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-white text-gray-400 shadow-sm">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                          No addresses saved
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Add your first delivery address
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-950"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-950 sm:text-base">
                                  {addr.fullName}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">{addr.phone}</p>
                              </div>
                            </div>

                            <div className="mb-4 text-sm leading-6 text-gray-700">
                              <p>{addr.address}</p>
                              <p>
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              {addr.country && (
                                <p className="text-gray-500">{addr.country}</p>
                              )}
                            </div>

                            <div className="flex gap-2 border-t border-gray-100 pt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAddress(addr);
                                  setShowForm(true);
                                }}
                                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(addr.id)}
                                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Track Order Section */}
                <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                    <h2 className="text-base font-semibold text-gray-950">
                      Track Your Order
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Enter Shiprocket Order ID
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Enter Order ID"
                        className="h-11 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!orderId.trim()) return toast.error("Please enter an order ID");
                          window.open(
                            `https://shiprocket.co/tracking/${orderId.trim()}`,
                            "_blank"
                          );
                        }}
                        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800 sm:px-5"
                      >
                        <Search className="w-4 h-4" />
                        Track Order
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Orders Tab Content */}
            {activeTab === "orders" && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <MyOrders token={token} apiUrl={apiUrl} embedded />
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <AddressForm
            onSave={handleSave}
            onClose={() => setShowForm(false)}
            initialData={editingAddress}
          />
        )}
      </div>
    </div>
  );
}
