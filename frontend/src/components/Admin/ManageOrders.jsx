// src/components/Admin/ManageOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Package, User, Calendar, CreditCard, CheckCircle, XCircle, Clock, Ban, AlertCircle, Loader, RefreshCw } from "lucide-react";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]); // ✅ ADDED
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'cancellations', or 'returns'
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [processingCancellation, setProcessingCancellation] = useState(null);
  const [processingReturn, setProcessingReturn] = useState(null); // ✅ ADDED
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;
const navigate = useNavigate();
  // Axios instance with admin token auth
  const axiosAdmin = axios.create({
    baseURL: `${apiUrl}/api/orders`,
    headers: {
      authorization: import.meta.env.VITE_ADMIN_TOKEN,
    },
  });

  useEffect(() => {
    sessionStorage.removeItem("fromDashboard");
    fetchOrders();
    fetchCancellationRequests();
    fetchReturnRequests(); // ✅ ADDED
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosAdmin.get("/admin");
      // Sort orders: newest first (based on createdAt timestamp)
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
      alert(`Cancellation ${status} successfully`);
    } catch (error) {
      console.error("Error updating cancellation status", error);
      setProcessingCancellation(null);
      alert("Failed to update cancellation status");
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
      await fetchReturnRequests(); // ✅ ADDED
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
        case 'requested':
          return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">Cancellation Requested</span>;
        case 'approved':
          return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Cancelled</span>;
        case 'rejected':
          return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Cancellation Rejected</span>;
      }
    }

    // ✅ ADDED: Return status badge
    if (order.returnRequested) {
      switch (order.returnStatus) {
        case 'requested':
          return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Return Requested</span>;
        case 'approved':
          return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Return Approved</span>;
        case 'rejected':
          return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Return Rejected</span>;
      }
    }
    
    const status = order.orderStatus || 'pending';
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 ${colors[status] || 'bg-gray-100 text-gray-800'} text-xs font-medium rounded capitalize`}>
        {status}
      </span>
    );
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-9">
      
      <h2 className="text-4xl font-bold mb-8 text-center text-orange-500 uppercase">Manage Orders</h2>
{/* Back Button */}
<div className="mb-4">
  <button
    onClick={() => navigate("/admin/dashboard")}
    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition text-sm"
  >
    ← Back to Dashboard
  </button>
</div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-6 py-3 font-medium text-lg ${
            activeTab === "all"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`px-6 py-3 font-medium text-lg relative ${
            activeTab === "cancellations"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("cancellations")}
        >
          Cancellation Requests 
          {cancellationRequests.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {cancellationRequests.length}
            </span>
          )}
        </button>
        {/* ✅ ADDED: Return Requests Tab */}
        <button
          className={`px-6 py-3 font-medium text-lg relative ${
            activeTab === "returns"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("returns")}
        >
          Return Requests 
          {returnRequests.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {returnRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "all" ? (
        // All Orders Tab - Now sorted with newest first
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found.</p>
            </div>
          ) : (
            orders.map((order) => {
              const isUpdating = updatingOrderId === order._id;
              const isDeleting = deletingOrderId === order._id;
              const isNew = isNewOrder(order.createdAt);
              
              return (
                <div
                  key={order._id}
                  className={`p-6 border rounded-2xl shadow-md hover:shadow-lg transition relative ${
                    order.cancelled ? 'border-orange-200 bg-orange-50' : 
                    order.returnRequested ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                  } ${isUpdating || isDeleting ? 'opacity-70' : ''}`}
                >
                  {/* New Order Badge */}
                  {isNew && (
                    <div className="absolute -top-2 -left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      NEW
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {(isUpdating || isDeleting) && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {isUpdating ? 'Updating status...' : 'Deleting order...'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row justify-between gap-6 relative">
                    {/* Left Side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-md md:text-xl font-semibold text-gray-800">
                          Order ID: {order._id}
                        </h3>
                        {getStatusBadge(order)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                          {isNew && <span className="text-xs text-green-600 font-medium">(New)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">₹{order.payableAmount}</span>
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{order.products.length} items</span>
                        </div>
                      </div>

                      {/* Cancellation Info */}
                      {order.cancelled && (
                        <div className="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Cancellation {order.cancellationStatus}</span>
                          </div>
                          {order.cancellationReason && (
                            <p className="text-sm text-orange-700 mt-1">
                              <strong>Reason:</strong> {order.cancellationReason}
                            </p>
                          )}
                          {order.cancelledAt && (
                            <p className="text-xs text-orange-600 mt-1">
                              Requested: {new Date(order.cancelledAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* ✅ ADDED: Return Info */}
                      {order.returnRequested && (
                        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <RefreshCw className="w-4 h-4" />
                            <span className="font-medium">Return {order.returnStatus}</span>
                          </div>
                          {order.returnReason && (
                            <p className="text-sm text-blue-700 mt-1">
                              <strong>Reason:</strong> {order.returnReason}
                            </p>
                          )}
                          {order.returnRequestedAt && (
                            <p className="text-xs text-blue-600 mt-1">
                              Requested: {new Date(order.returnRequestedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Full Address */}
                      <div className="mt-4">
                        <p className="text-gray-800 font-semibold mb-1">Shipping Address:</p>
                        <p className="text-gray-600 leading-relaxed">
                          <strong>Name:</strong> {order.address?.name}<br />
                          <strong>Phone:</strong> {order.address?.phone}<br />
                          {order.address?.email && (<><strong>Email:</strong> {order.address.email}<br /></>)}
                          <strong>Street:</strong> {order.address?.street}<br />
                          <strong>City:</strong> {order.address?.city}<br />
                          <strong>State:</strong> {order.address?.state}<br />
                          <strong>Postal Code:</strong> {order.address?.postalCode}
                        </p>
                      </div>

                      {/* Product List with Image and Size/Color */}
                      <div className="mt-4">
                        <p className="text-gray-800 font-semibold mb-1">Products:</p>
                        <ul className="space-y-4">
                          {order.products.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-4">
                              <img
                                src={`${apiUrl}${item.product?.image || "/placeholder.jpg"}`}
                                alt={item.product?.name || "Product"}
                                className="w-16 h-16 object-cover rounded shadow"
                              />
                              <div>
                                <p className="text-gray-700 font-medium">
                                  {item.product?.name || "Unknown Product"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity} | ₹{item.product?.price} | Size: {item.selectedSize || "—"}
                                  {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Customization uploads if present */}
                      {(order.customizationUploads?.image || order.customizationUploads?.pdf || order.customizationUploads?.selectedSide) && (
                        <div className="mt-4">
                          <p className="text-gray-800 font-semibold mb-1">Customization:</p>
                          {order.customizationUploads?.selectedSide && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-700">
                                <strong>Design Side:</strong> {order.customizationUploads.selectedSide}
                              </p>
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            {order.customizationUploads?.image && (
                              <div>
                                <img
                                  src={`${apiUrl}${order.customizationUploads.image}`}
                                  alt="Custom upload"
                                  className="w-28 h-28 object-cover rounded border"
                                />
                                <p className="text-xs text-gray-500 mt-1 break-all">{order.customizationUploads.image}</p>
                              </div>
                            )}
                            {order.customizationUploads?.pdf && (
                              <a
                                href={`${apiUrl}${order.customizationUploads.pdf}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline text-sm break-all"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex flex-col items-start lg:items-end gap-3">
                      {/* Order Status Update */}
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Update Status:</label>
                        <select 
                          value={order.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={isUpdating || isDeleting}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="returned">Returned</option>
                        </select>
                      </div>

                      {/* Cancellation Actions */}
                      {order.cancelled && order.cancellationStatus === 'requested' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateCancellationStatus(order._id, 'rejected')}
                            disabled={isProcessingCancellation(order._id, 'rejected') || isUpdating || isDeleting}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingCancellation(order._id, 'rejected') ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {isProcessingCancellation(order._id, 'rejected') ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleUpdateCancellationStatus(order._id, 'approved')}
                            disabled={isProcessingCancellation(order._id, 'approved') || isUpdating || isDeleting}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingCancellation(order._id, 'approved') ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {isProcessingCancellation(order._id, 'approved') ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      )}

                      {/* ✅ ADDED: Return Actions */}
                      {order.returnRequested && order.returnStatus === 'requested' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateReturnStatus(order._id, 'rejected')}
                            disabled={isProcessingReturn(order._id, 'rejected') || isUpdating || isDeleting}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingReturn(order._id, 'rejected') ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {isProcessingReturn(order._id, 'rejected') ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleUpdateReturnStatus(order._id, 'approved')}
                            disabled={isProcessingReturn(order._id, 'approved') || isUpdating || isDeleting}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessingReturn(order._id, 'approved') ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {isProcessingReturn(order._id, 'approved') ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(order._id)}
                        disabled={isDeleting || isUpdating}
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
                        Order ID: {order._id}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 mb-4">
                        <div>
                          <p className="font-medium text-sm text-gray-500">User</p>
                          <p>{order.user?.name} ({order.user?.email})</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500">Amount</p>
                          <p>₹{order.totalAmount} (Payable: ₹{order.payableAmount})</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500">Coins</p>
                          <p>Earned: +{order.coinsEarned} | Redeemed: -{order.coinsRedeemed}</p>
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
                          {order.products.map((item, idx) => (
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
                        Order ID: {order._id}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 mb-4">
                        <div>
                          <p className="font-medium text-sm text-gray-500">User</p>
                          <p>{order.user?.name} ({order.user?.email})</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500">Amount</p>
                          <p>₹{order.totalAmount} (Payable: ₹{order.payableAmount})</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500">Coins</p>
                          <p>Earned: +{order.coinsEarned} | Redeemed: -{order.coinsRedeemed}</p>
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
                          {order.products.map((item, idx) => (
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