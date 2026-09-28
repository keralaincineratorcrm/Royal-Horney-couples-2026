import React, { useState, useMemo } from 'react';
import { Users, Search, Download, Eye, Coins, CheckCircle2 } from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';
import { exportToCSV } from './exportUtils';

interface CustomerValueSectionProps {
  customerAnalytics: ManagementAnalyticsData['customerAnalytics'];
  onSelectCustomer?: (customerId: string) => void;
}

export const CustomerValueSection: React.FC<CustomerValueSectionProps> = ({
  customerAnalytics,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customerAnalytics.customerValues.filter((c) => {
      return (
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerPhone.includes(searchTerm) ||
        c.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [customerAnalytics.customerValues, searchTerm]);

  const handleExportCSV = () => {
    const exportData = filteredCustomers.map((c) => ({
      customerName: c.customerName,
      phone: c.customerPhone,
      place: c.place,
      district: c.district,
      orderCount: c.orderCount,
      totalOrderValue: c.totalOrderValue,
      totalPaid: c.totalPaid,
      outstandingBalance: c.outstandingBalance,
      lastOrderDate: c.lastOrderDate,
    }));

    exportToCSV('Customer_Account_Lifetime_Value', exportData, [
      { key: 'customerName', label: 'Customer / Institution' },
      { key: 'phone', label: 'Contact Phone' },
      { key: 'place', label: 'Place' },
      { key: 'district', label: 'District' },
      { key: 'orderCount', label: 'Total Orders' },
      { key: 'totalOrderValue', label: 'Total Order Value (₹)' },
      { key: 'totalPaid', label: 'Total Paid (₹)' },
      { key: 'outstandingBalance', label: 'Outstanding Balance (₹)' },
      { key: 'lastOrderDate', label: 'Last Order Date' },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Customer Account Portfolio & Lifetime Value
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key client accounts, order history totals, payment receipts, and outstanding exposure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, place..."
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

      {/* Customer Health KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Total Database</div>
          <div className="text-base font-black text-slate-900 mt-1">
            {customerAnalytics.totalCustomers} Accounts
          </div>
        </div>

        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
          <div className="text-[11px] font-semibold text-blue-700">New Leads in Period</div>
          <div className="text-base font-black text-blue-800 mt-1">
            {customerAnalytics.newCustomers}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Active Opportunities</div>
          <div className="text-base font-black text-slate-900 mt-1">
            {customerAnalytics.activeCustomers}
          </div>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
          <div className="text-[11px] font-semibold text-amber-700">With Open Follow-ups</div>
          <div className="text-base font-black text-amber-800 mt-1">
            {customerAnalytics.withOpenFollowUps}
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
          <div className="text-[11px] font-semibold text-emerald-700">Converted to Orders</div>
          <div className="text-base font-black text-emerald-800 mt-1">
            {customerAnalytics.withOrders}
          </div>
        </div>

        <div className="bg-green-50/60 p-3 rounded-xl border border-green-100">
          <div className="text-[11px] font-semibold text-green-700">Completed Orders</div>
          <div className="text-base font-black text-green-800 mt-1">
            {customerAnalytics.withCompletedOrders}
          </div>
        </div>
      </div>

      {/* Customer Value Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">Customer / Client</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3 text-center">Orders</th>
              <th className="py-2.5 px-3 text-right font-black text-slate-900">Total Order Value (₹)</th>
              <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">Total Paid (₹)</th>
              <th className="py-2.5 px-3 text-right text-amber-800 font-bold">Balance Due (₹)</th>
              <th className="py-2.5 px-3">Last Order Date</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  No customer order records matching your search.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c.customerId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onSelectCustomer && onSelectCustomer(c.customerId)}
                      className="font-bold text-blue-700 hover:underline cursor-pointer block text-left"
                    >
                      {c.customerName}
                    </button>
                    <span className="text-[11px] text-slate-400">{c.customerPhone}</span>
                  </td>

                  <td className="py-2.5 px-3 text-slate-700">
                    <div>{c.place}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{c.district}</div>
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {c.orderCount}
                  </td>

                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    ₹{c.totalOrderValue.toLocaleString('en-IN')}
                  </td>

                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                    ₹{c.totalPaid.toLocaleString('en-IN')}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`font-black ${
                        c.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-400'
                      }`}
                    >
                      ₹{c.outstandingBalance.toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-slate-600">{c.lastOrderDate}</td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectCustomer && onSelectCustomer(c.customerId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

