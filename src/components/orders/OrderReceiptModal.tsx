import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  Truck,
  IndianRupee,
} from 'lucide-react';
import { Order, Payment } from '../../types';
import { dataStore } from '../../lib/supabase';

interface OrderReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const company = dataStore.getCompanySettings();
  const payments = dataStore.getPayments(order.id);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) || order.totalPaid || order.advancePaid || 0;
  const grandTotal = order.grandTotal || order.amount || 0;
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="order-receipt-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-7 shadow-2xl border border-slate-200 my-8 text-xs relative max-h-[92vh] overflow-y-auto print:m-0 print:p-6 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        {/* Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm">
              Order Receipt & Delivery Challan
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
              {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Challan / Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="mt-4 p-4 sm:p-6 bg-white border border-slate-200 rounded-xl print:border-none print:p-0">
          {/* Company Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-slate-800">
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="text-[#2563EB]">{company.companyName.split(' ')[0]}</span>{' '}
                {company.companyName.split(' ').slice(1).join(' ')}
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                {company.tagline || 'Clean Environment Systems & Bio-Waste Waste Management'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                <p>{company.officeAddress || 'Industrial Estate, South Kalamassery, Kochi, Kerala - 682033'}</p>
                <p>GSTIN: {company.gstin} • State Code: 32 ({company.state || 'Kerala'})</p>
                <p>Helpline: {company.phone} • Email: {company.email}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-md">
                Delivery Challan & Order Receipt
              </span>
              <div className="mt-2 text-xs">
                <div className="font-extrabold text-slate-900">{order.orderNumber}</div>
                <div className="text-[11px] text-slate-500">
                  Booking Date: <strong>{order.orderDate}</strong>
                </div>
                {order.sourceQuotationNumber && (
                  <div className="text-[11px] text-blue-600 font-semibold">
                    Ref Qtn: {order.sourceQuotationNumber}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 mt-1">
                  Expected Delivery:{' '}
                  <strong className="text-slate-800">{order.expectedDeliveryDate || 'Prompt'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Site Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billed To (Customer)
              </div>
              <div className="font-extrabold text-sm text-slate-900">{order.customerName}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {order.customerPlace}
                {order.district ? `, ${order.district}` : ''}
              </div>
              <div className="text-xs text-slate-700 font-semibold mt-1">
                Phone: {order.customerPhone}
                {order.alternativePhone ? ` / ${order.alternativePhone}` : ''}
              </div>
              {order.contactPerson && (
                <div className="text-[11px] text-slate-500">Contact: {order.contactPerson}</div>
              )}
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Delivery & Installation Site
              </div>
              <div className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {order.deliveryAddress || order.billingAddress || `${order.customerPlace}, Kerala`}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                <span>Installation: <strong>{order.installationRequired ? 'Required' : 'Not Required'}</strong></span>
                <span>•</span>
                <span>Executive: <strong>{order.assignedToName || order.assignedExecutiveName}</strong></span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase border-y border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item & Specifications</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">GST (18%)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        ₹{item.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        ₹{(item.gstAmount || Math.round(item.unitPrice * item.quantity * 0.18)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        ₹{(item.lineTotal || item.amount || (item.unitPrice * item.quantity * 1.18)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 px-3 text-slate-400 font-bold">1</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {order.productName || 'Kerala Incinerator Standard Unit'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{order.quantity || 1}</td>
                    <td className="py-3 px-3 text-right">
                      ₹{Math.round(grandTotal / 1.18).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{Math.round(grandTotal - grandTotal / 1.18).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            {/* Payment History Breakdown */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Payment Records</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  balanceDue <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {balanceDue <= 0 ? 'Fully Paid' : 'Partially Paid'}
                </span>
              </div>
              {payments.length === 0 ? (
                <div className="text-[11px] text-slate-500 py-1">
                  Advance Paid at Booking: <strong>₹{(order.advancePaid || 0).toLocaleString('en-IN')}</strong>
                </div>
              ) : (
                <div className="space-y-1.5 text-[11px]">
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-200/60 last:border-none">
                      <div>
                        <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                        {p.referenceNumber && (
                          <span className="text-[10px] text-slate-400 ml-1">({p.referenceNumber})</span>
                        )}
                        <span className="text-[10px] text-slate-400 block">{p.paymentDate}</span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        +₹{p.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal (Taxable Value):</span>
                <span>₹{(order.taxableAmount || Math.round(grandTotal / 1.18)).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>CGST (9%) + SGST (9%):</span>
                <span>₹{(order.gstAmount || Math.round(grandTotal - grandTotal / 1.18)).toLocaleString('en-IN')}</span>
              </div>
              {order.transportationCharges ? (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Transportation & Unloading:</span>
                  <span>₹{order.transportationCharges.toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-1.5 border-t border-slate-300 font-black text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700 font-bold">
                <span>Total Amount Paid:</span>
                <span>₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200 text-rose-600 font-extrabold text-sm">
                <span>Balance Payable at Delivery:</span>
                <span>₹{balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 uppercase">Terms & Delivery Conditions:</div>
            <p>1. Goods once sold are covered under 12 months comprehensive warranty against manufacturing defects.</p>
            <p>2. Final balance payment of ₹{balanceDue.toLocaleString('en-IN')} must be cleared upon safe delivery / prior to fire testing.</p>
            <p>3. Installation includes standard chimney height and base positioning on concrete or paved ground.</p>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <div className="font-bold text-slate-800 mt-1">Customer Site Acceptance</div>
              <div className="text-[10px] text-slate-400">Received incinerator unit in good condition</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <div className="font-bold text-slate-800 mt-1">For {company.companyName}</div>
              <div className="text-[10px] text-slate-400">{company.authorizedSignatoryLabel || 'Authorized Dispatch / Sales Officer'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

