import React from 'react';
import { RefreshCcw, Clock } from 'lucide-react';
import type { AdminAuditLog } from '../types';

interface AuditLogListProps {
  logs: AdminAuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString('vi-VN', { hour12: false });
};

export const AuditLogList: React.FC<AuditLogListProps> = ({ logs, loading, onRefresh }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Nhật ký quản trị</h3>
        <p className="text-sm text-slate-500">Theo dõi các thao tác gần đây.</p>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      )}
    </div>

    <div className="divide-y divide-slate-100">
      {loading && (
        <div className="py-4 text-slate-500 text-sm">Đang tải nhật ký...</div>
      )}

      {!loading && logs.length === 0 && (
        <div className="py-4 text-slate-500 text-sm">Chưa có log.</div>
      )}

      {!loading &&
        logs.map((log) => (
          <div key={log.id} className="py-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">
                {log.action.replace(/_/g, ' ')} • {log.targetType}
              </p>
              <p className="text-sm text-slate-500">
                {log.actor.displayName || log.actor.name || log.actor.email} {log.targetId ? `→ ${log.targetId}` : ''}
              </p>
              {log.metadata && (
                <pre className="mt-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={14} />
              {formatDate(log.createdAt)}
            </div>
          </div>
        ))}
    </div>
  </div>
);
