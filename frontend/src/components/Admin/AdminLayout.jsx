import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardList,
  LogOut,
  Menu,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  UserCircle,
  XCircle,
} from "lucide-react";
import { extractProducts } from "../../utils/products";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", Icon: BarChart3 },
  { label: "Products", to: "/admin/products", Icon: ShoppingBag },
  { label: "Inventory", to: "/admin/inventory", Icon: Boxes },
  { label: "Orders", to: "/admin/orders", Icon: ClipboardList },
  { label: "Cancellations", to: "/admin/cancellations", Icon: XCircle },
  { label: "Returns", to: "/admin/returns", Icon: RotateCcw },
];

const pageTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Product Catalog",
  "/admin/inventory": "Inventory",
  "/admin/orders": "Orders",
  "/admin/cancellations": "Cancellation Requests",
  "/admin/returns": "Return Requests",
};

const READ_NOTIFICATIONS_KEY = "adminReadNotificationIds";

const formatTime = (value) => {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isRecent = (value, hours = 24) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000;
};

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]"
      );
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const adminHeaders = useMemo(
    () => ({
      authorization: import.meta.env.VITE_ADMIN_TOKEN,
    }),
    []
  );

  const title = useMemo(() => {
    return pageTitles[location.pathname] || "Admin";
  }, [location.pathname]);

  const readNotificationSet = useMemo(
    () => new Set(readNotificationIds),
    [readNotificationIds]
  );

  const persistReadNotifications = (ids) => {
    const uniqueIds = [...new Set(ids)].slice(-200);
    setReadNotificationIds(uniqueIds);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        READ_NOTIFICATIONS_KEY,
        JSON.stringify(uniqueIds)
      );
    }
  };

  const markNotificationRead = (id) => {
    if (!id || readNotificationSet.has(id)) return;
    persistReadNotifications([...readNotificationIds, id]);
  };

  const markAllNotificationsRead = () => {
    if (!notifications.length) return;
    persistReadNotifications([
      ...readNotificationIds,
      ...notifications.map((item) => item.id),
    ]);
  };

  const logout = () => {
    localStorage.removeItem("isAdmin");
    setProfileOpen(false);
    setNotificationOpen(false);
    navigate("/admin", { replace: true });
  };

  const loadNotifications = async () => {
    setNotificationLoading(true);
    setNotificationError("");

    try {
      const [ordersRes, cancellationRes, returnRes, productsRes] =
        await Promise.all([
          axios.get(`${apiUrl}/api/orders/admin`, { headers: adminHeaders }),
          axios.get(`${apiUrl}/api/orders/admin/cancellation-requests`, {
            headers: adminHeaders,
          }),
          axios.get(`${apiUrl}/api/orders/admin/return-requests`, {
            headers: adminHeaders,
          }),
          axios.get(`${apiUrl}/api/products`),
        ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const cancellationRequests = Array.isArray(cancellationRes.data)
        ? cancellationRes.data
        : [];
      const returnRequests = Array.isArray(returnRes.data) ? returnRes.data : [];
      const products = extractProducts(productsRes.data);

      const nextNotifications = [
        ...orders
          .filter((order) => isRecent(order.createdAt))
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8)
          .map((order) => ({
            id: `order-${order._id}`,
            type: "order",
            title: "New order received",
            message: `${order.address?.name || order.user?.name || "Customer"} placed an order for ₹${order.payableAmount || order.totalAmount || 0}`,
            time: order.createdAt,
            to: "/admin/orders",
          })),
        ...cancellationRequests.slice(0, 8).map((order) => ({
          id: `cancel-${order._id}`,
          type: "cancel",
          title: "Cancellation requested",
          message: order.cancellationReason || `Order ${order._id}`,
          time: order.cancelledAt || order.createdAt,
          to: "/admin/cancellations",
        })),
        ...returnRequests.slice(0, 8).map((order) => ({
          id: `return-${order._id}`,
          type: "return",
          title: "Return requested",
          message: order.returnReason || `Order ${order._id}`,
          time: order.returnRequestedAt || order.createdAt,
          to: "/admin/returns",
        })),
        ...products
          .filter((product) => Number(product.stock || 0) <= 5)
          .slice(0, 8)
          .map((product) => ({
            id: `stock-${product._id || product.id}`,
            type: Number(product.stock || 0) <= 0 ? "out" : "stock",
            title:
              Number(product.stock || 0) <= 0
                ? "Product out of stock"
                : "Low stock alert",
            message: `${product.name} (${Number(product.stock || 0)} units)`,
            time: product.updatedAt || product.createdAt,
            to: "/admin/inventory",
          })),
      ]
        .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
        .slice(0, 20);

      setNotifications(nextNotifications);
      setLastUpdated(new Date());
    } catch (error) {
      setNotificationError("Could not load notifications");
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 20000);
    const handleFocus = () => loadNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const notificationCount = notifications.filter(
    (item) => !readNotificationSet.has(item.id)
  ).length;
  const notificationCountLabel =
    notificationCount > 99 ? "99+" : String(notificationCount);

  const notificationTone = (type) => {
    if (type === "cancel" || type === "out") return "bg-red-50 text-red-700";
    if (type === "return") return "bg-blue-50 text-blue-700";
    if (type === "stock") return "bg-orange-50 text-orange-700";
    return "bg-green-50 text-green-700";
  };

  const openNotification = (item) => {
    markNotificationRead(item.id);
    setNotificationOpen(false);
    navigate(item.to);
  };

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-[260px]"
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-black">
          <img src="/logo_white.png" alt="Filoteso" className="h-8 w-8 object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-black">
              Filoteso
            </p>
            <p className="truncate text-xs text-gray-500">Admin Console</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex h-11 items-center gap-3 px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} strokeWidth={1.9} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={logout}
          className={`flex h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={18} strokeWidth={1.9} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full">{sidebar}</div>
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-black/40"
          />
        </div>
      )}

      <div
        className={`min-h-screen transition-all duration-200 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center border border-gray-200 text-gray-700 hover:border-black hover:text-black lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-10 w-10 items-center justify-center border border-gray-200 text-gray-700 hover:border-black hover:text-black lg:flex"
              aria-label="Collapse sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-950 sm:text-lg">
                {title}
              </h1>
              <p className="hidden text-xs text-gray-500 sm:block">
                Manage catalog, inventory, orders, and requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((value) => !value);
                setProfileOpen(false);
                if (!notificationOpen) loadNotifications();
              }}
              className="relative flex h-10 w-10 items-center justify-center border border-gray-200 text-gray-700 hover:border-black hover:text-black"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.9} />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                  {notificationCountLabel}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-16 top-[calc(100%+8px)] z-40 w-[min(92vw,420px)] border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-950">
                      Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      {lastUpdated
                        ? `Updated ${formatTime(lastUpdated)}`
                        : "Live admin alerts"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="h-9 border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-black hover:text-black"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={loadNotifications}
                      disabled={notificationLoading}
                      className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-600 hover:border-black hover:text-black disabled:opacity-50"
                      aria-label="Refresh notifications"
                    >
                      <RefreshCw
                        size={16}
                        className={notificationLoading ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {notificationError && (
                    <div className="mb-2 flex items-center gap-2 border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertTriangle size={16} />
                      {notificationError}
                    </div>
                  )}

                  {notificationLoading && notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm font-semibold text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length ? (
                    <div className="space-y-1">
                      {notifications.map((item) => {
                        const isRead = readNotificationSet.has(item.id);
                        return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openNotification(item)}
                          className={`flex w-full gap-3 px-3 py-3 text-left transition hover:bg-gray-50 ${
                            isRead ? "opacity-60" : "bg-gray-50/70"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center ${notificationTone(
                              item.type
                            )}`}
                          >
                            {item.type === "stock" || item.type === "out" ? (
                              <Boxes size={17} />
                            ) : item.type === "return" ? (
                              <RotateCcw size={17} />
                            ) : item.type === "cancel" ? (
                              <XCircle size={17} />
                            ) : (
                              <ShoppingBag size={17} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              {!isRead && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />
                              )}
                              <span className="block text-sm font-bold text-gray-950">
                                {item.title}
                              </span>
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-gray-500">
                              {item.message}
                            </span>
                            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                              {formatTime(item.time)}
                            </span>
                          </span>
                        </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm font-bold text-gray-800">
                        No active notifications
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        New orders, requests, and stock alerts will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationOpen(false);
                }}
                className="flex h-10 items-center gap-2 border border-gray-200 px-2 text-gray-800 hover:border-black"
              >
                <UserCircle size={22} strokeWidth={1.7} />
                <span className="hidden text-sm font-semibold sm:inline">Admin</span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-48 border border-gray-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="text-sm font-bold text-gray-950">Admin</p>
                    <p className="text-xs text-gray-500">Catalog manager</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
