import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Calendar,
  User,
  Tag,
  Clock,
  ArrowUpDown,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { AuditLog } from '../../../types';

export const AuditLogsSection: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(() => dataStore.getAuditLogs());
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  const users = dataStore.getUsers();
  const modules = Array.from(new Set(logs.map((l) => l.module)));

  const filteredLogs = logs.filter((log) => {
    // Search filter
    const matchesSearch =
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      (log.recordNumber && log.recordNumber.toLowerCase().includes(search.toLowerCase()));

    // Module filter
    const matchesModule = moduleFilter === 'all' || log.module.toLowerCase() === moduleFilter.toLowerCase();

    // User filter
    const matchesUser = userFilter === 'all' || log.userId === userFilter;

    // Date range filter
    let matchesDate = true;
    if (dateRangeFilter !== 'all') {
      const logDate = new Date(log.timestamp).getTime();
      const now = new Date().getTime();
      const dayMs = 24 * 60 * 60 * 1000;

      if (dateRangeFilter === 'today') {
        matchesDate = now - logDate <= dayMs;
      } else if (dateRangeFilter === '7days') {
        matchesDate = now - logDate <= 7 * dayMs;
      } else if (dateRangeFilter === '30days') {
        matchesDate = now - logDate <= 30 * dayMs;
      }
    }

    return matchesSearch && matchesModule && matchesUser && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Record Number', 'Description'];
    const csvRows = [headers.join(',')];

    filteredLogs.forEach((l) => {
      const row = [
        `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
        `"${l.userName}"`,
        `"${l.userRole}"`,
        `"${l.action}"`,
        `"${l.module}"`,
        `"${l.recordNumber || ''}"`,
        `"${l.description.replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kerala_incinerator_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getModuleBadgeColor = (mod: string) => {
    switch (mod.toLowerCase()) {
      case 'quotations':
        return 'bg-blue-100 text-blue-800';
      case 'orders':
        return 'bg-emerald-100 text-emerald-800';
      case 'payments':
        return 'bg-purple-100 text-purple-800';
      case 'users':
        return 'bg-amber-100 text-amber-800';
      case 'products':
        return 'bg-cyan-100 text-cyan-800';
      case 'company':
      case 'settings':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Immutability Notice */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">System Audit Trail</h3>
              <span className="px-2.5 py-0.5 bg-slate-900 text-cyan-400 text-[10px] font-extrabold uppercase rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> Append-Only Immutable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verifiable log of every quotation, status update, price modification, and user change across Kerala Incinerator.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export Log (.csv)
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search actions, records, desc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Users & System</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Past 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Time (IST)</th>
                <th className="py-3.5 px-3">Actor</th>
                <th className="py-3.5 px-3">Module</th>
                <th className="py-3.5 px-3">Action</th>
                <th className="py-3.5 px-3">Record Reference</th>
                <th className="py-3.5 px-4">Description & Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit log records matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {log.userRole.replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getModuleBadgeColor(
                            log.module
                          )}`}
                        >
                          {log.module}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{log.action}</span>
                      </td>

                      {/* Record */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {log.recordNumber ? (
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {log.recordNumber}
                          </span>
                        ) : log.recordId ? (
                          <span className="text-slate-400 text-[10px]">
                            {log.recordId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-700">
                        <div>{log.description}</div>
                        {(log.previousValue || log.newValue) && (
                          <div className="mt-1 text-[11px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
                            {log.previousValue && (
                              <span className="line-through text-rose-600">
                                {log.previousValue}
                              </span>
                            )}
                            {log.previousValue && log.newValue && <span>→</span>}
                            {log.newValue && (
                              <span className="font-bold text-emerald-700">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

