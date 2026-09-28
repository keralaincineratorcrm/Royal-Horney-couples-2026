import React, { useState } from 'react';
import {
  GitBranch,
  ArrowDown,
  ShieldAlert,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  Check,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { WorkflowStatusItem } from '../../../types';

interface WorkflowSettingsSectionProps {
  canEdit: boolean;
}

export const WorkflowSettingsSection: React.FC<WorkflowSettingsSectionProps> = ({ canEdit }) => {
  const [selectedCategory, setSelectedCategory] = useState<'lead' | 'quotation' | 'order' | 'delivery'>('lead');
  const [statuses, setStatuses] = useState<WorkflowStatusItem[]>(() => dataStore.getWorkflowStatuses());
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const leads = dataStore.getAllCustomersUnfiltered();
  const quotations = dataStore.getQuotations();
  const orders = dataStore.getOrders();

  const getStageVolume = (status: WorkflowStatusItem) => {
    if (status.category === 'lead') {
      return leads.filter((l) => l.leadStatus === status.name).length;
    }
    if (status.category === 'quotation') {
      return quotations.filter((q) => q.status === status.name).length;
    }
    if (status.category === 'order' || status.category === 'delivery') {
      return orders.filter(
        (o) => o.deliveryStatus === status.name || (o as any).orderStatus === status.name
      ).length;
    }
    return 0;
  };

  const handleNameChange = (id: string, newName: string) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleToggleActive = (id: string) => {
    if (!canEdit) return;
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setShowWarningModal(true);
  };

  const handleConfirmSave = () => {
    dataStore.updateWorkflowStatuses(statuses);
    setShowWarningModal(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const currentCategoryStatuses = statuses
    .filter((s) => s.category === selectedCategory)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showSavedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Workflow Pipeline Updated</p>
              <p className="text-xs text-emerald-700">
                Display labels and active gates updated across CRM boards. Historical records remain preserved.
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

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">CRM Sales & Fulfillment Pipeline</h3>
          <p className="text-xs text-slate-500">
            Lifecycle stages governing customer progression from initial enquiry to incinerator commissioning.
          </p>
        </div>

        {/* Visual 8-Stage Sequential Diagram */}
        <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3">
          <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            Kerala Incinerator Standard Sales Workflow
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {['Lead', 'Contacted', 'Interested', 'Quotation', 'Follow-up', 'Ordered', 'Delivered', 'Completed'].map(
              (step, idx, arr) => (
                <React.Fragment key={step}>
                  <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-slate-200">
                    {step}
                  </span>
                  {idx < arr.length - 1 && (
                    <span className="text-cyan-400 font-bold">→</span>
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>

        {/* Pipeline Integrity Callout */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Workflow Integrity Protection:</span>
            <p className="text-amber-800">
              Internal system keys are locked to prevent breaking historical records. You can customize stage names, colors, and activate/deactivate optional pipeline steps.
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(
          [
            { id: 'lead', label: 'Lead Progression' },
            { id: 'quotation', label: 'Quotation Stages' },
            { id: 'order', label: 'Order Processing' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              selectedCategory === tab.id
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sequential Stages List */}
      <form onSubmit={handleSaveAttempt} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {selectedCategory.toUpperCase()} Pipeline Stages
          </h4>

          <div className="space-y-3">
            {currentCategoryStatuses.map((status, index) => {
              const volume = getStageVolume(status);
              const isLast = index === currentCategoryStatuses.length - 1;

              return (
                <div key={status.id} className="space-y-2">
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      status.active
                        ? 'bg-slate-50 hover:bg-white border-slate-200'
                        : 'bg-slate-100/50 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Stage Info */}
                    <div className="flex items-center gap-3.5 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: status.color || '#2563EB' }}
                      >
                        {status.order}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {canEdit ? (
                            <input
                              type="text"
                              value={status.name}
                              onChange={(e) => handleNameChange(status.id, e.target.value)}
                              className="font-bold text-xs text-slate-900 bg-white px-2.5 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
                            />
                          ) : (
                            <span className="font-bold text-xs text-slate-900">{status.name}</span>
                          )}

                          {status.isSystem && (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Core
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stage Metrics & Actions */}
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <span className="text-xs font-bold text-slate-700 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        {volume} records
                      </span>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(status.id)}
                          className={`px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl transition-colors ${
                            status.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {status.active ? 'Active' : 'Disabled'}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex justify-center text-slate-300 py-0.5">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        {canEdit && (
          <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Verify adjustments before saving to ensure continuous workflow operations.
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Workflow Changes
            </button>
          </div>
        )}
      </form>

      {/* Confirmation Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Apply Workflow Stage Adjustments?</h3>
              <p className="text-xs text-slate-600 mt-2">
                This updates stage display titles and active gates across Kerala Incinerator dashboards. All current customer records and audit trails remain preserved.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
