import React from 'react';
import { Users, Award, Download, Phone, MapPin, CheckCircle, TrendingUp } from 'lucide-react';
import { ManagementAnalyticsData, UserProfile } from '../../types';
import { exportToCSV } from './exportUtils';

interface ExecutivePerformanceSectionProps {
  executivePerformance: ManagementAnalyticsData['executivePerformance'];
  currentUser: UserProfile;
}

export const ExecutivePerformanceSection: React.FC<ExecutivePerformanceSectionProps> = ({
  executivePerformance,
  currentUser,
}) => {
  // Enforce RBAC
  const visibleExecutives =
    currentUser.role === 'sales_executive'
      ? executivePerformance.filter((e) => e.id === currentUser.id)
      : executivePerformance;

  const handleExportCSV = () => {
    const exportData = visibleExecutives.map((e) => ({
      name: e.name,
      role: e.role.replace(/_/g, ' '),
      leads: e.leads,
      calls: e.calls,
      followUps: e.followUps,
      visits: e.visits,
      quotations: e.quotations,
      orders: e.orders,
      orderValue: e.orderValue,
      paymentsCollected: e.paymentsCollected,
      completedOrders: e.completedOrders,
      conversionRate: e.leads > 0 ? `${Math.round((e.orders / e.leads) * 100)}%` : '0%',
    }));

    exportToCSV('Sales_Executive_Performance_Scorecard', exportData, [
      { key: 'name', label: 'Sales Executive' },
      { key: 'role', label: 'Role / Designation' },
      { key: 'leads', label: 'Leads Assigned' },
      { key: 'calls', label: 'Calls Logged' },
      { key: 'followUps', label: 'Follow-ups Handled' },
      { key: 'visits', label: 'Customer Visits' },
      { key: 'quotations', label: 'Quotations Created' },
      { key: 'orders', label: 'Orders Won' },
      { key: 'orderValue', label: 'Order Value (₹)' },
      { key: 'paymentsCollected', label: 'Payments Collected (₹)' },
      { key: 'completedOrders', label: 'Completed Deliveries' },
      { key: 'conversionRate', label: 'Lead-to-Order Conversion' },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Sales Executive & Team Performance Scorecard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual field sales benchmarks, activity completion metrics, and revenue contribution
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Scorecard CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">Sales Executive</th>
              <th className="py-2.5 px-3 text-center">Leads</th>
              <th className="py-2.5 px-3 text-center">Calls</th>
              <th className="py-2.5 px-3 text-center">Follow-ups</th>
              <th className="py-2.5 px-3 text-center">Visits</th>
              <th className="py-2.5 px-3 text-center">Quotations</th>
              <th className="py-2.5 px-3 text-center font-bold text-blue-700">Orders Won</th>
              <th className="py-2.5 px-3 text-right font-black text-slate-900">Total Sales (₹)</th>
              <th className="py-2.5 px-3 text-right text-emerald-800">Collections (₹)</th>
              <th className="py-2.5 px-3 text-center">Completed</th>
              <th className="py-2.5 px-3 text-center">Win Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleExecutives.map((exec) => {
              const winRate = exec.leads > 0 ? Math.round((exec.orders / exec.leads) * 100) : 0;
              return (
                <tr key={exec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={exec.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={exec.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{exec.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {exec.role.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">{exec.leads}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{exec.calls}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{exec.followUps}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{exec.visits}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{exec.quotations}</td>
                  <td className="py-3 px-3 text-center font-black text-blue-700">{exec.orders}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    ₹{exec.orderValue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">
                    ₹{exec.paymentsCollected.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">{exec.completedOrders}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {winRate}%
                    </span>
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

