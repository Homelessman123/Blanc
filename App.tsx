
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ContestsPage from './pages/ContestsPage';
import ContestDetailPage from './pages/ContestDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import ChatWidget from './components/ChatWidget';
import PrivateRoute from './components/PrivateRoute';

/**
 * NOTE ON BACKEND:
 * This is a FRONTEND-ONLY application designed to showcase a rich UI/UX.
 * All data is currently mocked and resides in `constants.ts`.
 * For full functionality (user accounts, payments, contest submissions),
 * a robust backend server and a database (e.g., Node.js with Express and MySQL) are required.
 * This frontend is ready to be connected to such a backend via API calls.
 */

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100 font-sans">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/contests" element={<ContestsPage />} />
                <Route path="/contests/:id" element={<ContestDetailPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Private Routes */}
                <Route path="/profile" element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } />
                <Route path="/admin" element={
                  <PrivateRoute adminOnly={true}>
                    <AdminDashboardPage />
                  </PrivateRoute>
                } />
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
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
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
