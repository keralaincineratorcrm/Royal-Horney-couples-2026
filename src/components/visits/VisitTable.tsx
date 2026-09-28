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
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { CustomerVisit } from '../../types';

interface VisitTableProps {
  visits: CustomerVisit[];
  onStartVisit: (visit: CustomerVisit) => void;
  onViewDetails: (visit: CustomerVisit) => void;
  onReschedule: (visit: CustomerVisit) => void;
}

export const VisitTable: React.FC<VisitTableProps> = ({
  visits,
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

  const handleWhatsApp = (visit: CustomerVisit, e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneClean = (visit.customerPhone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${visit.customerName}, this is regarding your visit for Kerala Incinerator solutions. Please let us know if you need any assistance.`
    );
    window.open(`https://wa.me/${phoneClean.startsWith('91') ? phoneClean : '91' + phoneClean}?text=${text}`, '_blank');
  };

  const handleCall = (visit: CustomerVisit, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${visit.customerPhone}`;
  };

  const handleOpenMap = (visit: CustomerVisit, e: React.MouseEvent) => {
    e.stopPropagation();
    if (visit.gpsLatitude && visit.gpsLongitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${visit.gpsLatitude},${visit.gpsLongitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((visit.location || visit.customerPlace) + ', Kerala')}`,
        '_blank'
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3">Products Discussed</th>
              <th className="py-3 px-3">Field Executive</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Outcome</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.map((visit) => (
              <tr
                key={visit.id}
                onClick={() => onViewDetails(visit)}
                className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
              >
                {/* Customer */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                    {visit.customerName}
                  </div>
                  <div className="text-[11px] text-slate-500">{visit.purpose || 'Site Inspection'}</div>
                </td>

                {/* Location */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => handleOpenMap(visit, e)}
                    className="flex items-center gap-1 text-[#2563EB] hover:underline font-semibold"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{visit.location || visit.customerPlace}</span>
                  </button>
                  {visit.gpsLatitude && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      GPS Captured
                    </span>
                  )}
                </td>

                {/* Phone & quick contact */}
                <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="font-mono text-slate-700 font-medium">{visit.customerPhone}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => handleCall(visit, e)}
                      title="Call"
                      className="p-1 rounded-md bg-slate-100 hover:bg-blue-100 text-[#2563EB] transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleWhatsApp(visit, e)}
                      title="WhatsApp"
                      className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </button>
                  </div>
                </td>

                {/* Product */}
                <td className="py-3 px-3">
                  <div className="font-medium text-slate-800 line-clamp-1 max-w-[180px]">
                    {visit.productsDiscussed?.[0] || '10kg SS Incinerator'}
                  </div>
                  {visit.estimatedOrderValue ? (
                    <div className="text-[11px] font-bold text-emerald-700">
                      ₹{Number(visit.estimatedOrderValue).toLocaleString('en-IN')}
                    </div>
                  ) : null}
                </td>

                {/* Sales Executive */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="font-semibold text-slate-800">
                    {visit.assignedToName || visit.executiveName}
                  </div>
                </td>

                {/* Date & Time */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#2563EB]" />
                    {visit.visitTime || '11:00'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">{visit.visitDate}</div>
                </td>

                {/* Status */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                      visit.status
                    )}`}
                  >
                    {visit.status}
                  </span>
                </td>

                {/* Outcome */}
                <td className="py-3 px-3 whitespace-nowrap">
                  {visit.outcome ? (
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {visit.outcome}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Pending</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {visit.status === 'Scheduled' || visit.status === 'Missed' ? (
                      <button
                        onClick={() => onStartVisit(visit)}
                        className="px-2.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] shadow-2xs"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Start Visit</span>
                      </button>
                    ) : visit.status === 'In Progress' ? (
                      <button
                        onClick={() => onStartVisit(visit)}
                        className="px-2.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] animate-pulse shadow-2xs"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Continue</span>
                      </button>
                    ) : null}

                    {visit.status !== 'Completed' && (
                      <button
                        onClick={() => onReschedule(visit)}
                        title="Reschedule Visit"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onViewDetails(visit)}
                      title="View Details"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

