import React from 'react';
import { XCircle, RefreshCcw, Search } from 'lucide-react';
import type { TeamPostSummary, TeamRecruitmentStatus } from '../../types';

type StatusFilter = 'ALL' | TeamRecruitmentStatus;

interface TeamPostListProps {
  posts: TeamPostSummary[];
  loading?: boolean;
  search: string;
  status: StatusFilter;
  page: number;
  total: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onStatusChange: (id: string, status: TeamRecruitmentStatus) => void;
  onDelete: (id: string) => void;
}

const statusOptions: TeamRecruitmentStatus[] = ['OPEN', 'FULL', 'CLOSED'];

export const TeamPostList: React.FC<TeamPostListProps> = ({
  posts,
  loading,
  search,
  status,
  page,
  total,
  pageSize,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onRefresh,
  onStatusChange,
  onDelete,
}) => {
  const safeTotal = Number.isFinite(total) ? total : posts.length;
  const pageCount = Math.max(1, Math.ceil(safeTotal / (pageSize || 1)));

  const handlePageChange = (next: number) => {
    if (next < 1 || next > pageCount) return;
    onPageChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bài viết tìm member</h2>
          <p className="text-sm text-slate-500">Quản lý bài đăng cộng đồng.</p>
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
              placeholder="Tìm tiêu đề, tag..."
              className="pl-10 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            />
          </div>
          <select
            value={status}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">OPEN</option>
            <option value="FULL">FULL</option>
            <option value="CLOSED">CLOSED</option>
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

      <div className="space-y-3">
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-500">
            Đang tải bài viết...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-500">
            Chưa có bài viết nào.
          </div>
        )}

        {!loading &&
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-800">{post.title}</p>
                  <p className="text-sm text-slate-500">
                    {post.owner.displayName || post.owner.name || 'Ẩn danh'} • {post.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => onStatusChange(post.id, option)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        post.status === option
                          ? 'bg-sky-500/20 border-sky-400 text-sky-600'
                          : 'border-slate-300 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                  <button
                    onClick={() => onDelete(post.id)}
                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-sm"
                  >
                    <XCircle size={16} /> Xóa
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{post.summary}</p>
              {post.tags && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
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
