import React from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, Percent } from 'lucide-react';
import { ManagementAnalyticsData, QuotationStatus } from '../../types';

interface QuotationAnalyticsSectionProps {
  quotationAnalytics: ManagementAnalyticsData['quotationAnalytics'];
  onNavigateTab?: (tab: string, filter?: any) => void;
}

export const QuotationAnalyticsSection: React.FC<QuotationAnalyticsSectionProps> = ({
  quotationAnalytics,
  onNavigateTab,
}) => {
  const statuses: { status: QuotationStatus; label: string; color: string; bg: string }[] = [
    { status: 'Draft', label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100' },
    { status: 'Sent', label: 'Sent to Customer', color: 'text-blue-600', bg: 'bg-blue-100' },
    { status: 'Viewed', label: 'Viewed by Customer', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { status: 'Negotiation', label: 'In Negotiation', color: 'text-amber-600', bg: 'bg-amber-100' },
    { status: 'Accepted', label: 'Accepted (Won)', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { status: 'Rejected', label: 'Rejected', color: 'text-rose-600', bg: 'bg-rose-100' },
    { status: 'Expired', label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-200' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Quotation Pipeline & Commercial Conversion
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotation status distribution, proposal values, and verified order conversion performance
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Percent className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-950">
            Conversion Rate: <span className="text-base font-black text-emerald-700">{quotationAnalytics.conversionRate}%</span>
          </span>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Total Quoted Value</div>
          <div className="text-base font-black text-slate-900 mt-1">
            ₹{quotationAnalytics.totalQuotedValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {quotationAnalytics.totalQuotations} proposals issued
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
          <div className="text-[11px] font-semibold text-emerald-700">Accepted Quoted Value</div>
          <div className="text-base font-black text-emerald-800 mt-1">
            ₹{quotationAnalytics.acceptedValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {quotationAnalytics.statusCounts.Accepted || 0} quotes converted
          </div>
        </div>

        <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
          <div className="text-[11px] font-semibold text-rose-700">Rejected Value</div>
          <div className="text-base font-black text-rose-800 mt-1">
            ₹{quotationAnalytics.rejectedValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">
            {quotationAnalytics.statusCounts.Rejected || 0} quotes rejected
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Average Quotation Size</div>
          <div className="text-base font-black text-slate-900 mt-1">
            ₹{quotationAnalytics.avgQuotationValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Per proposal mean</div>
        </div>
      </div>

      {/* Quotation Status Grid */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Proposals by Negotiation Status
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {statuses.map((item) => {
            const count = quotationAnalytics.statusCounts[item.status] || 0;
            return (
              <button
                key={item.status}
                onClick={() => onNavigateTab && onNavigateTab('quotations', { status: item.status })}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:shadow-2xs transition-all text-left cursor-pointer"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.bg} ${item.color}`}
                >
                  {item.label}
                </span>
                <div className="text-lg font-black text-slate-900 mt-2">{count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Methodology Disclaimer */}
      <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200/60 leading-relaxed">
        <span className="font-bold text-slate-700">Conversion Methodology:</span> Calculated as{' '}
        <span className="font-semibold text-slate-900">[Accepted Quotations]</span> divided by{' '}
        <span className="font-semibold text-slate-900">[Total Active/Delivered Quotations excluding Drafts]</span>. All quotations converted directly into orders maintain verified 1:1 cross-referencing in the orders database.
      </div>
    </div>
  );
};

