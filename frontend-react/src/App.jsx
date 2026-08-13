import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DataCacheProvider } from './context/DataCache';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ArcoPublicForm from './pages/ArcoPublicForm';
import SignInvite from './pages/SignInvite';
import CitizenPortal from './pages/CitizenPortal';
import DashboardDPO from './pages/DashboardDPO';
import Privacy from './pages/Privacy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieBanner from './components/CookieBanner';
import SessionExpiredModal from './components/SessionExpiredModal';
import ToastProvider from './components/Toast';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pending = lazy(() => import('./pages/Pending'));
const Compliance = lazy(() => import('./pages/Compliance'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const UserMonitor = lazy(() => import('./pages/UserMonitor'));
const HostMonitor = lazy(() => import('./pages/HostMonitor'));
const preloadModules = [
  () => import('./pages/Dashboard'),
  () => import('./pages/Pending'),
  () => import('./pages/Compliance'),
  () => import('./pages/AdminPanel'),
  () => import('./pages/UserMonitor'),
  () => import('./pages/HostMonitor'),
];

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-surface-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[12px] text-gray-600">Cargando...</span>
    </div>
  </div>
);

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (token && !user?.isActive) {
    return <Navigate to="/pending" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, token } = useAuth();
  if (token) {
    return <Navigate to={user?.isActive ? '/dashboard' : '/pending'} replace />;
  }
  return children;
}

function Preloader() {
  useEffect(() => {
    let active = true;
    const load = async () => {
      for (const fn of preloadModules) {
        if (!active) break;
        fn().catch(() => {});
      }
    };
    load();
    return () => { active = false; };
  }, []);
  return null;
}

function HomeRoute() {
  const { user, token } = useAuth();
  if (token) {
    return <Navigate to={user?.isActive ? '/dashboard' : '/pending'} replace />;
  }
  return <Landing />;
}

function AppContent() {
  const { token } = useAuth();
  return (
    <>
      <Preloader />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/pending" element={<ProtectedRoute><Pending /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/politica-privacidad" element={<PrivacyPolicy />} />
          <Route path="/arco-solicitud" element={<ArcoPublicForm />} />
          <Route path="/firmar/:token" element={<SignInvite />} />
          <Route path="/track" element={<CitizenPortal />} />
          <Route path="/dpo" element={<ProtectedRoute><DashboardDPO /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/user/:userId" element={<ProtectedRoute requireAdmin><UserMonitor /></ProtectedRoute>} />
          <Route path="/host-monitor" element={<ProtectedRoute><HostMonitor /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      <CookieBanner />
      <SessionExpiredModal />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DataCacheProvider>
        <AppContent />
      </DataCacheProvider>
    </ToastProvider>
  );
}
