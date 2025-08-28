
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, User as UserIcon, LogIn, LogOut, Flame, Shield } from 'lucide-react';
import NotificationSystem from '../NotificationSystem';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  const activeLinkStyle = {
    color: '#38bdf8', // light blue
    textShadow: '0 0 5px #38bdf8'
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-blue-500/10">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2 group">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:rotate-12 transition-transform duration-300">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 group-hover:from-sky-300 group-hover:to-blue-400 transition-all">
            ContestHub
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-lg">
          <NavLink to="/" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-sky-400 transition-colors duration-300">Home</NavLink>
          <NavLink to="/contests" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-sky-400 transition-colors duration-300">Contests</NavLink>
          <NavLink to="/marketplace" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-sky-400 transition-colors duration-300">Marketplace</NavLink>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/cart" className="relative text-gray-300 hover:text-sky-400 transition-colors duration-300">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <NotificationSystem />
              <div className="flex items-center gap-1 text-orange-400 font-bold" title={`${user.streak || 0} day streak!`}>
                <Flame size={20} />
                <span>{user.streak || 0}</span>
              </div>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-300 hover:text-sky-400 transition-colors duration-300" title="Admin Panel">
                  <Shield size={24} />
                </Link>
              )}
              <Link to="/profile" className="text-gray-300 hover:text-sky-400 transition-colors duration-300">
                {user.avatar ? (
                  <img src={user.avatar} alt="User Avatar" className="w-8 h-8 rounded-full border-2 border-sky-500" />
                ) : (
                  <UserIcon size={24} />
                )}
              </Link>
              <button onClick={logout} className="text-gray-300 hover:text-red-500 transition-colors duration-300" title="Logout">
                <LogOut size={24} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105">
              <LogIn size={20} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
