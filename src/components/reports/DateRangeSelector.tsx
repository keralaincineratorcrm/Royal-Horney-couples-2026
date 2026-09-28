import React, { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { DateRangeFilter } from '../../types';

interface DateRangeSelectorProps {
  currentRange: DateRangeFilter;
  customStart: string;
  customEnd: string;
  onRangeChange: (range: DateRangeFilter, customStart?: string, customEnd?: string) => void;
  activePeriodLabel: string;
  startDate: string;
  endDate: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  currentRange,
  customStart,
  customEnd,
  onRangeChange,
  activePeriodLabel,
  startDate,
  endDate,
}) => {
  const [localStart, setLocalStart] = useState(customStart || startDate);
  const [localEnd, setLocalEnd] = useState(customEnd || endDate);

  const filterOptions: { id: DateRangeFilter; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (localStart && localEnd) {
      onRangeChange('custom', localStart, localEnd);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.map((opt) => {
            const isActive = currentRange === opt.id;
            return (
              <button
                key={opt.id}
                id={`btn-date-${opt.id}`}
                onClick={() => onRangeChange(opt.id, localStart, localEnd)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Informative Date Period Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 whitespace-nowrap self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Showing data from <span className="font-bold text-slate-900">{startDate}</span> to{' '}
            <span className="font-bold text-slate-900">{endDate}</span>{' '}
            <span className="text-blue-600 font-semibold">({activePeriodLabel})</span>
          </span>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {currentRange === 'custom' && (
        <form
          onSubmit={handleApplyCustom}
          className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="custom-start-date" className="font-semibold text-slate-700">
              Start Date:
            </label>
            <input
              id="custom-start-date"
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="custom-end-date" className="font-semibold text-slate-700">
              End Date:
            </label>
            <input
              id="custom-end-date"
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            id="btn-apply-custom-dates"
            className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Dates
          </button>
        </form>
      )}
    </div>
  );
};

