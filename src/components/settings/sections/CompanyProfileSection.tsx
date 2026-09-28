import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { CompanySettings } from '../../../types';
import { DEFAULT_COMPANY_SETTINGS } from '../../../data/settingsData';

interface CompanyProfileSectionProps {
  canEdit: boolean;
}

export const CompanyProfileSection: React.FC<CompanyProfileSectionProps> = ({ canEdit }) => {
  const [settings, setSettings] = useState<CompanySettings>(() => dataStore.getCompanySettings());
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newTermInput, setNewTermInput] = useState('');

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange('logoUrl', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    const updated = [...(settings.defaultTerms || []), newTermInput.trim()];
    handleChange('defaultTerms', updated);
    setNewTermInput('');
  };

  const handleRemoveTerm = (index: number) => {
    const updated = (settings.defaultTerms || []).filter((_, i) => i !== index);
    handleChange('defaultTerms', updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    dataStore.updateCompanySettings(settings);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const handleReset = () => {
    if (!canEdit) return;
    setSettings({ ...DEFAULT_COMPANY_SETTINGS });
    dataStore.updateCompanySettings(DEFAULT_COMPANY_SETTINGS);
    setShowResetConfirm(false);
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
              <p className="font-bold text-sm">Company Settings Saved Successfully</p>
              <p className="text-xs text-emerald-700">
                All future quotation PDFs, order receipts, delivery challans, and print layouts will now use these updated details.
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

      {/* Permission Notice if Read-Only */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>You have view-only access to Company Profile. Administrative updates require Owner privileges.</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Company Identification</h3>
                <p className="text-xs text-slate-500">Legal entity details, branding, and registration</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold rounded-full">
              Centralized Store
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Company Name *
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tagline / Motto
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Industry / Category
              </label>
              <input
                type="text"
                value={settings.category}
                onChange={(e) => handleChange('category', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                GSTIN Number *
              </label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
            </div>
          </div>

          {/* Logo Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden p-1 shadow-sm">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-blue-600 font-extrabold text-xs">
                    <span>KI</span>
                    <span className="text-[9px] text-slate-400">LOGO</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Company Brand Logo</h4>
                <p className="text-xs text-slate-500">Appears on quotations, delivery receipts, and official PDFs</p>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-sm transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '')}
                    className="px-3 py-2 min-h-[44px] text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact & Communications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Contact & Online Presence</h3>
              <p className="text-xs text-slate-500">Official communication channels for clients and invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Official Helpline / Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!canEdit}
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Official WhatsApp Number *
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  disabled={!canEdit}
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Official Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!canEdit}
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  disabled={!canEdit}
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Physical Address & Locations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Addresses & Operations Hub</h3>
              <p className="text-xs text-slate-500">Commercial office and manufacturing facility in Kerala</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Corporate / Sales Office Address *
              </label>
              <textarea
                value={settings.officeAddress}
                onChange={(e) => handleChange('officeAddress', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Manufacturing Hub / Works Address *
              </label>
              <textarea
                value={settings.manufacturingHub}
                onChange={(e) => handleChange('manufacturingHub', e.target.value)}
                disabled={!canEdit}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                District
              </label>
              <input
                type="text"
                value={settings.district}
                onChange={(e) => handleChange('district', e.target.value)}
                disabled={!canEdit}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                State & PIN Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                />
                <input
                  type="text"
                  value={settings.pinCode}
                  onChange={(e) => handleChange('pinCode', e.target.value)}
                  disabled={!canEdit}
                  placeholder="PIN"
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Legal Signatory & Default Terms */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Authorized Signatory & Quotation Terms</h3>
              <p className="text-xs text-slate-500">Legal clauses rendered on quotation PDF and dispatch slips</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Authorized Signatory Title
            </label>
            <input
              type="text"
              value={settings.authorizedSignatoryLabel}
              onChange={(e) => handleChange('authorizedSignatoryLabel', e.target.value)}
              disabled={!canEdit}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
            />
          </div>

          {/* Standard Terms List */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Default Quotation & Delivery Terms
            </label>
            <div className="space-y-2 mb-3">
              {(settings.defaultTerms || []).map((term, index) => (
                <div key={index} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 font-medium">{term}</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                      title="Remove term"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  placeholder="Add a new standard term or condition..."
                  className="flex-1 px-3 py-2 min-h-[44px] bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTerm();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-4 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Document Header Preview */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
              <Eye className="w-4 h-4" />
              Live Document Header Preview
            </span>
            <span>Used across PDF Generator & Order Receipts</span>
          </div>
          <div className="p-4 bg-white rounded-xl text-slate-900 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-lg font-black tracking-tight text-slate-900">
                  <span className="text-[#2563EB]">{settings.companyName.split(' ')[0]}</span>{' '}
                  {settings.companyName.split(' ').slice(1).join(' ')}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">{settings.tagline}</p>
                <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                  <p>{settings.officeAddress}</p>
                  <p>GSTIN: <span className="font-mono font-semibold">{settings.gstin}</span> • State: {settings.state}</p>
                  <p>Helpline: {settings.phone} • Email: {settings.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded">
                  Official Document
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{settings.website}</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
              <span>Signatory: <strong>{settings.authorizedSignatoryLabel}</strong></span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Kerala Pollution Control Board Standard
              </span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        {canEdit && (
          <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Defaults
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-6 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                Save Company Changes
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Reset Company Settings?</h3>
              <p className="text-xs text-slate-600 mt-1">
                This will reset the company profile to the official Kerala Incinerator default parameters (Kalamassery & Perumbavoor works).
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
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

