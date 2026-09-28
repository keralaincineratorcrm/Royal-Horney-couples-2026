import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  MessageCircle,
  FileText,
  Phone,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Edit,
  ExternalLink,
  ShoppingCart,
  Clock,
  Send,
  Eye,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Quotation, QuotationStatus, CustomerLead } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  generateQuotationPDF,
  printQuotationPdf,
  shareQuotationWhatsApp,
  formatINR,
} from '../../lib/pdfGenerator';
import { QuotationPreviewModal } from './QuotationPreviewModal';

interface QuotationDetailModalProps {
  quotation: Quotation;
  onClose: () => void;
  onEdit: (quotation: Quotation) => void;
  onConvertToOrder: (quotation: Quotation) => void;
  onSelectCustomer: (customer: CustomerLead) => void;
  onDuplicate: (quotation: Quotation) => void;
}

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  Draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  Sent: { label: 'Sent', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  Viewed: { label: 'Viewed', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  Negotiation: {
    label: 'Negotiation',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  Accepted: {
    label: 'Accepted',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  Rejected: { label: 'Rejected', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  Expired: { label: 'Expired', bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-400' },
};

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation: initialQuotation,
  onClose,
  onEdit,
  onConvertToOrder,
  onSelectCustomer,
  onDuplicate,
}) => {
  const { currentUser, isOwner, isSenior } = useAuth();
  const [quotation, setQuotation] = useState<Quotation>(initialQuotation);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [statusRemark, setStatusRemark] = useState<string>('');
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  const customer = dataStore.getCustomers().find((c) => c.id === quotation.customerId);
  const activities = dataStore.getActivities(quotation.customerId);

  const statusInfo = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.Draft;

  // Handle status update
  const handleUpdateStatus = (newStatus: QuotationStatus) => {
    setStatusUpdating(true);
    const updated = dataStore.updateQuotationStatus(
      quotation.id,
      newStatus,
      statusRemark || `Status updated to ${newStatus} by ${currentUser.name}`
    );
    if (updated) {
      setQuotation(updated);
    }
    setShowStatusDropdown(false);
    setStatusRemark('');
    setStatusUpdating(false);
  };

  const isExpired =
    quotation.validUntil &&
    quotation.status !== 'Accepted' &&
    quotation.status !== 'Rejected' &&
    new Date(quotation.validUntil) < new Date();

  return (
    <>
      <div
        id="quotation-detail-modal-backdrop"
        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <div
          id="quotation-detail-modal-card"
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-[#0F172A] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-900/60 border border-blue-500/30 flex items-center justify-center text-[#38BDF8]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">{quotation.quotationNumber}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                  >
                    {quotation.status}
                  </span>
                  {quotation.convertedToOrderId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      <span>Converted to Order</span>
                    </span>
                  )}
                  {isExpired && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-950 text-rose-300 border border-rose-800">
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Issued on {quotation.quotationDate} • Valid until {quotation.validUntil || '15 Days'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-close-detail"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Document Actions */}
              <button
                id="btn-detail-preview-pdf"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>View Letterhead</span>
              </button>

              <button
                id="btn-detail-download-pdf"
                onClick={() => generateQuotationPDF(quotation)}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                id="btn-detail-print"
                onClick={() => printQuotationPdf(quotation)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                id="btn-detail-whatsapp"
                onClick={() => shareQuotationWhatsApp(quotation)}
                className="px-3 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                id="btn-detail-duplicate"
                onClick={() => onDuplicate(quotation)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Duplicate quotation for another client or revision"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Duplicate</span>
              </button>

              {(!quotation.convertedToOrderId || isOwner) && (
                <button
                  id="btn-detail-edit"
                  onClick={() => onEdit(quotation)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Convert to Order Action */}
            <div className="flex items-center gap-2">
              {!quotation.convertedToOrderId ? (
                <button
                  id="btn-detail-convert-order"
                  onClick={() => onConvertToOrder(quotation)}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Convert to Order</span>
                </button>
              ) : (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Order Confirmed</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Customer Summary Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">
                    Customer Prospect
                  </span>
                  {customer && (
                    <button
                      type="button"
                      onClick={() => onSelectCustomer(customer)}
                      className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-0.5"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="text-sm font-extrabold text-slate-900">{quotation.customerName}</div>
                {quotation.careOf && (
                  <div className="text-xs text-slate-600 font-medium">C/O: {quotation.careOf}</div>
                )}
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{quotation.customerPlace}</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{quotation.customerPhone}</span>
                  {quotation.alternativePhone && ` / ${quotation.alternativePhone}`}
                </div>
              </div>

              {/* 2. Executive & Assignment Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider block">
                  Sales Assignment
                </span>

                <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{quotation.assignedToName || 'Sales Executive'}</span>
                </div>

                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Prepared By:</span>
                  <strong className="text-slate-800">{quotation.preparedByName || quotation.assignedToName}</strong>
                </div>

                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Valid Period:</span>
                  <strong className="text-slate-800">{quotation.validityDays || 15} Days</strong>
                </div>

                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Expires:</span>
                  <strong className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                    {quotation.validUntil || 'Within 15 days'}
                  </strong>
                </div>
              </div>

              {/* 3. Status Transition Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">
                    Quotation Lifecycle
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="text-[11px] font-bold text-[#2563EB] hover:underline"
                  >
                    Change Status
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                  >
                    {quotation.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Last update: {new Date(quotation.updatedAt || quotation.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Inline Status Changer Dropdown */}
                {showStatusDropdown && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 animate-fadeIn">
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          'Draft',
                          'Sent',
                          'Viewed',
                          'Negotiation',
                          'Accepted',
                          'Rejected',
                          'Expired',
                        ] as QuotationStatus[]
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateStatus(st)}
                          disabled={quotation.status === st}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            quotation.status === st
                              ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-[#2563EB] hover:text-[#2563EB]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Items Table */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider">
                  Itemized Incinerator Equipment & Materials
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {quotation.items.length} {quotation.items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Product Name & Spec</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Disc.</th>
                      <th className="py-2.5 px-3 text-right">GST %</th>
                      <th className="py-2.5 px-3 text-right">Item Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {quotation.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{it.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            {it.description || it.capacity}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          ₹{it.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-rose-600">
                          {it.discount > 0 ? `-₹${it.discount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          {it.taxRate || 18}%
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          ₹{Math.round(it.totalAmount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Terms Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs text-slate-600">
                <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider block">
                  Commercial Terms
                </span>
                <div>
                  <strong className="text-slate-800">Payment Terms:</strong>{' '}
                  {quotation.paymentTerms || '50% advance, balance on delivery.'}
                </div>
                <div>
                  <strong className="text-slate-800">Delivery Terms:</strong>{' '}
                  {quotation.deliveryTerms || 'Within 5-7 working days.'}
                </div>
                <div>
                  <strong className="text-slate-800">Installation:</strong>{' '}
                  {quotation.installationTerms || 'Included with standard chimney.'}
                </div>
                <div>
                  <strong className="text-slate-800">Warranty:</strong>{' '}
                  {quotation.warranty || '12 months manufacturing warranty.'}
                </div>
                {quotation.remarks && (
                  <div className="pt-1 text-slate-700">
                    <strong className="text-slate-800">Special Notes:</strong> {quotation.remarks}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider block">
                  Amount Breakdown
                </span>

                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{quotation.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {(quotation.discountTotal || quotation.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-bold">
                      -₹{(quotation.discountTotal || quotation.discountAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{(quotation.taxableAmount || quotation.subtotal).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-slate-800">
                    ₹{quotation.taxTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {(quotation.transportationCharges || 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Transportation:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{(quotation.transportationCharges || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center bg-blue-50/70 -mx-4 -mb-4 p-3 rounded-b-2xl">
                  <span className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">
                    Grand Total:
                  </span>
                  <span className="text-lg font-black text-[#2563EB]">
                    ₹{Math.round(quotation.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Customer Timeline */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider">
                Related Customer Activity History
              </h3>

              <div className="space-y-2">
                {activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-2.5 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{act.type}</span>
                        <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{act.description || act.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-400">
              Quotation ID: <code className="font-mono text-slate-600">{quotation.id}</code>
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Document Preview Modal */}
      {showPreviewModal && (
        <QuotationPreviewModal
          quotation={quotation}
          onClose={() => setShowPreviewModal(false)}
          onConvertToOrder={onConvertToOrder}
        />
      )}
    </>
  );
};

