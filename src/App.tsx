import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminAuthGuard } from './pages/admin/AdminAuthGuard';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AdminNavbar } from './components/admin/AdminNavbar';
import { AdminSidebar } from './components/admin/AdminSidebar';

import { HomePage } from './pages/HomePage';

const ProductsPage = lazy(() => import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminAddProductPage = lazy(() => import('./pages/admin/AdminAddProductPage').then((m) => ({ default: m.AdminAddProductPage })));
const AdminInquiriesPage = lazy(() => import('./pages/admin/AdminInquiriesPage').then((m) => ({ default: m.AdminInquiriesPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));
const AdminMfaSetupPage = lazy(() => import('./pages/admin/AdminMfaSetupPage').then((m) => ({ default: m.AdminMfaSetupPage })));

const PageLoader: React.FC = () => (
  <div className="admin-auth-loading">
    <div className="homepage-loading-spinner" />
  </div>
);

const isAdminSubdomain = (): boolean => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.startsWith('admin.') || hostname === 'admin.localhost';
};

const AdminPortal: React.FC = () => {
  const isSubdomain = isAdminSubdomain();

  return (
    <AdminAuthGuard>
      <div className="admin-app-layout">
        <AdminNavbar />
        <div className="admin-body-layout">
          <AdminSidebar />
          <main className="admin-main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {isSubdomain ? (
                  <>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/products" element={<AdminProductsPage />} />
                    <Route path="/products/new" element={<AdminAddProductPage />} />
                    <Route path="/products/:id/edit" element={<AdminAddProductPage />} />
                    <Route path="/inquiries" element={<AdminInquiriesPage />} />
                    <Route path="/inquiries/:id" element={<AdminInquiriesPage />} />
                    <Route path="/settings" element={<AdminSettingsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/products/new" element={<AdminAddProductPage />} />
                    <Route path="/admin/products/:id/edit" element={<AdminAddProductPage />} />
                    <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
                    <Route path="/admin/inquiries/:id" element={<AdminInquiriesPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
};

const PublicPortal: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="public-main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

const MainContent: React.FC = () => {
  const location = useLocation();

  if (location.pathname === '/admin/setup-mfa') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminMfaSetupPage />
      </Suspense>
    );
  }

  const adminSubdomain = isAdminSubdomain();
  const adminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  if (adminSubdomain || adminPath) {
    return <AdminPortal />;
  }

  return <PublicPortal />;
};

const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, search]);

  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <DataProvider>
          <MainContent />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}