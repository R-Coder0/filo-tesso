// src/components/Admin/ManageOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Ban,
  CheckCircle,
  Clock,
  Eye,
  FileDown,
  Loader,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { showToastConfirm } from "../../utils/toastConfirm";
import { extractProducts } from "../../utils/products";

const pageTitle = {
  all: "All Orders",
  cancellations: "Cancellation Requests",
  returns: "Return Requests",
};

const getOrderNumber = (order) => order.orderNumber || order._id;

const getItemName = (item) =>
  item.name || item.product?.name || "Unknown Product";

const getItemImage = (item) => item.product?.image || "/placeholder.jpg";

const getItemPrice = (item) =>
  item.priceAtPurchase ?? item.product?.price?.sale ?? 0;

const emptyManualOrder = {
  customerName: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  paymentMethod: "COD",
  paymentStatus: "Pending",
  orderStatus: "pending",
  adminNote: "",
  products: [{ product: "", selectedSize: "", quantity: 1 }],
};

const getProductSalePrice = (product) => Number(product?.price?.sale || 0);

const getProductSizes = (product) => {
  if (Array.isArray(product?.sizeVariants) && product.sizeVariants.length) {
    return product.sizeVariants.map((variant) => ({
      size: String(variant.size || "").toUpperCase(),
      stock: Number(variant.stock || 0),
    }));
  }

  if (Array.isArray(product?.sizes) && product.sizes.length) {
    return product.sizes.map((size) => ({
      size: String(size || "").toUpperCase(),
      stock: Number(product?.stock || 0),
    }));
  }

  return [];
};

const OrderDetailsModal = ({
  apiUrl,
  downloading,
  onClose,
  onDownloadLabel,
  onRefreshShipment,
  order,
  refreshing,
}) => {
  if (!order) return null;

  const shipment = order.shiprocket || {};
  const hasCustomization =
    order.customizationUploads?.image ||
    order.customizationUploads?.pdf ||
    order.customizationUploads?.selectedSide;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">
              Order details
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-950">
              {getOrderNumber(order)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            aria-label="Close order details"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Order date", new Date(order.createdAt).toLocaleString()],
              ["Order status", order.orderStatus || "pending"],
              ["Payment", `${order.paymentMethod} · ${order.paymentStatus}`],
              ["Payable amount", `₹${order.payableAmount}`],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {order.manualEntry && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Manual admin entry</p>
              {order.adminNote && <p className="mt-1">{order.adminNote}</p>}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Customer & shipping
              </h4>
              <div className="mt-4 space-y-1 text-sm leading-6 text-gray-600">
                <p className="font-semibold text-gray-950">{order.address?.name || "—"}</p>
                <p>{order.address?.phone || "—"}</p>
                <p>{order.address?.email || "—"}</p>
                <p className="pt-2">
                  {order.address?.street || "—"}
                  <br />
                  {order.address?.city || "—"}, {order.address?.state || "—"}{" "}
                  {order.address?.postalCode || ""}
                  <br />
                  {order.address?.country || "India"}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Shiprocket
                  </p>
                  <h4 className="mt-1 text-lg font-semibold">
                    {shipment.status || shipment.syncStatus || "Not started"}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onRefreshShipment(order)}
                    disabled={refreshing}
                    className="rounded-lg border border-white/20 p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Refresh shipment"
                    title={
                      shipment.shipmentId
                        ? "Refresh shipment"
                        : "Retry Shiprocket sync"
                    }
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadLabel(order)}
                    disabled={!shipment.awbCode || downloading}
                    className="rounded-lg border border-white/20 p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Download shipment label"
                    title={
                      shipment.awbCode
                        ? "Download shipment label"
                        : "Label available after AWB assignment"
                    }
                  >
                    {downloading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400">SR Order ID</dt>
                  <dd className="mt-1 break-all font-medium">{shipment.orderId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Shipment ID</dt>
                  <dd className="mt-1 break-all font-medium">{shipment.shipmentId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">AWB</dt>
                  <dd className="mt-1 break-all font-medium">{shipment.awbCode || "Awaiting"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Courier</dt>
                  <dd className="mt-1 font-medium">{shipment.courierName || "Awaiting"}</dd>
                </div>
              </dl>
              {shipment.lastError && (
                <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-xs text-red-200">
                  {shipment.lastError}
                </p>
              )}
            </section>
          </div>

          <section>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Products
            </h4>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
              {(order.products || []).map((item, index) => (
                <div
                  key={`${item.product?._id || item.product || index}-${index}`}
                  className={`flex items-center gap-4 p-4 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <img
                    src={`${apiUrl}${getItemImage(item)}`}
                    alt={getItemName(item)}
                    className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-950">
                      {getItemName(item)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Qty {item.quantity} · ₹{getItemPrice(item)} · Size{" "}
                      {item.selectedSize || "—"}
                      {item.selectedColor ? ` · ${item.selectedColor}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{item.sku || "No SKU"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {hasCustomization && (
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Customization
              </h4>
              <p className="mt-3 text-sm text-gray-600">
                Design side: {order.customizationUploads?.selectedSide || "—"}
              </p>
              <div className="mt-3 flex flex-wrap items-start gap-4">
                {order.customizationUploads?.image && (
                  <img
                    src={`${apiUrl}${order.customizationUploads.image}`}
                    alt="Custom upload"
                    className="h-28 w-28 rounded-lg border border-gray-200 object-cover"
                  />
                )}
                {order.customizationUploads?.pdf && (
                  <a
                    href={`${apiUrl}${order.customizationUploads.pdf}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                  >
                    View customization PDF
                  </a>
                )}
              </div>
            </section>
          )}

          {(order.cancelled || order.returnRequested) && (
            <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
              {order.cancelled && (
                <p>
                  Cancellation {order.cancellationStatus}:{" "}
                  {order.cancellationReason || "No reason provided"}
                </p>
              )}
              {order.returnRequested && (
                <p>
                  Return {order.returnStatus}:{" "}
                  {order.returnReason || "No reason provided"}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const ManageOrders = ({ view = "all" }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]); // ✅ ADDED
  const activeTab = view;
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [processingCancellation, setProcessingCancellation] = useState(null);
  const [processingReturn, setProcessingReturn] = useState(null); // ✅ ADDED
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shipmentAction, setShipmentAction] = useState(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualOrder, setManualOrder] = useState(emptyManualOrder);
  const [savingManualOrder, setSavingManualOrder] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  // Axios instance with admin token auth
  const axiosAdmin = axios.create({
    baseURL: `${apiUrl}/api/orders`,
    headers: {
      authorization: import.meta.env.VITE_ADMIN_TOKEN,
    },
  });
  const axiosShiprocket = axios.create({
    baseURL: `${apiUrl}/api/shiprocket`,
    headers: {
      authorization: import.meta.env.VITE_ADMIN_TOKEN,
    },
  });

  useEffect(() => {
    sessionStorage.removeItem("fromDashboard");
    fetchOrders();
    fetchProducts();
    fetchCancellationRequests();
    fetchReturnRequests(); // ✅ ADDED

    const refreshTimer = setInterval(() => {
      if (view === "all") fetchOrders(true);
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, []);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axiosAdmin.get("/admin");
      // Sort orders: newest first (based on createdAt timestamp)
      const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      setSelectedOrder((current) =>
        current
          ? sortedOrders.find((order) => order._id === current._id) || current
          : null
      );
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchCancellationRequests = async () => {
    try {
      const res = await axiosAdmin.get("/admin/cancellation-requests");
      // Sort cancellation requests: newest first
      const sortedRequests = res.data.sort((a, b) => new Date(b.cancelledAt || b.createdAt) - new Date(a.cancelledAt || a.createdAt));
      setCancellationRequests(sortedRequests);
    } catch (error) {
      console.error("Error fetching cancellation requests", error);
    }
  };

  // ✅ ADDED: Fetch return requests
  const fetchReturnRequests = async () => {
    try {
      const res = await axiosAdmin.get("/admin/return-requests");
      // Sort return requests: newest first
      const sortedRequests = res.data.sort((a, b) => new Date(b.returnRequestedAt || b.createdAt) - new Date(a.returnRequestedAt || a.createdAt));
      setReturnRequests(sortedRequests);
    } catch (error) {
      console.error("Error fetching return requests", error);
    }
  };

  const handleUpdateCancellationStatus = async (orderId, status) => {
    try {
      setProcessingCancellation({ orderId, status });
      
      await axiosAdmin.patch(`/admin/${orderId}/cancellation-status`, { status });
      await fetchOrders();
      await fetchCancellationRequests();
      
      setProcessingCancellation(null);
      toast.success(`Cancellation ${status} successfully`);
    } catch (error) {
      console.error("Error updating cancellation status", error);
      setProcessingCancellation(null);
      toast.error("Failed to update cancellation status");
    }
  };

  // ✅ ADDED: Handle return status update
  const handleUpdateReturnStatus = async (orderId, status) => {
    try {
      setProcessingReturn({ orderId, status });
      
      await axiosAdmin.patch(`/admin/${orderId}/return-status`, { status });
      await fetchOrders();
      await fetchReturnRequests();
      
      setProcessingReturn(null);
      toast.success(`Return ${status} successfully`);
    } catch (error) {
      console.error("Error updating return status", error);
      setProcessingReturn(null);
      toast.error("Failed to update return status");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/products`);
      setProducts(extractProducts(res.data));
    } catch (error) {
      console.error("Error fetching products for manual orders", error);
    }
  };

  const deleteOrder = async (id) => {
    try {
      setDeletingOrderId(id);
      await axiosAdmin.delete(`/${id}`);
      await fetchOrders();
      await fetchCancellationRequests();
      await fetchReturnRequests(); // ✅ ADDED
      toast.success("Order deleted successfully");
      setSelectedOrder((current) => (current?._id === id ? null : current));
      setDeletingOrderId(null);
    } catch (err) {
      console.error("Failed to delete order", err);
      toast.error("Failed to delete order");
      setDeletingOrderId(null);
    }
  };

  const handleDelete = (id) => {
    showToastConfirm({
      title: "Delete this order?",
      message: "This order will be removed from the admin list.",
      confirmText: "Delete",
      confirmClassName: "bg-red-600 hover:bg-red-700",
      onConfirm: () => deleteOrder(id),
    });
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      
      const response = await axiosAdmin.post("/update-status", {
        id: orderId,
        status: newStatus,
      });
      await fetchOrders();
      
      setUpdatingOrderId(null);
      if (response.data.shiprocketWarning) {
        toast.error(
          `Order shipped, but AWB assignment is pending: ${response.data.shiprocketWarning}`
        );
      } else {
        toast.success(
          newStatus === "shipped"
            ? "Order shipped and sent to Shiprocket"
            : `Order status updated to ${newStatus}`
        );
      }
    } catch (error) {
      console.error("Error updating order status", error);
      setUpdatingOrderId(null);
      await fetchOrders(true);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update order status"
      );
    }
  };

  const handleRefreshShipment = async (order) => {
    try {
      setShipmentAction({ orderId: order._id, type: "refresh" });
      await axiosShiprocket.post(`/orders/${order._id}/refresh`);
      await fetchOrders(true);
      toast.success("Shipment details refreshed");
    } catch (error) {
      console.error("Failed to refresh shipment", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to refresh shipment"
      );
    } finally {
      setShipmentAction(null);
    }
  };

  const handleSyncOrRefreshShipment = async (order) => {
    if (order.shiprocket?.shipmentId) {
      return handleRefreshShipment(order);
    }

    try {
      setShipmentAction({ orderId: order._id, type: "sync" });
      await axiosShiprocket.post(`/orders/${order._id}/sync`);
      await fetchOrders(true);
      toast.success("Order synced with Shiprocket");
    } catch (error) {
      console.error("Failed to sync order with Shiprocket", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to sync order with Shiprocket"
      );
    } finally {
      setShipmentAction(null);
    }
  };

  const handleDownloadLabel = async (order) => {
    try {
      setShipmentAction({ orderId: order._id, type: "label" });
      const response = await axiosShiprocket.get(`/orders/${order._id}/label`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${getOrderNumber(order)}-label.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      await fetchOrders(true);
      toast.success("Shipment label downloaded");
    } catch (error) {
      console.error("Failed to download shipment label", error);
      toast.error("Label is available after Shiprocket assigns an AWB");
    } finally {
      setShipmentAction(null);
    }
  };

  const getFreshManualOrder = () => ({
    ...emptyManualOrder,
    products: emptyManualOrder.products.map((item) => ({ ...item })),
  });

  const getManualProduct = (productId) =>
    products.find((product) => product._id === productId);

  const getManualItemStock = (item) => {
    const product = getManualProduct(item.product);
    if (!product) return 0;
    const sizes = getProductSizes(product);
    if (!sizes.length) return Number(product.stock || 0);

    const selected = sizes.find((variant) => variant.size === item.selectedSize);
    return Number(selected?.stock || 0);
  };

  const manualOrderTotal = manualOrder.products.reduce((sum, item) => {
    const product = getManualProduct(item.product);
    return sum + getProductSalePrice(product) * Number(item.quantity || 0);
  }, 0);

  const openManualOrderModal = () => {
    setManualOrder(getFreshManualOrder());
    setManualModalOpen(true);
  };

  const closeManualOrderModal = () => {
    if (savingManualOrder) return;
    setManualModalOpen(false);
    setManualOrder(getFreshManualOrder());
  };

  const updateManualField = (field, value) => {
    setManualOrder((current) => ({
      ...current,
      [field]: value,
      ...(field === "paymentMethod"
        ? { paymentStatus: value === "Prepaid" ? "Paid" : "Pending" }
        : {}),
    }));
  };

  const updateManualItem = (index, field, value) => {
    setManualOrder((current) => {
      const nextProducts = current.products.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "product") {
          const selectedProduct = products.find((product) => product._id === value);
          const [firstSize] = getProductSizes(selectedProduct);
          return {
            product: value,
            selectedSize: firstSize?.size || "",
            quantity: 1,
          };
        }

        if (field === "quantity") {
          return {
            ...item,
            quantity: Math.max(1, Number(value || 1)),
          };
        }

        return {
          ...item,
          [field]: value,
          ...(field === "selectedSize" ? { quantity: 1 } : {}),
        };
      });

      return { ...current, products: nextProducts };
    });
  };

  const addManualItem = () => {
    setManualOrder((current) => ({
      ...current,
      products: [
        ...current.products,
        { product: "", selectedSize: "", quantity: 1 },
      ],
    }));
  };

  const removeManualItem = (index) => {
    setManualOrder((current) => ({
      ...current,
      products:
        current.products.length > 1
          ? current.products.filter((_, itemIndex) => itemIndex !== index)
          : current.products,
    }));
  };

  const handleCreateManualOrder = async (event) => {
    event.preventDefault();

    const orderProducts = manualOrder.products
      .filter((item) => item.product)
      .map((item) => ({
        product: item.product,
        selectedSize: item.selectedSize,
        quantity: Number(item.quantity || 1),
      }));

    if (!orderProducts.length) {
      toast.error("Please add at least one product");
      return;
    }

    try {
      setSavingManualOrder(true);
      await axiosAdmin.post("/admin/manual", {
        address: {
          name: manualOrder.customerName,
          phone: manualOrder.phone,
          email: manualOrder.email,
          street: manualOrder.street,
          city: manualOrder.city,
          state: manualOrder.state,
          postalCode: manualOrder.postalCode,
          country: "India",
        },
        products: orderProducts,
        paymentMethod: manualOrder.paymentMethod,
        paymentStatus: manualOrder.paymentStatus,
        orderStatus: manualOrder.orderStatus,
        adminNote: manualOrder.adminNote,
      });

      await fetchOrders();
      await fetchProducts();
      closeManualOrderModal();
      toast.success("Manual order added successfully");
    } catch (error) {
      console.error("Failed to create manual order", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to add manual order"
      );
    } finally {
      setSavingManualOrder(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Paid: 'bg-green-100 text-green-800',
      Failed: 'bg-red-100 text-red-800',
      Refunded: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 ${colors[status] || 'bg-gray-100 text-gray-800'} text-xs font-medium rounded`}>
        {status}
      </span>
    );
  };

  // Helper function to check if an order is being processed
  const isProcessingCancellation = (orderId, status = null) => {
    return processingCancellation && 
           processingCancellation.orderId === orderId && 
           (status ? processingCancellation.status === status : true);
  };

  // ✅ ADDED: Helper function to check if return is being processed
  const isProcessingReturn = (orderId, status = null) => {
    return processingReturn && 
           processingReturn.orderId === orderId && 
           (status ? processingReturn.status === status : true);
  };

  // Function to get time difference for "New" badge
  const isNewOrder = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - orderTime) / (1000 * 60 * 60);
    return hoursDifference <= 24; // Show as new if within 24 hours
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-9">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
            Order Operations
          </p>
          <h2 className="text-2xl font-bold text-gray-950 md:text-3xl">
            {pageTitle[activeTab] || "Orders"}
          </h2>
        </div>
        {activeTab === "all" && (
          <button
            type="button"
            onClick={openManualOrderModal}
            className="inline-flex items-center justify-center gap-2 border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
          >
            <Plus className="h-4 w-4" />
            Add Manual Order
          </button>
        )}
      </div>

      {activeTab === "all" ? (
        <>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-14 text-center shadow-sm">
              <Package className="mx-auto mb-4 h-14 w-14 text-gray-300" />
              <p className="text-gray-600">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full border-collapse text-left">
                  <thead className="bg-gray-950 text-white">
                    <tr className="text-xs uppercase tracking-[0.12em]">
                      <th className="px-4 py-4 font-semibold">Order</th>
                      <th className="px-4 py-4 font-semibold">Customer</th>
                      <th className="px-4 py-4 font-semibold">Date</th>
                      <th className="px-4 py-4 font-semibold">Payment</th>
                      <th className="px-4 py-4 font-semibold">Items</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 font-semibold">Shipment</th>
                      <th className="px-4 py-4 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => {
                      const isUpdating = updatingOrderId === order._id;
                      const isDeleting = deletingOrderId === order._id;
                      const isRefreshing =
                        shipmentAction?.orderId === order._id &&
                        ["refresh", "sync"].includes(shipmentAction.type);
                      const isDownloading =
                        shipmentAction?.orderId === order._id &&
                        shipmentAction.type === "label";
                      const shipment = order.shiprocket || {};

                      return (
                        <tr
                          key={order._id}
                          className={`border-t border-gray-200 align-middle transition hover:bg-gray-100 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } ${isUpdating || isDeleting ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-gray-950">
                                {getOrderNumber(order)}
                              </span>
                              {isNewOrder(order.createdAt) && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                  NEW
                                </span>
                              )}
                              {order.manualEntry && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                  MANUAL
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              {order.paymentMethod}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="max-w-[170px] truncate text-sm font-semibold text-gray-900">
                              {order.address?.name || "—"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {order.address?.phone || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-bold text-gray-950">
                              ₹{order.payableAmount}
                            </p>
                            <div className="mt-1">
                              {getPaymentStatusBadge(order.paymentStatus)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {order.products?.reduce(
                              (total, item) => total + Number(item.quantity || 0),
                              0
                            ) || 0}
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={order.orderStatus || "pending"}
                              onChange={(event) =>
                                handleUpdateOrderStatus(order._id, event.target.value)
                              }
                              disabled={isUpdating || isDeleting}
                              className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium capitalize text-gray-800 outline-none transition focus:border-gray-950 disabled:cursor-wait"
                              aria-label={`Update ${getOrderNumber(order)} status`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option
                                value="shipped"
                                disabled={!shipment.shipmentId}
                              >
                                Shipped
                              </option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="returned">Returned</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            {shipment.shipmentId ? (
                              <div className="space-y-1 text-xs text-gray-600">
                                <p>
                                  <span className="font-semibold text-gray-900">SR:</span>{" "}
                                  {shipment.orderId || "—"}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-900">Shipment:</span>{" "}
                                  {shipment.shipmentId}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-900">AWB:</span>{" "}
                                  {shipment.awbCode || "Awaiting"}
                                </p>
                                {shipment.status && (
                                  <p className="font-medium text-purple-700">
                                    {shipment.status}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Truck className="h-4 w-4" />
                                {shipment.syncStatus === "failed"
                                  ? "Sync failed"
                                  : "Not shipped"}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition hover:border-gray-950 hover:bg-gray-950 hover:text-white"
                                aria-label="View order details"
                                title="View order details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSyncOrRefreshShipment(order)}
                                disabled={isRefreshing}
                                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition hover:border-gray-950 hover:bg-gray-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Refresh shipment"
                                title={
                                  shipment.shipmentId
                                    ? "Refresh Shiprocket shipment"
                                    : "Retry Shiprocket sync"
                                }
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${
                                    isRefreshing ? "animate-spin" : ""
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadLabel(order)}
                                disabled={!shipment.awbCode || isDownloading}
                                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition hover:border-gray-950 hover:bg-gray-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Download shipment label"
                                title={
                                  shipment.awbCode
                                    ? "Download shipment label"
                                    : "Label available after AWB assignment"
                                }
                              >
                                {isDownloading ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileDown className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(order._id)}
                                disabled={isDeleting || isUpdating}
                                className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Delete order"
                                title="Delete order"
                              >
                                {isDeleting ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {manualModalOpen && (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeManualOrderModal();
              }}
            >
              <form
                onSubmit={handleCreateManualOrder}
                className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              >
                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">
                      Admin order entry
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-gray-950">
                      Add Manual Order
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeManualOrderModal}
                    disabled={savingManualOrder}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Close manual order form"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[calc(92vh-150px)] space-y-6 overflow-y-auto p-6">
                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                      Customer
                    </h4>
                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                      <input
                        type="text"
                        value={manualOrder.customerName}
                        onChange={(event) =>
                          updateManualField("customerName", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                        placeholder="Customer name"
                        required
                      />
                      <input
                        type="tel"
                        value={manualOrder.phone}
                        onChange={(event) =>
                          updateManualField("phone", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                        placeholder="Phone"
                        required
                      />
                      <input
                        type="email"
                        value={manualOrder.email}
                        onChange={(event) =>
                          updateManualField("email", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                        placeholder="Email optional"
                      />
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                      Shipping Address
                    </h4>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={manualOrder.street}
                        onChange={(event) =>
                          updateManualField("street", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950 md:col-span-2"
                        placeholder="Street address"
                        required
                      />
                      <input
                        type="text"
                        value={manualOrder.city}
                        onChange={(event) =>
                          updateManualField("city", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                        placeholder="City"
                        required
                      />
                      <input
                        type="text"
                        value={manualOrder.state}
                        onChange={(event) =>
                          updateManualField("state", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                        placeholder="State"
                        required
                      />
                      <input
                        type="text"
                        value={manualOrder.postalCode}
                        onChange={(event) =>
                          updateManualField("postalCode", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                        placeholder="Pincode"
                        required
                      />
                      <input
                        type="text"
                        value="India"
                        readOnly
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                      />
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                      Payment & Status
                    </h4>
                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                      <select
                        value={manualOrder.paymentMethod}
                        onChange={(event) =>
                          updateManualField("paymentMethod", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950"
                      >
                        <option value="COD">COD</option>
                        <option value="Prepaid">Prepaid</option>
                      </select>
                      <select
                        value={manualOrder.paymentStatus}
                        onChange={(event) =>
                          updateManualField("paymentStatus", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                      <select
                        value={manualOrder.orderStatus}
                        onChange={(event) =>
                          updateManualField("orderStatus", event.target.value)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                        Products
                      </h4>
                      <button
                        type="button"
                        onClick={addManualItem}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-950 hover:bg-gray-950 hover:text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {manualOrder.products.map((item, index) => {
                        const selectedProduct = getManualProduct(item.product);
                        const sizes = getProductSizes(selectedProduct);
                        const stock = item.product ? getManualItemStock(item) : 0;
                        const lineTotal =
                          getProductSalePrice(selectedProduct) *
                          Number(item.quantity || 0);

                        return (
                          <div
                            key={`${index}-${item.product || "blank"}`}
                            className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1.7fr_0.8fr_0.65fr_0.65fr_auto]"
                          >
                            <select
                              value={item.product}
                              onChange={(event) =>
                                updateManualItem(index, "product", event.target.value)
                              }
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950"
                              required
                            >
                              <option value="">
                                {products.length ? "Select product" : "Loading products..."}
                              </option>
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} · ₹{getProductSalePrice(product)}
                                </option>
                              ))}
                            </select>

                            <select
                              value={item.selectedSize}
                              onChange={(event) =>
                                updateManualItem(index, "selectedSize", event.target.value)
                              }
                              disabled={!sizes.length}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-950 disabled:bg-gray-100"
                              required={sizes.length > 0}
                            >
                              <option value="">
                                {sizes.length ? "Size" : "No size"}
                              </option>
                              {sizes.map((variant) => (
                                <option key={variant.size} value={variant.size}>
                                  {variant.size} · {variant.stock} left
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateManualItem(index, "quantity", event.target.value)
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                              required
                            />

                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                              <p className="font-semibold text-gray-950">₹{lineTotal}</p>
                              <p className="text-xs text-gray-500">Stock {stock}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeManualItem(index)}
                              disabled={manualOrder.products.length === 1}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Remove item"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <textarea
                      value={manualOrder.adminNote}
                      onChange={(event) =>
                        updateManualField("adminNote", event.target.value)
                      }
                      className="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                      placeholder="Admin note optional"
                    />
                    <div className="rounded-xl border border-gray-200 bg-gray-950 px-5 py-4 text-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Payable total
                      </p>
                      <p className="mt-1 text-2xl font-bold">₹{manualOrderTotal}</p>
                    </div>
                  </section>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeManualOrderModal}
                    disabled={savingManualOrder}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingManualOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingManualOrder ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {savingManualOrder ? "Saving..." : "Save Manual Order"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <OrderDetailsModal
            apiUrl={apiUrl}
            downloading={
              shipmentAction?.orderId === selectedOrder?._id &&
              shipmentAction?.type === "label"
            }
            onClose={() => setSelectedOrder(null)}
            onDownloadLabel={handleDownloadLabel}
            onRefreshShipment={handleSyncOrRefreshShipment}
            order={selectedOrder}
            refreshing={
              shipmentAction?.orderId === selectedOrder?._id &&
              ["refresh", "sync"].includes(shipmentAction?.type)
            }
          />
        </>
      ) : activeTab === "cancellations" ? (
        // Cancellation Requests Tab - Also sorted with newest first
        <div className="space-y-6">
          {cancellationRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cancellation requests</h3>
              <p className="text-gray-600">All cancellation requests have been processed.</p>
            </div>
          ) : (
            cancellationRequests.map((order) => {
              const isProcessingReject = isProcessingCancellation(order._id, 'rejected');
              const isProcessingApprove = isProcessingCancellation(order._id, 'approved');
              const isProcessing = isProcessingApprove;
              const isDeleting = deletingOrderId === order._id;
              const isNew = isNewOrder(order.cancelledAt || order.createdAt);
              
              return (
                <div
                  key={order._id}
                  className={`p-6 border border-orange-200 rounded-2xl shadow-md bg-orange-50 hover:shadow-lg transition relative ${
                    isProcessing || isDeleting ? 'opacity-70' : ''
                  }`}
                >
                  {/* New Cancellation Request Badge */}
                  {isNew && (
                    <div className="absolute -top-2 -left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      NEW REQUEST
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {(isProcessing || isDeleting) && (
                    <div className="absolute inset-0 bg-orange-50/80 rounded-2xl flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {isProcessing ? 'Processing request...' : 'Deleting order...'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row justify-between gap-6 relative">
                    {/* Left Side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-full">
                          <Ban className="w-4 h-4" />
                          <span className="text-sm font-medium">CANCELLATION REQUESTED</span>
                        </div>
                        <span className="text-sm text-orange-600">
                          {new Date(order.cancelledAt).toLocaleString()}
                          {isNew && <span className="ml-2 text-green-600 font-medium">(New)</span>}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold mb-2 text-gray-800">
                        Order ID: {getOrderNumber(order)}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 mb-4">
                        <div>
                          <p className="font-medium text-sm text-gray-500">User</p>
                          <p>{order.user?.name} ({order.user?.email})</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500">Amount</p>
                          <p>₹{order.totalAmount} (Payable: ₹{order.payableAmount})</p>
                        </div>
                      </div>

                      {/* Cancellation Reason */}
                      <div className="mb-4 p-3 bg-white border border-orange-200 rounded-lg">
                        <p className="font-medium text-orange-800 mb-1">Cancellation Reason:</p>
                        <p className="text-orange-700">{order.cancellationReason}</p>
                      </div>

                      {/* Products List */}
                      <div className="mt-4">
                        <p className="text-gray-800 font-semibold mb-2">Products:</p>
                        <ul className="space-y-2">
                          {(order.products || []).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <img
                                src={`${apiUrl}${item.product?.image || "/placeholder.jpg"}`}
                                alt={item.product?.name || "Product"}
                                className="w-12 h-12 object-cover rounded shadow"
                              />
                              <div>
                                <p className="text-gray-700 font-medium">
                                  {item.product?.name || "Unknown Product"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity} | Size: {item.selectedSize || "—"}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Address */}
                      <div className="mt-4">
                        <p className="text-gray-800 font-semibold mb-1">Shipping Address:</p>
                        <p className="text-gray-600 text-sm">
                          {order.address?.name}, {order.address?.street}, {order.address?.city}, {order.address?.state} - {order.address?.postalCode}
                        </p>
                      </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">Quick Actions</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleUpdateCancellationStatus(order._id, 'rejected')}
                            disabled={isProcessingReject || isDeleting}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingReject ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {isProcessingReject ? 'Rejecting...' : 'Reject Cancellation'}
                          </button>
                          <button
                            onClick={() => handleUpdateCancellationStatus(order._id, 'approved')}
                            disabled={isProcessingApprove || isDeleting}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingApprove ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {isProcessingApprove ? 'Approving...' : 'Approve Cancellation'}
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(order._id)}
                        disabled={isDeleting || isProcessing}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {isDeleting ? 'Deleting...' : 'Delete Order'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // ✅ ADDED: Return Requests Tab
        <div className="space-y-6">
          {returnRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No return requests</h3>
              <p className="text-gray-600">All return requests have been processed.</p>
            </div>
          ) : (
            returnRequests.map((order) => {
              const isProcessingReject = isProcessingReturn(order._id, 'rejected');
              const isProcessingApprove = isProcessingReturn(order._id, 'approved');
              const isProcessing = isProcessingApprove;
              const isDeleting = deletingOrderId === order._id;
              const isNew = isNewOrder(order.returnRequestedAt || order.createdAt);
              
              return (
                <div
                  key={order._id}
                  className={`p-6 border border-blue-200 rounded-2xl shadow-md bg-blue-50 hover:shadow-lg transition relative ${
                    isProcessing || isDeleting ? 'opacity-70' : ''
                  }`}
                >
                  {/* New Return Request Badge */}
                  {isNew && (
                    <div className="absolute -top-2 -left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      NEW REQUEST
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {(isProcessing || isDeleting) && (
                    <div className="absolute inset-0 bg-blue-50/80 rounded-2xl flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {isProcessing ? 'Processing request...' : 'Deleting order...'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row justify-between gap-6 relative">
                    {/* Left Side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-full">
                          <RefreshCw className="w-4 h-4" />
                          <span className="text-sm font-medium">RETURN REQUESTED</span>
                        </div>
                        <span className="text-sm text-blue-600">
                          {new Date(order.returnRequestedAt).toLocaleString()}
                          {isNew && <span className="ml-2 text-green-600 font-medium">(New)</span>}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold mb-2 text-gray-800">
                        Order ID: {getOrderNumber(order)}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 mb-4">
                        <div>
                          <p className="font-medium text-sm text-gray-500">User</p>
                          <p>{order.user?.name} ({order.user?.email})</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500">Amount</p>
                          <p>₹{order.totalAmount} (Payable: ₹{order.payableAmount})</p>
                        </div>
                      </div>

                      {/* Return Reason */}
                      <div className="mb-4 p-3 bg-white border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-800 mb-1">Return Reason:</p>
                        <p className="text-blue-700">{order.returnReason}</p>
                      </div>

                      {/* Products List */}
                      <div className="mt-4">
                        <p className="text-gray-800 font-semibold mb-2">Products:</p>
                        <ul className="space-y-2">
                          {(order.products || []).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <img
                                src={`${apiUrl}${item.product?.image || "/placeholder.jpg"}`}
                                alt={item.product?.name || "Product"}
                                className="w-12 h-12 object-cover rounded shadow"
                              />
                              <div>
                                <p className="text-gray-700 font-medium">
                                  {item.product?.name || "Unknown Product"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity} | Size: {item.selectedSize || "—"}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Address */}
                      <div className="mt-4">
                        <p className="text-gray-800 font-semibold mb-1">Shipping Address:</p>
                        <p className="text-gray-600 text-sm">
                          {order.address?.name}, {order.address?.street}, {order.address?.city}, {order.address?.state} - {order.address?.postalCode}
                        </p>
                      </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">Quick Actions</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleUpdateReturnStatus(order._id, 'rejected')}
                            disabled={isProcessingReject || isDeleting}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingReject ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {isProcessingReject ? 'Rejecting...' : 'Reject Return'}
                          </button>
                          <button
                            onClick={() => handleUpdateReturnStatus(order._id, 'approved')}
                            disabled={isProcessingApprove || isDeleting}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingApprove ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {isProcessingApprove ? 'Approving...' : 'Approve Return'}
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(order._id)}
                        disabled={isDeleting || isProcessing}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {isDeleting ? 'Deleting...' : 'Delete Order'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
