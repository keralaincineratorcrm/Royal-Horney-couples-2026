import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
  FileText,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Flame,
  User,
  Camera,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { CustomerVisit, CustomerLead } from '../../types';
import { dataStore } from '../../lib/supabase';

interface VisitDetailModalProps {
  visit: CustomerVisit;
  onClose: () => void;
  onStartVisit?: (visit: CustomerVisit) => void;
  onReschedule?: (visit: CustomerVisit) => void;
  onViewCustomer?: (customerId: string) => void;
  onCreateQuotation?: (customer: CustomerLead, visit: CustomerVisit) => void;
  onCreateOrder?: (customer: CustomerLead, visit: CustomerVisit) => void;
}

export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  visit,
  onClose,
  onStartVisit,
  onReschedule,
  onViewCustomer,
  onCreateQuotation,
  onCreateOrder,
}) => {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const customer = dataStore.getCustomers('owner').find((c) => c.id === visit.customerId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
      case 'Checked In':
        return 'bg-blue-50 text-[#2563EB] border-blue-200 animate-pulse';
      case 'Scheduled':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Missed':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'Rescheduled':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getOrderChanceBadge = (chance?: string) => {
    switch (chance) {
      case 'High':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleOpenGoogleMaps = () => {
    if (visit.gpsLatitude && visit.gpsLongitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${visit.gpsLatitude},${visit.gpsLongitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (visit.location || visit.customerPlace) {
      const query = encodeURIComponent(`${visit.location || visit.customerPlace}, Kerala`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsApp = () => {
    const phoneClean = (visit.customerPhone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${visit.customerName}, this is regarding your customer visit for Kerala Incinerator waste management solutions (${visit.productsDiscussed.join(', ')}). Let us know if you need any further information.`
    );
    window.open(`https://wa.me/${phoneClean.startsWith('91') ? phoneClean : '91' + phoneClean}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(visit.status)}`}>
                  {visit.status}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                  {visit.visitDate} at {visit.visitTime}
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight truncate">
                {visit.customerName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-slate-300 mt-1">
                <span className="flex items-center gap-1 text-[#38BDF8] font-semibold">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {visit.location || visit.customerPlace}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {visit.customerPhone}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Contact & Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={`tel:${visit.customerPhone}`}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-[#2563EB] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#2563EB]" />
              <span>Call Phone</span>
            </a>

            <button
              onClick={handleWhatsApp}
              className="p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleOpenGoogleMaps}
              className="p-2.5 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-200 text-[#0284C7] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#0284C7]" />
              <span>View Map</span>
            </button>

            {customer && onViewCustomer && (
              <button
                onClick={() => {
                  onClose();
                  onViewCustomer(customer.id);
                }}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Customer Profile</span>
              </button>
            )}
          </div>

          {/* GPS Check-in Card (Section 15 Google Maps) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Navigation className="w-4 h-4 text-[#2563EB]" />
                <span>GPS Check-in Details</span>
              </div>
              {visit.gpsLatitude && visit.gpsLongitude ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  GPS Verified
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[10px]">
                  Manual Check-in
                </span>
              )}
            </div>

            {visit.gpsLatitude && visit.gpsLongitude ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Coordinates</span>
                  <span className="font-mono font-bold text-slate-800">
                    {visit.gpsLatitude.toFixed(5)}, {visit.gpsLongitude.toFixed(5)}
                  </span>
                  {visit.gpsAccuracy && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Accuracy: ±{Math.round(visit.gpsAccuracy)} meters
                    </span>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-in Time</span>
                    <span className="font-bold text-slate-800">
                      {visit.checkInTime || visit.visitTime} {visit.checkOutTime ? `(Out: ${visit.checkOutTime})` : ''}
                    </span>
                  </div>
                  <button
                    onClick={handleOpenGoogleMaps}
                    className="mt-2 text-[#2563EB] hover:underline font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>Open in Google Maps Navigation</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                <span>GPS coordinates not captured for this visit ({visit.gpsUnavailable ? 'Device GPS was unavailable' : 'Manual entry'}). Location recorded as: <strong>{visit.location || visit.customerPlace}</strong>.</span>
              </div>
            )}
          </div>

          {/* Visit Purpose & Executive Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Purpose of Visit</span>
              <span className="font-bold text-slate-900 text-sm">{visit.purpose || 'Customer Site Visit'}</span>
              <div className="text-slate-500 text-[11px] mt-1">
                Executive: <strong className="text-slate-800">{visit.assignedToName || visit.executiveName}</strong>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Outcome & Order Probability</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-blue-50 text-[#2563EB] border border-blue-200">
                  {visit.outcome || 'Pending'}
                </span>
                {visit.orderChance && (
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getOrderChanceBadge(visit.orderChance)}`}>
                    {visit.orderChance} Chance
                  </span>
                )}
              </div>
              {visit.estimatedOrderValue ? (
                <div className="text-emerald-700 font-extrabold text-xs mt-1">
                  Est. Value: ₹{Number(visit.estimatedOrderValue).toLocaleString('en-IN')}
                </div>
              ) : null}
            </div>
          </div>

          {/* Products Discussed (Section 9) */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Products Discussed
            </span>
            <div className="flex flex-wrap gap-1.5">
              {visit.productsDiscussed && visit.productsDiscussed.length > 0 ? (
                visit.productsDiscussed.map((prod, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px]"
                  >
                    {prod}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No specific products specified</span>
              )}
            </div>
          </div>

          {/* Discussion Notes & Customer Requirements (Section 8) */}
          <div className="space-y-2.5">
            {visit.discussionNotes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Discussion Points & Meeting Notes
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {visit.discussionNotes}
                </p>
              </div>
            )}

            {visit.customerRequirements && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Customer Requirements & Capacity Needed
                </span>
                <p className="text-slate-800 font-medium">
                  {visit.customerRequirements} {visit.quantityRequirement ? `(${visit.quantityRequirement})` : ''}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visit.customerResponse && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer Response</span>
                  <span className="font-bold text-slate-800">{visit.customerResponse}</span>
                </div>
              )}

              {visit.competitorMentioned && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Competitor Mentioned</span>
                  <span className="font-semibold text-slate-700">{visit.competitorMentioned}</span>
                </div>
              )}
            </div>

            {visit.customerQuestions && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                  Customer Questions / Concerns
                </span>
                <p className="text-slate-700 italic">"{visit.customerQuestions}"</p>
              </div>
            )}

            {visit.visitRemarks && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <span className="text-[#2563EB] text-[10px] uppercase font-bold block mb-1">
                  Executive Remarks
                </span>
                <p className="text-slate-800 font-medium">{visit.visitRemarks}</p>
              </div>
            )}
          </div>

          {/* Site Photos (Section 16) */}
          {visit.photos && visit.photos.length > 0 && (
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold block flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-600" />
                Site Photos ({visit.photos.length})
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {visit.photos.map((pic, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto(pic)}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 relative group"
                  >
                    <img
                      src={pic}
                      alt={`Site photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                      <Camera className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Follow-up Link */}
          {visit.nextFollowUpDate && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Next Follow-up Scheduled: {visit.nextFollowUpDate} {visit.nextFollowUpTime ? `at ${visit.nextFollowUpTime}` : ''}
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Source: Customer Visit
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rescheduled Note if applicable */}
          {visit.status === 'Rescheduled' && visit.rescheduledReason && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
              <span className="font-bold block">Rescheduled Reason:</span>
              <span>{visit.rescheduledReason} (Rescheduled to {visit.rescheduledToDate})</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Start visit if scheduled or missed */}
            {(visit.status === 'Scheduled' || visit.status === 'Missed') && onStartVisit && (
              <button
                onClick={() => {
                  onClose();
                  onStartVisit(visit);
                }}
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Start Visit (Check-in)</span>
              </button>
            )}

            {/* In Progress -> Continue visit */}
            {visit.status === 'In Progress' && onStartVisit && (
              <button
                onClick={() => {
                  onClose();
                  onStartVisit(visit);
                }}
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 animate-pulse"
              >
                <Navigation className="w-4 h-4" />
                <span>Continue Visit</span>
              </button>
            )}

            {/* Reschedule button */}
            {visit.status !== 'Completed' && visit.status !== 'Cancelled' && onReschedule && (
              <button
                onClick={() => {
                  onClose();
                  onReschedule(visit);
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reschedule</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Section 27: Quotation Integration */}
            {visit.outcome === 'Quotation Required' && customer && onCreateQuotation && (
              <button
                onClick={() => {
                  onClose();
                  onCreateQuotation(customer, visit);
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Create Quotation</span>
              </button>
            )}

            {/* Section 28: Order Integration */}
            {visit.outcome === 'Order Confirmed' && customer && onCreateOrder && (
              <button
                onClick={() => {
                  onClose();
                  onCreateOrder(customer, visit);
                }}
                className="px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Create Order</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Photo Lightbox */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={activePhoto}
              alt="Site Photo"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

