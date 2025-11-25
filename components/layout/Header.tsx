import React, { useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserIcon, LogIn, LogOut } from 'lucide-react';
import StreakDisplay from '../StreakDisplay';

const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();

  const activeLinkStyle = {
    color: '#38bdf8',
    textShadow: '0 0 5px #38bdf8',
  };

  // Lazy prefetch on hover to keep bandwidth light
  const prefetched = useRef(new Set<string>());
  const prefetchRoute = (href: string) => {
    if (prefetched.current.has(href)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    prefetched.current.add(href);
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
          <NavLink
            to="/"
            onMouseEnter={() => prefetchRoute('/')}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="text-gray-300 hover:text-sky-400 transition-colors duration-300"
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/contests"
            onMouseEnter={() => prefetchRoute('/contests')}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="text-gray-300 hover:text-sky-400 transition-colors duration-300"
          >
            Cuộc thi
          </NavLink>
          <NavLink
            to="/marketplace"
            onMouseEnter={() => prefetchRoute('/marketplace')}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="text-gray-300 hover:text-sky-400 transition-colors duration-300"
          >
            Khóa học
          </NavLink>
          <NavLink
            to="/community"
            onMouseEnter={() => prefetchRoute('/community')}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
            className="text-gray-300 hover:text-sky-400 transition-colors duration-300"
          >
            Cộng đồng
          </NavLink>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <StreakDisplay streak={user.streak || 0} animate />
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
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
