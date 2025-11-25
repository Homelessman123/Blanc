import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, FileText, Award, Layers } from 'lucide-react';
import type { AdminContentItem, AdminDashboardStats, AdminAuditLog } from '../types';
import { AuditLogList } from './AuditLogList';

interface AdminDashboardProps {
  stats: AdminDashboardStats;
  contests: AdminContentItem[];
  documents: AdminContentItem[];
  auditLogs?: AdminAuditLog[];
  auditLoading?: boolean;
  onRefreshAudit?: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; change?: string }> = ({
  icon,
  label,
  value,
  change,
}) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
      {change && (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {change}
        </span>
      )}
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  contests,
  documents,
  auditLogs = [],
  auditLoading = false,
  onRefreshAudit,
}) => {
  const publishedCount = (items: AdminContentItem[]) =>
    items.filter((item) => item.status === 'PUBLISHED').length;
  const draftCount = (items: AdminContentItem[]) =>
    items.filter((item) => item.status !== 'PUBLISHED').length;

  const chartData = useMemo(
    () => [
      { name: 'Cuoc thi', published: publishedCount(contests), draft: draftCount(contests) },
      { name: 'Tai lieu', published: publishedCount(documents), draft: draftCount(documents) },
    ],
    [contests, documents]
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tong quan</h2>
          <p className="text-sm text-slate-500">Theo doi nhap, ban cong khai va hoat dong gan day.</p>
        </div>
        <div className="text-sm text-slate-500">Tu dong cap nhat</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Layers className="text-indigo-500" />} label="Tong noi dung" value={stats.totalPosts} />
        <StatCard icon={<Users className="text-green-500" />} label="Nguoi dung" value={stats.totalUsers.toLocaleString()} />
        <StatCard icon={<Award className="text-purple-500" />} label="Cuoc thi" value={stats.contestCount} />
        <StatCard icon={<FileText className="text-orange-500" />} label="Tai lieu/Khoa hoc" value={stats.documentCount} />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-700">Tinh trang xuat ban</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="published" name="Da dang" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="draft" name="Nhap/Luu tru" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AuditLogList logs={auditLogs.slice(0, 8)} loading={auditLoading} onRefresh={onRefreshAudit} />
    </div>
  );
};
