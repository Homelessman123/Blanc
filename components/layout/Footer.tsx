
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-sky-400 mb-4">ContestHub</h3>
            <p className="text-gray-400">Your central hub for academic and creative excellence.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#/contests" className="text-gray-400 hover:text-sky-400 transition">Contests</a></li>
              <li><a href="#/marketplace" className="text-gray-400 hover:text-sky-400 transition">Marketplace</a></li>
              <li><a href="#/profile" className="text-gray-400 hover:text-sky-400 transition">My Profile</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-sky-400 transition">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-sky-400 transition">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-sky-400 transition">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              {/* Placeholder icons */}
              <a href="#" className="text-gray-400 hover:text-sky-400 transition">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-sky-400 transition">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-sky-400 transition">Instagram</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} ContestHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
