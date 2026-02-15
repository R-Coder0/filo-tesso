// src/pages/MyOrders.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { 
  Package, Calendar, CreditCard, Coins, FileText, Image, 
  Clock, CheckCircle, XCircle, Ban, Loader 
} from "lucide-react";

const MyOrders = () => {
  const { user, token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [orderToReturn, setOrderToReturn] = useState(null); // ✅ ADDED
  const [cancellationReason, setCancellationReason] = useState("");
  const [returnReason, setReturnReason] = useState(""); // ✅ ADDED
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [returningOrderId, setReturningOrderId] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${apiUrl}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort orders: newest first (based on createdAt timestamp)
        const sortedOrders = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (e) {
        console.error(e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetch();
  }, [user, token, apiUrl]);

  // Cancel Order Function
  const cancelOrder = async (orderId, reason) => {
    try {
      setCancellingOrderId(orderId);
      
      const { data } = await axios.patch(
        `${apiUrl}/api/orders/${orderId}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the specific order and maintain sort order
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order._id === orderId ? data.order : order
        );
        // Re-sort after update to maintain newest-first order
        return updatedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      
      setOrderToCancel(null);
      setCancellationReason("");
      setCancellingOrderId(null);
      alert(data.message);
    } catch (error) {
      console.error('Cancellation failed:', error);
      setCancellingOrderId(null);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // ✅ UPDATED: Return Order Function with reason
  const handleReturnRequest = async (orderId, reason) => {
    try {
      setReturningOrderId(orderId);
      
      const { data } = await axios.patch(
        `${apiUrl}/api/orders/${orderId}/return`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the specific order
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order._id === orderId ? data.order : order
        );
        return updatedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      
      setOrderToReturn(null);
      setReturnReason("");
      setReturningOrderId(null);
      alert(data.message);
    } catch (error) {
      console.error('Return request failed:', error);
      setReturningOrderId(null);
      alert(error.response?.data?.message || 'Failed to request return');
    }
  };

  // Function to check if order is new (within 24 hours)
  const isNewOrder = (orderDate) => {
    const orderTime = new Date(orderDate).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - orderTime) / (1000 * 60 * 60);
    return hoursDifference <= 24; // Show as new if within 24 hours
  };

  // Check if return is possible (24 hours window)
  const canReturnOrder = (order) => {
    if (order.orderStatus !== 'delivered') return false;
    if (order.returnRequested) return false;
    
    const deliveredTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - deliveredTime) / (1000 * 60 * 60);
    
    return hoursDifference <= 24; // 24 hours window
  };

  // Derive coins from orders if context doesn't have a reliable value
  const derivedCoinsFromOrders = useMemo(() => {
    try {
      return (orders || []).reduce(
        (sum, o) => sum + (Number(o?.coinsEarned) || 0) - (Number(o?.coinsRedeemed) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [orders]);

  // Prefer context balance if it's a number; otherwise fallback to derived
  const coinBalance =
    typeof user?.coinsBalance === "number" ? user.coinsBalance : derivedCoinsFromOrders;

  const getCoinStatusInfo = (order) => {
    const coinStatus = order.coinStatus || 'pending';
    const coinCreditDate = order.coinCreditDate ? new Date(order.coinCreditDate) : null;
    const now = new Date();
    
    switch (coinStatus) {
      case 'credited':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Coins Credited',
          description: `${order.coinsEarned} coins added to your wallet`
        };
      
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Coins Cancelled',
          description: 'Order was cancelled/returned'
        };
      
      case 'pending':
      default:
        const daysRemaining = coinCreditDate ? Math.ceil((coinCreditDate - now) / (1000 * 60 * 60 * 24)) : 10;
        
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'Coins Pending',
          description: daysRemaining > 0 
            ? `Will be credited in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
            : 'Will be credited today'
        };
    }
  };

  const getOrderStatusInfo = (order) => {
    // Check cancellation status first
    if (order.cancelled) {
      switch (order.cancellationStatus) {
        case 'requested':
          return {
            color: 'text-orange-600',
            text: 'Cancellation Requested'
          };
        case 'approved':
          return {
            color: 'text-red-600',
            text: 'Cancelled'
          };
        case 'rejected':
          return {
            color: 'text-yellow-600',
            text: 'Cancellation Rejected'
          };
        default:
          return {
            color: 'text-orange-600',
            text: 'Cancellation Pending'
          };
      }
    }
    
    const orderStatus = order.orderStatus || 'pending';
    const paymentStatus = order.paymentStatus || 'Pending';
    
    if (['cancelled', 'returned'].includes(orderStatus)) {
      return {
        color: 'text-red-600',
        text: orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)
      };
    }
    
    if (orderStatus === 'delivered') {
      return {
        color: 'text-green-600',
        text: 'Delivered'
      };
    }
    
    if (paymentStatus === 'Paid') {
      return {
        color: 'text-blue-600',
        text: orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1) || 'Processing'
      };
    }
    
    return {
      color: 'text-yellow-600',
      text: paymentStatus
    };
  };

  // Check if order can be cancelled
  const canCancelOrder = (order) => {
    if (order.cancelled) return false;
    
    const status = (order.orderStatus || 'pending').toLowerCase();
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    
    return cancellableStatuses.includes(status);
  };

  // Cancel Order Modal Component
  const CancelOrderModal = () => {
    if (!orderToCancel) return null;
    
    const isCancelling = cancellingOrderId === orderToCancel._id;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {isCancelling ? 'Cancelling Order...' : 'Cancel Order?'}
          </h3>
          
          {!isCancelling ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel order #{orderToCancel._id?.slice(-8)}?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation
                </label>
                <select 
                  value={cancellationReason} 
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={isCancelling}
                >
                  <option value="">Select a reason</option>
                  <option value="changed-mind">Changed my mind</option>
                  <option value="found-cheaper">Found better price elsewhere</option>
                  <option value="delivery-time">Delivery time too long</option>
                  <option value="wrong-item">Ordered wrong item</option>
                  <option value="other">Other reason</option>
                </select>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setOrderToCancel(null);
                    setCancellationReason("");
                  }}
                  disabled={isCancelling}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go Back
                </button>
                <button
                  onClick={() => cancelOrder(orderToCancel._id, cancellationReason)}
                  disabled={!cancellationReason || isCancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Order'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Loader className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">Processing your cancellation request...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ ADDED: Return Order Modal Component
  const ReturnOrderModal = () => {
    if (!orderToReturn) return null;
    
    const isReturning = returningOrderId === orderToReturn._id;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {isReturning ? 'Requesting Return...' : 'Request Return?'}
          </h3>
          
          {!isReturning ? (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to return order #{orderToReturn._id?.slice(-8)}?
                <br />
                <span className="text-sm text-blue-600">
                  Return window: 24 hours from delivery
                </span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for return
                </label>
                <select 
                  value={returnReason} 
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isReturning}
                >
                  <option value="">Select a reason</option>
                  <option value="wrong-item">Wrong item received</option>
                  <option value="defective">Product is defective</option>
                  <option value="not-as-described">Not as described</option>
                  <option value="size-issue">Size doesn't fit</option>
                  <option value="changed-mind">Changed my mind</option>
                  <option value="other">Other reason</option>
                </select>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setOrderToReturn(null);
                    setReturnReason("");
                  }}
                  disabled={isReturning}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go Back
                </button>
                <button
                  onClick={() => handleReturnRequest(orderToReturn._id, returnReason)}
                  disabled={!returnReason || isReturning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isReturning ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    'Request Return'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Processing your return request...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">Track and manage your purchases</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-full shadow-lg">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-lg">{coinBalance}</span>
              <span className="text-sm opacity-90">Coins</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading your orders…</h3>
            <p className="text-gray-600">Hold your horses. Or your wallet.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">Track and manage your purchases</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-full shadow-lg">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-lg">{coinBalance}</span>
              <span className="text-sm opacity-90">Coins</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Your order history will appear here once you make a purchase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track orders and coin status</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-full shadow-lg">
            <Coins className="w-5 h-5" />
            <span className="font-bold text-lg">{coinBalance}</span>
            <span className="text-sm opacity-90">Coins Available</span>
          </div>
        </div>

        <div className="space-y-6">
          {orders.map((order) => {
            const coinStatusInfo = getCoinStatusInfo(order);
            const orderStatusInfo = getOrderStatusInfo(order);
            const CoinStatusIcon = coinStatusInfo.icon;
            const isThisOrderCancelling = cancellingOrderId === order._id;
            const isThisOrderReturning = returningOrderId === order._id;
            const isNew = isNewOrder(order.createdAt);
            
            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 relative"
              >
                {/* New Order Badge */}
                {isNew && (
                  <div className="absolute -top-0 -left-0 bg-green-500 text-white px-3 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                    NEW
                  </div>
                )}

                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Order ID</p>
                        <p className="text-white font-mono text-sm">{order._id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${orderStatusInfo.color} bg-white/20`}>
                        {orderStatusInfo.text}
                      </span>
                      
                      {/* ✅ UPDATED: Return Button with modal trigger */}
                      {canReturnOrder(order) && (
                        <button
                          onClick={() => setOrderToReturn(order)}
                          disabled={isThisOrderReturning}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isThisOrderReturning ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <Package className="w-3 h-3" />
                          )}
                          {isThisOrderReturning ? 'Returning...' : 'Return'}
                        </button>
                      )}
                      
                      {canCancelOrder(order) && (
                        <button
                          onClick={() => setOrderToCancel(order)}
                          disabled={isThisOrderCancelling}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isThisOrderCancelling ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          {isThisOrderCancelling ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Return Status Display */}
                  {order.returnRequested && (
                    <div className="px-3 py-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg mb-4">
                      Return {order.returnStatus}
                      {order.returnReason && ` - ${order.returnReason}`}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Order Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                          {isNew && <span className="ml-2 text-green-600 text-xs font-medium">(New)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                        <p className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Coins className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Coins Activity</p>
                        <p className="text-sm font-semibold text-gray-900">
                          <span className="text-green-600">+{order.coinsEarned}</span>
                          {" / "}
                          <span className="text-red-600">-{order.coinsRedeemed}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.cancelled && (
                    <div className={`${
                      order.cancellationStatus === 'requested' ? 'bg-orange-50 border-orange-200' :
                      order.cancellationStatus === 'approved' ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                    } border rounded-xl p-4 mb-6`}>
                      <div className="flex items-center gap-3">
                        <Clock className={`w-5 h-5 ${
                          order.cancellationStatus === 'requested' ? 'text-orange-600' :
                          order.cancellationStatus === 'approved' ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${
                              order.cancellationStatus === 'requested' ? 'text-orange-600' :
                              order.cancellationStatus === 'approved' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {order.cancellationStatus === 'requested' && 'Cancellation Requested'}
                              {order.cancellationStatus === 'approved' && 'Order Cancelled'}
                              {order.cancellationStatus === 'rejected' && 'Cancellation Rejected'}
                            </span>
                            {order.cancelledAt && (
                              <span className="text-xs text-gray-500">
                                ({new Date(order.cancelledAt).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.cancellationStatus === 'requested' && 
                              'Your cancellation request is under review. Admin will process it shortly.'}
                            {order.cancellationStatus === 'approved' && 
                              `Your order has been cancelled. ${order.coinsRedeemed > 0 ? 
                                `${order.coinsRedeemed} coins have been refunded to your account.` : ''}`}
                            {order.cancellationStatus === 'rejected' && 
                              'Your cancellation request was rejected. Please contact support for more details.'}
                          </p>
                          {order.cancellationReason && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Reason:</strong> {order.cancellationReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.coinsEarned > 0 && (
                    <div className={`${coinStatusInfo.bgColor} ${coinStatusInfo.borderColor} border rounded-xl p-4 mb-6`}>
                      <div className="flex items-center gap-3">
                        <CoinStatusIcon className={`w-5 h-5 ${coinStatusInfo.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${coinStatusInfo.color}`}>
                              {coinStatusInfo.text}
                            </span>
                            {order.coinCreditDate && coinStatusInfo.text === 'Coins Pending' && (
                              <span className="text-xs text-gray-500">
                                (until {new Date(order.coinCreditDate).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{coinStatusInfo.description}</p>
                        </div>
                        <span className={`text-lg font-bold ${coinStatusInfo.color}`}>
                          +{order.coinsEarned}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium text-gray-900">₹{order.totalAmount}</span>
                    </div>
                    {order.coinsRedeemed > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Coins Redeemed</span>
                        <span className="text-sm font-medium text-green-600">-₹{order.coinsRedeemed}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-base font-semibold text-gray-900">Amount Paid</span>
                      <span className="text-lg font-bold text-gray-900">₹{order.payableAmount}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Order Items</h4>
                    <div className="space-y-3">
                      {order.products.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {p.product?.name || "Unknown Product"}
                            </h5>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span className="font-medium">Qty: {p.quantity}</span>
                              {p.selectedSize && <span>Size: {p.selectedSize}</span>}
                              {p.selectedColor && <span>Color: {p.selectedColor}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(order.customizationUploads?.image || order.customizationUploads?.pdf) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Customization</h4>
                      <div className="flex flex-wrap items-center gap-4">
                        {order.customizationUploads?.image && (
                          <div className="relative group">
                            <img
                              src={`${apiUrl}${order.customizationUploads.image}`}
                              alt="Customization"
                              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-gray-900 transition-colors"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Image className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                        {order.customizationUploads?.pdf && (
                          <a
                            href={`${apiUrl}${order.customizationUploads.pdf}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all group"
                          >
                            <FileText className="w-5 h-5" />
                            <span className="text-sm font-medium">View PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CancelOrderModal />
      <ReturnOrderModal /> {/* ✅ ADDED: Return Modal */}
    </div>
  );
};

export default MyOrders;