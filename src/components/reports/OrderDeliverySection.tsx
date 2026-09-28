import React from 'react';
import { ShoppingCart, Truck, AlertTriangle, CheckCircle2, Clock, Eye, Phone } from 'lucide-react';
import { ManagementAnalyticsData, DeliveryStatus, OrderStatus } from '../../types';

interface OrderDeliverySectionProps {
  orderAnalytics: ManagementAnalyticsData['orderAnalytics'];
  deliveryPerformance: ManagementAnalyticsData['deliveryPerformance'];
  onSelectOrder?: (orderId: string) => void;
  onNavigateTab?: (tab: string, filter?: any) => void;
}

export const OrderDeliverySection: React.FC<OrderDeliverySectionProps> = ({
  orderAnalytics,
  deliveryPerformance,
  onSelectOrder,
  onNavigateTab,
}) => {
  const deliveryStages: {
    status: DeliveryStatus;
    label: string;
    count: number;
    color: string;
    bg: string;
  }[] = [
    { status: 'Pending', label: 'Pending Booking', count: deliveryPerformance.pending, color: 'text-blue-700', bg: 'bg-blue-50' },
    { status: 'Processing', label: 'Factory Processing', count: deliveryPerformance.processing, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { status: 'Ready for Dispatch', label: 'Ready for Dispatch', count: deliveryPerformance.readyForDispatch, color: 'text-purple-700', bg: 'bg-purple-50' },
    { status: 'In Transit', label: 'In Transit', count: deliveryPerformance.inTransit, color: 'text-amber-700', bg: 'bg-amber-50' },
    { status: 'Delivered', label: 'Delivered', count: deliveryPerformance.delivered, color: 'text-teal-700', bg: 'bg-teal-50' },
    { status: 'Installed', label: 'Installed', count: deliveryPerformance.installed, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { status: 'Completed', label: 'Completed & Finalized', count: deliveryPerformance.completed, color: 'text-green-700', bg: 'bg-green-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Order Execution & Incinerator Delivery Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational tracking of incinerator manufacturing, transit logistics, and client site commissioning
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Orders</span>
            <div className="text-lg font-black text-slate-900">{orderAnalytics.totalOrders}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Value</span>
            <div className="text-lg font-black text-blue-700">
              ₹{orderAnalytics.totalOrderValue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Stages Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Delivery Lifecycle Stages
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {deliveryStages.map((stage) => (
            <button
              key={stage.status}
              onClick={() => onNavigateTab && onNavigateTab('orders', { deliveryStatus: stage.status })}
              className={`p-3 rounded-xl border border-slate-200 text-left transition-all hover:shadow-2xs cursor-pointer ${stage.bg}`}
            >
              <div className={`text-[10px] font-bold ${stage.color}`}>{stage.label}</div>
              <div className="text-xl font-black text-slate-900 mt-1">{stage.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Section 10: Overdue Deliveries Alert Table */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Overdue Shipments Awaiting Dispatch / Delivery ({deliveryPerformance.overdueCount})
          </h3>
          <span className="text-[11px] text-slate-400">Target expected date has elapsed</span>
        </div>

        {deliveryPerformance.overdueList.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            All scheduled customer incinerator shipments are on track. No overdue deliveries recorded!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-rose-200 bg-rose-50/20">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-rose-100/60 text-rose-950 font-bold border-b border-rose-200">
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Sales Executive</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {deliveryPerformance.overdueList.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-rose-100/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ord.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{ord.customerPhone}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-700">{ord.expectedDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {ord.currentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{ord.salesExecutiveName}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectOrder && onSelectOrder(ord.orderId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-md font-semibold text-[11px] cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

