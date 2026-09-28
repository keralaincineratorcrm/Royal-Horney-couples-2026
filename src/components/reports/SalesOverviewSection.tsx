import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';

interface SalesOverviewSectionProps {
  salesOverview: ManagementAnalyticsData['salesOverview'];
  timeSeries: ManagementAnalyticsData['timeSeries'];
}

export const SalesOverviewSection: React.FC<SalesOverviewSectionProps> = ({
  salesOverview,
  timeSeries,
}) => {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartMetric, setChartMetric] = useState<'sales' | 'orders' | 'payments'>('sales');

  const currentSeries =
    granularity === 'daily'
      ? timeSeries.daily
      : granularity === 'weekly'
      ? timeSeries.weekly
      : timeSeries.monthly;

  // Maximum value for SVG chart scaling
  const maxValue = Math.max(
    ...currentSeries.map((d) => (chartMetric === 'orders' ? d.orders : d[chartMetric])),
    1
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Sales & Revenue Analytics Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregate financials derived from active database orders and payment ledger
          </p>
        </div>

        {/* Chart Granularity & Metric Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setGranularity('daily')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                granularity === 'daily' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setGranularity('weekly')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                granularity === 'weekly' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                granularity === 'monthly' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setChartMetric('sales')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'sales' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Sales (₹)
            </button>
            <button
              onClick={() => setChartMetric('payments')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'payments' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Payments (₹)
            </button>
            <button
              onClick={() => setChartMetric('orders')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'orders' ? 'bg-violet-600 text-white shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Orders (Count)
            </button>
          </div>
        </div>
      </div>

      {/* 7 Core Financial Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Total Order Value</div>
          <div className="text-base font-black text-slate-900 mt-1">
            ₹{salesOverview.totalOrderValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
          <div className="text-[11px] font-semibold text-emerald-700">Payments Collected</div>
          <div className="text-base font-black text-emerald-800 mt-1">
            ₹{salesOverview.totalPaymentsCollected.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
          <div className="text-[11px] font-semibold text-amber-700">Outstanding Balance</div>
          <div className="text-base font-black text-amber-800 mt-1">
            ₹{salesOverview.outstandingBalance.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Orders Booked</div>
          <div className="text-base font-black text-slate-900 mt-1">{salesOverview.orderCount}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Avg Order Value</div>
          <div className="text-base font-black text-slate-900 mt-1">
            ₹{salesOverview.avgOrderValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-green-50/60 p-3 rounded-xl border border-green-100">
          <div className="text-[11px] font-semibold text-green-700">Completed Orders Val</div>
          <div className="text-base font-black text-green-800 mt-1">
            ₹{salesOverview.completedOrderValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
          <div className="text-[11px] font-semibold text-rose-700">Cancelled Value</div>
          <div className="text-base font-black text-rose-800 mt-1">
            ₹{salesOverview.cancelledOrderValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Responsive Visual SVG Trend Chart */}
      <div className="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {chartMetric === 'sales'
              ? 'Sales Revenue Trend (₹)'
              : chartMetric === 'payments'
              ? 'Payments Collected Trend (₹)'
              : 'Orders Count Trend'}{' '}
            — {granularity.toUpperCase()}
          </div>
          <div className="text-[11px] text-slate-500">
            {currentSeries.length > 0 ? `${currentSeries.length} data points` : 'No activity in period'}
          </div>
        </div>

        {currentSeries.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mb-2" />
            No confirmed orders or payment records logged in this specific date range.
          </div>
        ) : (
          <div className="space-y-2">
            {/* Bar & Value Visualization */}
            <div className="h-48 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 overflow-x-auto">
              {currentSeries.map((item, idx) => {
                const rawVal = chartMetric === 'orders' ? item.orders : item[chartMetric];
                const heightPercent = maxValue > 0 ? Math.max(6, Math.round((rawVal / maxValue) * 100)) : 6;
                const barColor =
                  chartMetric === 'sales'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : chartMetric === 'payments'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-violet-600 hover:bg-violet-500';

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[36px] max-w-[64px] flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                  >
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono shadow-md pointer-events-none whitespace-nowrap z-10">
                      {chartMetric === 'orders'
                        ? `${item.orders} Orders`
                        : `₹${rawVal.toLocaleString('en-IN')}`}
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full ${barColor} rounded-t-lg transition-all duration-300`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* Label */}
                    <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 pt-2 px-1">
              <span>Peak: {chartMetric === 'orders' ? `${maxValue} orders` : `₹${maxValue.toLocaleString('en-IN')}`}</span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Sales
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block ml-2" /> Payments
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

