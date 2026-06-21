// App.jsx
import React, { lazy, Suspense, memo } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useUI } from "./context/UIContext"; // ✅ add this
import ClientHelmet from "./components/ClientHelmet";
import {
  getCanonicalUrl,
  getClientRouteSeo,
} from "./utils/siteSeo";
// import MarqueeOffers from "./section/Marquee";
import ScrollToTop from "./components/ScrollToTop";

// Lazy components
const Navbar = lazy(() => import("./components/navBar"));
const Footer = lazy(() => import("./components/Footer"));
const FloatingWhatsApp = lazy(() => import("./components/FloatingWhatsApp"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./pages/Profile"));
const ReviewSubmissionPage = lazy(() => import("./pages/Reveiwpage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const Collaborate = lazy(() => import("./pages/Collaborate"));
const CancellationAndReturnsPage = lazy(
  () => import("./pages/help/cancellation-return")
);
const FAQPage = lazy(() => import("./pages/help/Faqs"));
const PaymentsHelpPage = lazy(() => import("./pages/help/payments"));
const ShippingHelpPage = lazy(() => import("./pages/help/shipping"));
const PrivacyPolicyPage = lazy(
  () => import("./pages/consumer-policies/privacy")
);
const ReturnsAndRefundsPage = lazy(
  () => import("./pages/consumer-policies/return&refund")
);
const SecurityPolicyPage = lazy(
  () => import("./pages/consumer-policies/security")
);
const TermsAndServicesPage = lazy(
  () => import("./pages/consumer-policies/t&c")
);
const ContactPage = lazy(() => import("./pages/Contact"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const AboutPage = lazy(() => import("./pages/About"));
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
  const canonicalUrl = getCanonicalUrl(location.pathname);
  const pageSeo = getClientRouteSeo(location.pathname);

  return (
    <>
      <ClientHelmet helmetKey={`${location.pathname}${location.search}`}>
        <title>{pageSeo.title}</title>
        <meta name="title" content={pageSeo.title} />
        <meta name="description" content={pageSeo.description} />
        <meta name="keywords" content={pageSeo.keywords} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageSeo.title} />
        <meta property="og:description" content={pageSeo.description} />
        <meta property="og:image" content="https://filoteso.co.in/icon.png" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageSeo.title} />
        <meta name="twitter:description" content={pageSeo.description} />
        <meta name="twitter:image" content="https://filoteso.co.in/icon.png" />
      </ClientHelmet>
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
      <Suspense fallback={null}>
        {!isAdminRoute && <Navbar />}
      </Suspense>

      <Suspense fallback={null}>
        {/* ✅ Render the sidebar when flag is true */}
        {showCartSidebar && (
          <CartSidebar onClose={() => setShowCartSidebar(false)} />
        )}
      </Suspense>

      <ScrollToTop/>
      <main>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:category" element={<ProductList />} />
            <Route path="/products/:category/:subcategory" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/order-confirmation" element={<OrderConfirm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
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
            <Route path="/about" element={<AboutPage />} />
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
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <FloatingWhatsApp />}
      </Suspense>
    </>
  );
}

export default App;
