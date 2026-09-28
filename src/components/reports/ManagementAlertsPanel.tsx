import React from 'react';
import { AlertTriangle, Clock, Truck, IndianRupee, FileText, ChevronRight } from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';

interface ManagementAlertsPanelProps {
  alerts: ManagementAnalyticsData['managementAlerts'];
  onNavigateTab: (tab: string) => void;
}

export const ManagementAlertsPanel: React.FC<ManagementAlertsPanelProps> = ({
  alerts,
  onNavigateTab,
}) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Follow-up':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Delivery':
        return <Truck className="w-4 h-4 text-rose-600" />;
      case 'Payment':
        return <IndianRupee className="w-4 h-4 text-amber-600" />;
      case 'Quotation':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCardStyle = (type: 'warning' | 'danger' | 'info') => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/70';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100/70';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-950 hover:bg-blue-100/70';
    }
  };

  const getBadgeStyle = (type: 'warning' | 'danger' | 'info') => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Management Action Required ({alerts.length})
        </h3>
        <span className="text-[11px] text-slate-400">Click any card to review records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            id={`alert-card-${alert.id}`}
            onClick={() => onNavigateTab(alert.targetTab)}
            className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs group ${getCardStyle(
              alert.type
            )}`}
          >
            <div className="flex items-start gap-2.5 pr-2">
              <div className="p-1.5 rounded-lg bg-white shadow-2xs mt-0.5 shrink-0">
                {getCategoryIcon(alert.category)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold leading-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                    {alert.title}
                  </h4>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${getBadgeStyle(
                      alert.type
                    )}`}
                  >
                    {alert.count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {alert.description}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
};

