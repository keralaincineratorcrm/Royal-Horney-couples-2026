import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Flame,
  User,
  Phone,
  FileText,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react';
import { VisitPurpose, OrderChance, CustomerLead } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ScheduleVisitModalProps {
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: (visitId?: string) => void;
}

const VISIT_PURPOSES: VisitPurpose[] = [
  'Initial Enquiry',
  'Product Demonstration',
  'Quotation Discussion',
  'Follow-up Visit',
  'Site Inspection',
  'Order Discussion',
  'Delivery Discussion',
  'Other',
];

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  initialCustomerId,
  onClose,
  onSuccess,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();
  const allCustomers = dataStore.getCustomers(isOwner ? 'owner' : isSenior ? 'senior_sales_executive' : 'sales_executive', currentUser.id);
  const products = dataStore.getProducts();
  const salesTeam = users.filter((u) => u.role !== 'owner');

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>(
    currentUser.role === 'sales_executive' ? currentUser.id : users[1]?.id || currentUser.id
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const [visitDate, setVisitDate] = useState(todayStr);
  const [visitTime, setVisitTime] = useState('11:00');
  const [purpose, setPurpose] = useState<VisitPurpose>('Site Inspection');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['10kg SS Burner Incinerator']);
  const [orderChance, setOrderChance] = useState<OrderChance>('Medium');
  const [estimatedValue, setEstimatedValue] = useState<string>('55000');
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  // When customer is selected, prefill details
  const handleSelectCustomer = (c: CustomerLead) => {
    setSelectedCustomerId(c.id);
    setLocation(c.place || c.district || '');
    if (c.productInterestedName) {
      setSelectedProducts([c.productInterestedName]);
    }
    if (c.orderChance) {
      setOrderChance(c.orderChance);
    }
    if (c.expectedValue) {
      setEstimatedValue(String(c.expectedValue));
    }
    if (isOwner || isSenior) {
      if (c.assignedToId) {
        setSelectedExecutiveId(c.assignedToId);
      }
    }
  };

  // If initial customer provided, populate
  React.useEffect(() => {
    if (initialCustomerId) {
      const c = allCustomers.find((cust) => cust.id === initialCustomerId);
      if (c) handleSelectCustomer(c);
    }
  }, [initialCustomerId]);

  const toggleProduct = (prodName: string) => {
    if (selectedProducts.includes(prodName)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter((p) => p !== prodName));
      }
    } else {
      setSelectedProducts([...selectedProducts, prodName]);
    }
  };

  const filteredCustomers = allCustomers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.place && c.place.toLowerCase().includes(q))
    );
  });

  const selectedCustomer = allCustomers.find((c) => c.id === selectedCustomerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    if (!visitDate) {
      setError('Please select a visit date.');
      return;
    }

    const assignedUser = users.find((u) => u.id === selectedExecutiveId) || currentUser;

    try {
      const newVisit = dataStore.scheduleVisit({
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.customerName,
        customerPhone: selectedCustomer?.phone,
        customerPlace: selectedCustomer?.place,
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name,
        visitDate,
        visitTime,
        location: location || selectedCustomer?.place || 'Customer Site',
        purpose,
        productsDiscussed: selectedProducts,
        orderChance,
        estimatedOrderValue: estimatedValue ? Number(estimatedValue) : undefined,
        visitRemarks: remarks,
      });

      onSuccess(newVisit.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule visit. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 text-xs">
        {/* Modal Header */}
        <div className="bg-[#0F172A] text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#38BDF8]" />
              Schedule Customer Visit
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Plan and assign field visits to Kerala institutions, hospitals, and clients
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Customer Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              1. Select Customer / Prospect <span className="text-rose-500">*</span>
            </label>

            {selectedCustomer ? (
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {selectedCustomer.customerName}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px] mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-[#2563EB]" />
                      {selectedCustomer.place || selectedCustomer.district}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.phone}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('')}
                  className="px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-white rounded-lg transition-colors border border-blue-200"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone or place..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.slice(0, 10).map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{cust.customerName}</span>
                          <span className="text-slate-500 text-[11px] flex items-center gap-2">
                            <span>{cust.place || cust.district}</span>
                            <span>•</span>
                            <span>{cust.phone}</span>
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {cust.customerCategory || 'Customer'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">No customers found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Assign Sales Executive */}
          {(isOwner || isSenior) && (
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                2. Assigned Field Sales Executive
              </label>
              <select
                value={selectedExecutiveId}
                onChange={(e) => setSelectedExecutiveId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {salesTeam.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'senior_sales_executive' ? 'Senior Executive' : 'Field Executive'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Visit Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                Visit Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                Scheduled Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. Purpose of Visit */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              Purpose of Visit
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as VisitPurpose)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VISIT_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Products to Discuss (Catalog) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              Products to Discuss (Incinerator Models)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {products.map((prod) => {
                const isSelected = selectedProducts.includes(prod.name);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => toggleProduct(prod.name)}
                    className={`p-2 rounded-lg text-left text-xs font-medium border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate pr-1">{prod.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Order Probability & Expected Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                Order Chance
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['High', 'Medium', 'Low'] as OrderChance[]).map((oc) => (
                  <button
                    key={oc}
                    type="button"
                    onClick={() => setOrderChance(oc)}
                    className={`py-2 text-center rounded-xl font-bold border transition-all text-xs ${
                      orderChance === oc
                        ? oc === 'High'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : oc === 'Medium'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {oc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
                Est. Value (₹)
              </label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 7. Location / Site Address */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              Site / Meeting Location in Kerala
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near St. George Hospital, Kothamangalam"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 8. Remarks */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide">
              Pre-visit Notes / Objectives
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Carry brochure of 10kg SS & site inspection checklist for waste disposal point."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Visit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

