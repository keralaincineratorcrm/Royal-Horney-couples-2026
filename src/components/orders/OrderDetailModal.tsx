import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  User,
  Building,
  Wrench,
  Award,
  AlertCircle,
  Plus,
  Share2,
  ExternalLink,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { Order, Payment, CustomerLead } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { RecordPaymentModal } from './RecordPaymentModal';
import { UpdateDeliveryModal } from './UpdateDeliveryModal';
import { OrderReceiptModal } from './OrderReceiptModal';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
  onSelectCustomer?: (customer: CustomerLead) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdate,
  onSelectCustomer,
}) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'senior_sales_executive';

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState<boolean>(false);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  // Live order and payments
  const liveOrder = dataStore.getOrderById(order.id) || order;
  const payments = dataStore.getPayments(liveOrder.id);

  const grandTotal = liveOrder.grandTotal || liveOrder.amount || 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) || liveOrder.totalPaid || liveOrder.advancePaid || 0;
  const balanceDue = Math.max(0, grandTotal - totalPaid);
  const paidPercent = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100)) : 0;

  // Lifecycle steps
  const steps = [
    { key: 'Confirmed', label: '1. Confirmed', desc: 'Order Placed' },
    { key: 'Processing', label: '2. In Production', desc: 'Fabrication' },
    { key: 'Ready for Dispatch', label: '3. Dispatch Ready', desc: 'QC Cleared' },
    { key: 'In Transit', label: '4. In Transit', desc: 'On Vehicle' },
    { key: 'Delivered', label: '5. Delivered', desc: 'At Customer Site' },
    { key: 'Installed', label: '6. Installed', desc: 'Commissioned' },
    { key: 'Completed', label: '7. Completed', desc: 'Fully Closed' },
  ];

  const getStepIndex = (delStatus: string, ordStatus?: string) => {
    if (ordStatus === 'Completed' || delStatus === 'Completed') return 6;
    if (delStatus === 'Installed' || liveOrder.installationStatus === 'Completed') return 5;
    if (delStatus === 'Delivered') return 4;
    if (delStatus === 'In Transit') return 3;
    if (delStatus === 'Ready for Dispatch') return 2;
    if (delStatus === 'Processing' || ordStatus === 'Processing') return 1;
    return 0;
  };

  const currentStepIdx = getStepIndex(liveOrder.deliveryStatus, liveOrder.orderStatus);

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Kerala Incinerator - Order Confirmation & Status*\n\n` +
      `Dear ${liveOrder.customerName},\n` +
      `Thank you for confirming your order with Kerala Incinerator!\n\n` +
      `*Order Details:*\n` +
      `• Order Number: *${liveOrder.orderNumber}*\n` +
      `• Product: *${liveOrder.productName}*\n` +
      `• Total Amount: *₹${grandTotal.toLocaleString('en-IN')}*\n` +
      `• Total Paid: *₹${totalPaid.toLocaleString('en-IN')}*\n` +
      `• Balance Due: *₹${balanceDue.toLocaleString('en-IN')}*\n` +
      `• Expected Delivery: *${liveOrder.expectedDeliveryDate || 'Upcoming'}*\n` +
      `• Delivery Status: *${liveOrder.deliveryStatus}*\n\n` +
      `Delivery Site: ${liveOrder.deliveryAddress || liveOrder.customerPlace}\n` +
      `Sales Executive: ${liveOrder.assignedToName || liveOrder.assignedExecutiveName}\n\n` +
      `For any dispatch assistance, call our Kerala helpline: +91 98470 12345.`
    );
    window.open(`https://wa.me/91${liveOrder.customerPhone?.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const handleCompleteOrder = () => {
    const res = dataStore.completeOrder(liveOrder.id, completionNotes);
    if (res.success) {
      setShowCompletionConfirm(false);
      onUpdate();
    } else {
      alert(res.error || 'Failed to complete order');
    }
  };

  return (
    <>
      <div
        id="order-detail-modal"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      >
        <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 text-xs relative max-h-[92vh] overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  {liveOrder.orderNumber}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  ({liveOrder.orderDate})
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    liveOrder.orderStatus === 'Completed' || liveOrder.deliveryStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : liveOrder.deliveryStatus === 'Delivered'
                      ? 'bg-teal-100 text-teal-800'
                      : liveOrder.deliveryStatus === 'In Transit'
                      ? 'bg-sky-100 text-sky-800'
                      : liveOrder.deliveryStatus === 'Ready for Dispatch'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {liveOrder.deliveryStatus}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    balanceDue <= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : totalPaid > 0
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {liveOrder.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Customer: <strong className="text-slate-900">{liveOrder.customerName}</strong> ({liveOrder.customerPlace})
              </p>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3.5 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => setShowDeliveryModal(true)}
                className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Truck className="w-4 h-4" />
                <span>Update Dispatch</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                title="Share order summary on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowReceiptModal(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Print delivery challan & invoice receipt"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stepper Lifecycle */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="flex items-center justify-between relative">
                {steps.map((st, idx) => {
                  const isPast = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={st.key} className="flex-1 flex flex-col items-center relative text-center">
                      {/* Connecting Line */}
                      {idx > 0 && (
                        <div
                          className={`absolute top-3 right-1/2 left-[-50%] h-0.5 z-0 ${
                            idx <= currentStepIdx ? 'bg-[#2563EB]' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      {/* Step Circle */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] z-10 transition-all ${
                          isCurrent
                            ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 scale-110 shadow-xs'
                            : isPast
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      {/* Step Label */}
                      <div className="mt-1.5">
                        <div
                          className={`text-[10px] font-bold leading-tight ${
                            isCurrent
                              ? 'text-[#2563EB]'
                              : isPast
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          {st.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="mt-4 space-y-4 flex-1">
            {/* 1. Customer & Delivery Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-extrabold text-slate-900 text-xs">Customer Information</span>
                  </div>
                  {onSelectCustomer && (
                    <button
                      onClick={() => {
                        const cust = dataStore.getCustomerById(liveOrder.customerId);
                        if (cust) onSelectCustomer(cust);
                      }}
                      className="text-[10px] font-bold text-[#2563EB] hover:underline flex items-center gap-0.5"
                    >
                      <span>Full Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">{liveOrder.customerName}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {liveOrder.customerPlace}
                      {liveOrder.district ? `, ${liveOrder.district}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href={`tel:${liveOrder.customerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{liveOrder.customerPhone}</span>
                    </a>
                    {liveOrder.alternativePhone && (
                      <span className="text-[11px] text-slate-500">
                        Alt: {liveOrder.alternativePhone}
                      </span>
                    )}
                  </div>

                  {liveOrder.contactPerson && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Contact Person: <strong>{liveOrder.contactPerson}</strong>
                    </div>
                  )}

                  {liveOrder.sourceQuotationNumber && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">Converted from:</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-[#2563EB] font-bold rounded-md border border-blue-200">
                        {liveOrder.sourceQuotationNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery & Site Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-600" />
                    <span className="font-extrabold text-slate-900 text-xs">Dispatch & Site Details</span>
                  </div>
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    className="text-[10px] font-bold text-sky-700 hover:underline"
                  >
                    Edit Transit Info
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-900 block mb-0.5">Delivery Site:</span>
                    {liveOrder.deliveryAddress || liveOrder.customerPlace}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expected Date</span>
                      <span className="font-bold text-slate-800">
                        {liveOrder.expectedDeliveryDate || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Actual Delivery</span>
                      <span className="font-bold text-emerald-700">
                        {liveOrder.actualDeliveryDate || liveOrder.deliveryDate || 'In Progress'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-200/70 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">Installation:</span>
                      <span className="font-bold text-purple-700">
                        {liveOrder.installationStatus || (liveOrder.installationRequired ? 'Pending' : 'Not Required')}
                      </span>
                    </div>
                    {liveOrder.installationRemarks && (
                      <p className="text-purple-800 text-[10px] mt-0.5">{liveOrder.installationRemarks}</p>
                    )}
                  </div>

                  {liveOrder.deliveryRemarks && (
                    <div className="text-[10px] text-slate-500 italic">
                      Remarks: {liveOrder.deliveryRemarks}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Financial Progress Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Financial Summary (18% GST Included)
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Total Collected</div>
                    <div className="text-base font-extrabold text-emerald-300">
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="pl-4 border-l border-white/20">
                    <div className="text-[10px] text-rose-400 font-bold uppercase">Pending Balance</div>
                    <div className="text-base font-extrabold text-rose-300">
                      ₹{balanceDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Payment Progress: {paidPercent}%</span>
                  <span>{balanceDue <= 0 ? 'Fully Cleared' : `₹${balanceDue.toLocaleString('en-IN')} Remaining`}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      paidPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Products / Line Items Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800 text-xs flex items-center justify-between">
                <span>Ordered Incinerator Equipment</span>
                <span className="text-slate-500 font-normal">
                  Total Items: {liveOrder.items?.reduce((s, it) => s + it.quantity, 0) || liveOrder.quantity || 1}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase border-b border-slate-200">
                      <th className="py-2 px-3">Item Details</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">GST (18%)</th>
                      <th className="py-2 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {liveOrder.items && liveOrder.items.length > 0 ? (
                      liveOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            {item.productModel && (
                              <div className="text-[10px] text-slate-400">Model: {item.productModel}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            ₹{item.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            ₹{(item.gstAmount || Math.round(item.unitPrice * item.quantity * 0.18)).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                            ₹{(item.lineTotal || item.amount || (item.unitPrice * item.quantity * 1.18)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {liveOrder.productName || 'Kerala Incinerator Standard Unit'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">{liveOrder.quantity || 1}</td>
                        <td className="py-2.5 px-3 text-right">
                          ₹{Math.round(grandTotal / 1.18).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          ₹{Math.round(grandTotal - grandTotal / 1.18).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold">
                          ₹{grandTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Payment History Section */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-slate-800 text-xs">Payment Collection History</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    ({payments.length} Records)
                  </span>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Payment</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  {liveOrder.advancePaid ? (
                    <div>
                      Initial booking advance of ₹{liveOrder.advancePaid.toLocaleString('en-IN')} recorded in order summary.
                    </div>
                  ) : (
                    <div>No payments registered yet for this order.</div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase border-b border-slate-200">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Amount (₹)</th>
                        <th className="py-2 px-3">Method</th>
                        <th className="py-2 px-3">Reference / UTR</th>
                        <th className="py-2 px-3">Notes</th>
                        <th className="py-2 px-3 text-right">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-700">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                            {p.referenceNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                            {p.notes || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                            {p.recordedByName || 'Staff'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. Completion Bar / Finalize Action */}
            {liveOrder.orderStatus !== 'Completed' && (
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Order Completion & Handover</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    When delivery is verified, site installation is tested, and balance payment is collected, mark this order as Completed.
                  </p>
                </div>

                <button
                  onClick={() => setShowCompletionConfirm(true)}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Order Completed</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          order={liveOrder}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Update Delivery Modal */}
      {showDeliveryModal && (
        <UpdateDeliveryModal
          order={liveOrder}
          onClose={() => setShowDeliveryModal(false)}
          onSuccess={() => {
            setShowDeliveryModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Order Receipt / Challan Modal */}
      {showReceiptModal && (
        <OrderReceiptModal
          order={liveOrder}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Order Completion Confirmation Dialog */}
      {showCompletionConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-2.5 pb-2 text-emerald-700">
              <Award className="w-5 h-5" />
              <h4 className="text-base font-extrabold text-slate-900">Finalize & Complete Order?</h4>
            </div>

            <p className="text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to mark Order <strong>{liveOrder.orderNumber}</strong> for <strong>{liveOrder.customerName}</strong> as completely finished? This will officially close delivery and update the customer's CRM status to "Completed".
            </p>

            <div className="mt-3">
              <label className="block font-bold text-slate-800 mb-1">
                Completion Notes (Optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. Unit tested with dry waste; customer certified satisfactory performance; warranty card issued."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCompletionConfirm(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                className="px-5 py-2 font-extrabold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Yes, Finalize Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

