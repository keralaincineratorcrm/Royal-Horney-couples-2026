import React, { useState, useMemo } from 'react';
import {
  Coins,
  Search,
  Filter,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Phone,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';
import { exportToCSV } from './exportUtils';

interface OutstandingBalanceReportProps {
  balances: ManagementAnalyticsData['outstandingBalances'];
  onSelectOrder?: (orderId: string) => void;
  onSelectCustomer?: (customerId: string) => void;
}

export const OutstandingBalanceReport: React.FC<OutstandingBalanceReportProps> = ({
  balances,
  onSelectOrder,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Extract unique executives and districts for filtering
  const executives = useMemo(() => {
    const set = new Set<string>();
    balances.forEach((b) => {
      if (b.salesExecutiveName) set.add(b.salesExecutiveName);
    });
    return Array.from(set).sort();
  }, [balances]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    balances.forEach((b) => {
      if (b.district) set.add(b.district);
    });
    return Array.from(set).sort();
  }, [balances]);

  // Filtered and sorted rows
  const filteredBalances = useMemo(() => {
    return balances
      .filter((item) => {
        const matchesSearch =
          item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customerPhone.includes(searchTerm);

        const matchesExec =
          executiveFilter === 'all' || item.salesExecutiveName === executiveFilter;

        const matchesDistrict =
          districtFilter === 'all' || item.district === districtFilter;

        const matchesStatus =
          statusFilter === 'all' || item.paymentStatus === statusFilter;

        return matchesSearch && matchesExec && matchesDistrict && matchesStatus;
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? b.balanceDue - a.balanceDue
          : a.balanceDue - b.balanceDue;
      });
  }, [balances, searchTerm, executiveFilter, districtFilter, statusFilter, sortOrder]);

  const totalOutstanding = filteredBalances.reduce((sum, b) => sum + b.balanceDue, 0);
  const totalOrderVal = filteredBalances.reduce((sum, b) => sum + b.orderAmount, 0);
  const totalPaidVal = filteredBalances.reduce((sum, b) => sum + b.totalPaid, 0);

  const handleExportCSV = () => {
    const exportData = filteredBalances.map((b) => ({
      orderNumber: b.orderNumber,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      district: b.district,
      salesExecutive: b.salesExecutiveName,
      orderDate: b.orderDate,
      orderAmount: b.orderAmount,
      totalPaid: b.totalPaid,
      balanceDue: b.balanceDue,
      lastPaymentDate: b.lastPaymentDate,
      paymentStatus: b.paymentStatus,
    }));

    exportToCSV('Outstanding_Balances_Report', exportData, [
      { key: 'orderNumber', label: 'Order Number' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerPhone', label: 'Customer Phone' },
      { key: 'district', label: 'District' },
      { key: 'salesExecutive', label: 'Sales Executive' },
      { key: 'orderDate', label: 'Order Date' },
      { key: 'orderAmount', label: 'Order Amount (₹)' },
      { key: 'totalPaid', label: 'Total Paid (₹)' },
      { key: 'balanceDue', label: 'Balance Due (₹)' },
      { key: 'lastPaymentDate', label: 'Last Payment Date' },
      { key: 'paymentStatus', label: 'Payment Status' },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            Outstanding Balances & Collections Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time receivables calculated strictly as [Order Grand Total] minus [Actual Payments Ledger]
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-amber-600">Pending Receivables</div>
            <div className="text-lg font-black text-amber-700">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order #, Customer, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={executiveFilter}
          onChange={(e) => setExecutiveFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Sales Executives</option>
          {executives.map((exec) => (
            <option key={exec} value={exec}>
              {exec}
            </option>
          ))}
        </select>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Payment Statuses</option>
          <option value="Pending">Pending (No Advance)</option>
          <option value="Advance Received">Advance Received</option>
          <option value="Partial Paid">Partial Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">Order No</th>
              <th className="py-2.5 px-3">Customer & Place</th>
              <th className="py-2.5 px-3">Sales Executive</th>
              <th className="py-2.5 px-3">Order Date</th>
              <th className="py-2.5 px-3 text-right">Order Total</th>
              <th className="py-2.5 px-3 text-right">Total Paid</th>
              <th
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="py-2.5 px-3 text-right text-amber-800 font-black cursor-pointer hover:bg-amber-100/50"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Balance Due</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Last Payment</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBalances.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No outstanding customer balances matching the selected criteria.
                </td>
              </tr>
            ) : (
              filteredBalances.map((row) => {
                const isHighBalance = row.balanceDue >= 100000;
                return (
                  <tr key={row.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {row.orderNumber}
                    </td>

                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectCustomer && onSelectCustomer(row.customerId)}
                        className="font-bold text-blue-700 hover:underline cursor-pointer block text-left"
                      >
                        {row.customerName}
                      </button>
                      <span className="text-[11px] text-slate-400">
                        {row.district} • {row.customerPhone}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {row.salesExecutiveName}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      {row.orderDate}
                    </td>

                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      ₹{row.orderAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      ₹{row.totalPaid.toLocaleString('en-IN')}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block font-black px-2 py-0.5 rounded-md ${
                          isHighBalance
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ₹{row.balanceDue.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      {row.lastPaymentDate}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.paymentStatus === 'Fully Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.paymentStatus === 'Advance Received'
                            ? 'bg-sky-100 text-sky-800'
                            : row.paymentStatus === 'Partial Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectOrder && onSelectOrder(row.orderId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredBalances.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                <td colSpan={4} className="py-3 px-3">
                  Summary Totals ({filteredBalances.length} Orders)
                </td>
                <td className="py-3 px-3 text-right">₹{totalOrderVal.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 text-right text-emerald-700">
                  ₹{totalPaidVal.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right text-amber-800">
                  ₹{totalOutstanding.toLocaleString('en-IN')}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

