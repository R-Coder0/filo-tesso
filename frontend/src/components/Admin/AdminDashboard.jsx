import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
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
    maximumFractionDigits: 2,
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

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, cancellationRes, returnRes] =
        await Promise.all([
          axios.get(`${apiUrl}/api/products`),
          axios.get(`${apiUrl}/api/orders/admin`, { headers: adminHeaders }),
          axios.get(`${apiUrl}/api/orders/admin/cancellation-requests`, {
            headers: adminHeaders,
          }),
          axios.get(`${apiUrl}/api/orders/admin/return-requests`, {
            headers: adminHeaders,
          }),
        ]);

      setProducts(extractProducts(productsRes.data));
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setCancellations(
        Array.isArray(cancellationRes.data) ? cancellationRes.data : []
      );
      setReturns(Array.isArray(returnRes.data) ? returnRes.data : []);
    } catch (error) {
      console.error("Could not load dashboard data", error);
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
                          {order.orderNumber || order._id}
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
        </>
      )}
    </div>
  );
}
