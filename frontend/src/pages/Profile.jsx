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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {initialData ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {[
            { label: "Full Name", name: "fullName", required: true },
            { label: "Phone Number", name: "phone", type: "tel", required: true },
            { label: "Address", name: "address", required: true },
            { label: "City", name: "city" },
            { label: "State", name: "state" },
            { label: "Pincode", name: "pincode" },
            { label: "Country", name: "country" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={f.type || "text"}
                name={f.name}
                value={formData[f.name]}
                onChange={handleChange}
                className="w-full rounded-full border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 sm:px-4 sm:py-3"
                placeholder={`Enter ${f.label.toLowerCase()}`}
              />
            </div>
          ))}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full rounded-full bg-black py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 sm:py-3.5 sm:text-base"
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
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const { wishlist } = useWishlist();

  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || "");

  const [orderId, setOrderId] = useState("");

  const [activeTab, setActiveTab] = useState("account");

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      
      const storedAuth = localStorage.getItem("auth");
      
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        const updatedAuth = {
          ...parsed,
          user: {
            ...parsed.user,
            name: tempName.trim()
          }
        };
        localStorage.setItem("auth", JSON.stringify(updatedAuth));
        toast.success("Name updated successfully");
        
        // Page refresh for changes to take effect
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

      setEditingName(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (user?.name) {
      setTempName(user.name);
    }
  }, [user?.name]);

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

  const NavButton = ({ active, onClick, children, danger }) => (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-black text-white"
          : danger
          ? "text-gray-700 hover:bg-red-50 hover:text-red-600"
          : "text-gray-700 hover:bg-gray-100 hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Mobile Header */}
      <div className="sticky top-[76px] z-40 bg-white shadow-sm lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">My Account</h1>
          <button
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
            className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 rounded-full border px-3 py-2 text-sm ${
              activeTab === "account"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 rounded-full border px-3 py-2 text-sm ${
              activeTab === "orders"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            My Orders
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 pt-0 sm:pt-6 lg:pt-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Profile Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-semibold">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Hello,</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {user?.name || "No Name"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="p-3 space-y-1">
                <NavButton
                  active={activeTab === "orders"}
                  onClick={() => setActiveTab("orders")}
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </NavButton>
                <NavButton
                  active={activeTab === "account"}
                  onClick={() => setActiveTab("account")}
                >
                  <User className="w-4 h-4" />
                  Account Settings
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
              <>
                {/* Mobile Profile Card */}
                <div className="mb-2 bg-black px-4 py-6 lg:hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-xl font-bold border-2 border-white/30">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      {!editingName ? (
                        <>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold text-white">
                              {user?.name || "No Name"}
                            </h2>
                            <button
                              onClick={() => setEditingName(true)}
                              className="text-white/80 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-sm text-white/70">{user?.email}</p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full rounded-full px-3 py-2 text-sm text-gray-900"
                            disabled={updating}
                            placeholder="Enter your name"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveName}
                              disabled={updating}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                            >
                              {updating ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false);
                                setTempName(user?.name || "");
                              }}
                              disabled={updating}
                              className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Profile Header */}
                <div className="mb-6 hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {!editingName ? (
                          <>
                            <div className="flex items-center gap-3">
                              <h1 className="text-2xl font-bold text-gray-900">
                                {user?.name || "No Name"}
                              </h1>
                              <button
                                onClick={() => setEditingName(true)}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="w-64 rounded-full border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                              disabled={updating}
                              placeholder="Enter your name"
                            />
                            <button
                              onClick={handleSaveName}
                              disabled={updating}
                              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                              {updating ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false);
                                setTempName(user?.name || "");
                              }}
                              disabled={updating}
                              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 font-medium text-gray-900 transition-all hover:border-gray-900 hover:bg-gray-50"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          navigate("/", { replace: true });
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-gray-800"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wishlist Stats */}
                <div className="px-4 sm:mb-6 sm:px-0">
                  <button
                    type="button"
                    onClick={() => navigate("/wishlist")}
                    className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-black sm:p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        <Heart className="h-4 w-4 text-gray-700" strokeWidth={1.7} />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Wishlist</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                      {wishlist.length.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">Saved Styles</p>
                  </button>
                </div>

                {/* Saved Addresses */}
                <div className="mx-0 mb-2 rounded-xl border border-gray-200 bg-white shadow-sm sm:mx-0 sm:mb-6">
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        Saved Addresses
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Manage delivery locations
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Add Address</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-6">
                    {addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-sm font-medium">
                          No addresses saved
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Add your first delivery address
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="rounded-xl border border-gray-200 p-4 transition-all hover:border-black hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                                  {addr.fullName}
                                </p>
                                <p className="text-sm text-gray-600">{addr.phone}</p>
                              </div>
                            </div>

                            <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                              <p>{addr.address}</p>
                              <p className="mt-1">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              {addr.country && (
                                <p className="text-gray-500">{addr.country}</p>
                              )}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  setEditingAddress(addr);
                                  setShowForm(true);
                                }}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(addr.id)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
                </div>

                {/* Track Order Section */}
                <div className="mx-0 rounded-xl border border-gray-200 bg-white shadow-sm sm:mx-0">
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      Track Your Order
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Enter Shiprocket Order ID
                    </p>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Enter Order ID"
                        className="flex-1 rounded-full border border-gray-300 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 sm:px-4 sm:py-3"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (!orderId.trim()) return toast.error("Please enter an order ID");
                          window.open(
                            `https://shiprocket.co/tracking/${orderId.trim()}`,
                            "_blank"
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 sm:px-6 sm:py-3 whitespace-nowrap"
                      >
                        <Search className="w-4 h-4" />
                        Track Order
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Orders Tab Content */}
            {activeTab === "orders" && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
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
