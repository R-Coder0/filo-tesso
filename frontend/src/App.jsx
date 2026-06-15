// App.jsx
import React, { lazy, Suspense, memo } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useUI } from "./context/UIContext"; // ✅ add this
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import ReviewSubmissionPage from "./pages/Reveiwpage";
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
import BlogDetailPage from "./pages/BlogDetailPage";

// Lazy components
const Navbar = lazy(() => import("./components/navBar"));
const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./components/ProductList"));
const ProductDetail = lazy(() => import("./components/ProductDetailPage"));
const CheckoutPage = lazy(() => import("./components/CheckoutPage"));
const ShiprocketCheckoutReturn = lazy(
  () => import("./components/ShiprocketCheckoutReturn")
);
const OrderConfirm = lazy(() => import("./components/OrderConfirmationPage"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const AdminLogin = lazy(() => import("./components/Admin/AdminLogin"));
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));
const ManageProducts = lazy(() => import("./components/Admin/ManageProducts"));
const InventoryPage = lazy(() => import("./components/Admin/InventoryPage"));
const ManageOrders = lazy(() => import("./components/Admin/ManageOrders"));
const CartSidebar = lazy(() => import("./components/CartSidebar"));
const RequireAuth = lazy(() => import("./components/RequireAuth"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoutes"));
const BlogPage = lazy(() => import("./pages/BlogPage"));

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
  const isHomeRoute = location.pathname === "/";

  return (
    <>
      {/* <MarqueeOffers/> */}
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3200,
          style: {
            border: "1px solid #111827",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#111827",
            fontWeight: 600,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
          },
          success: {
            iconTheme: { primary: "#16a34a", secondary: "#ffffff" },
          },
          error: {
            iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
          },
        }}
      />
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
            <Route
              path="/wishlist"
              element={
                <RequireAuth>
                  <WishlistPage />
                </RequireAuth>
              }
            />
            <Route path="/collabration" element={<Collaborate/>}/>
            <Route path="/help/cancellation-and-returns" element={<CancellationAndReturnsPage/>}/>
            <Route path="/help/faqs" element={<FAQPage/>}/>
            <Route path="/help/payments" element={<PaymentsHelpPage/>}/>
            <Route path="/help/shipping" element={<ShippingHelpPage/>}/>
            <Route path="/consumer-policies/privacy" element={<PrivacyPolicyPage/>}/>
            <Route path="/consumer-policies/return-and-refund" element={<ReturnsAndRefundsPage/>}/>
            <Route path="/consumer-policies/security" element={<SecurityPolicyPage/>}/>
            <Route path="/consumer-policies/terms-and-conditions" element={<TermsAndServicesPage/>}/>
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/contact" element={<ContactPage/>}/>
            <Route
              path="/shiprocket-checkout-return"
              element={
                <RequireAuth>
                  <ShiprocketCheckoutReturn />
                </RequireAuth>
              }
            />
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
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute needsDashboardSource>
                  <AdminLayout>
                    <ManageProducts />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute needsDashboardSource>
                  <AdminLayout>
                    <InventoryPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute needsDashboardSource>
                  <AdminLayout>
                    <ManageOrders view="all" />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cancellations"
              element={
                <ProtectedRoute needsDashboardSource>
                  <AdminLayout>
                    <ManageOrders view="cancellations" />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/returns"
              element={
                <ProtectedRoute needsDashboardSource>
                  <AdminLayout>
                    <ManageOrders view="returns" />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <FloatingWhatsApp />}
      </Suspense>
    </>
  );
}

export default App;
