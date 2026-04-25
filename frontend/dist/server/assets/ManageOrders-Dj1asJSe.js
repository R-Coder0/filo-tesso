import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Package, Clock, Loader, Calendar, CreditCard, AlertCircle, RefreshCw, XCircle, CheckCircle, Ban } from "lucide-react";
const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [processingCancellation, setProcessingCancellation] = useState(null);
  const [processingReturn, setProcessingReturn] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const apiUrl = "http://localhost:5000";
  const navigate = useNavigate();
  const axiosAdmin = axios.create({
    baseURL: `${apiUrl}/api/orders`,
    headers: {
      authorization: "admin-token-123"
    }
  });
  useEffect(() => {
    sessionStorage.removeItem("fromDashboard");
    fetchOrders();
    fetchCancellationRequests();
    fetchReturnRequests();
  }, []);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/admin");
      const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCancellationRequests = async () => {
    try {
      const res = await axiosAdmin.get("/admin/cancellation-requests");
      const sortedRequests = res.data.sort((a, b) => new Date(b.cancelledAt || b.createdAt) - new Date(a.cancelledAt || a.createdAt));
      setCancellationRequests(sortedRequests);
    } catch (error) {
      console.error("Error fetching cancellation requests", error);
    }
  };
  const fetchReturnRequests = async () => {
    try {
      const res = await axiosAdmin.get("/admin/return-requests");
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
      alert(`Cancellation ${status} successfully`);
    } catch (error) {
      console.error("Error updating cancellation status", error);
      setProcessingCancellation(null);
      alert("Failed to update cancellation status");
    }
  };
  const handleUpdateReturnStatus = async (orderId, status) => {
    try {
      setProcessingReturn({ orderId, status });
      await axiosAdmin.patch(`/admin/${orderId}/return-status`, { status });
      await fetchOrders();
      await fetchReturnRequests();
      setProcessingReturn(null);
      alert(`Return ${status} successfully`);
    } catch (error) {
      console.error("Error updating return status", error);
      setProcessingReturn(null);
      alert("Failed to update return status");
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      setDeletingOrderId(id);
      await axiosAdmin.delete(`/${id}`);
      await fetchOrders();
      await fetchCancellationRequests();
      await fetchReturnRequests();
      setDeletingOrderId(null);
    } catch (err) {
      console.error("Failed to delete order", err);
      setDeletingOrderId(null);
    }
  };
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await axiosAdmin.post("/update-status", {
        id: orderId,
        status: newStatus
      });
      await fetchOrders();
      setUpdatingOrderId(null);
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status", error);
      setUpdatingOrderId(null);
      alert("Failed to update order status");
    }
  };
  const getStatusBadge = (order) => {
    if (order.cancelled) {
      switch (order.cancellationStatus) {
        case "requested":
          return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded", children: "Cancellation Requested" });
        case "approved":
          return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded", children: "Cancelled" });
        case "rejected":
          return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded", children: "Cancellation Rejected" });
      }
    }
    if (order.returnRequested) {
      switch (order.returnStatus) {
        case "requested":
          return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded", children: "Return Requested" });
        case "approved":
          return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded", children: "Return Approved" });
        case "rejected":
          return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded", children: "Return Rejected" });
      }
    }
    const status = order.orderStatus || "pending";
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800"
    };
    return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 ${colors[status] || "bg-gray-100 text-gray-800"} text-xs font-medium rounded capitalize`, children: status });
  };
  const getPaymentStatusBadge = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Paid: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Refunded: "bg-gray-100 text-gray-800"
    };
    return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 ${colors[status] || "bg-gray-100 text-gray-800"} text-xs font-medium rounded`, children: status });
  };
  const isProcessingCancellation = (orderId, status = null) => {
    return processingCancellation && processingCancellation.orderId === orderId && (status ? processingCancellation.status === status : true);
  };
  const isProcessingReturn = (orderId, status = null) => {
    return processingReturn && processingReturn.orderId === orderId && (status ? processingReturn.status === status : true);
  };
  const isNewOrder = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = (/* @__PURE__ */ new Date()).getTime();
    const hoursDifference = (currentTime - orderTime) / (1e3 * 60 * 60);
    return hoursDifference <= 24;
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-9", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx(Package, { className: "w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Loading orders..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-9", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold mb-8 text-center text-orange-500 uppercase", children: "Manage Orders" }),
    /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => navigate("/admin/dashboard"),
        className: "flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition text-sm",
        children: "← Back to Dashboard"
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex border-b border-gray-200 mb-6", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: `px-6 py-3 font-medium text-lg ${activeTab === "all" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-500 hover:text-gray-700"}`,
          onClick: () => setActiveTab("all"),
          children: [
            "All Orders (",
            orders.length,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: `px-6 py-3 font-medium text-lg relative ${activeTab === "cancellations" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-500 hover:text-gray-700"}`,
          onClick: () => setActiveTab("cancellations"),
          children: [
            "Cancellation Requests",
            cancellationRequests.length > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center", children: cancellationRequests.length })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: `px-6 py-3 font-medium text-lg relative ${activeTab === "returns" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-500 hover:text-gray-700"}`,
          onClick: () => setActiveTab("returns"),
          children: [
            "Return Requests",
            returnRequests.length > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center", children: returnRequests.length })
          ]
        }
      )
    ] }),
    activeTab === "all" ? (
      // All Orders Tab - Now sorted with newest first
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: orders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "No orders found." })
      ] }) : orders.map((order) => {
        const isUpdating = updatingOrderId === order._id;
        const isDeleting = deletingOrderId === order._id;
        const isNew = isNewOrder(order.createdAt);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `p-6 border rounded-2xl shadow-md hover:shadow-lg transition relative ${order.cancelled ? "border-orange-200 bg-orange-50" : order.returnRequested ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"} ${isUpdating || isDeleting ? "opacity-70" : ""}`,
            children: [
              isNew && /* @__PURE__ */ jsxs("div", { className: "absolute -top-2 -left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                "NEW"
              ] }),
              (isUpdating || isDeleting) && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx(Loader, { className: "w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: isUpdating ? "Updating status..." : "Deleting order..." })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between gap-6 relative", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                    /* @__PURE__ */ jsxs("h3", { className: "text-md md:text-xl font-semibold text-gray-800", children: [
                      "Order ID: ",
                      order._id
                    ] }),
                    getStatusBadge(order)
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700 mb-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-gray-500" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm", children: new Date(order.createdAt).toLocaleDateString() }),
                      isNew && /* @__PURE__ */ jsx("span", { className: "text-xs text-green-600 font-medium", children: "(New)" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4 text-gray-500" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
                        "₹",
                        order.payableAmount
                      ] }),
                      getPaymentStatusBadge(order.paymentStatus)
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Package, { className: "w-4 h-4 text-gray-500" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
                        order.products?.length || 0,
                        " items"
                      ] })
                    ] })
                  ] }),
                  order.cancelled && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-orange-100 border border-orange-200 rounded-lg", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-orange-800", children: [
                      /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                        "Cancellation ",
                        order.cancellationStatus
                      ] })
                    ] }),
                    order.cancellationReason && /* @__PURE__ */ jsxs("p", { className: "text-sm text-orange-700 mt-1", children: [
                      /* @__PURE__ */ jsx("strong", { children: "Reason:" }),
                      " ",
                      order.cancellationReason
                    ] }),
                    order.cancelledAt && /* @__PURE__ */ jsxs("p", { className: "text-xs text-orange-600 mt-1", children: [
                      "Requested: ",
                      new Date(order.cancelledAt).toLocaleString()
                    ] })
                  ] }),
                  order.returnRequested && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-blue-800", children: [
                      /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                        "Return ",
                        order.returnStatus
                      ] })
                    ] }),
                    order.returnReason && /* @__PURE__ */ jsxs("p", { className: "text-sm text-blue-700 mt-1", children: [
                      /* @__PURE__ */ jsx("strong", { children: "Reason:" }),
                      " ",
                      order.returnReason
                    ] }),
                    order.returnRequestedAt && /* @__PURE__ */ jsxs("p", { className: "text-xs text-blue-600 mt-1", children: [
                      "Requested: ",
                      new Date(order.returnRequestedAt).toLocaleString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-1", children: "Shipping Address:" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-gray-600 leading-relaxed", children: [
                      /* @__PURE__ */ jsx("strong", { children: "Name:" }),
                      " ",
                      order.address?.name,
                      /* @__PURE__ */ jsx("br", {}),
                      /* @__PURE__ */ jsx("strong", { children: "Phone:" }),
                      " ",
                      order.address?.phone,
                      /* @__PURE__ */ jsx("br", {}),
                      order.address?.email && /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx("strong", { children: "Email:" }),
                        " ",
                        order.address.email,
                        /* @__PURE__ */ jsx("br", {})
                      ] }),
                      /* @__PURE__ */ jsx("strong", { children: "Street:" }),
                      " ",
                      order.address?.street,
                      /* @__PURE__ */ jsx("br", {}),
                      /* @__PURE__ */ jsx("strong", { children: "City:" }),
                      " ",
                      order.address?.city,
                      /* @__PURE__ */ jsx("br", {}),
                      /* @__PURE__ */ jsx("strong", { children: "State:" }),
                      " ",
                      order.address?.state,
                      /* @__PURE__ */ jsx("br", {}),
                      /* @__PURE__ */ jsx("strong", { children: "Postal Code:" }),
                      " ",
                      order.address?.postalCode
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-1", children: "Products:" }),
                    /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: (order.products || []).map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-4", children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: `${apiUrl}${item.product?.image || "/placeholder.jpg"}`,
                          alt: item.product?.name || "Product",
                          className: "w-16 h-16 object-cover rounded shadow"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-gray-700 font-medium", children: item.product?.name || "Unknown Product" }),
                        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                          "Qty: ",
                          item.quantity,
                          " | ₹",
                          item.product?.price?.sale || 0,
                          " | Size: ",
                          item.selectedSize || "—",
                          item.selectedColor ? ` | Color: ${item.selectedColor}` : ""
                        ] })
                      ] })
                    ] }, idx)) })
                  ] }),
                  (order.customizationUploads?.image || order.customizationUploads?.pdf || order.customizationUploads?.selectedSide) && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-1", children: "Customization:" }),
                    order.customizationUploads?.selectedSide && /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700", children: [
                      /* @__PURE__ */ jsx("strong", { children: "Design Side:" }),
                      " ",
                      order.customizationUploads.selectedSide
                    ] }) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                      order.customizationUploads?.image && /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: `${apiUrl}${order.customizationUploads.image}`,
                            alt: "Custom upload",
                            className: "w-28 h-28 object-cover rounded border"
                          }
                        ),
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1 break-all", children: order.customizationUploads.image })
                      ] }),
                      order.customizationUploads?.pdf && /* @__PURE__ */ jsx(
                        "a",
                        {
                          href: `${apiUrl}${order.customizationUploads.pdf}`,
                          target: "_blank",
                          rel: "noreferrer",
                          className: "text-blue-600 hover:underline text-sm break-all",
                          children: "View PDF"
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start lg:items-end gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700", children: "Update Status:" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: order.orderStatus,
                        onChange: (e) => handleUpdateOrderStatus(order._id, e.target.value),
                        className: "px-3 py-2 border border-gray-300 rounded-md text-sm",
                        disabled: isUpdating || isDeleting,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" }),
                          /* @__PURE__ */ jsx("option", { value: "confirmed", children: "Confirmed" }),
                          /* @__PURE__ */ jsx("option", { value: "shipped", children: "Shipped" }),
                          /* @__PURE__ */ jsx("option", { value: "delivered", children: "Delivered" }),
                          /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Cancelled" }),
                          /* @__PURE__ */ jsx("option", { value: "returned", children: "Returned" })
                        ]
                      }
                    )
                  ] }),
                  order.cancelled && order.cancellationStatus === "requested" && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-2", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleUpdateCancellationStatus(order._id, "rejected"),
                        disabled: isProcessingCancellation(order._id, "rejected") || isUpdating || isDeleting,
                        className: "px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        children: [
                          isProcessingCancellation(order._id, "rejected") ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
                          isProcessingCancellation(order._id, "rejected") ? "Rejecting..." : "Reject"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleUpdateCancellationStatus(order._id, "approved"),
                        disabled: isProcessingCancellation(order._id, "approved") || isUpdating || isDeleting,
                        className: "px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        children: [
                          isProcessingCancellation(order._id, "approved") ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
                          isProcessingCancellation(order._id, "approved") ? "Approving..." : "Approve"
                        ]
                      }
                    )
                  ] }),
                  order.returnRequested && order.returnStatus === "requested" && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-2", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleUpdateReturnStatus(order._id, "rejected"),
                        disabled: isProcessingReturn(order._id, "rejected") || isUpdating || isDeleting,
                        className: "px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        children: [
                          isProcessingReturn(order._id, "rejected") ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
                          isProcessingReturn(order._id, "rejected") ? "Rejecting..." : "Reject"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleUpdateReturnStatus(order._id, "approved"),
                        disabled: isProcessingReturn(order._id, "approved") || isUpdating || isDeleting,
                        className: "px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        children: [
                          isProcessingReturn(order._id, "approved") ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
                          isProcessingReturn(order._id, "approved") ? "Approving..." : "Approve"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handleDelete(order._id),
                      disabled: isDeleting || isUpdating,
                      className: "px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                      children: [
                        isDeleting ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
                        isDeleting ? "Deleting..." : "Delete Order"
                      ]
                    }
                  )
                ] })
              ] })
            ]
          },
          order._id
        );
      }) })
    ) : activeTab === "cancellations" ? (
      // Cancellation Requests Tab - Also sorted with newest first
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: cancellationRequests.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-16 h-16 text-green-400 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No cancellation requests" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "All cancellation requests have been processed." })
      ] }) : cancellationRequests.map((order) => {
        const isProcessingReject = isProcessingCancellation(order._id, "rejected");
        const isProcessingApprove = isProcessingCancellation(order._id, "approved");
        const isProcessing = isProcessingApprove;
        const isDeleting = deletingOrderId === order._id;
        const isNew = isNewOrder(order.cancelledAt || order.createdAt);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `p-6 border border-orange-200 rounded-2xl shadow-md bg-orange-50 hover:shadow-lg transition relative ${isProcessing || isDeleting ? "opacity-70" : ""}`,
            children: [
              isNew && /* @__PURE__ */ jsxs("div", { className: "absolute -top-2 -left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                "NEW REQUEST"
              ] }),
              (isProcessing || isDeleting) && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-orange-50/80 rounded-2xl flex items-center justify-center z-10", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx(Loader, { className: "w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: isProcessing ? "Processing request..." : "Deleting order..." })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between gap-6 relative", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-full", children: [
                      /* @__PURE__ */ jsx(Ban, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "CANCELLATION REQUESTED" })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-sm text-orange-600", children: [
                      new Date(order.cancelledAt).toLocaleString(),
                      isNew && /* @__PURE__ */ jsx("span", { className: "ml-2 text-green-600 font-medium", children: "(New)" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("h3", { className: "text-xl font-semibold mb-2 text-gray-800", children: [
                    "Order ID: ",
                    order._id
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 mb-4", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-gray-500", children: "User" }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        order.user?.name,
                        " (",
                        order.user?.email,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-gray-500", children: "Amount" }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        "₹",
                        order.totalAmount,
                        " (Payable: ₹",
                        order.payableAmount,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-gray-500", children: "Coins" }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        "Earned: +",
                        order.coinsEarned,
                        " | Redeemed: -",
                        order.coinsRedeemed
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-white border border-orange-200 rounded-lg", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-orange-800 mb-1", children: "Cancellation Reason:" }),
                    /* @__PURE__ */ jsx("p", { className: "text-orange-700", children: order.cancellationReason })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-2", children: "Products:" }),
                    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: (order.products || []).map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: `${apiUrl}${item.product?.image || "/placeholder.jpg"}`,
                          alt: item.product?.name || "Product",
                          className: "w-12 h-12 object-cover rounded shadow"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-gray-700 font-medium", children: item.product?.name || "Unknown Product" }),
                        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                          "Qty: ",
                          item.quantity,
                          " | Size: ",
                          item.selectedSize || "—"
                        ] })
                      ] })
                    ] }, idx)) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-1", children: "Shipping Address:" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-gray-600 text-sm", children: [
                      order.address?.name,
                      ", ",
                      order.address?.street,
                      ", ",
                      order.address?.city,
                      ", ",
                      order.address?.state,
                      " - ",
                      order.address?.postalCode
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start lg:items-end gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Quick Actions" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleUpdateCancellationStatus(order._id, "rejected"),
                          disabled: isProcessingReject || isDeleting,
                          className: "px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                          children: [
                            isProcessingReject ? /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4" }),
                            isProcessingReject ? "Rejecting..." : "Reject Cancellation"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleUpdateCancellationStatus(order._id, "approved"),
                          disabled: isProcessingApprove || isDeleting,
                          className: "px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                          children: [
                            isProcessingApprove ? /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
                            isProcessingApprove ? "Approving..." : "Approve Cancellation"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handleDelete(order._id),
                      disabled: isDeleting || isProcessing,
                      className: "px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                      children: [
                        isDeleting ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
                        isDeleting ? "Deleting..." : "Delete Order"
                      ]
                    }
                  )
                ] })
              ] })
            ]
          },
          order._id
        );
      }) })
    ) : (
      // ✅ ADDED: Return Requests Tab
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: returnRequests.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-16 h-16 text-green-400 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No return requests" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "All return requests have been processed." })
      ] }) : returnRequests.map((order) => {
        const isProcessingReject = isProcessingReturn(order._id, "rejected");
        const isProcessingApprove = isProcessingReturn(order._id, "approved");
        const isProcessing = isProcessingApprove;
        const isDeleting = deletingOrderId === order._id;
        const isNew = isNewOrder(order.returnRequestedAt || order.createdAt);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `p-6 border border-blue-200 rounded-2xl shadow-md bg-blue-50 hover:shadow-lg transition relative ${isProcessing || isDeleting ? "opacity-70" : ""}`,
            children: [
              isNew && /* @__PURE__ */ jsxs("div", { className: "absolute -top-2 -left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                "NEW REQUEST"
              ] }),
              (isProcessing || isDeleting) && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-blue-50/80 rounded-2xl flex items-center justify-center z-10", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx(Loader, { className: "w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: isProcessing ? "Processing request..." : "Deleting order..." })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between gap-6 relative", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-full", children: [
                      /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "RETURN REQUESTED" })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-sm text-blue-600", children: [
                      new Date(order.returnRequestedAt).toLocaleString(),
                      isNew && /* @__PURE__ */ jsx("span", { className: "ml-2 text-green-600 font-medium", children: "(New)" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("h3", { className: "text-xl font-semibold mb-2 text-gray-800", children: [
                    "Order ID: ",
                    order._id
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 mb-4", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-gray-500", children: "User" }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        order.user?.name,
                        " (",
                        order.user?.email,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-gray-500", children: "Amount" }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        "₹",
                        order.totalAmount,
                        " (Payable: ₹",
                        order.payableAmount,
                        ")"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-gray-500", children: "Coins" }),
                      /* @__PURE__ */ jsxs("p", { children: [
                        "Earned: +",
                        order.coinsEarned,
                        " | Redeemed: -",
                        order.coinsRedeemed
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-white border border-blue-200 rounded-lg", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium text-blue-800 mb-1", children: "Return Reason:" }),
                    /* @__PURE__ */ jsx("p", { className: "text-blue-700", children: order.returnReason })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-2", children: "Products:" }),
                    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: (order.products || []).map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: `${apiUrl}${item.product?.image || "/placeholder.jpg"}`,
                          alt: item.product?.name || "Product",
                          className: "w-12 h-12 object-cover rounded shadow"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-gray-700 font-medium", children: item.product?.name || "Unknown Product" }),
                        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                          "Qty: ",
                          item.quantity,
                          " | Size: ",
                          item.selectedSize || "—"
                        ] })
                      ] })
                    ] }, idx)) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-gray-800 font-semibold mb-1", children: "Shipping Address:" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-gray-600 text-sm", children: [
                      order.address?.name,
                      ", ",
                      order.address?.street,
                      ", ",
                      order.address?.city,
                      ", ",
                      order.address?.state,
                      " - ",
                      order.address?.postalCode
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start lg:items-end gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Quick Actions" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleUpdateReturnStatus(order._id, "rejected"),
                          disabled: isProcessingReject || isDeleting,
                          className: "px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                          children: [
                            isProcessingReject ? /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4" }),
                            isProcessingReject ? "Rejecting..." : "Reject Return"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleUpdateReturnStatus(order._id, "approved"),
                          disabled: isProcessingApprove || isDeleting,
                          className: "px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                          children: [
                            isProcessingApprove ? /* @__PURE__ */ jsx(Loader, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
                            isProcessingApprove ? "Approving..." : "Approve Return"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handleDelete(order._id),
                      disabled: isDeleting || isProcessing,
                      className: "px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                      children: [
                        isDeleting ? /* @__PURE__ */ jsx(Loader, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
                        isDeleting ? "Deleting..." : "Delete Order"
                      ]
                    }
                  )
                ] })
              ] })
            ]
          },
          order._id
        );
      }) })
    )
  ] });
};
export {
  ManageOrders as default
};
