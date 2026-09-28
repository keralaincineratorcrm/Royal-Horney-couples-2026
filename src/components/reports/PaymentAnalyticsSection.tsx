import React from 'react';
import { Wallet, IndianRupee, CreditCard, Building, CheckCircle } from 'lucide-react';
import { ManagementAnalyticsData, PaymentMethod } from '../../types';

interface PaymentAnalyticsSectionProps {
  paymentAnalytics: ManagementAnalyticsData['paymentAnalytics'];
}

export const PaymentAnalyticsSection: React.FC<PaymentAnalyticsSectionProps> = ({
  paymentAnalytics,
}) => {
  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'UPI':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'Bank Transfer':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'Cheque':
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      case 'Cash':
        return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-600" />;
    }
  };

  const totalCollected = paymentAnalytics.totalPaid;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Payment Collections & Method Distribution
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified financial receipts aggregated across all recorded customer transaction entries
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Collections</span>
          <div className="text-lg font-black text-emerald-700">
            ₹{paymentAnalytics.totalPaid.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 5 High-Level Collection KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">Total Order Value</div>
          <div className="text-base font-black text-slate-900 mt-1">
            ₹{paymentAnalytics.totalOrderValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
          <div className="text-[11px] font-semibold text-emerald-700">Total Paid (Ledger)</div>
          <div className="text-base font-black text-emerald-800 mt-1">
            ₹{paymentAnalytics.totalPaid.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
          <div className="text-[11px] font-semibold text-sky-700">Advance Received</div>
          <div className="text-base font-black text-sky-800 mt-1">
            ₹{paymentAnalytics.advanceReceived.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
          <div className="text-[11px] font-semibold text-blue-700">Partial Payments</div>
          <div className="text-base font-black text-blue-800 mt-1">
            ₹{paymentAnalytics.partialPayments.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
          <div className="text-[11px] font-semibold text-amber-700">Outstanding Balance</div>
          <div className="text-base font-black text-amber-800 mt-1">
            ₹{paymentAnalytics.outstandingBalance.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Collections by Payment Channel
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {paymentAnalytics.methodBreakdown.map((item) => {
            const share =
              totalCollected > 0 ? Math.round((item.amount / totalCollected) * 100) : 0;

            return (
              <div
                key={item.method}
                className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    {getMethodIcon(item.method)}
                    <span>{item.method}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {item.count} txns
                  </span>
                </div>

                <div className="text-sm font-black text-slate-900">
                  ₹{item.amount.toLocaleString('en-IN')}
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${share}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-500 text-right font-medium">
                    {share}% of collections
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

