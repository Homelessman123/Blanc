import React from 'react';
import { Trash2, Search, RefreshCcw } from 'lucide-react';
import type { User } from '../../types';

type RoleFilter = 'ALL' | 'USER' | 'ADMIN';

interface UserListProps {
  users: User[];
  loading?: boolean;
  search: string;
  roleFilter: RoleFilter;
  page: number;
  total: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: RoleFilter) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onRoleChange: (userId: string, role: 'USER' | 'ADMIN') => void;
  onDelete: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  search,
  roleFilter,
  page,
  total,
  pageSize,
  onSearchChange,
  onRoleFilterChange,
  onPageChange,
  onRefresh,
  onRoleChange,
  onDelete,
}) => {
  const safeTotal = Number.isFinite(total) ? total : users.length;
  const pageCount = Math.max(1, Math.ceil(safeTotal / (pageSize || 1)));

  const handlePageChange = (next: number) => {
    if (next < 1 || next > pageCount) return;
    onPageChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Người dùng</h2>
          <p className="text-sm text-slate-500">Quản lý quyền và xóa tài khoản.</p>
          <p className="text-xs text-slate-400 mt-1">
            Tổng: {safeTotal.toLocaleString()} • Trang {page}/{pageCount}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm email, tên..."
              className="pl-10 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          >
            <option value="ALL">Tất cả</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-left text-slate-700">
          <thead className="bg-slate-50 text-sm font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Quyền</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Đang tải người dùng...
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Chưa có người dùng.
                </td>
              </tr>
            )}

            {!loading &&
              users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{user.displayName || user.name || 'Chưa cập nhật'}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => onRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(user.id)}
                      className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 text-sm"
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Trang {page} / {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
            disabled={page <= 1 || loading}
          >
            Trước
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
            disabled={page >= pageCount || loading}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};
