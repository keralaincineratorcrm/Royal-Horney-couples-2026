import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Calendar,
  FileText,
  ShoppingCart,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Flame,
  Plus,
  Download,
  AlertCircle,
  Check,
  Edit2,
  CalendarClock,
  Send,
  Eye,
  Shield,
} from 'lucide-react';
import {
  CustomerLead,
  LeadStatus,
  FollowUp,
  CustomerVisit,
  Quotation,
  Order,
  CustomerActivity,
} from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getLeadStatusBadgeClass } from './CustomerList';
import { generateQuotationPdf, shareQuotationOnWhatsApp } from '../../lib/pdfGenerator';

interface CustomerDetailModalProps {
  customer: CustomerLead | null;
  onClose: () => void;
  onAddFollowUp: (customer: CustomerLead) => void;
  onStartVisit: (customer: CustomerLead) => void;
  onCreateQuotation: (customer: CustomerLead) => void;
  onCreateOrder?: (customer: CustomerLead) => void;
}

export const PIPELINE_STAGES: { stage: LeadStatus; label: string }[] = [
  { stage: 'New Lead', label: 'Lead' },
  { stage: 'Contacted', label: 'Contacted' },
  { stage: 'Interested', label: 'Interested' },
  { stage: 'Quotation Sent', label: 'Quotation' },
  { stage: 'Follow-up', label: 'Follow-up' },
  { stage: 'Ordered', label: 'Ordered' },
  { stage: 'Delivered', label: 'Delivered' },
  { stage: 'Completed', label: 'Completed' },
];

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer: initialCustomer,
  onClose,
  onAddFollowUp,
  onStartVisit,
  onCreateQuotation,
  onCreateOrder,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'timeline' | 'info' | 'followups' | 'visits' | 'quotations' | 'orders'
  >('timeline');

  // Active customer state synced with dataStore
  const [customer, setCustomer] = useState<CustomerLead | null>(initialCustomer);

  // Sub-modal states for Follow-ups
  const [completeModalFu, setCompleteModalFu] = useState<FollowUp | null>(null);
  const [customerResponse, setCustomerResponse] = useState('');
  const [nextFuDateAfterComplete, setNextFuDateAfterComplete] = useState('');

  const [rescheduleModalFu, setRescheduleModalFu] = useState<FollowUp | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00');
  const [rescheduleRemarks, setRescheduleRemarks] = useState('');

  const [editModalFu, setEditModalFu] = useState<FollowUp | null>(null);
  const [editContactType, setEditContactType] = useState<'Call' | 'WhatsApp' | 'Visit'>('Call');
  const [editTime, setEditTime] = useState('11:00');
  const [editRemarks, setEditRemarks] = useState('');

  // Quotation viewing detail modal
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);

  // Sync with dataStore changes
  useEffect(() => {
    if (!initialCustomer) {
      setCustomer(null);
      return;
    }

    const loadLatest = () => {
      const latest = dataStore.getCustomerById(initialCustomer.id);
      setCustomer(latest || initialCustomer);
    };

    loadLatest();
    const unsub = dataStore.subscribe(loadLatest);
    return unsub;
  }, [initialCustomer]);

  if (!customer) return null;

  const activities = dataStore.getActivities(customer.id);
  const followUps = dataStore.getFollowUps('owner').filter((f) => f.customerId === customer.id);
  const visits = dataStore.getVisits('owner').filter((v) => v.customerId === customer.id);
  const quotations = dataStore.getQuotations('owner').filter((q) => q.customerId === customer.id);
  const orders = dataStore.getOrders('owner').filter((o) => o.customerId === customer.id);

  const todayStr = new Date().toISOString().split('T')[0];

  // Grouped followups
  const overdueFollowUps = followUps.filter(
    (f) => f.status === 'Pending' && f.followUpDate < todayStr
  );
  const upcomingFollowUps = followUps.filter(
    (f) => f.status === 'Pending' && f.followUpDate >= todayStr
  );
  const completedFollowUps = followUps.filter((f) => f.status === 'Completed');

  // Can the user modify stages or reassign?
  const canManage =
    isOwner || isSenior || customer.assignedToId === currentUser.id;

  // Handle Pipeline Stage Change
  const handleStageChange = (newStage: LeadStatus) => {
    if (!canManage) {
      alert('You do not have permission to change this customer record.');
      return;
    }
    dataStore.updateCustomer(customer.id, { leadStatus: newStage });
  };

  // Reassignment
  const handleReassign = (newAssigneeId: string) => {
    if (!isOwner && !isSenior) return;
    const targetUser = users.find((u) => u.id === newAssigneeId);
    if (targetUser) {
      dataStore.updateCustomer(customer.id, {
        assignedToId: targetUser.id,
        assignedToName: targetUser.name,
      });
    }
  };

  // Quick Action Handlers
  const handleCall = () => {
    window.location.href = `tel:${customer.phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${customer.customerName}, Greetings from Kerala Incinerator! Regarding your enquiry for ${customer.productInterestedName}, we are pleased to assist you with specifications and installation.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleOpenMap = (placeName?: string) => {
    const loc = placeName || customer.place;
    const query = encodeURIComponent(`${loc}, Kerala, India`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Follow-up Actions
  const handleOpenCompleteFu = (fu: FollowUp) => {
    setCompleteModalFu(fu);
    setCustomerResponse('');
    setNextFuDateAfterComplete('');
  };

  const handleSaveCompleteFu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalFu) return;
    dataStore.completeFollowUp(
      completeModalFu.id,
      customerResponse,
      nextFuDateAfterComplete || undefined
    );
    setCompleteModalFu(null);
  };

  const handleOpenRescheduleFu = (fu: FollowUp) => {
    setRescheduleModalFu(fu);
    setRescheduleDate(fu.followUpDate);
    setRescheduleTime(fu.followUpTime || '11:00');
    setRescheduleRemarks('');
  };

  const handleSaveRescheduleFu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalFu || !rescheduleDate) return;
    dataStore.rescheduleFollowUp(
      rescheduleModalFu.id,
      rescheduleDate,
      rescheduleTime,
      rescheduleRemarks
    );
    setRescheduleModalFu(null);
  };

  const handleOpenEditFu = (fu: FollowUp) => {
    setEditModalFu(fu);
    setEditContactType(fu.contactType);
    setEditTime(fu.followUpTime || '11:00');
    setEditRemarks(fu.remarks);
  };

  const handleSaveEditFu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalFu) return;
    dataStore.updateFollowUp(editModalFu.id, {
      contactType: editContactType,
      followUpTime: editTime,
      remarks: editRemarks,
    });
    setEditModalFu(null);
  };

  // Check stage index for pipeline
  const currentPipelineIdx = PIPELINE_STAGES.findIndex(
    (s) => s.stage === customer.leadStatus
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* 7. CUSTOMER PROFILE HEADER */}
        <div className="bg-[#0F172A] text-white p-5 md:p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight truncate">
                  {customer.customerName}
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getLeadStatusBadgeClass(
                    customer.leadStatus
                  )}`}
                >
                  {customer.leadStatus}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    customer.orderChance === 'High'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : customer.orderChance === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {customer.orderChance} Chance
                </span>
              </div>

              {/* Header Details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2.5">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                  {customer.place}, Kerala
                </span>
                <span className="flex items-center gap-1 font-mono text-emerald-400">
                  <Phone className="w-3.5 h-3.5" />
                  {customer.phone}
                </span>
                <span className="flex items-center gap-1 text-sky-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {customer.productInterestedName}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  Assigned:{' '}
                  <strong className="text-white">{customer.assignedToName}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 15. CUSTOMER QUICK ACTIONS (Large touch-friendly buttons) */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={handleCall}
              className="py-2.5 px-3 bg-[#2563EB] hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>CALL</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="py-2.5 px-3 bg-[#16A34A] hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WHATSAPP</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onAddFollowUp(customer);
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>ADD FOLLOW-UP</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartVisit(customer);
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <MapPin className="w-4 h-4 text-[#38BDF8]" />
              <span>RECORD VISIT</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onCreateQuotation(customer);
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>CREATE QUOTATION</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onCreateOrder) {
                  onCreateOrder(customer);
                }
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>CREATE ORDER</span>
            </button>
          </div>
        </div>

        {/* 9. SALES PIPELINE (Visual Pipeline & Interactive Stage Switcher) */}
        <div className="bg-slate-50 px-4 md:px-6 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sales Pipeline:
              </span>
              <span className="text-[11px] text-slate-500">
                Click a stage to advance or update customer
              </span>
            </div>

            {/* Reassign Executive for Owner / Senior */}
            {(isOwner || isSenior) && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold hidden sm:inline">
                  Reassign:
                </span>
                <select
                  value={customer.assignedToId}
                  onChange={(e) => handleReassign(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-xs"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Visual Interactive Stage Flow */}
          <div className="flex items-center overflow-x-auto gap-1 pb-1 scrollbar-none">
            {PIPELINE_STAGES.map((s, idx) => {
              const isCurrent = customer.leadStatus === s.stage;
              const isPast =
                currentPipelineIdx !== -1 && idx < currentPipelineIdx;

              return (
                <button
                  key={s.stage}
                  onClick={() => handleStageChange(s.stage)}
                  title={`Click to set stage to ${s.label}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isCurrent
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs scale-105'
                      : isPast
                      ? 'bg-blue-50 text-[#2563EB] border-blue-200 hover:bg-blue-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                      isCurrent
                        ? 'bg-white text-[#2563EB]'
                        : isPast
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </div>
                  <span>{s.label}</span>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 ml-0.5 ${
                        isCurrent || isPast ? 'text-blue-400' : 'text-slate-300'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 md:px-6 border-b border-slate-200 flex items-center gap-3 text-xs font-bold text-slate-500 overflow-x-auto shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>10. Activity Timeline</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
              {activities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            8. Customer Information
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'followups'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>11. Follow-ups</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                overdueFollowUps.length > 0
                  ? 'bg-rose-100 text-rose-700 font-extrabold'
                  : 'bg-slate-100'
              }`}
            >
              {followUps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('visits')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'visits'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>12. Visits</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
              {visits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quotations'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>13. Quotations</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
              {quotations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>14. Orders</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px]">
              {orders.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-xs">
          {/* 10. ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Chronological Sales History
                </h3>
                <span className="text-[11px] text-slate-400">
                  Total {activities.length} logged events
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  No activity logged yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activities.map((act) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{act.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {act.type}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[11px]">{act.timestamp}</span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {act.description}
                        </p>

                        <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                          <span>
                            Logged by: <strong className="text-slate-700">{act.performedByName}</strong>
                          </span>
                          {act.amount && (
                            <span className="font-bold text-emerald-600">
                              • Amount: ₹{act.amount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {act.status && (
                            <span className="font-semibold text-[#2563EB]">
                              • Status: {act.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. CUSTOMER INFORMATION (Clean information cards) */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Contact Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-200 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#2563EB]" />
                  <span>Contact Details</span>
                </h4>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Customer Name
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {customer.customerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Primary Phone
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-900">
                        {customer.phone}
                      </span>
                      <button
                        onClick={handleCall}
                        className="px-2 py-0.5 bg-blue-100 text-[#2563EB] rounded-lg text-[10px] font-bold hover:bg-blue-200"
                      >
                        Call
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Alternative Phone
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {customer.alternativePhone || 'Not provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Care Of (C/O)
                    </span>
                    <span className="font-medium text-slate-800">
                      {customer.careOf || 'Self'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Place / Town
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-slate-900">
                        {customer.place}, Kerala
                      </span>
                      <button
                        onClick={() => handleOpenMap()}
                        className="text-[10px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Map</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Full Address
                    </span>
                    <span className="font-medium text-slate-800 leading-relaxed block">
                      {customer.address || customer.place}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Deal & Opportunity Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-200 text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Product & Sales Details</span>
                </h4>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Product Interested
                    </span>
                    <span className="font-bold text-[#2563EB] text-sm">
                      {customer.productInterestedName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Expected Value
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{customer.expectedValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Lead Source
                    </span>
                    <span className="font-semibold text-slate-800">
                      {customer.leadSource}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Assigned Executive
                    </span>
                    <span className="font-semibold text-slate-900">
                      {customer.assignedToName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Created / Enquiry Date
                    </span>
                    <span className="font-medium text-slate-800">
                      {customer.enquiryDate || (customer.createdAt ? customer.createdAt.split('T')[0] : 'N/A')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Next Scheduled Follow-up
                    </span>
                    <span className="font-bold text-rose-600">
                      {customer.nextFollowUpDate || 'None scheduled'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Remarks / Notes
                    </span>
                    <span className="text-slate-700 italic block leading-relaxed">
                      {customer.remarks || 'No initial remarks entered.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. CUSTOMER FOLLOW-UPS (Upcoming, Overdue, Completed with Actions) */}
          {activeTab === 'followups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Customer Follow-up Schedules
                </h3>
                <button
                  onClick={() => {
                    onClose();
                    onAddFollowUp(customer);
                  }}
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Schedule Follow-up</span>
                </button>
              </div>

              {/* Overdue Follow-ups */}
              {overdueFollowUps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Overdue Follow-ups ({overdueFollowUps.length})</span>
                  </div>
                  {overdueFollowUps.map((fu) => (
                    <FollowUpCard
                      key={fu.id}
                      fu={fu}
                      isOverdue={true}
                      onComplete={() => handleOpenCompleteFu(fu)}
                      onReschedule={() => handleOpenRescheduleFu(fu)}
                      onEdit={() => handleOpenEditFu(fu)}
                    />
                  ))}
                </div>
              )}

              {/* Upcoming Follow-ups */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700 text-xs">
                  Upcoming Follow-ups ({upcomingFollowUps.length})
                </div>
                {upcomingFollowUps.length === 0 ? (
                  <div className="bg-slate-50 p-4 rounded-xl text-slate-400 text-center">
                    No upcoming follow-ups scheduled.
                  </div>
                ) : (
                  upcomingFollowUps.map((fu) => (
                    <FollowUpCard
                      key={fu.id}
                      fu={fu}
                      isOverdue={false}
                      onComplete={() => handleOpenCompleteFu(fu)}
                      onReschedule={() => handleOpenRescheduleFu(fu)}
                      onEdit={() => handleOpenEditFu(fu)}
                    />
                  ))
                )}
              </div>

              {/* Completed Follow-ups */}
              {completedFollowUps.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-emerald-700 text-xs">
                    Completed Follow-ups ({completedFollowUps.length})
                  </div>
                  {completedFollowUps.map((fu) => (
                    <div
                      key={fu.id}
                      className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {fu.contactType} Follow-up ({fu.followUpDate} at {fu.followUpTime})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Completed
                        </span>
                      </div>
                      <p className="text-slate-600">{fu.remarks}</p>
                      {fu.customerResponse && (
                        <p className="text-emerald-800 font-semibold mt-1">
                          Response: {fu.customerResponse}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Completed by {fu.assignedToName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 12. CUSTOMER VISITS */}
          {activeTab === 'visits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Customer Field Visits & GPS Inspections
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Site visits, incinerator demos, and GPS check-ins recorded for this customer
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onStartVisit(customer);
                  }}
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Schedule / Record Visit</span>
                </button>
              </div>

              {visits.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  No site visits recorded yet for this customer.
                </div>
              ) : (
                visits.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 text-xs shadow-2xs hover:border-blue-200 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            v.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : v.status === 'In Progress'
                              ? 'bg-blue-50 text-[#2563EB] border-blue-200 animate-pulse'
                              : v.status === 'Missed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {v.status || 'Completed'}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {v.purpose || 'Site Inspection'}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-semibold text-slate-700">
                            {v.visitDate} ({v.visitTime})
                          </span>
                          <span>•</span>
                          <span>Executive: <strong>{v.assignedToName || v.executiveName}</strong></span>
                          <span>•</span>
                          <span className="text-[#2563EB] font-medium">{v.location || v.customerPlace}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {v.outcome && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-50 text-[#2563EB] border border-blue-200">
                            {v.outcome}
                          </span>
                        )}
                        {v.orderChance && (
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            v.orderChance === 'High'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : v.orderChance === 'Medium'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {v.orderChance} Chance
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Products Discussed */}
                    {v.productsDiscussed && v.productsDiscussed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Products:</span>
                        {v.productsDiscussed.map((prod, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded-md text-[11px] border border-slate-200"
                          >
                            {prod}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Discussion notes & customer requirements */}
                    {(v.discussionNotes || v.discussionPoints) && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800">
                        <strong className="text-slate-900 block mb-0.5 text-[11px]">Discussion Notes:</strong>
                        <p className="font-medium text-slate-700">{v.discussionNotes || v.discussionPoints}</p>
                      </div>
                    )}

                    {v.customerRequirements && (
                      <div className="text-slate-700 bg-slate-50/70 p-2 rounded-lg border border-slate-150">
                        <strong className="text-slate-900">Requirements:</strong> {v.customerRequirements} {v.quantityRequirement ? `(${v.quantityRequirement})` : ''}
                      </div>
                    )}

                    {v.visitRemarks && (
                      <div className="text-slate-600 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                        <strong className="text-slate-800">Remarks:</strong> {v.visitRemarks}
                      </div>
                    )}

                    {/* Photos */}
                    {v.photos && v.photos.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Site Photos ({v.photos.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {v.photos.map((pic, picIdx) => (
                            <img
                              key={picIdx}
                              src={pic}
                              alt="Visit site"
                              className="w-14 h-14 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(pic, '_blank')}
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GPS Coordinates & Map Action */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        {v.gpsLatitude && v.gpsLongitude ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              GPS Verified ({v.gpsLatitude.toFixed(4)}, {v.gpsLongitude.toFixed(4)}{v.gpsAccuracy ? ` ±${Math.round(v.gpsAccuracy)}m` : ''})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Manual Check-in</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (v.gpsLatitude && v.gpsLongitude) {
                              window.open(`https://www.google.com/maps/search/?api=1&query=${v.gpsLatitude},${v.gpsLongitude}`, '_blank');
                            } else {
                              handleOpenMap(v.location || v.customerPlace || customer.place);
                            }
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#2563EB] border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>View Location in Map</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 13. QUOTATIONS */}
          {activeTab === 'quotations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Customer Quotations & Estimates
                </h3>
                <button
                  onClick={() => {
                    onClose();
                    onCreateQuotation(customer);
                  }}
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Quotation</span>
                </button>
              </div>

              {quotations.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  No quotations created yet for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {quotations.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#2563EB]">
                            {q.quotationNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {q.status}
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Date: <strong>{q.quotationDate}</strong> • Prepared by:{' '}
                          <strong>{q.preparedByName}</strong>
                        </div>
                        <div className="text-slate-800 font-semibold">
                          Items:{' '}
                          {q.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                          Total Amount: ₹{q.totalAmount.toLocaleString('en-IN')} (incl. GST)
                        </div>
                      </div>

                      {/* Quotation Actions: View, Download PDF, WhatsApp */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setViewQuotation(q)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => generateQuotationPdf(q)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl font-bold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => shareQuotationOnWhatsApp(q)}
                          className="px-3 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 14. ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Confirmed Customer Orders
                </h3>
                <button
                  onClick={() => {
                    onClose();
                    if (onCreateOrder) {
                      onCreateOrder(customer);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Order</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  No orders placed yet for this customer.
                </div>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-sm text-[#16A34A]">
                          {o.orderNumber}
                        </span>
                        <div className="text-slate-500 mt-0.5">
                          Order Date: {o.orderDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Payment: {o.paymentStatus}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Delivery: {o.deliveryStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">
                          Product
                        </span>
                        <span className="font-bold text-slate-800">
                          {o.productName || 'Incinerator Unit'} (x{o.quantity || 1})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">
                          Total Value (18% GST)
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          ₹{(o.grandTotal || o.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">
                          Paid So Far
                        </span>
                        <span className="font-bold text-emerald-700 text-xs">
                          ₹{(o.totalPaid || o.advancePaid || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">
                          Balance Due
                        </span>
                        <span className={`font-extrabold text-xs ${(o.balanceDue ?? o.balanceAmount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          ₹{(o.balanceDue ?? o.balanceAmount ?? Math.max(0, (o.grandTotal || o.amount || 0) - (o.totalPaid || o.advancePaid || 0))).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-600 gap-1 pt-1 text-[11px]">
                      {o.deliveryAddress && (
                        <div>
                          <strong className="text-slate-800">Delivery Site:</strong>{' '}
                          {o.deliveryAddress}
                        </div>
                      )}
                      <div className="text-slate-500">
                        Expected Delivery: <strong className="text-slate-800">{o.expectedDeliveryDate || 'Pending'}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complete Follow-up Modal */}
      {completeModalFu && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">
                Complete Follow-up
              </h4>
              <button
                onClick={() => setCompleteModalFu(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompleteFu} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Response / Discussion Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={customerResponse}
                  onChange={(e) => setCustomerResponse(e.target.value)}
                  placeholder="e.g., Customer requested formal quotation and site measurement next week."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Next Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={nextFuDateAfterComplete}
                  onChange={(e) => setNextFuDateAfterComplete(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalFu(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Save & Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Follow-up Modal */}
      {rescheduleModalFu && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">
                Reschedule Follow-up
              </h4>
              <button
                onClick={() => setRescheduleModalFu(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRescheduleFu} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason / Remarks
                </label>
                <textarea
                  rows={2}
                  value={rescheduleRemarks}
                  onChange={(e) => setRescheduleRemarks(e.target.value)}
                  placeholder="e.g., Customer busy traveling, requested call back on Saturday."
                  className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalFu(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Follow-up Modal */}
      {editModalFu && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">
                Edit Follow-up
              </h4>
              <button
                onClick={() => setEditModalFu(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFu} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Type
                  </label>
                  <select
                    value={editContactType}
                    onChange={(e) =>
                      setEditContactType(e.target.value as 'Call' | 'WhatsApp' | 'Visit')
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  >
                    <option value="Call">Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Visit">Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remarks / Objective
                </label>
                <textarea
                  rows={2}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalFu(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Quotation Detail Modal */}
      {viewQuotation && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  {viewQuotation.quotationNumber}
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Kerala Incinerator Commercial Quotation
                </p>
              </div>
              <button
                onClick={() => setViewQuotation(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold">{viewQuotation.quotationDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold">{viewQuotation.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prepared by:</span>
                <span className="font-semibold">{viewQuotation.preparedByName}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Quotation Items:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {viewQuotation.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                    <div>
                      <div className="font-bold text-slate-800">{it.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        Qty: {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      ₹{(it.totalAmount || it.quantity * it.unitPrice).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{viewQuotation.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%):</span>
                <span>₹{(viewQuotation.taxTotal || Math.round((viewQuotation.subtotal * 18) / 100)).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transportation:</span>
                <span>₹{(viewQuotation.transportationCharges || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#2563EB] pt-1 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>₹{viewQuotation.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => generateQuotationPdf(viewQuotation)}
                className="px-4 py-2 bg-blue-50 text-[#2563EB] font-bold rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => shareQuotationOnWhatsApp(viewQuotation)}
                className="px-4 py-2 bg-[#16A34A] text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Follow-up Card with Actions (Complete, Reschedule, Edit)
interface FollowUpCardProps {
  fu: FollowUp;
  isOverdue: boolean;
  onComplete: () => void;
  onReschedule: () => void;
  onEdit: () => void;
}

const FollowUpCard: React.FC<FollowUpCardProps> = ({
  fu,
  isOverdue,
  onComplete,
  onReschedule,
  onEdit,
}) => {
  return (
    <div
      className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-colors ${
        isOverdue
          ? 'bg-rose-50/70 border-rose-200'
          : 'bg-slate-50 border-slate-200 hover:border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>
              {fu.contactType} Follow-up ({fu.followUpDate} at {fu.followUpTime})
            </span>
            {isOverdue && (
              <span className="px-2 py-0.2 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                Overdue
              </span>
            )}
          </div>
          <p className="text-slate-600 mt-1 leading-relaxed">{fu.remarks}</p>
        </div>

        <span className="text-[11px] text-slate-400 shrink-0">
          Assigned: <strong>{fu.assignedToName}</strong>
        </span>
      </div>

      {/* Action Buttons: Complete, Reschedule, Edit */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 justify-end">
        <button
          onClick={onEdit}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3 text-slate-500" />
          <span>Edit</span>
        </button>

        <button
          onClick={onReschedule}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-amber-700 border border-amber-300 rounded-lg text-[11px] font-semibold flex items-center gap-1"
        >
          <CalendarClock className="w-3 h-3 text-amber-600" />
          <span>Reschedule</span>
        </button>

        <button
          onClick={onComplete}
          className="px-3 py-1 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
        >
          <Check className="w-3 h-3" />
          <span>Complete</span>
        </button>
      </div>
    </div>
  );
};

