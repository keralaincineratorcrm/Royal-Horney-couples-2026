import React from 'react';
import {
  ShoppingCart,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  Wrench,
  Award,
  XCircle,
  IndianRupee,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { Order, Payment } from '../../types';

interface OrderStatsCardsProps {
  orders: Order[];
  payments: Payment[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const OrderStatsCards: React.FC<OrderStatsCardsProps> = ({
  orders,
  payments,
  selectedFilter,
  onSelectFilter,
}) => {
  // Aggregate Metrics
  const totalOrders = orders.length;
  const processingCount = orders.filter(
    (o) => o.deliveryStatus === 'Processing' || o.orderStatus === 'Processing'
  ).length;
  const readyForDispatchCount = orders.filter(
    (o) => o.deliveryStatus === 'Ready for Dispatch'
  ).length;
  const inTransitCount = orders.filter((o) => o.deliveryStatus === 'In Transit').length;
  const deliveredCount = orders.filter((o) => o.deliveryStatus === 'Delivered').length;
  const installedCount = orders.filter(
    (o) => o.deliveryStatus === 'Installed' || (o.installationStatus === 'Completed' && o.orderStatus !== 'Completed')
  ).length;
  const completedCount = orders.filter(
    (o) => o.orderStatus === 'Completed' || o.deliveryStatus === 'Completed'
  ).length;
  const cancelledCount = orders.filter(
    (o) => o.orderStatus === 'Cancelled' || o.deliveryStatus === 'Cancelled'
  ).length;

  const totalOrderValue = orders.reduce((sum, o) => sum + (o.grandTotal || o.amount || 0), 0);
  const totalAdvanceCollected = orders.reduce((sum, o) => sum + (o.totalPaid || o.advancePaid || 0), 0);
  const totalBalancePending = Math.max(0, totalOrderValue - totalAdvanceCollected);

  // Financial collection from payments collection
  const totalPaymentsRecorded = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const kpis = [
    {
      id: 'All',
      label: 'Total Orders',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'blue',
      badge: 'Active Bookings',
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      activeRing: 'ring-2 ring-blue-500',
    },
    {
      id: 'Processing',
      label: 'In Production',
      value: processingCount,
      icon: Clock,
      color: 'amber',
      badge: 'Fabrication',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      activeRing: 'ring-2 ring-amber-500',
    },
    {
      id: 'Ready for Dispatch',
      label: 'Ready Dispatch',
      value: readyForDispatchCount,
      icon: PackageCheck,
      color: 'indigo',
      badge: 'QC Passed',
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      activeRing: 'ring-2 ring-indigo-500',
    },
    {
      id: 'In Transit',
      label: 'In Transit',
      value: inTransitCount,
      icon: Truck,
      color: 'sky',
      badge: 'On Route',
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      activeRing: 'ring-2 ring-sky-500',
    },
    {
      id: 'Delivered',
      label: 'Delivered',
      value: deliveredCount,
      icon: CheckCircle2,
      color: 'teal',
      badge: 'At Site',
      bg: 'bg-teal-50 border-teal-200 text-teal-700',
      activeRing: 'ring-2 ring-teal-500',
    },
    {
      id: 'Installed',
      label: 'Installed',
      value: installedCount,
      icon: Wrench,
      color: 'purple',
      badge: 'Commissioned',
      bg: 'bg-purple-50 border-purple-200 text-purple-700',
      activeRing: 'ring-2 ring-purple-500',
    },
    {
      id: 'Completed',
      label: 'Completed',
      value: completedCount,
      icon: Award,
      color: 'emerald',
      badge: 'Closed',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      activeRing: 'ring-2 ring-emerald-500',
    },
    {
      id: 'Cancelled',
      label: 'Cancelled',
      value: cancelledCount,
      icon: XCircle,
      color: 'rose',
      badge: 'Voided',
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      activeRing: 'ring-2 ring-rose-500',
    },
  ];

  return (
    <div id="order-stats-container" className="space-y-3">
      {/* 1. Status KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = selectedFilter === kpi.id;

          return (
            <button
              key={kpi.id}
              onClick={() => onSelectFilter(isSelected && kpi.id !== 'All' ? 'All' : kpi.id)}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between relative overflow-hidden bg-white ${
                isSelected
                  ? `${kpi.activeRing} shadow-md bg-white border-transparent`
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${kpi.bg}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {kpi.badge}
                </div>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2563EB]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Financial Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Order Value */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-xs relative overflow-hidden border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Total Order Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 tracking-tight">
            ₹{totalOrderValue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-white/10">
            <span>{totalOrders} Total Confirmed Orders</span>
            <span className="text-emerald-400 font-semibold">18% GST Included</span>
          </div>
        </div>

        {/* Advance & Payments Collected */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl p-4 shadow-xs relative overflow-hidden border border-emerald-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
              Advance & Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 tracking-tight">
            ₹{totalAdvanceCollected.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-200 mt-2 pt-2 border-t border-white/10">
            <span>
              Collection Rate:{' '}
              <strong className="text-white font-bold">
                {totalOrderValue > 0 ? Math.round((totalAdvanceCollected / totalOrderValue) * 100) : 0}%
              </strong>
            </span>
            <span className="text-emerald-300">
              {payments.length} Payments Recorded
            </span>
          </div>
        </div>

        {/* Balance Pending */}
        <div className="bg-gradient-to-br from-rose-950 to-rose-900 text-white rounded-2xl p-4 shadow-xs relative overflow-hidden border border-rose-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-200 uppercase tracking-wider">
              Balance Pending
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 tracking-tight">
            ₹{totalBalancePending.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-rose-200 mt-2 pt-2 border-t border-white/10">
            <span>
              Pending from{' '}
              <strong className="text-white font-bold">
                {orders.filter((o) => (o.balanceDue || o.balanceAmount || 0) > 0).length} Orders
              </strong>
            </span>
            <button
              onClick={() => onSelectFilter('PendingPayment')}
              className="text-white underline text-[11px] font-semibold hover:text-rose-100"
            >
              Filter Pending →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

