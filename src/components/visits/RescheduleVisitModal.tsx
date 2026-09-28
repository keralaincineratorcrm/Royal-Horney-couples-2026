import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  RotateCcw,
  AlertTriangle,
  User,
  MapPin,
} from 'lucide-react';
import { CustomerVisit } from '../../types';
import { dataStore } from '../../lib/supabase';

interface RescheduleVisitModalProps {
  visit: CustomerVisit;
  onClose: () => void;
  onSuccess: (newVisitId?: string) => void;
}

const RESCHEDULE_REASONS = [
  'Customer Unavailable / Postponed',
  'Heavy Rain / Flood Alert in Kerala',
  'NH Highway / Traffic Delay',
  'Customer Emergency',
  'Executive Illness / Unavailable',
  'Site Not Ready / Construction Pending',
  'Requested Additional Information First',
  'Other',
];

export const RescheduleVisitModal: React.FC<RescheduleVisitModalProps> = ({
  visit,
  onClose,
  onSuccess,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [newDate, setNewDate] = useState(tomorrowStr);
  const [newTime, setNewTime] = useState(visit.visitTime || '11:00');
  const [reason, setReason] = useState(RESCHEDULE_REASONS[0]);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setError('Please select a new visit date.');
      return;
    }

    try {
      const newVisit = dataStore.rescheduleVisit(
        visit.id,
        newDate,
        newTime,
        reason,
        remarks
      );
      onSuccess(newVisit?.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to reschedule visit.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              Reschedule Visit
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Set new date & time. The current visit record will be preserved as Rescheduled.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Visit Summary Card */}
        <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">
              Current Visit Record
            </span>
            <div className="font-black text-slate-900 text-sm truncate">
              {visit.customerName}
            </div>
            <div className="text-slate-600 text-xs flex flex-wrap items-center gap-2 mt-0.5">
              <span>{visit.location || visit.customerPlace}</span>
              <span>•</span>
              <span className="font-semibold text-slate-800">
                {visit.visitDate} at {visit.visitTime}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                New Visit Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                New Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              Reason for Rescheduling <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RESCHEDULE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              Remarks & Follow-up Details
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Customer requested morning appointment after 11:30 AM due to board meeting."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirm Reschedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
