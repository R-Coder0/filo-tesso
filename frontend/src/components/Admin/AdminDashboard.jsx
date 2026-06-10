import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  IndianRupee,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { extractProducts } from "../../utils/products";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getSalePrice = (product) => Number(product?.price?.sale || 0);

export default function AdminDashboard() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const adminHeaders = { authorization: import.meta.env.VITE_ADMIN_TOKEN };

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountSetting, setDiscountSetting] = useState({
    enabled: true,
    percentage: 15,
  });
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");
  const [discountInput, setDiscountInput] = useState("15");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, cancellationRes, returnRes, discountRes] =
        await Promise.all([
          axios.get(`${apiUrl}/api/products`),
          axios.get(`${apiUrl}/api/orders/admin`, { headers: adminHeaders }),
          axios.get(`${apiUrl}/api/orders/admin/cancellation-requests`, {
            headers: adminHeaders,
          }),
          axios.get(`${apiUrl}/api/orders/admin/return-requests`, {
            headers: adminHeaders,
          }),
          axios.get(`${apiUrl}/api/admin/first-order-discount`),
        ]);

      setProducts(extractProducts(productsRes.data));
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setCancellations(
        Array.isArray(cancellationRes.data) ? cancellationRes.data : []
      );
      setReturns(Array.isArray(returnRes.data) ? returnRes.data : []);

      const percentage = Number(discountRes.data?.percentage ?? 15);
      setDiscountSetting({
        enabled: Boolean(discountRes.data?.enabled),
        percentage,
      });
      setDiscountInput(String(percentage));
    } catch (error) {
      setDiscountMessage("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const stats = useMemo(() => {
    const totalStock = products.reduce(
      (sum, product) => sum + Number(product.stock || 0),
      0
    );
    const stockValue = products.reduce(
      (sum, product) => sum + Number(product.stock || 0) * getSalePrice(product),
      0
    );
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.payableAmount || order.totalAmount || 0),
      0
    );
    const delivered = orders.filter(
      (order) => order.orderStatus === "delivered"
    ).length;
    const pending = orders.filter(
      (order) => (order.orderStatus || "pending") === "pending"
    ).length;
    const lowStock = products.filter(
      (product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 5
    );
    const outOfStock = products.filter((product) => Number(product.stock || 0) <= 0);

    return {
      totalStock,
      stockValue,
      revenue,
      delivered,
      pending,
      lowStock,
      outOfStock,
    };
  }, [orders, products]);

  const clampDiscount = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 15;
    return Math.min(100, Math.max(0, numericValue));
  };

  const updateDiscountSetting = async (nextSetting) => {
    setDiscountSaving(true);
    setDiscountMessage("");
    try {
      const { data } = await axios.put(
        `${apiUrl}/api/admin/first-order-discount`,
        nextSetting,
        { headers: adminHeaders }
      );
      const percentage = Number(data.percentage ?? nextSetting.percentage);
      setDiscountSetting({
        enabled: Boolean(data.enabled),
        percentage,
      });
      setDiscountInput(String(percentage));
      setDiscountMessage("Discount settings updated");
    } catch (err) {
      setDiscountMessage(
        err.response?.data?.message || "Failed to update discount"
      );
    } finally {
      setDiscountSaving(false);
    }
  };

  const saveDiscountPercentage = () => {
    const percentage = clampDiscount(discountInput);
    updateDiscountSetting({
      ...discountSetting,
      percentage,
    });
  };

  const cards = [
    {
      label: "Total Revenue",
      value: formatINR(stats.revenue),
      sub: `${orders.length} total orders`,
      Icon: IndianRupee,
    },
    {
      label: "Products",
      value: products.length,
      sub: `${stats.totalStock} units in stock`,
      Icon: ShoppingBag,
    },
    {
      label: "Inventory Value",
      value: formatINR(stats.stockValue),
      sub: `${stats.lowStock.length} low-stock SKUs`,
      Icon: Boxes,
    },
    {
      label: "Delivered",
      value: stats.delivered,
      sub: `${stats.pending} pending orders`,
      Icon: PackageCheck,
    },
    {
      label: "Cancellations",
      value: cancellations.length,
      sub: "Open customer requests",
      Icon: XCircle,
    },
    {
      label: "Returns",
      value: returns.length,
      sub: "Open return requests",
      Icon: RefreshCw,
    },
  ];

  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
            Overview
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-950 md:text-3xl">
            Business Analytics
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center justify-center gap-2 border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="border border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ label, value, sub, Icon }) => (
              <div key={label} className="border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      {label}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
                    <p className="mt-1 text-sm text-gray-500">{sub}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center border border-gray-200 bg-gray-50 text-gray-950">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-gray-950">Recent Orders</h3>
                  <p className="text-sm text-gray-500">Latest customer activity</p>
                </div>
                <TrendingUp size={20} className="text-gray-400" />
              </div>
              <div className="divide-y divide-gray-100">
                {recentOrders.length ? (
                  recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_auto_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-950">
                          {order.address?.name || order.user?.name || "Customer"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {order._id}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatINR(order.payableAmount || order.totalAmount)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {order.orderStatus || "pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-sm text-gray-500">
                    No orders yet.
                  </div>
                )}
              </div>
            </section>

            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-base font-bold text-gray-950">
                  Inventory Alerts
                </h3>
                <p className="text-sm text-gray-500">
                  Low-stock and out-of-stock products
                </p>
              </div>
              <div className="space-y-3 p-5">
                {[...stats.outOfStock, ...stats.lowStock].slice(0, 6).map((product) => (
                  <div
                    key={product._id || product.id}
                    className="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        Number(product.stock || 0) <= 0
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    >
                      {Number(product.stock || 0) <= 0
                        ? "Out"
                        : `${product.stock} left`}
                    </span>
                  </div>
                ))}
                {!stats.outOfStock.length && !stats.lowStock.length && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 size={16} />
                    Inventory looks healthy.
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  First Order Discount
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Applies only on a customer's first order.
                </p>
              </div>
              <button
                type="button"
                disabled={discountSaving}
                onClick={() =>
                  updateDiscountSetting({
                    ...discountSetting,
                    enabled: !discountSetting.enabled,
                  })
                }
                className={`min-w-20 border px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                  discountSetting.enabled
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-gray-100 text-gray-600"
                } disabled:opacity-50`}
              >
                {discountSetting.enabled ? "On" : "Off"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discountInput}
                  onChange={(event) => setDiscountInput(event.target.value)}
                  onBlur={() => setDiscountInput(String(clampDiscount(discountInput)))}
                  className="w-full border border-gray-300 px-3 py-3 pr-8 text-sm font-semibold outline-none focus:border-black"
                  disabled={discountSaving}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                  %
                </span>
              </div>
              <button
                type="button"
                disabled={discountSaving}
                onClick={saveDiscountPercentage}
                className="border border-black bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-white hover:text-black disabled:opacity-50"
              >
                Save Discount
              </button>
            </div>

            {discountMessage && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle size={16} />
                {discountMessage}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
