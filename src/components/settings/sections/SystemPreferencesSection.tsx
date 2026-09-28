import React, { useState } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Bell,
  Smartphone,
  Calendar,
  IndianRupee,
  Clock,
  Database,
  Download,
  AlertTriangle,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { SystemPreferences } from '../../../types';
import { DEFAULT_SYSTEM_PREFERENCES } from '../../../data/settingsData';

interface SystemPreferencesSectionProps {
  canEdit: boolean;
}

export const SystemPreferencesSection: React.FC<SystemPreferencesSectionProps> = ({ canEdit }) => {
  const [prefs, setPrefs] = useState<SystemPreferences>(() => dataStore.getSystemPreferences());
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Backup & DB test states
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [exportMessage, setExportMessage] = useState('');

  const handleChange = (field: keyof SystemPreferences, value: any) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof SystemPreferences) => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    dataStore.updateSystemPreferences(prefs);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const handleReset = () => {
    if (!canEdit) return;
    setPrefs({ ...DEFAULT_SYSTEM_PREFERENCES });
    dataStore.updateSystemPreferences(DEFAULT_SYSTEM_PREFERENCES);
    setShowResetConfirm(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const handleTestDatabase = async () => {
    setDbStatus('testing');
    try {
      await dataStore.testSupabaseConnection();
      setDbStatus('success');
      setTimeout(() => setDbStatus('idle'), 3000);
    } catch {
      setDbStatus('idle');
    }
  };

  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      companySettings: dataStore.getCompanySettings(),
      quotationSettings: dataStore.getQuotationSettings(),
      orderSettings: dataStore.getOrderSettings(),
      systemPreferences: dataStore.getSystemPreferences(),
      leadSources: dataStore.getLeadSources(),
      workflowStatuses: dataStore.getWorkflowStatuses(),
      customers: dataStore.getAllCustomersUnfiltered(),
      orders: dataStore.getOrders(),
      followUps: dataStore.getFollowUps(),
      products: dataStore.getProducts(),
      users: dataStore.getUsers(),
      auditLogsCount: dataStore.getAuditLogs().length,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kerala_incinerator_crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMessage('CRM data exported successfully!');
    setTimeout(() => setExportMessage(''), 3500);
  };

  const handleResetDemo = () => {
    if (confirm('Are you sure you want to reset all CRM demo data to initial Kerala Incinerator factory state?')) {
      dataStore.resetDemoData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showSavedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">System Preferences Updated</p>
              <p className="text-xs text-emerald-700">
                Regional formatting, follow-up timers, and notification triggers have been applied.
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

      {exportMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          {exportMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Regional & Localization Defaults (Indian Standard) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Localization & Indian Regional Standards</h3>
              <p className="text-xs text-slate-500">Currency symbols, Indian date conventions, and IST timezone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                System Currency
              </label>
              <input
                type="text"
                value="₹ INR (Indian Rupee)"
                disabled
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Indian numbering (Lakhs & Crores)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Timezone
              </label>
              <input
                type="text"
                value="Asia/Kolkata (IST +05:30)"
                disabled
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Indian Standard Time</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Date Display Format
              </label>
              <select
                value={prefs.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. 23/09/2026</span>
            </div>
          </div>
        </div>

        {/* Operational Timers & Reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Follow-Up & Operating Reminders</h3>
              <p className="text-xs text-slate-500">Thresholds to ensure field leads never turn cold in Kerala</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Daily Follow-Up Reminder Alert Time (IST)
              </label>
              <input
                type="time"
                value={prefs.followUpReminderTime || '09:00'}
                onChange={(e) => handleChange('followUpReminderTime', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Morning trigger to review scheduled customer calls
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Default Proposal Validity Window (Days)
              </label>
              <input
                type="number"
                value={prefs.defaultQuotationValidityDays || 30}
                onChange={(e) => handleChange('defaultQuotationValidityDays', Number(e.target.value))}
                disabled={!canEdit}
                min={1}
                max={180}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard proposal validity before price review
              </span>
            </div>
          </div>
        </div>

        {/* Notifications & Field Mobility */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Field Mobility & Communications</h3>
              <p className="text-xs text-slate-500">Alert triggers and field check-in capabilities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => canEdit && handleToggle('enableWhatsAppAlerts')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                prefs.enableWhatsAppAlerts
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="font-bold text-xs text-slate-900">WhatsApp One-Click Dispatch</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Pre-fill Kerala Incinerator quotations and customer chats directly in WhatsApp
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.enableWhatsAppAlerts}
                onChange={() => {}}
                disabled={!canEdit}
                className="w-5 h-5 text-emerald-600 rounded"
              />
            </div>

            <div
              onClick={() => canEdit && handleToggle('enableGpsVerification')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                prefs.enableGpsVerification
                  ? 'bg-blue-50/50 border-blue-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="font-bold text-xs text-slate-900">GPS Site Verification & Geostamping</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Require GPS coordinate capture when field executives check in at incinerator sites
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.enableGpsVerification}
                onChange={() => {}}
                disabled={!canEdit}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Database, Backup & Recovery Tools */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Database Connection & Data Backup</h3>
              <p className="text-xs text-slate-500">Supabase state verification and JSON data export</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Test Supabase */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  Supabase Verification
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Verifies real-time sync with Supabase PostgreSQL cloud backend.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={dbStatus === 'testing'}
                className="px-3 py-2 min-h-[44px] bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {dbStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    Connecting...
                  </>
                ) : dbStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Connected Healthy
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 text-slate-500" />
                    Test Connection
                  </>
                )}
              </button>
            </div>

            {/* Export Backup */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Full Data Backup
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Export complete JSON snapshot of all settings, leads, quotations, and orders.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-2 min-h-[44px] bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Download Backup (.json)
              </button>
            </div>

            {/* Reset Demo Data */}
            {canEdit && (
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Reset Demo State
                  </div>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Clears local modifications and reloads the default factory dataset.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="px-3 py-2 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Demo State
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {canEdit && (
          <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Preferences
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        )}
      </form>

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Reset Preferences to Defaults?</h3>
              <p className="text-xs text-slate-600 mt-2">
                This will restore default regional timers, Indian date formats, and notification parameters.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
