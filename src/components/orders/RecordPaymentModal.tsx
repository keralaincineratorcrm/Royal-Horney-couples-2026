import React, { useState } from 'react';
import {
  X,
  CreditCard,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building,
  Smartphone,
  Banknote,
  FileCheck,
} from 'lucide-react';
import { Order, Payment, PaymentMethod } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface RecordPaymentModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();

  const grandTotal = order.grandTotal || order.amount || 0;
  const existingPayments = dataStore.getPayments(order.id);
  const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0) || order.totalPaid || order.advancePaid || 0;
  const currentBalance = Math.max(0, grandTotal - totalPaidSoFar);

  const [amount, setAmount] = useState<number>(currentBalance > 0 ? currentBalance : 0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [allowOverpayment, setAllowOverpayment] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than ₹0.');
      return;
    }

    if (!allowOverpayment && amount > currentBalance) {
      setErrorMsg(
        `Amount ₹${amount.toLocaleString('en-IN')} exceeds pending balance ₹${currentBalance.toLocaleString('en-IN')}. Enable override to record excess amount.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = dataStore.addPayment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          amount,
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          recordedById: currentUser.id,
          recordedByName: currentUser.name,
        },
        allowOverpayment
      );

      if (!result.success || !result.payment) {
        setErrorMsg(result.error || 'Failed to record payment.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(result.payment);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while recording payment.');
      setIsSubmitting(false);
    }
  };

  const methods: { id: PaymentMethod; label: string; icon: any; placeholder: string }[] = [
    { id: 'UPI', label: 'UPI / GPay / PhonePe', icon: Smartphone, placeholder: 'Enter UPI Ref / Transaction ID' },
    { id: 'Bank Transfer', label: 'Bank Transfer (NEFT/RTGS)', icon: Building, placeholder: 'Enter Bank UTR Number' },
    { id: 'Cheque', label: 'Cheque Payment', icon: FileCheck, placeholder: 'Cheque No. & Bank Name' },
    { id: 'Cash', label: 'Cash on Delivery', icon: Banknote, placeholder: 'Cash Receipt Ref (Optional)' },
  ];

  return (
    <div
      id="record-payment-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 text-xs relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Record Customer Payment
              </h3>
              <p className="text-[11px] text-slate-500">
                Order: <span className="font-bold text-slate-700">{order.orderNumber}</span> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Value</div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-600 font-semibold uppercase">Paid So Far</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
              ₹{totalPaidSoFar.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-rose-500 font-semibold uppercase">Balance Due</div>
            <div className="text-sm font-extrabold text-rose-600 mt-0.5">
              ₹{currentBalance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount Input with quick presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">
                Payment Amount Received (₹) <span className="text-rose-500">*</span>
              </label>
              {currentBalance > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmount(currentBalance)}
                    className="text-[10px] font-bold text-[#2563EB] hover:underline bg-blue-50 px-2 py-0.5 rounded-md"
                  >
                    Full Balance (₹{currentBalance.toLocaleString('en-IN')})
                  </button>
                  {currentBalance > 2000 && (
                    <button
                      type="button"
                      onClick={() => setAmount(Math.round(currentBalance / 2))}
                      className="text-[10px] font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 px-1.5 py-0.5 rounded-md"
                    >
                      50% (₹{Math.round(currentBalance / 2).toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                required
                min={1}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter amount in ₹"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                    <span className="truncate text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Payment Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Transaction / Ref Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={methods.find((m) => m.id === paymentMethod)?.placeholder || 'UTR / Cheque / Ref'}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Notes / Remarks (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Google Pay to business account; or handed cash to delivery driver."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Remaining Balance Projection */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">New Balance After Payment:</span>
            <span className="font-extrabold text-slate-900 text-sm">
              ₹{Math.max(0, currentBalance - (amount || 0)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Allow Overpayment Toggle if user entered more than balance */}
          {amount > currentBalance && currentBalance > 0 && (
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={allowOverpayment}
                onChange={(e) => setAllowOverpayment(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-[11px] text-amber-800 font-medium">
                Authorize excess payment / advance credit override
              </span>
            </label>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record ₹{(amount || 0).toLocaleString('en-IN')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

