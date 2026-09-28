import React, { useState } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Percent,
  Calendar,
  Hash,
  Truck,
  Shield,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { QuotationSettings } from '../../../types';
import { DEFAULT_QUOTATION_SETTINGS } from '../../../data/settingsData';

interface QuotationSettingsSectionProps {
  canEdit: boolean;
}

export const QuotationSettingsSection: React.FC<QuotationSettingsSectionProps> = ({ canEdit }) => {
  const [settings, setSettings] = useState<QuotationSettings>(() => dataStore.getQuotationSettings());
  const [showSavedToast, setShowSavedToast] = useState(false);

  const currentYear = new Date().getFullYear();
  const sampleQuotationNumber = `${settings.prefix || 'KI-QTN'}-${currentYear}-0042`;

  const handleChange = (field: keyof QuotationSettings, value: any) => {
    setSettings((prev) => {
      const updated = { ...prev, [field]: value };
      // Keep CGST and SGST in sync if defaultGstRate changed
      if (field === 'defaultGstRate') {
        const rate = Number(value) || 0;
        updated.cgstRate = rate / 2;
        updated.sgstRate = rate / 2;
      }
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    dataStore.updateQuotationSettings(settings);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const handleReset = () => {
    if (!canEdit) return;
    setSettings({ ...DEFAULT_QUOTATION_SETTINGS });
    dataStore.updateQuotationSettings(DEFAULT_QUOTATION_SETTINGS);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showSavedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Quotation Settings Updated Successfully</p>
              <p className="text-xs text-emerald-700">
                All newly created quotations will adopt this prefix, GST structure, and default terms.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSavedToast(false)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Invariant Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <div className="font-bold">Future Transactions Invariant</div>
            <p className="text-blue-800 leading-relaxed">
              Updates made here will take effect on <strong>FUTURE</strong> quotations only.
              Past and existing quotations remain permanently locked with their original quotation numbers, GST calculations, and terms.
            </p>
          </div>
        </div>

        {/* Numbering & Series */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Quotation Numbering & Series</h3>
              <p className="text-xs text-slate-500">Auto-generated quotation sequence format for Kerala Incinerator</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Quotation Prefix *
              </label>
              <input
                type="text"
                value={settings.prefix}
                onChange={(e) => handleChange('prefix', e.target.value)}
                disabled={!canEdit}
                placeholder="KI-QTN"
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: KI-QTN</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Sequence Format Pattern
              </label>
              <input
                type="text"
                value={settings.numberFormat || 'KI-QTN-YYYY-XXXX'}
                disabled
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Annual reset with 4-digit zero-padded index</span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">
                Live Next Quotation Preview
              </div>
              <div className="text-lg font-mono font-black text-white mt-0.5 tracking-wider">
                {sampleQuotationNumber}
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-blue-600 text-white font-bold rounded-lg self-start sm:self-auto">
              Auto Sequential
            </span>
          </div>
        </div>

        {/* GST & Taxation Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Taxation & Validity Defaults</h3>
              <p className="text-xs text-slate-500">Statutory Kerala GST components and validity window</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Total GST Rate (%) *
              </label>
              <input
                type="number"
                value={settings.defaultGstRate}
                onChange={(e) => handleChange('defaultGstRate', Number(e.target.value))}
                disabled={!canEdit}
                min={0}
                max={28}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Standard: 18%</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                CGST Split (%)
              </label>
              <input
                type="number"
                value={settings.cgstRate ?? settings.defaultGstRate / 2}
                disabled
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Central Goods & Service Tax (50%)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                SGST Split (%)
              </label>
              <input
                type="number"
                value={settings.sgstRate ?? settings.defaultGstRate / 2}
                disabled
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">State Goods & Service Tax (Kerala 50%)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Default Quotation Validity (Days)
            </label>
            <input
              type="number"
              value={settings.defaultValidityDays}
              onChange={(e) => handleChange('defaultValidityDays', Number(e.target.value))}
              disabled={!canEdit}
              min={1}
              max={180}
              className="w-full sm:w-1/3 px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Proposals are valid for this duration from issuance
            </span>
          </div>
        </div>

        {/* Standard Terms & Conditions Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Default Quotation Clauses & Terms</h3>
              <p className="text-xs text-slate-500">Auto-filled in new quotation drafts for fast processing</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Payment Terms
              </label>
              <textarea
                value={settings.defaultPaymentTerms}
                onChange={(e) => handleChange('defaultPaymentTerms', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Delivery Terms
              </label>
              <textarea
                value={settings.defaultDeliveryTerms}
                onChange={(e) => handleChange('defaultDeliveryTerms', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Warranty Terms
              </label>
              <textarea
                value={settings.defaultWarrantyTerms}
                onChange={(e) => handleChange('defaultWarrantyTerms', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Quotation Remarks & Inclusions
              </label>
              <textarea
                value={settings.defaultRemarks}
                onChange={(e) => handleChange('defaultRemarks', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {canEdit && (
          <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Quotation Defaults
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Quotation Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
