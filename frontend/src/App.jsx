// App.jsx
import React, { lazy, Suspense, memo } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { useUI } from "./context/UIContext"; // ✅ add this
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import ReviewSubmissionPage from "./pages/Reveiwpage";
import { AuthProvider } from "./context/AuthContext";
import WishlistPage from "./pages/WishlistPage";
import MarqueeOffers from "./section/Marquee";
import ScrollToTop from "./components/ScrollToTop";
import Collaborate from "./pages/Collaborate";
import CancellationAndReturnsPage from "./pages/help/cancellation-return";
import FAQPage from "./pages/help/Faqs";
import PaymentsHelpPage from "./pages/help/payments";
import ShippingHelpPage from "./pages/help/shipping";
import PrivacyPolicyPage from "./pages/consumer-policies/privacy";
import ReturnsAndRefundsPage from "./pages/consumer-policies/return&refund";
import SecurityPolicyPage from "./pages/consumer-policies/security";
import TermsAndServicesPage from "./pages/consumer-policies/t&c";
import ContactPage from "./pages/Contact";

// Lazy components
const Navbar = lazy(() => import("./components/navBar"));
const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./components/ProductList"));
const ProductDetail = lazy(() => import("./components/ProductDetailPage"));
const CheckoutPage = lazy(() => import("./components/CheckoutPage"));
const OrderConfirm = lazy(() => import("./components/OrderConfirmationPage"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const AdminLogin = lazy(() => import("./components/Admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));
const ManageProducts = lazy(() => import("./components/Admin/ManageProducts"));
const ManageOrders = lazy(() => import("./components/Admin/ManageOrders"));
const CartSidebar = lazy(() => import("./components/CartSidebar"));
const RequireAuth = lazy(() => import("./components/RequireAuth"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoutes"));


const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
));

const NotFoundPage = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
    </div>
  </div>
));

function App() {
  // ✅ read state from UI context
  const { showCartSidebar, setShowCartSidebar } = useUI();
const location = useLocation();

  // ✅ Check if route starts with /admin
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
    <AuthProvider>
      {/* <MarqueeOffers/> */}
      <Suspense fallback={<LoadingSpinner />}>
         {/* ✅ Hide Navbar on admin routes */}
          {!isAdminRoute && <Navbar />}
        {/* ✅ Render the sidebar when flag is true */}
        {showCartSidebar && (
          <CartSidebar onClose={() => setShowCartSidebar(false)} />
        )}
        <ScrollToTop/>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:category" element={<ProductList />} />
            <Route path="/products/:category/:subcategory" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/order-confirmation" element={<OrderConfirm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reveiw"  element={<ReviewSubmissionPage/>}/>
            <Route path="/wishlist" element={<WishlistPage/>} />
            <Route path="/collabration" element={<Collaborate/>}/>
            <Route path="/help/cancellation-and-returns" element={<CancellationAndReturnsPage/>}/>
            <Route path="/help/faqs" element={<FAQPage/>}/>
            <Route path="/help/payments" element={<PaymentsHelpPage/>}/>
            <Route path="/help/shipping" element={<ShippingHelpPage/>}/>
            <Route path="/consumer-policies/privacy" element={<PrivacyPolicyPage/>}/>
            <Route path="/consumer-policies/return-and-refund" element={<ReturnsAndRefundsPage/>}/>
            <Route path="/consumer-policies/security" element={<SecurityPolicyPage/>}/>
            <Route path="/consumer-policies/terms-and-conditions" element={<TermsAndServicesPage/>}/>
            <Route path="/contact" element={<ContactPage/>}/>
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-orders"
              element={
                <RequireAuth>
                  <MyOrders />
                </RequireAuth>
              }
            />

            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute needsLoginSource>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute needsDashboardSource>
                  <ManageProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute needsDashboardSource>
                  <ManageOrders />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

          {!isAdminRoute && <Footer />}
      </Suspense>
      </AuthProvider>
    </>
  );
}

export default App;
