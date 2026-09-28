import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, MessageCircle, MapPin, User, AlertCircle, Check } from 'lucide-react';
import { CustomerLead, ContactType, OrderChance, UserProfile } from '../../types';
import { dataStore } from '../../lib/supabase';

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer?: CustomerLead | null;
  customers: CustomerLead[];
  users: UserProfile[];
  currentUser: UserProfile;
}

export const AddFollowUpModal: React.FC<AddFollowUpModalProps> = ({
  isOpen,
  onClose,
  initialCustomer,
  customers,
  users,
  currentUser,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomer?.id || '');
  const [assignedToId, setAssignedToId] = useState(initialCustomer?.assignedToId || currentUser.id);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [contactType, setContactType] = useState<ContactType>('Call');
  const [orderChance, setOrderChance] = useState<OrderChance>(initialCustomer?.orderChance || 'High');
  const [remarks, setRemarks] = useState('');
  const [searchCustomerText, setSearchCustomerText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isOwnerOrSenior = currentUser.role === 'owner' || currentUser.role === 'senior_sales_executive';

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
      setAssignedToId(initialCustomer.assignedToId || currentUser.id);
      if (initialCustomer.orderChance) {
        setOrderChance(initialCustomer.orderChance);
      }
    }
  }, [initialCustomer, currentUser.id]);

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomerOptions = customers.filter((c) => {
    if (!searchCustomerText.trim()) return true;
    const q = searchCustomerText.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.place.toLowerCase().includes(q) ||
      c.productInterestedName.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    const targetCustomer = customers.find((c) => c.id === selectedCustomerId);
    if (!targetCustomer) {
      setErrorMsg('Selected customer was not found.');
      return;
    }

    if (!followUpDate) {
      setErrorMsg('Please select a follow-up date.');
      return;
    }

    const assignedUser = users.find((u) => u.id === assignedToId) || currentUser;

    dataStore.addFollowUp({
      customerId: targetCustomer.id,
      customerName: targetCustomer.customerName,
      customerPhone: targetCustomer.phone,
      customerPlace: targetCustomer.place,
      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,
      followUpDate,
      followUpTime,
      contactType,
      productName: targetCustomer.productInterestedName,
      orderChance,
      remarks: remarks.trim() || `Follow-up planned via ${contactType}`,
      status: 'Pending',
    });

    onClose();
  };

  return (
    <div
      id="add-followup-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="add-followup-modal-content"
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-[#0F172A] tracking-tight">
              Schedule Follow-up
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set customer contact date, time, and discussion plan.
            </p>
          </div>
          <button
            id="close-add-followup-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">
                Select Customer <span className="text-rose-500">*</span>
              </label>
              {customers.length > 5 && (
                <span className="text-[11px] text-slate-400">{customers.length} available</span>
              )}
            </div>

            {/* Quick search input */}
            <input
              type="text"
              placeholder="Search customer name, phone, or location..."
              value={searchCustomerText}
              onChange={(e) => setSearchCustomerText(e.target.value)}
              className="w-full px-3 py-1.5 mb-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />

            <select
              id="followup-customer-select"
              required
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const cust = customers.find((c) => c.id === e.target.value);
                if (cust) {
                  setAssignedToId(cust.assignedToId || currentUser.id);
                  if (cust.orderChance) setOrderChance(cust.orderChance);
                }
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">-- Choose Customer --</option>
              {filteredCustomerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} ({c.place}) — {c.productInterestedName} [{c.phone}]
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-blue-950">{selectedCustomer.customerName}</div>
                  <div className="text-[11px] text-slate-600">
                    {selectedCustomer.place} • {selectedCustomer.phone}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-[#2563EB] rounded-md">
                  {selectedCustomer.productInterestedName}
                </span>
              </div>
            )}
          </div>

          {/* Assigned Sales Executive (if Owner or Senior) */}
          {isOwnerOrSenior && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Assigned Sales Executive
              </label>
              <select
                id="followup-assigned-executive-select"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'owner' ? 'Owner' : u.role === 'senior_sales_executive' ? 'Senior Executive' : 'Field Executive'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Follow-up Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="followup-date-input"
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Time <span className="text-rose-500">*</span>
              </label>
              <input
                id="followup-time-input"
                type="time"
                required
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Contact Type */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Contact Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContactType('Call')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  contactType === 'Call'
                    ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Call</span>
              </button>

              <button
                type="button"
                onClick={() => setContactType('WhatsApp')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  contactType === 'WhatsApp'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setContactType('Visit')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  contactType === 'Visit'
                    ? 'bg-sky-50 border-sky-600 text-sky-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Site Visit</span>
              </button>
            </div>
          </div>

          {/* Order Chance */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Expected Order Chance</label>
            <div className="grid grid-cols-3 gap-2">
              {(['High', 'Medium', 'Low'] as OrderChance[]).map((chance) => (
                <button
                  key={chance}
                  type="button"
                  onClick={() => setOrderChance(chance)}
                  className={`py-2 rounded-xl border font-bold text-center transition-all ${
                    orderChance === chance
                      ? chance === 'High'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : chance === 'Medium'
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'bg-slate-100 border-slate-400 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {chance}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Remarks / Agenda</label>
            <textarea
              id="followup-remarks-input"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Call customer after 11am to confirm site dimensions and explain difference between SS and MS incinerator."
              className="w-full p-2.5 rounded-xl border border-slate-300 font-normal focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-followup-submit-btn"
              type="submit"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

