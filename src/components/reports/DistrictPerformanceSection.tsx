import React, { useState, useMemo } from 'react';
import { MapPin, ArrowUpDown, Download, Search } from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';
import { exportToCSV } from './exportUtils';

interface DistrictPerformanceSectionProps {
  districtPerformance: ManagementAnalyticsData['districtPerformance'];
  onNavigateTab?: (tab: string, filter?: any) => void;
}

export const DistrictPerformanceSection: React.FC<DistrictPerformanceSectionProps> = ({
  districtPerformance,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'orderValue' | 'orders' | 'leads' | 'outstandingBalance'>('orderValue');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredDistricts = useMemo(() => {
    return districtPerformance
      .filter((d) => d.district.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [districtPerformance, searchTerm, sortKey, sortOrder]);

  const toggleSort = (key: 'orderValue' | 'orders' | 'leads' | 'outstandingBalance') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const totalLeads = filteredDistricts.reduce((s, d) => s + d.leads, 0);
  const totalQuotes = filteredDistricts.reduce((s, d) => s + d.quotations, 0);
  const totalOrders = filteredDistricts.reduce((s, d) => s + d.orders, 0);
  const totalOrderVal = filteredDistricts.reduce((s, d) => s + d.orderValue, 0);
  const totalCollected = filteredDistricts.reduce((s, d) => s + d.paymentsCollected, 0);
  const totalBalance = filteredDistricts.reduce((s, d) => s + d.outstandingBalance, 0);

  const handleExportCSV = () => {
    const exportData = filteredDistricts.map((d) => ({
      district: d.district,
      leads: d.leads,
      quotations: d.quotations,
      orders: d.orders,
      orderValue: d.orderValue,
      paymentsCollected: d.paymentsCollected,
      outstandingBalance: d.outstandingBalance,
    }));

    exportToCSV('Kerala_Districts_Performance', exportData, [
      { key: 'district', label: 'Kerala District' },
      { key: 'leads', label: 'Total Inquiries / Leads' },
      { key: 'quotations', label: 'Quotations Created' },
      { key: 'orders', label: 'Orders Won' },
      { key: 'orderValue', label: 'Order Value (₹)' },
      { key: 'paymentsCollected', label: 'Payments Collected (₹)' },
      { key: 'outstandingBalance', label: 'Outstanding Balance (₹)' },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Kerala District-Wise Sales & Market Penetration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic performance across all 14 revenue districts of Kerala state
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">District (Kerala)</th>
              <th
                onClick={() => toggleSort('leads')}
                className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Leads</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Quotations</th>
              <th
                onClick={() => toggleSort('orders')}
                className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Orders</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('orderValue')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 text-slate-900 font-black"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Order Value (₹)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right text-emerald-800">Collected (₹)</th>
              <th
                onClick={() => toggleSort('outstandingBalance')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 text-amber-800 font-bold"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Balance (₹)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDistricts.map((d, i) => (
              <tr key={d.district} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-900">{d.district}</span>
                    {d.orderValue > 150000 && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                        Top Zone
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{d.leads}</td>
                <td className="py-2.5 px-3 text-center text-slate-600">{d.quotations}</td>
                <td className="py-2.5 px-3 text-center font-bold text-blue-700">{d.orders}</td>
                <td className="py-2.5 px-3 text-right font-black text-slate-900">
                  ₹{d.orderValue.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                  ₹{d.paymentsCollected.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                  ₹{d.outstandingBalance.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-3">State Totals (14 Districts)</td>
              <td className="py-3 px-3 text-center">{totalLeads}</td>
              <td className="py-3 px-3 text-center">{totalQuotes}</td>
              <td className="py-3 px-3 text-center text-blue-700">{totalOrders}</td>
              <td className="py-3 px-3 text-right">₹{totalOrderVal.toLocaleString('en-IN')}</td>
              <td className="py-3 px-3 text-right text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</td>
              <td className="py-3 px-3 text-right text-amber-800">₹{totalBalance.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

