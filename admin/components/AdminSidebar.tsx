import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Award,
  PlusCircle,
  LogOut,
  Users,
  Users2,
} from 'lucide-react';
import { ContentType } from '../types';
import type { AdminPage } from '../types';

interface AdminSidebarProps {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onCreate: (type: ContentType) => void;
  onLogout?: () => void;
}

const navItems: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
  { id: 'users', label: 'Người dùng', icon: <Users size={18} /> },
  { id: 'competitions', label: 'Cuộc thi', icon: <Award size={18} /> },
  { id: 'documents', label: 'Tài liệu / Khóa học', icon: <FileText size={18} /> },
  { id: 'community', label: 'Cộng đồng', icon: <Users2 size={18} /> },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPage,
  onNavigate,
  onCreate,
  onLogout,
}) => {
  return (
    <aside className="w-64 bg-slate-950 text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl shadow-slate-900/50 z-50">
      <div className="p-6 border-b border-slate-900 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg">
          CH
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-tight">ContestHub</h1>
          <p className="text-xs text-slate-400">Admin Workspace</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 font-semibold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="pt-4 border-t border-slate-900 mt-6">
          <button
            onClick={() => onCreate(ContentType.COMPETITION)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors font-semibold shadow-lg shadow-indigo-900/30"
          >
            <PlusCircle size={18} />
            Viết bài mới
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-900">
        <button
          onClick={() => onCreate(ContentType.DOCUMENT)}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 bg-slate-900/80 hover:bg-slate-900 rounded-lg transition-colors mb-2"
        >
          <FileText size={18} />
          <span>Tạo tài liệu</span>
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        )}
      </div>
    </aside>
  );
};
