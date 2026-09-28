import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, Phone, MessageCircle, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { FollowUp, ContactType } from '../../types';
import { dataStore } from '../../lib/supabase';

interface CompleteFollowUpModalProps {
  followUp: FollowUp | null;
  onClose: () => void;
  onCompleted?: () => void;
}

const RESPONSE_OPTIONS = [
  { value: 'Interested', label: 'Interested', color: 'emerald' },
  { value: 'Need More Information', label: 'Need More Information', color: 'blue' },
  { value: 'Quotation Required', label: 'Quotation Required', color: 'indigo' },
  { value: 'Order Confirmed', label: 'Order Confirmed', color: 'green' },
  { value: 'Call Later', label: 'Call Later', color: 'amber' },
  { value: 'Not Interested', label: 'Not Interested', color: 'rose' },
  { value: 'No Response', label: 'No Response', color: 'slate' },
  { value: 'Other', label: 'Other', color: 'slate' },
];

export const CompleteFollowUpModal: React.FC<CompleteFollowUpModalProps> = ({
  followUp,
  onClose,
  onCompleted,
}) => {
  const [customerResponse, setCustomerResponse] = useState('Interested');
  const [outcomeRemarks, setOutcomeRemarks] = useState('');
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [nextTime, setNextTime] = useState('11:00');
  const [nextContactType, setNextContactType] = useState<ContactType>('Call');
  const [nextRemarks, setNextRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!followUp) return null;

  const handleCompleteSubmit = (shouldScheduleNext: boolean) => {
    setErrorMsg('');

    if (shouldScheduleNext && !nextDate) {
      setErrorMsg('Please select a date for the next follow-up.');
      return;
    }

    dataStore.completeFollowUp(
      followUp.id,
      customerResponse,
      outcomeRemarks.trim(),
      shouldScheduleNext && nextDate
        ? {
            date: nextDate,
            time: nextTime,
            contactType: nextContactType,
            remarks: nextRemarks.trim() || `Next follow-up following: ${customerResponse}`,
          }
        : undefined
    );

    if (onCompleted) onCompleted();
    onClose();
  };

  return (
    <div
      id="complete-followup-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="complete-followup-modal-content"
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
                Complete Follow-up
              </h3>
              <p className="text-xs text-slate-500">
                Record customer response and maintain full activity audit log.
              </p>
            </div>
          </div>
          <button
            id="close-complete-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Follow-up Details Summary Box */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-slate-900">{followUp.customerName}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-[#2563EB] rounded-md">
              {followUp.productName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {followUp.customerPlace}
            </span>
            <span className="font-mono text-slate-700">{followUp.customerPhone}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Due: {followUp.followUpDate} at {followUp.followUpTime}
            </span>
            <span className="text-slate-500">Via {followUp.contactType}</span>
          </div>
          {followUp.remarks && (
            <div className="text-[11px] text-slate-500 italic mt-1 pt-1 border-t border-slate-200/60">
              Planned note: "{followUp.remarks}"
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4 text-xs">
          {/* Customer Response Options */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Customer Response <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RESPONSE_OPTIONS.map((opt) => {
                const isSelected = customerResponse === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCustomerResponse(opt.value)}
                    className={`p-2 rounded-xl border text-center font-bold transition-all text-xs ${
                      isSelected
                        ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback & Remarks */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Feedback Remarks / Outcome Notes
            </label>
            <textarea
              id="complete-outcome-remarks"
              rows={3}
              value={outcomeRemarks}
              onChange={(e) => setOutcomeRemarks(e.target.value)}
              placeholder="e.g. Customer requested formal GST quotation for 10kg MS incinerator with freight charges to Aimury."
              className="w-full p-2.5 rounded-xl border border-slate-300 font-normal focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Next Follow-up Toggle */}
          <div className="p-3.5 bg-sky-50/50 border border-sky-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Schedule Next Follow-up?</span>
                <span className="text-[11px] text-slate-500">
                  Creates a linked new follow-up while preserving this record in history.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleNext}
                  onChange={(e) => setScheduleNext(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>

            {scheduleNext && (
              <div className="pt-2 border-t border-sky-100 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Next Date *</label>
                    <input
                      type="date"
                      required
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Contact Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Call', 'WhatsApp', 'Visit'] as ContactType[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNextContactType(mode)}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition-all ${
                          nextContactType === mode
                            ? 'bg-blue-100 border-[#2563EB] text-[#2563EB]'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Follow-up Goal</label>
                  <input
                    type="text"
                    value={nextRemarks}
                    onChange={(e) => setNextRemarks(e.target.value)}
                    placeholder="e.g. Check if quotation PDF was reviewed."
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>

            {!scheduleNext ? (
              <button
                id="complete-only-btn"
                type="button"
                onClick={() => handleCompleteSubmit(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Only</span>
              </button>
            ) : (
              <button
                id="complete-and-schedule-next-btn"
                type="button"
                onClick={() => handleCompleteSubmit(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Complete & Schedule Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

