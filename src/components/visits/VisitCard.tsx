import React from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  Eye,
  RotateCcw,
  Flame,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
} from 'lucide-react';
import { CustomerVisit } from '../../types';

interface VisitCardProps {
  visit: CustomerVisit;
  onStartVisit: (visit: CustomerVisit) => void;
  onViewDetails: (visit: CustomerVisit) => void;
  onReschedule: (visit: CustomerVisit) => void;
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  onStartVisit,
  onViewDetails,
  onReschedule,
}) => {
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

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneClean = (visit.customerPhone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${visit.customerName}, this is regarding your visit for Kerala Incinerator solutions. Please let us know if you need any assistance.`
    );
    window.open(`https://wa.me/${phoneClean.startsWith('91') ? phoneClean : '91' + phoneClean}?text=${text}`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${visit.customerPhone}`;
  };

  return (
    <div
      onClick={() => onViewDetails(visit)}
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group text-xs"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                visit.status
              )}`}
            >
              {visit.status}
            </span>
            {visit.orderChance && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getOrderChanceBadge(
                  visit.orderChance
                )}`}
              >
                {visit.orderChance} Chance
              </span>
            )}
            {visit.gpsLatitude && visit.gpsLongitude && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                GPS
              </span>
            )}
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-slate-700 font-black text-xs">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{visit.visitTime || '11:00'}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {visit.visitDate}
            </div>
          </div>
        </div>

        {/* Customer Title */}
        <h3 className="text-base font-black text-slate-900 group-hover:text-[#2563EB] transition-colors line-clamp-1">
          {visit.customerName}
        </h3>

        {/* Place & Phone */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 text-[11px] mt-1">
          <span className="flex items-center gap-1 text-[#2563EB] font-bold">
            <MapPin className="w-3 h-3 shrink-0" />
            {visit.location || visit.customerPlace}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            {visit.customerPhone}
          </span>
        </div>

        {/* Product & Purpose */}
        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Purpose</span>
            <span className="font-bold text-slate-800 truncate">{visit.purpose || 'Customer Site Visit'}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Product</span>
            <span className="font-bold text-slate-900 truncate max-w-[160px]">
              {visit.productsDiscussed?.[0] || '10kg SS Incinerator'}
            </span>
          </div>
          {visit.estimatedOrderValue ? (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Est. Value</span>
              <span className="font-black text-emerald-700">
                ₹{Number(visit.estimatedOrderValue).toLocaleString('en-IN')}
              </span>
            </div>
          ) : null}
        </div>

        {/* Executive Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-0.5">
          <span className="flex items-center gap-1 font-medium">
            <User className="w-3 h-3 text-slate-400" />
            {visit.assignedToName || visit.executiveName}
          </span>
          {visit.outcome && (
            <span className="font-bold text-[#2563EB] bg-blue-50/80 px-2 py-0.5 rounded-md text-[10px]">
              {visit.outcome}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons (Section 13: Minimum 44px Touch Targets) */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2" onClick={(e) => e.stopPropagation()}>
        {/* Primary Action Button */}
        {visit.status === 'Scheduled' || visit.status === 'Missed' ? (
          <button
            type="button"
            onClick={() => onStartVisit(visit)}
            className="w-full min-h-[44px] py-2.5 px-3 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Navigation className="w-4 h-4" />
            <span>START VISIT (CHECK-IN)</span>
          </button>
        ) : visit.status === 'In Progress' ? (
          <button
            type="button"
            onClick={() => onStartVisit(visit)}
            className="w-full min-h-[44px] py-2.5 px-3 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs animate-pulse"
          >
            <Navigation className="w-4 h-4" />
            <span>CONTINUE VISIT</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onViewDetails(visit)}
            className="w-full min-h-[40px] py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>VIEW VISIT DETAILS</span>
          </button>
        )}

        {/* Quick Contact & Utility Row */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={handleCall}
            title="Call Customer"
            className="min-h-[42px] rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[#2563EB] flex items-center justify-center transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            title="WhatsApp"
            className="min-h-[42px] rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onReschedule(visit)}
            title="Reschedule Visit"
            className="min-h-[42px] rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetails(visit)}
            title="View Full Details"
            className="min-h-[42px] rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

