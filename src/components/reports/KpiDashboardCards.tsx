import React from 'react';
import {
  Users,
  UserPlus,
  Clock,
  AlertCircle,
  MapPin,
  FileText,
  CheckCircle2,
  ShoppingCart,
  IndianRupee,
  Wallet,
  Coins,
  Award,
  ChevronRight,
} from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';

interface KpiDashboardCardsProps {
  kpis: ManagementAnalyticsData['kpis'];
  onNavigateTab: (tab: string, filterState?: any) => void;
  onSelectReportSection?: (sectionId: string) => void;
}

export const KpiDashboardCards: React.FC<KpiDashboardCardsProps> = ({
  kpis,
  onNavigateTab,
  onSelectReportSection,
}) => {
  const cards = [
    {
      id: 'kpi-total-leads',
      label: 'Total Leads',
      value: kpis.totalLeads,
      isCurrency: false,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      action: () => onNavigateTab('customers'),
      hint: 'All customer accounts in CRM',
    },
    {
      id: 'kpi-new-leads',
      label: 'New Leads',
      value: kpis.newLeads,
      isCurrency: false,
      icon: UserPlus,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      action: () => onNavigateTab('customers', { status: 'New Lead' }),
      hint: 'Registered in selected period',
    },
    {
      id: 'kpi-active-followups',
      label: 'Active Follow-ups',
      value: kpis.activeFollowUps,
      isCurrency: false,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      action: () => onNavigateTab('followups'),
      hint: 'Pending or scheduled actions',
    },
    {
      id: 'kpi-overdue-followups',
      label: 'Overdue Follow-ups',
      value: kpis.overdueFollowUps,
      isCurrency: false,
      icon: AlertCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      highlightDanger: kpis.overdueFollowUps > 0,
      action: () => onNavigateTab('followups', { filter: 'overdue' }),
      hint: 'Elapsed follow-up target date',
    },
    {
      id: 'kpi-visits',
      label: 'Customer Visits',
      value: kpis.visits,
      isCurrency: false,
      icon: MapPin,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      action: () => onNavigateTab('visits'),
      hint: 'Field visits in period',
    },
    {
      id: 'kpi-quotations',
      label: 'Quotations Created',
      value: kpis.quotations,
      isCurrency: false,
      icon: FileText,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
      action: () => onNavigateTab('quotations'),
      hint: 'Official customer proposals',
    },
    {
      id: 'kpi-accepted-quotations',
      label: 'Accepted Quotes',
      value: kpis.acceptedQuotations,
      isCurrency: false,
      icon: CheckCircle2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100',
      action: () => onNavigateTab('quotations', { status: 'Accepted' }),
      hint: 'Proposals approved by buyer',
    },
    {
      id: 'kpi-orders',
      label: 'Total Orders',
      value: kpis.orders,
      isCurrency: false,
      icon: ShoppingCart,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
      action: () => onNavigateTab('orders'),
      hint: 'Orders booked in period',
    },
    {
      id: 'kpi-total-sales',
      label: 'Total Sales (₹)',
      value: kpis.totalSales,
      isCurrency: true,
      icon: IndianRupee,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100/60',
      borderColor: 'border-blue-200',
      action: () => (onSelectReportSection ? onSelectReportSection('sales') : onNavigateTab('orders')),
      hint: 'Gross confirmed order value',
      isMajor: true,
    },
    {
      id: 'kpi-payments-collected',
      label: 'Payments Collected',
      value: kpis.paymentsCollected,
      isCurrency: true,
      icon: Wallet,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100/60',
      borderColor: 'border-emerald-200',
      action: () => (onSelectReportSection ? onSelectReportSection('payments') : onNavigateTab('orders')),
      hint: 'Actual bank / UPI collections',
      isMajor: true,
    },
    {
      id: 'kpi-balance-pending',
      label: 'Balance Pending',
      value: kpis.balancePending,
      isCurrency: true,
      icon: Coins,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100/60',
      borderColor: 'border-amber-200',
      action: () => (onSelectReportSection ? onSelectReportSection('outstanding') : onNavigateTab('orders')),
      hint: 'Receivables due from orders',
      isMajor: true,
      highlightWarning: kpis.balancePending > 0,
    },
    {
      id: 'kpi-completed-orders',
      label: 'Completed Orders',
      value: kpis.completedOrders,
      isCurrency: false,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      action: () => onNavigateTab('orders', { status: 'Completed' }),
      hint: 'Delivered & finalized orders',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Executive Performance KPI Grid (12 Metrics)
        </h2>
        <span className="text-[11px] text-slate-400">Click any card to inspect or drill down</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              id={card.id}
              onClick={card.action}
              className={`flex flex-col justify-between p-3.5 rounded-2xl border bg-white text-left transition-all hover:shadow-md cursor-pointer group ${
                card.highlightDanger
                  ? 'border-rose-300 ring-1 ring-rose-300/60 bg-rose-50/20'
                  : card.highlightWarning
                  ? 'border-amber-300 ring-1 ring-amber-300/60 bg-amber-50/20'
                  : card.borderColor
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-500 truncate">
                  {card.label}
                </div>
                <div
                  className={`text-lg sm:text-xl font-black tracking-tight mt-0.5 ${
                    card.isMajor ? 'text-slate-950 font-black' : 'text-slate-800'
                  }`}
                >
                  {card.isCurrency ? `₹${card.value.toLocaleString('en-IN')}` : card.value}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{card.hint}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

