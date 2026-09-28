import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { FollowUp } from '../../types';
import { dataStore } from '../../lib/supabase';

interface RescheduleModalProps {
  followUp: FollowUp | null;
  onClose: () => void;
  onRescheduled?: () => void;
}

const COMMON_REASONS = [
  'Customer Busy / Asked to call back',
  'Customer Travelling / Out of station',
  'Requested Weekend Call',
  'Decision Maker Unavailable',
  'Awaiting Price Approval',
  'Site Inspection Postponed',
  'Other',
];

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  followUp,
  onClose,
  onRescheduled,
}) => {
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState(followUp?.followUpTime || '11:00');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!followUp) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newDate) {
      setErrorMsg('Please select a new follow-up date.');
      return;
    }

    const finalReason = reason === 'Other' ? (customReason.trim() || 'Rescheduled') : reason;

    dataStore.rescheduleFollowUp(
      followUp.id,
      newDate,
      newTime,
      finalReason,
      remarks.trim()
    );

    if (onRescheduled) onRescheduled();
    onClose();
  };

  return (
    <div
      id="reschedule-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="reschedule-modal-content"
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
                Reschedule Follow-up
              </h3>
              <p className="text-xs text-slate-500">
                Move follow-up to a new date and keep full audit trail.
              </p>
            </div>
          </div>
          <button
            id="close-reschedule-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status summary */}
        <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>{followUp.customerName}</span>
            <span className="text-slate-500">{followUp.customerPlace}</span>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center gap-2">
            <span>Currently scheduled:</span>
            <span className="font-semibold text-rose-600">
              {followUp.followUpDate} at {followUp.followUpTime}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* New Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                New Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="reschedule-new-date"
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                New Time <span className="text-rose-500">*</span>
              </label>
              <input
                id="reschedule-new-time"
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Reason selection */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Reason for Rescheduling <span className="text-rose-500">*</span>
            </label>
            <select
              id="reschedule-reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specify Reason</label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Additional Notes</label>
            <textarea
              id="reschedule-remarks-input"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Call customer at 3:00 PM once site engineer reaches property."
              className="w-full p-2.5 rounded-xl border border-slate-300 font-normal focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-reschedule-btn"
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

