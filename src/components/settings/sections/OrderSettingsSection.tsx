import React, { useState } from 'react';
import {
  ShoppingBag,
  Save,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Hash,
  Truck,
  CreditCard,
  ShieldAlert,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { OrderSettings } from '../../../types';
import {
  DEFAULT_ORDER_SETTINGS,
  PAYMENT_STATUS_OPTIONS,
  DELIVERY_STATUS_OPTIONS,
} from '../../../data/settingsData';

interface OrderSettingsSectionProps {
  canEdit: boolean;
}

export const OrderSettingsSection: React.FC<OrderSettingsSectionProps> = ({ canEdit }) => {
  const [settings, setSettings] = useState<OrderSettings>(() => dataStore.getOrderSettings());
  const [showSavedToast, setShowSavedToast] = useState(false);

  const currentYear = new Date().getFullYear();
  const sampleOrderNumber = `${settings.prefix || 'KI-ORD'}-${currentYear}-0018`;

  const handleChange = (field: keyof OrderSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    dataStore.updateOrderSettings(settings);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const handleReset = () => {
    if (!canEdit) return;
    setSettings({ ...DEFAULT_ORDER_SETTINGS });
    dataStore.updateOrderSettings(DEFAULT_ORDER_SETTINGS);
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
              <p className="font-bold text-sm">Order Settings Saved Successfully</p>
              <p className="text-xs text-emerald-700">
                Future bookings and delivery challans will adhere to these configuration parameters.
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Invariant Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 space-y-1">
            <div className="font-bold">Historical Order Audit Protection</div>
            <p className="text-emerald-800 leading-relaxed">
              Order numbering formats and terms apply strictly to <strong>NEW bookings</strong>.
              All existing orders, payment receipts, installation logs, and accounts receivables remain untouched.
            </p>
          </div>
        </div>

        {/* Numbering & Sequence */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Order Numbering & Booking Codes</h3>
              <p className="text-xs text-slate-500">Official sales order and delivery challan identifiers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Order Prefix *
              </label>
              <input
                type="text"
                value={settings.prefix}
                onChange={(e) => handleChange('prefix', e.target.value)}
                disabled={!canEdit}
                placeholder="KI-ORD"
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Standard prefix: KI-ORD</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Number Pattern
              </label>
              <input
                type="text"
                value={settings.numberFormat || 'KI-ORD-YYYY-XXXX'}
                disabled
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Format: KI-ORD-[YEAR]-[INDEX]</span>
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">
                Next Order ID Preview
              </div>
              <div className="text-lg font-mono font-black text-white mt-0.5 tracking-wider">
                {sampleOrderNumber}
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg self-start sm:self-auto">
              Auto Sequential
            </span>
          </div>
        </div>

        {/* Standard Terms Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Default Commercial Clauses</h3>
              <p className="text-xs text-slate-500">Auto-populated on order confirmation and dispatch paperwork</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Payment Conditions
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
                Default Dispatch & Transportation Terms
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
                Default Installation Protocol
              </label>
              <select
                value={settings.defaultInstallationBehavior || 'mandatory'}
                onChange={(e) => handleChange('defaultInstallationBehavior', e.target.value as any)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              >
                <option value="mandatory">Mandatory (Company Technician On-Site Handover)</option>
                <option value="optional_requested">Optional (Upon Customer Request)</option>
                <option value="not_required">Self-Installation by Client (Factory Pre-Assembled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Order & Dispatch Remarks
              </label>
              <textarea
                value={settings.defaultOrderRemarks}
                onChange={(e) => handleChange('defaultOrderRemarks', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>
          </div>
        </div>

        {/* Status Definitions & Lifecycles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Payment Statuses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Payment Status Stages</h4>
                <p className="text-[11px] text-slate-500">Enforced financial ledger lifecycle</p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {PAYMENT_STATUS_OPTIONS.map((st) => (
                <div
                  key={st.value}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800">{st.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">System Standard</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Statuses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Manufacturing & Delivery Stages</h4>
                <p className="text-[11px] text-slate-500">Fabrication to site handover pipeline</p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1 max-h-64 overflow-y-auto pr-1">
              {DELIVERY_STATUS_OPTIONS.map((st, idx) => (
                <div
                  key={st.value}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{st.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Verified Step</span>
                </div>
              ))}
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
              Reset Order Defaults
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Order Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
