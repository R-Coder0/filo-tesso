import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Coins,
  Package,
  LogOut,
  Shield,
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
} from "lucide-react";
import MyOrders from "./MyOrders";
import { FaHeart } from "react-icons/fa";

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
      return alert("Please fill all required fields");
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {initialData ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors p-1"
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
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder={`Enter ${f.label.toLowerCase()}`}
              />
            </div>
          ))}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-black text-white py-3 sm:py-3.5 rounded-lg  transition-all font-medium text-sm sm:text-base shadow-sm"
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
  const [pendingCoins, setPendingCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // ✅ ✅ ✅ DEBUGGING YAHAN ADD KARO - Profile component ke andar ✅ ✅ ✅
  console.log("🔍 Profile Component - Current User:", user);
  console.log("🔍 Profile Component - User Name:", user?.name);
  console.log("🔍 Profile Component - User Email:", user?.email);
  console.log("🔍 Profile Component - Token:", token ? "Present" : "Missing");

  // ✅ Check karo ki user data properly aa raha hai ya nahi
  useEffect(() => {
    console.log("🔄 User data updated:", user);
  }, [user]);


  // ✅ Temporary - Check localStorage directly
useEffect(() => {
  const checkLocalStorage = () => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📦 Direct localStorage check:", parsed.user);
      
      // Agar context user undefined hai, par localStorage mein data hai
      if (!user?.name && parsed.user?.name) {
        console.log("🔄 Using localStorage data as fallback");
        // Yahan aap temporary data set kar sakte ho
      }
    }
  };
  
  checkLocalStorage();
}, [user]);

  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || "");

  const [orderId, setOrderId] = useState("");

  const [activeTab, setActiveTab] = useState("account");

  // ✅ Update profile function (Fixed)
  const handleSaveName = async () => {
    console.log("💾 Saving name:", tempName);
    
    if (!tempName.trim()) {
      alert("Name cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      
      // ✅ Temporary: Direct localStorage mein save karo
      const storedAuth = localStorage.getItem("auth");
      console.log("📦 Stored auth before update:", storedAuth);
      
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
        console.log("✅ LocalStorage updated with new name:", tempName.trim());
        
        // Page refresh for changes to take effect
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

      setEditingName(false);
    } catch (error) {
      console.error("❌ Profile update error:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Reset tempName when user changes
  useEffect(() => {
    if (user?.name) {
      setTempName(user.name);
      console.log("🔄 TempName updated to:", user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedAddresses")) || [];
    setAddresses(saved);
    console.log("🏠 Addresses loaded:", saved.length);
  }, []);

  const saveToStorage = (list) => {
    localStorage.setItem("savedAddresses", JSON.stringify(list));
    setAddresses(list);
    console.log("💾 Addresses saved to localStorage:", list.length);
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

  const handleDelete = (id) => {
    if (window.confirm("Delete this address?")) {
      saveToStorage(addresses.filter((a) => a.id !== id));
    }
  };

  useEffect(() => {
    const fetchPendingCoins = async () => {
      try {
        console.log("🔄 Fetching pending coins...");
        const { data } = await axios.get(`${apiUrl}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pending = (data || []).reduce(
          (total, order) =>
            order.coinStatus === "pending" ? total + order.coinsEarned : total,
          0
        );
        setPendingCoins(pending);
        console.log("💰 Pending coins:", pending);
      } catch (error) {
        console.error("❌ Error fetching pending coins:", error);
        setPendingCoins(0);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchPendingCoins();
  }, [user, token, apiUrl]);

  if (!user) {
    console.log("🚫 No user found, redirecting to login");
    navigate("/login", { replace: true });
    return null;
  }

  const coins = Number(user?.coinsBalance ?? 0);
  console.log("🪙 Current coins balance:", coins);

  const NavButton = ({ active, onClick, children, danger }) => (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-blue-50 text-blue-600"
          : danger
          ? "text-gray-700 hover:bg-red-50 hover:text-red-600"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8 mt-8 pt-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">My Account</h1>
          <button
            onClick={() => {
              console.log("🚪 Logging out...");
              logout();
              navigate("/", { replace: true });
            }}
            className="text-red-600 text-sm font-medium"
          >
            Logout
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 px-3 py-2 text-sm rounded-md border ${
              activeTab === "account"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 px-3 py-2 text-sm rounded-md border ${
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-24">
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
                    console.log("🚪 Logging out...");
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
                <div className="lg:hidden bg-black px-4 py-6 mb-2">
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
                          <p className="text-blue-100 text-sm mt-0.5">{user?.email}</p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-white text-sm"
                            disabled={updating}
                            placeholder="Enter your name"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveName}
                              disabled={updating}
                              className="px-3 py-1.5 bg-white text-black rounded-md text-xs font-medium disabled:opacity-50"
                            >
                              {updating ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false);
                                setTempName(user?.name || "");
                              }}
                              disabled={updating}
                              className="px-3 py-1.5 bg-white/20 text-white rounded-md text-xs font-medium disabled:opacity-50"
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
                <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6 mb-6">
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
                                className="text-gray-400 hover:text-gray-600"
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
                              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
                              disabled={updating}
                              placeholder="Enter your name"
                            />
                            <button
                              onClick={handleSaveName}
                              disabled={updating}
                              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                              {updating ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false);
                                setTempName(user?.name || "");
                              }}
                              disabled={updating}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
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
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all font-medium text-gray-900"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </button>
                      <button
                        onClick={() => {
                          console.log("🚪 Logging out...");
                          logout();
                          navigate("/", { replace: true });
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 transition-all font-medium shadow-sm hover:shadow"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rest of the code remains same... */}
                {/* Coins & Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 px-4 sm:px-0 mb-2 sm:mb-6">
                  <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {coins.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Coins</p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {loading ? "..." : pendingCoins.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Coins</p>
                  </div>

                  <div onClick={() => window.open('/wishlist')} className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <FaHeart className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-xs text-gray-500">Wishlist</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">Favourites</p>
                  </div>
                </div>

                {/* Saved Addresses */}
                <div className="bg-white rounded-lg shadow-sm mx-0 sm:mx-0 mb-2 sm:mb-6">
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
                      className="flex items-center gap-1.5 sm:gap-2 bg-black text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
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
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
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
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(addr.id)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
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
                <div className="bg-white rounded-lg shadow-sm mx-0 sm:mx-0">
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
                        className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          if (!orderId.trim()) return alert("Please enter an order ID");
                          window.open(
                            `https://shiprocket.co/tracking/${orderId.trim()}`,
                            "_blank"
                          );
                        }}
                        className="flex items-center justify-center gap-2 bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
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
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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