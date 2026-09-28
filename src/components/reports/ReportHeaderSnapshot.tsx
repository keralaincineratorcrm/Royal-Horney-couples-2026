import React, { useState } from 'react';
import { Printer, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface ReportHeaderSnapshotProps {
  reportTitle: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  currentUser: UserProfile;
  onRefresh: () => void;
  onExportAllCSV: () => void;
}

export const ReportHeaderSnapshot: React.FC<ReportHeaderSnapshotProps> = ({
  reportTitle,
  periodLabel,
  startDate,
  endDate,
  currentUser,
  onRefresh,
  onExportAllCSV,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const now = new Date();
  const generatedTimeStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/50 print:bg-white print:text-black print:border-none print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Official Executive Analytics
            </span>
            <span className="text-xs text-slate-400">Kerala Incinerator Sales CRM</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {reportTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2">
            <div>
              <span className="text-slate-400">Reporting Period:</span>{' '}
              <span className="font-semibold text-white">
                {startDate} to {endDate} ({periodLabel})
              </span>
            </div>
            <div className="hidden sm:inline text-slate-600">•</div>
            <div>
              <span className="text-slate-400">Generated:</span>{' '}
              <span className="font-semibold text-slate-200">{generatedTimeStr}</span>
            </div>
            <div className="hidden sm:inline text-slate-600">•</div>
            <div>
              <span className="text-slate-400">Prepared for:</span>{' '}
              <span className="font-semibold text-white">
                {currentUser.name} ({currentUser.role.replace(/_/g, ' ')})
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 print:hidden self-start md:self-auto flex-wrap">
          <button
            id="btn-refresh-analytics"
            onClick={handleRefreshClick}
            title="Refresh database records"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="btn-export-reports-csv"
            onClick={onExportAllCSV}
            title="Export full analytics to CSV spreadsheet"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            title="Print or save as PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

