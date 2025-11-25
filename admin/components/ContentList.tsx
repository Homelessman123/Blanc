import React, { useMemo, useState } from 'react';
import { Search, Edit2, Trash2, PlusCircle, Star } from 'lucide-react';
import { ContentType } from '../types';
import type { AdminContentItem } from '../types';
import type { ContentStatus } from '../../types';

interface ContentListProps {
  type: ContentType;
  items: AdminContentItem[];
  loading?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onViewReviews?: (id: string, title: string) => void;
}

const StatusBadge: React.FC<{ status: ContentStatus }> = ({ status }) => {
  const styles: Record<ContentStatus, string> = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    DRAFT: 'bg-amber-100 text-amber-700',
    ARCHIVED: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<ContentStatus, string> = {
    PUBLISHED: 'Đã đăng',
    DRAFT: 'Nháp',
    ARCHIVED: 'Lưu trữ',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const ContentList: React.FC<ContentListProps> = ({
  type,
  items,
  loading,
  onEdit,
  onDelete,
  onCreate,
  onViewReviews,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.summary || '').toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {type === ContentType.COMPETITION ? 'Cuộc thi' : 'Tài liệu / Khóa học'}
          </h2>
          <p className="text-sm text-slate-500">
            Quản lý nội dung đã tạo và các bản nháp.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700"
          >
            <PlusCircle size={16} />
            Viết bài
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Nội dung</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">
                {type === ContentType.COMPETITION ? "Đơn vị" : "Tác giả"}
              </th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Đánh giá</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Cập nhật</th>
              <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  Không có nội dung nào.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((item) => {
                const dateText =
                  item.updatedAt || item.createdAt
                    ? new Date((item.updatedAt || item.createdAt) as string).toLocaleDateString('vi-VN')
                    : '-';
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-200" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 line-clamp-1">{item.title}</div>
                          {item.summary && (
                            <div className="text-xs text-slate-500 line-clamp-1">{item.summary}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.author || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.rating ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-amber-500">{item.rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-500">{item.reviewCount || 0} đánh giá</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{dateText}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {type === ContentType.DOCUMENT && onViewReviews && (
                          <button
                            onClick={() => onViewReviews(item.id, item.title)}
                            className="p-2 hover:bg-amber-50 text-amber-500 hover:text-amber-600 rounded-lg transition-colors"
                            title="Xem đánh giá"
                            aria-label="Xem đánh giá"
                          >
                            <Star size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-2 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                          aria-label="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                          title="Xóa"
                          aria-label="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
