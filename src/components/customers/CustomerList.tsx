import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Flame,
  Calendar,
  X,
  Clock,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle,
  Building,
  UserCheck,
} from 'lucide-react';
import { CustomerLead, LeadStatus, OrderChance } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CustomerListProps {
  onSelectCustomer: (customer: CustomerLead) => void;
  onOpenAddModal: () => void;
  onAddFollowUp: (customer: CustomerLead) => void;
}

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

export const getLeadStatusBadgeClass = (status: LeadStatus) => {
  switch (status) {
    case 'New Lead':
      return 'bg-blue-100 text-[#2563EB] border-blue-200';
    case 'Contacted':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'Interested':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'Quotation Sent':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Follow-up':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Ordered':
      return 'bg-emerald-100 text-[#16A34A] border-emerald-200';
    case 'Delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Completed':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'No Need':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Purchased Another Brand':
      return 'bg-rose-100 text-[#EF4444] border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const CustomerList: React.FC<CustomerListProps> = ({
  onSelectCustomer,
  onOpenAddModal,
  onAddFollowUp,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [chanceFilter, setChanceFilter] = useState<string>('All');
  const [executiveFilter, setExecutiveFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [followUpFilter, setFollowUpFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');

  // Customer leads reactive data
  const [customers, setCustomers] = useState<CustomerLead[]>(() =>
    dataStore.getCustomers(currentUser.role, currentUser.id)
  );

  const products = dataStore.getProducts();

  useEffect(() => {
    const refresh = () => {
      setCustomers(dataStore.getCustomers(currentUser.role, currentUser.id));
    };
    refresh();
    const unsub = dataStore.subscribe(refresh);
    return unsub;
  }, [currentUser]);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return customers.filter((c) => {
      // 1. Search matching: Customer Name, Phone, Alternative Phone, Place, Product
      const matchesSearch =
        !term ||
        c.customerName.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.alternativePhone && c.alternativePhone.toLowerCase().includes(term)) ||
        c.place.toLowerCase().includes(term) ||
        (c.address && c.address.toLowerCase().includes(term)) ||
        c.productInterestedName.toLowerCase().includes(term) ||
        (c.careOf && c.careOf.toLowerCase().includes(term));

      // 2. Status filter
      const matchesStatus = statusFilter === 'All' || c.leadStatus === statusFilter;

      // 3. Order chance filter
      const matchesChance = chanceFilter === 'All' || c.orderChance === chanceFilter;

      // 4. Sales Executive filter
      const matchesExec = executiveFilter === 'All' || c.assignedToId === executiveFilter;

      // 5. Product filter
      const matchesProduct =
        productFilter === 'All' ||
        c.productInterestedId === productFilter ||
        c.productInterestedName.toLowerCase().includes(productFilter.toLowerCase());

      // 6. District filter
      const matchesDistrict =
        districtFilter === 'All' ||
        c.place.toLowerCase().includes(districtFilter.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(districtFilter.toLowerCase()));

      // 7. Follow-up filter
      let matchesFollowUp = true;
      if (followUpFilter === 'Overdue') {
        matchesFollowUp = !!c.nextFollowUpDate && c.nextFollowUpDate < todayStr;
      } else if (followUpFilter === 'Today') {
        matchesFollowUp = c.nextFollowUpDate === todayStr;
      } else if (followUpFilter === 'Tomorrow') {
        matchesFollowUp = c.nextFollowUpDate === tomorrowStr;
      } else if (followUpFilter === 'Upcoming') {
        matchesFollowUp = !!c.nextFollowUpDate && c.nextFollowUpDate >= todayStr;
      } else if (followUpFilter === 'No Follow-up') {
        matchesFollowUp = !c.nextFollowUpDate;
      }

      // 8. Date filter (enquiryDate or createdAt)
      let matchesDate = true;
      const refDate = c.enquiryDate || (c.createdAt ? c.createdAt.split('T')[0] : '');
      if (dateFilter === 'Today') {
        matchesDate = refDate === todayStr;
      } else if (dateFilter === 'Last 7 Days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const sevenDaysAgo = d.toISOString().split('T')[0];
        matchesDate = refDate >= sevenDaysAgo;
      } else if (dateFilter === 'Last 30 Days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const thirtyDaysAgo = d.toISOString().split('T')[0];
        matchesDate = refDate >= thirtyDaysAgo;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesChance &&
        matchesExec &&
        matchesProduct &&
        matchesDistrict &&
        matchesFollowUp &&
        matchesDate
      );
    });
  }, [
    customers,
    searchTerm,
    statusFilter,
    chanceFilter,
    executiveFilter,
    productFilter,
    districtFilter,
    followUpFilter,
    dateFilter,
    todayStr,
    tomorrowStr,
  ]);

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'All' ||
    chanceFilter !== 'All' ||
    executiveFilter !== 'All' ||
    productFilter !== 'All' ||
    districtFilter !== 'All' ||
    followUpFilter !== 'All' ||
    dateFilter !== 'All';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setChanceFilter('All');
    setExecutiveFilter('All');
    setProductFilter('All');
    setDistrictFilter('All');
    setFollowUpFilter('All');
    setDateFilter('All');
  };

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = (phone: string, name: string, product: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${name}, Greetings from Kerala Incinerator! Regarding your enquiry for ${product}, please let us know how we can assist you.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const leadStatusOptions: LeadStatus[] = [
    'New Lead',
    'Contacted',
    'Interested',
    'Quotation Sent',
    'Follow-up',
    'Ordered',
    'Delivered',
    'Completed',
    'No Need',
    'Purchased Another Brand',
  ];

  return (
    <div id="customer-leads-page" className="space-y-4 pb-20 md:pb-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Customers & Leads
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2563EB] text-xs font-bold">
              {filteredCustomers.length} leads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customers, leads and sales opportunities across Kerala.
          </p>
        </div>

        {/* Desktop Add Lead button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Quick Button (large touch-friendly) */}
      <div className="sm:hidden">
        <button
          onClick={onOpenAddModal}
          className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New Lead</span>
        </button>
      </div>

      {/* 2. Prominent Search Bar & 3. Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Prominent Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers, phone numbers, places or products..."
            className="w-full pl-10 pr-9 py-2.5 text-xs md:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {leadStatusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Executive Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Sales Executive
            </label>
            <select
              value={executiveFilter}
              disabled={!isOwner && !isSenior}
              onChange={(e) => setExecutiveFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="All">All Executives</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Chance Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Order Chance
            </label>
            <select
              value={chanceFilter}
              onChange={(e) => setChanceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              <option value="All">All Chances</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Product
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none truncate"
            >
              <option value="All">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              District
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              <option value="All">All Districts</option>
              {KERALA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Next Follow-up Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Next Follow-up
            </label>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              <option value="All">All Schedules</option>
              <option value="Overdue">Overdue</option>
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="Upcoming">Upcoming</option>
              <option value="No Follow-up">No Follow-up</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Showing <strong>{filteredCustomers.length}</strong> of {customers.length} total leads
            </span>
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Desktop Professional Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-600">No customers or leads found.</p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Lead</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-3">Place</th>
                  <th className="py-3.5 px-3">Phone</th>
                  <th className="py-3.5 px-3">Product</th>
                  <th className="py-3.5 px-3">Assigned To</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Order Chance</th>
                  <th className="py-3.5 px-3">Next Follow-up</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const isOverdue =
                    cust.nextFollowUpDate && cust.nextFollowUpDate < todayStr;
                  const isToday = cust.nextFollowUpDate === todayStr;

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => onSelectCustomer(cust)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Customer */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors">
                          {cust.customerName}
                        </div>
                        {cust.careOf && (
                          <div className="text-[10px] text-slate-400">
                            C/O: {cust.careOf}
                          </div>
                        )}
                      </td>

                      {/* Place */}
                      <td className="py-3 px-3 text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" />
                          <span className="truncate max-w-[120px]">{cust.place}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                        <div>{cust.phone}</div>
                        {cust.alternativePhone && (
                          <div className="text-[10px] text-slate-400">
                            Alt: {cust.alternativePhone}
                          </div>
                        )}
                      </td>

                      {/* Product */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 flex items-center gap-1 truncate max-w-[140px]">
                          <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{cust.productInterestedName}</span>
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[110px]">
                            {cust.assignedToName}
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getLeadStatusBadgeClass(
                            cust.leadStatus
                          )}`}
                        >
                          {cust.leadStatus}
                        </span>
                      </td>

                      {/* Order Chance */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cust.orderChance === 'High'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : cust.orderChance === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {cust.orderChance}
                        </span>
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3 px-3 text-[11px]">
                        {cust.nextFollowUpDate ? (
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              isOverdue
                                ? 'text-rose-600'
                                : isToday
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>
                              {cust.nextFollowUpDate}{' '}
                              {isOverdue && '(Overdue)'}
                              {isToday && '(Today)'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleCall(cust.phone, e)}
                            title="Call customer"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleWhatsApp(
                                cust.phone,
                                cust.customerName,
                                cust.productInterestedName,
                                e
                              )
                            }
                            title="WhatsApp chat"
                            className="p-1.5 text-[#16A34A] hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectCustomer(cust)}
                            title="View customer profile"
                            className="px-2.5 py-1 bg-slate-100 group-hover:bg-[#2563EB] group-hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Mobile Customer Cards (One-hand usability) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-600">No customers or leads found.</p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Lead</span>
            </button>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const isOverdue =
              cust.nextFollowUpDate && cust.nextFollowUpDate < todayStr;
            const isToday = cust.nextFollowUpDate === todayStr;

            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-200 transition-all cursor-pointer space-y-2.5"
              >
                {/* Header Row: Customer Name & Place + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-[#0F172A] truncate">
                      {cust.customerName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      <span className="font-medium truncate">{cust.place}</span>
                      {cust.careOf && (
                        <span className="text-[10px] text-slate-400 truncate">
                          • C/O: {cust.careOf}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLeadStatusBadgeClass(
                      cust.leadStatus
                    )}`}
                  >
                    {cust.leadStatus}
                  </span>
                </div>

                {/* Product & Executive Info */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-800 flex items-center gap-1 truncate max-w-[60%]">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{cust.productInterestedName}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      cust.orderChance === 'High'
                        ? 'bg-emerald-50 text-emerald-700'
                        : cust.orderChance === 'Medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cust.orderChance} Chance
                  </span>
                </div>

                {/* Next Follow-up & Executive */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-slate-500 truncate max-w-[50%]">
                    Exec: <strong>{cust.assignedToName}</strong>
                  </span>

                  {cust.nextFollowUpDate ? (
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isOverdue
                          ? 'text-rose-600'
                          : isToday
                          ? 'text-amber-600'
                          : 'text-slate-600'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{cust.nextFollowUpDate}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No Follow-up</span>
                  )}
                </div>

                {/* Touch Actions Bar: Call, WhatsApp, Follow-up, View */}
                <div
                  className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleCall(cust.phone, e)}
                    className="py-2 px-1 bg-blue-50 active:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={(e) =>
                      handleWhatsApp(
                        cust.phone,
                        cust.customerName,
                        cust.productInterestedName,
                        e
                      )
                    }
                    className="py-2 px-1 bg-emerald-50 active:bg-emerald-100 text-[#16A34A] rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onAddFollowUp(cust)}
                    className="py-2 px-1 bg-amber-50 active:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Follow-up</span>
                  </button>

                  <button
                    onClick={() => onSelectCustomer(cust)}
                    className="py-2 px-1 bg-slate-900 active:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

