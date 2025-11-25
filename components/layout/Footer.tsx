
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-sky-400 mb-4">ContestHub</h3>
            <p className="text-gray-400">Trung tâm kết nối cuộc thi và phát triển tài năng của bạn.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li><a href="#/contests" className="text-gray-400 hover:text-sky-400 transition">Cuộc thi</a></li>
              <li><a href="#/marketplace" className="text-gray-400 hover:text-sky-400 transition">Khóa học</a></li>
              <li><a href="#/profile" className="text-gray-400 hover:text-sky-400 transition">Hồ sơ của tôi</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-sky-400 transition">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="text-gray-400 hover:text-sky-400 transition">Liên hệ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-sky-400 transition">Điều khoản dịch vụ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Theo dõi chúng tôi</h4>
            <div className="flex space-x-4">
              {/* Placeholder icons */}
              <a href="#" className="text-gray-400 hover:text-sky-400 transition">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-sky-400 transition">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-sky-400 transition">Instagram</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} ContestHub. Bản quyền thuộc về ContestHub.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
