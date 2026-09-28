import React from 'react';
import {
  X,
  Download,
  Printer,
  MessageCircle,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Quotation } from '../../types';
import { COMPANY_DETAILS, generateQuotationPDF, printQuotationPdf, shareQuotationWhatsApp, formatINR } from '../../lib/pdfGenerator';

interface QuotationPreviewModalProps {
  quotation: Quotation;
  onClose: () => void;
  onConvertToOrder?: (quotation: Quotation) => void;
}

export const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
  quotation,
  onClose,
  onConvertToOrder,
}) => {
  const calcSubtotal = quotation.subtotal;
  const calcDiscount = quotation.discountTotal || quotation.discountAmount || 0;
  const calcTaxable = quotation.taxableAmount || Math.max(0, calcSubtotal - calcDiscount);
  const calcTax = quotation.taxTotal || Math.round((calcTaxable * (quotation.taxPercent || 18)) / 100);
  const calcTrans = quotation.transportationCharges || 0;
  const calcGrandTotal = quotation.totalAmount || calcTaxable + calcTax + calcTrans;

  return (
    <div
      id="quotation-preview-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="quotation-preview-modal-card"
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Modal Top Action Bar */}
        <div className="bg-[#0F172A] px-5 py-3.5 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-300">Quotation Document Preview:</span>
            <span className="font-extrabold text-[#38BDF8] text-sm sm:text-base">
              {quotation.quotationNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="preview-btn-download-pdf"
              onClick={() => generateQuotationPDF(quotation)}
              className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              id="preview-btn-print"
              onClick={() => printQuotationPdf(quotation)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
              title="Print Quotation"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              id="preview-btn-whatsapp"
              onClick={() => shareQuotationWhatsApp(quotation)}
              className="px-3 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              id="preview-btn-close"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document Sheet */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-md border border-slate-200 overflow-hidden text-slate-900 text-xs font-sans">
            {/* 1. BRAND HEADER */}
            <div className="bg-[#0F172A] text-white p-6 relative">
              <div className="h-1 bg-[#2563EB] absolute top-0 left-0 right-0" />
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    KERALA INCINERATOR
                  </h1>
                  <p className="text-xs font-bold text-[#38BDF8] tracking-wider uppercase mt-0.5">
                    {COMPANY_DETAILS.tagline}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed max-w-md">
                    {COMPANY_DETAILS.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 mt-2">
                    <span>GSTIN: <strong className="text-slate-200">{COMPANY_DETAILS.gstin}</strong></span>
                    <span>Helpline: <strong className="text-slate-200">{COMPANY_DETAILS.phone}</strong></span>
                    <span>Email: <strong className="text-slate-200">{COMPANY_DETAILS.email}</strong></span>
                  </div>
                </div>

                <div className="bg-[#2563EB] p-3.5 rounded-xl text-center self-start sm:self-auto shrink-0 shadow-sm border border-blue-400/30">
                  <div className="text-[10px] font-extrabold text-blue-100 uppercase tracking-widest">
                    Official Quotation
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {quotation.quotationNumber}
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 text-white">
                    Status: {quotation.status}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. METADATA TWO COLUMNS */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 bg-slate-50/50">
              {/* Issued To */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Quotation Issued To:</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">{quotation.customerName}</div>
                {quotation.careOf && (
                  <div className="text-[11px] text-slate-600 font-medium">C/O: {quotation.careOf}</div>
                )}
                {quotation.customerAddress && (
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">{quotation.customerAddress}</div>
                )}
                <div className="text-[11px] text-slate-700 font-medium mt-1">
                  Place: <strong className="text-slate-900">{quotation.customerPlace}</strong>
                </div>
                <div className="text-[11px] text-slate-700 font-medium">
                  Phone: <strong className="text-slate-900">{quotation.customerPhone}</strong>
                  {quotation.alternativePhone && ` / ${quotation.alternativePhone}`}
                </div>
              </div>

              {/* Quotation Particulars */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Quotation Particulars:</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Quotation Date:</span>
                  <strong className="text-slate-900">{quotation.quotationDate}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Valid Until:</span>
                  <strong className="text-slate-900">
                    {quotation.validUntil || `${quotation.validityDays || 15} Days from issue`}
                  </strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Prepared By:</span>
                  <strong className="text-slate-900">{quotation.assignedToName || quotation.preparedByName || 'Sales Executive'}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Executive Contact:</span>
                  <strong className="text-slate-900">+91 94471 20001</strong>
                </div>
              </div>
            </div>

            {/* 3. ITEMS TABLE */}
            <div className="p-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0F172A] text-white text-[10px] font-extrabold uppercase">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center w-12">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-3 text-right">GST</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {quotation.items.map((item, idx) => {
                      const lineTotal =
                        item.totalAmount || (item.unitPrice * item.quantity - (item.discount || 0)) * 1.18;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="text-[10px] text-slate-500">
                              {item.description || (item.capacity ? `Capacity: ${item.capacity}` : 'Commercial Smokeless Waste Disposal Incinerator')}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700">
                            ₹{item.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-rose-600">
                            {item.discount > 0 ? `-₹${item.discount.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 font-medium">
                            {item.taxRate || 18}%
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            ₹{Math.round(lineTotal).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. FINANCIAL SUMMARY & TERMS */}
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Terms and Conditions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] space-y-1.5 text-slate-600">
                <div className="font-bold text-[#2563EB] uppercase tracking-wider text-[11px] mb-1">
                  Terms & Conditions
                </div>
                <div>
                  • <strong>Payment:</strong> {quotation.paymentTerms || '50% advance with order, balance prior to delivery.'}
                </div>
                <div>
                  • <strong>Delivery:</strong> {quotation.deliveryTerms || 'Within 5-7 working days across Kerala.'}
                </div>
                <div>
                  • <strong>Installation:</strong> {quotation.installationTerms || 'Standard chimney set & site installation included.'}
                </div>
                <div>
                  • <strong>Warranty:</strong> {quotation.warranty || '12 months comprehensive warranty on fabrication.'}
                </div>
                {quotation.remarks && (
                  <div className="pt-1 text-slate-700">
                    • <strong>Remarks:</strong> {quotation.remarks}
                  </div>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-slate-800">₹{calcSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {calcDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-₹{calcDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value:</span>
                  <span className="font-medium text-slate-800">₹{calcTaxable.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span className="font-medium text-slate-800">₹{calcTax.toLocaleString('en-IN')}</span>
                </div>

                {calcTrans > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Transportation:</span>
                    <span className="font-medium text-slate-800">₹{calcTrans.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-center bg-[#0F172A] -mx-4 -mb-4 p-3 rounded-b-xl text-white">
                  <span className="font-bold text-xs uppercase tracking-wider">Grand Total:</span>
                  <span className="text-base font-black text-[#38BDF8]">
                    ₹{Math.round(calcGrandTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. FOOTER & AUTHORIZED SIGNATORY */}
            <div className="p-6 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] text-slate-500 space-y-0.5 text-center sm:text-left">
                <div className="font-bold text-slate-800">Bank Details for Direct Transfer:</div>
                <div>A/C Name: Kerala Incinerator Pvt Ltd | Bank: SBI Perumbavoor Main</div>
                <div>A/C No: 384792019482 | IFSC: SBIN0070154 | UPI: keralaincinerator@sbi</div>
              </div>

              <div className="text-center sm:text-right shrink-0">
                <div className="text-[11px] font-bold text-slate-900">For KERALA INCINERATOR</div>
                <div className="my-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-[#2563EB] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>OFFICIALLY VERIFIED & ISSUED</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-600 mt-1">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Quotation valid for {quotation.validityDays || 15} days from date of issue.
          </div>

          <div className="flex items-center gap-2">
            {quotation.status === 'Accepted' && onConvertToOrder && !quotation.convertedToOrderId && (
              <button
                onClick={() => {
                  onClose();
                  onConvertToOrder(quotation);
                }}
                className="px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Convert to Order</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

