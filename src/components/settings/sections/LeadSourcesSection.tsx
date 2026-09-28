import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Edit2,
  Power,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  MessageSquare,
  Phone,
  Users,
  Building,
  Radio,
  Tag,
  X,
  ShieldCheck,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { LeadSourceItem } from '../../../types';

interface LeadSourcesSectionProps {
  canEdit: boolean;
}

export const LeadSourcesSection: React.FC<LeadSourcesSectionProps> = ({ canEdit }) => {
  const [sources, setSources] = useState<LeadSourceItem[]>(() => dataStore.getLeadSources());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<LeadSourceItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });

  const refreshSources = () => {
    setSources(dataStore.getLeadSources());
  };

  const getSourceLeadCount = (sourceName: string) => {
    const customers = dataStore.getAllCustomersUnfiltered();
    return customers.filter(
      (c) => c.leadSource?.toLowerCase() === sourceName.toLowerCase()
    ).length;
  };

  const getSourceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('web') || n.includes('google')) return <Globe className="w-4 h-4 text-blue-600" />;
    if (n.includes('what')) return <MessageSquare className="w-4 h-4 text-emerald-600" />;
    if (n.includes('phone') || n.includes('call')) return <Phone className="w-4 h-4 text-cyan-600" />;
    if (n.includes('walk') || n.includes('visit')) return <Building className="w-4 h-4 text-amber-600" />;
    if (n.includes('refer') || n.includes('word')) return <Users className="w-4 h-4 text-purple-600" />;
    return <Radio className="w-4 h-4 text-slate-600" />;
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', description: '', active: true });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (src: LeadSourceItem) => {
    setSelectedSource(src);
    setFormData({
      name: src.name,
      description: src.description || '',
      active: src.active,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    dataStore.addLeadSource({
      name: formData.name.trim(),
      description: formData.description.trim(),
      active: formData.active,
      displayOrder: sources.length + 1,
      isSystem: false,
    });
    refreshSources();
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !canEdit) return;
    dataStore.updateLeadSource(selectedSource.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      active: formData.active,
    });
    refreshSources();
    setIsEditModalOpen(false);
  };

  const handleToggleActive = (src: LeadSourceItem) => {
    if (!canEdit) return;
    dataStore.toggleLeadSourceActive(src.id, !src.active);
    refreshSources();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lead Acquisition Channels</h3>
            <p className="text-xs text-slate-500">
              Configure attribution channels for incoming leads across Kerala.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Lead Channel
            </button>
          )}
        </div>

        {/* Invariant guarantee banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Historical Integrity Guaranteed:</strong> Deactivating a channel removes it from new lead entry dropdowns, but preserves all historical lead records and conversion analytics associated with it.
          </span>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sources.map((src) => {
          const count = getSourceLeadCount(src.name);

          return (
            <div
              key={src.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                src.active
                  ? 'border-slate-200 hover:border-blue-300'
                  : 'border-slate-200/60 bg-slate-50/50 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      {getSourceIcon(src.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{src.name}</h4>
                      {src.isSystem && (
                        <span className="text-[10px] text-slate-400 font-semibold">Core Channel</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      src.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {src.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3 min-h-[32px]">
                  {src.description || 'Channel attribution for Kerala customer enquiries.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                    {count} leads logged
                  </span>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(src)}
                      className="p-1.5 min-h-[36px] min-w-[36px] text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Channel"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(src)}
                      className={`p-1.5 min-h-[36px] min-w-[36px] rounded-lg transition-colors ${
                        src.active
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={src.active ? 'Deactivate Channel' : 'Activate Channel'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CHANNEL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAdd}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Lead Channel</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kerala Trade Expo"
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description / Campaign Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Notes about attribution..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                Save Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CHANNEL MODAL */}
      {isEditModalOpen && selectedSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Lead Channel</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                Update Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
