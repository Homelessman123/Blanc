
import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const ContestsPage = lazy(() => import('./pages/ContestsPage'));
const ContestDetailPageNew = lazy(() => import('./pages/ContestDetailPageNew'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));

const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen text-white/80">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-indigo-400 animate-spin" />
      <p className="text-sm">Đang tải...</p>
    </div>
  </div>
);

/**
 * NOTE ON BACKEND:
 * This is a FRONTEND-ONLY application designed to showcase a rich UI/UX.
 * All data is currently mocked and resides in `constants.ts`.
 * For full functionality (user accounts, payments, contest submissions),
 * a robust backend server and a database (e.g., Node.js with Express and MySQL) are required.
 * This frontend is ready to be connected to such a backend via API calls.
 */

const AdminRoute: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? (
    <PrivateRoute adminOnly>
      <AdminPage />
    </PrivateRoute>
  ) : (
    <AdminLoginPage />
  );
};

const Shell: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = ['/login', '/register', '/forgot-password'].some((path) =>
    location.pathname.startsWith(path)
  );
  const hideFooter = isAdminPage || isAuthPage;

  return (
    <div className={`flex flex-col min-h-screen ${isAdminPage ? 'bg-slate-900' : 'bg-gray-900'} text-gray-100 font-sans`}>
      {!isAdminPage && <Header />}
      <main className="flex-grow">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<div className="container mx-auto px-4 py-8"><HomePage /></div>} />
            <Route path="/contests" element={<div className="container mx-auto px-4 py-8"><ContestsPage /></div>} />
            <Route path="/contests/:id" element={<div className="container mx-auto px-4 py-8"><ContestDetailPageNew /></div>} />
            <Route path="/marketplace" element={<div className="container mx-auto px-4 py-8"><MarketplacePage /></div>} />
            <Route path="/courses/:id" element={<div className="container mx-auto px-4 py-8"><CourseDetailPage /></div>} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/login" element={<div className="container mx-auto px-4 py-8"><LoginPage /></div>} />
            <Route path="/forgot-password" element={<div className="container mx-auto px-4 py-8"><ForgotPasswordPage /></div>} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminRoute />} />

            {/* Private Routes */}
            <Route path="/profile" element={
              <div className="container mx-auto px-4 py-8">
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              </div>
            } />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
      <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.3)',
                backdropFilter: 'blur(16px)',
                minWidth: '320px',
              },
              success: {
                style: {
                  background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
                  border: '2px solid #10b981',
                  color: '#ffffff',
                  boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.3)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
                  border: '2px solid #ef4444',
                  color: '#ffffff',
                  boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.3)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
              loading: {
                style: {
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  border: '2px solid #60a5fa',
                  color: '#ffffff',
                  boxShadow: '0 25px 50px -12px rgba(96, 165, 250, 0.4), 0 0 0 1px rgba(96, 165, 250, 0.3)',
                },
              },
            }}
          />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <HashRouter>
      <Shell />
    </HashRouter>
  </AuthProvider>
);

export default App;
