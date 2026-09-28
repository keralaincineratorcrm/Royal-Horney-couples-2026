import React, { useState } from 'react';
import { X, UserPlus, Flame, CheckCircle2 } from 'lucide-react';
import { CustomerLead, LeadSource, OrderChance, LeadStatus } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: CustomerLead) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
}) => {
  const { currentUser, users, isOwner, isSenior } = useAuth();
  const products = dataStore.getProducts();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');
  const [careOf, setCareOf] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().split('T')[0]);
  const [leadSource, setLeadSource] = useState<LeadSource>('Website');
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('New Lead');
  const [orderChance, setOrderChance] = useState<OrderChance>('Medium');
  const [expectedValue, setExpectedValue] = useState<number>(
    products[0]?.defaultPrice || 18500
  );
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleProductChange = (prodId: string) => {
    setProductId(prodId);
    const selected = products.find((p) => p.id === prodId);
    if (selected) {
      setExpectedValue(selected.defaultPrice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !place.trim()) {
      alert('Please fill in Customer Name, Phone number, and Kerala Place/Location.');
      return;
    }

    const selectedProduct = products.find((p) => p.id === productId);
    const selectedAssignee =
      users.find((u) => u.id === assignedToId) || currentUser;

    const newLead = dataStore.addCustomer({
      customerName: customerName.trim(),
      phone: phone.trim(),
      alternativePhone: alternativePhone.trim() || undefined,
      place: place.trim(),
      address: address.trim(),
      careOf: careOf.trim() || undefined,
      productInterestedId: productId,
      productInterestedName: selectedProduct
        ? selectedProduct.name
        : '10kg MS Burner Incinerator',
      enquiryDate: enquiryDate || new Date().toISOString().split('T')[0],
      leadSource,
      assignedToId: isOwner || isSenior ? selectedAssignee.id : currentUser.id,
      assignedToName: isOwner || isSenior ? selectedAssignee.name : currentUser.name,
      leadStatus,
      orderChance,
      expectedValue: Number(expectedValue) || 0,
      remarks: remarks.trim(),
      nextFollowUpDate: nextFollowUpDate || undefined,
    });

    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      onCustomerAdded(newLead);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Add New Lead</h2>
              <p className="text-xs text-slate-400">
                Kerala Incinerator Sales CRM & Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Toast */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Lead created successfully. Opening customer profile...</span>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto text-xs flex-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Thomas Prakash"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            {/* Place / Town in Kerala */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Place <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g., Aimury, Perumbavoor, Ernakulam"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            {/* Primary Phone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-mono"
              />
            </div>

            {/* Alternative Phone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alternative Phone
              </label>
              <input
                type="tel"
                value={alternativePhone}
                onChange={(e) => setAlternativePhone(e.target.value)}
                placeholder="Optional secondary contact"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-mono"
              />
            </div>

            {/* C/O (Care Of) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                C/O (Care Of)
              </label>
              <input
                type="text"
                value={careOf}
                onChange={(e) => setCareOf(e.target.value)}
                placeholder="e.g., Self / Dr. George / Resort Manager"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            {/* Product Interested */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Product Interested <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                required
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.defaultPrice.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            {/* Enquiry Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Enquiry Date
              </label>
              <input
                type="date"
                value={enquiryDate}
                onChange={(e) => setEnquiryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            {/* Lead Source */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              >
                <option value="Website">Website (keralaincinerator.com)</option>
                <option value="Phone">Phone</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Reference">Reference</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Assigned Sales Executive */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Sales Executive
              </label>
              <select
                value={assignedToId}
                disabled={!isOwner && !isSenior}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-medium"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (
                    {u.role === 'owner'
                      ? 'Owner'
                      : u.role === 'senior_sales_executive'
                      ? 'Senior'
                      : 'Sales Executive'}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Status (Default: New Lead) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Status
              </label>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-medium"
              >
                <option value="New Lead">New Lead (Default)</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Ordered">Ordered</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="No Need">No Need</option>
                <option value="Purchased Another Brand">Purchased Another Brand</option>
              </select>
            </div>

            {/* Order Chance (Default: Medium) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Order Chance
              </label>
              <select
                value={orderChance}
                onChange={(e) => setOrderChance(e.target.value as OrderChance)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-medium"
              >
                <option value="High">High</option>
                <option value="Medium">Medium (Default)</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Expected Value */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Value (₹)
              </label>
              <input
                type="number"
                value={expectedValue}
                onChange={(e) => setExpectedValue(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-medium"
              />
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Near Church, High School Junction, Aimury, Kerala"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Domestic waste burner for residential compound; needs chimney fitting and delivery estimate."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Buttons: Cancel & Save Lead */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

