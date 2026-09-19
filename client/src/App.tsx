import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  const dashboardRedirect = user?.role === 'SELLER'
    ? '/seller'
    : user?.role === 'BUYER'
      ? '/buyer'
      : user?.role === 'ADMIN'
        ? '/admin'
        : '/';

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['BUYER']}><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['BUYER']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['BUYER']}><OrdersPage /></ProtectedRoute>} />

        <Route path="/seller" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerDashboard /></ProtectedRoute>} />
        <Route path="/buyer" element={<ProtectedRoute allowedRoles={['BUYER']}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={dashboardRedirect} replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
