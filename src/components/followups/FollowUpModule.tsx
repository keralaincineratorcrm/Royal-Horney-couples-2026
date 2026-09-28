import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  MapPin,
  Plus,
  Search,
  Filter,
  X,
  User,
  ChevronRight,
  ExternalLink,
  Users,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { FollowUp, CustomerLead, ContactType, OrderChance, FollowUpStatus, UserRole } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { AddFollowUpModal } from './AddFollowUpModal';
import { CompleteFollowUpModal } from './CompleteFollowUpModal';
import { RescheduleModal } from './RescheduleModal';
import { WhatsAppModal } from './WhatsAppModal';

interface FollowUpModuleProps {
  onSelectCustomer: (customer: CustomerLead) => void;
  onStartVisit?: (customer: CustomerLead) => void;
  initialSelectedCustomer?: CustomerLead | null;
}

type TabType = 'today' | 'overdue' | 'upcoming' | 'completed' | 'all';
type DateShortcut = 'all' | 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'custom';

export const FollowUpModule: React.FC<FollowUpModuleProps> = ({
  onSelectCustomer,
  onStartVisit,
  initialSelectedCustomer,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();

  // Reactive store state
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = dataStore.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [seniorViewMode, setSeniorViewMode] = useState<'my' | 'team'>('my');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState('all');
  const [selectedOrderChanceFilter, setSelectedOrderChanceFilter] = useState<string>('all');
  const [selectedContactTypeFilter, setSelectedContactTypeFilter] = useState<string>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [dateShortcut, setDateShortcut] = useState<DateShortcut>('all');
  const [customDate, setCustomDate] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(!!initialSelectedCustomer);
  const [completeItem, setCompleteItem] = useState<FollowUp | null>(null);
  const [rescheduleItem, setRescheduleItem] = useState<FollowUp | null>(null);
  const [whatsAppItem, setWhatsAppItem] = useState<FollowUp | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const weekEndStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch customers and follow-ups based on role
  const isSeniorTeamMode = isSenior && seniorViewMode === 'team';
  const roleForQuery = isOwner || isSeniorTeamMode ? 'owner' : currentUser.role;
  const userIdForQuery = isOwner || isSeniorTeamMode ? undefined : currentUser.id;

  const allFollowUps = dataStore.getFollowUps(roleForQuery, userIdForQuery);
  const allCustomers = dataStore.getCustomers('owner'); // for full lookup
  const products = dataStore.getProducts();

  // Helper to get customer by id
  const getCustomerForFollowUp = (item: FollowUp): CustomerLead | undefined => {
    return allCustomers.find((c) => c.id === item.customerId);
  };

  // Pre-calculate tab counts (based on current role scope before text filters)
  const tabCounts = useMemo(() => {
    const todayItems = allFollowUps.filter(
      (f) => f.followUpDate === todayStr && f.status !== 'Completed' && f.status !== 'Cancelled'
    );
    const overdueItems = allFollowUps.filter(
      (f) =>
        f.status === 'Overdue' ||
        (f.status === 'Pending' && f.followUpDate < todayStr)
    );
    const upcomingItems = allFollowUps.filter(
      (f) => f.followUpDate > todayStr && f.status !== 'Completed' && f.status !== 'Cancelled'
    );
    const completedTodayItems = allFollowUps.filter(
      (f) =>
        f.status === 'Completed' &&
        (f.completedAt?.startsWith(todayStr) || f.followUpDate === todayStr)
    );
    const allCompletedItems = allFollowUps.filter((f) => f.status === 'Completed');

    return {
      today: todayItems.length,
      overdue: overdueItems.length,
      upcoming: upcomingItems.length,
      completedToday: completedTodayItems.length,
      allCompleted: allCompletedItems.length,
      total: allFollowUps.length,
    };
  }, [allFollowUps, todayStr]);

  // Unique list of districts / places for filter
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    allFollowUps.forEach((f) => {
      if (f.customerPlace) set.add(f.customerPlace);
    });
    return Array.from(set).sort();
  }, [allFollowUps]);

  // Filter follow-ups
  const filteredFollowUps = useMemo(() => {
    return allFollowUps.filter((item) => {
      const isOverdue =
        item.status === 'Overdue' ||
        (item.status === 'Pending' && item.followUpDate < todayStr);

      // Tab filter
      if (activeTab === 'today') {
        if (item.followUpDate !== todayStr || item.status === 'Completed') return false;
      } else if (activeTab === 'overdue') {
        if (!isOverdue) return false;
      } else if (activeTab === 'upcoming') {
        if (item.followUpDate <= todayStr || item.status === 'Completed' || item.status === 'Cancelled')
          return false;
      } else if (activeTab === 'completed') {
        if (item.status !== 'Completed') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.customerName.toLowerCase().includes(q);
        const matchPhone = item.customerPhone.toLowerCase().includes(q);
        const matchPlace = item.customerPlace.toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchRemarks = item.remarks.toLowerCase().includes(q);
        const matchExec = item.assignedToName.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPlace && !matchProduct && !matchRemarks && !matchExec) {
          return false;
        }
      }

      // Executive filter (if Owner or Senior)
      if (selectedExecutiveFilter !== 'all' && item.assignedToId !== selectedExecutiveFilter) {
        return false;
      }

      // Order chance filter
      if (selectedOrderChanceFilter !== 'all' && item.orderChance !== selectedOrderChanceFilter) {
        return false;
      }

      // Contact type filter
      if (selectedContactTypeFilter !== 'all' && item.contactType !== selectedContactTypeFilter) {
        return false;
      }

      // Product filter
      if (selectedProductFilter !== 'all' && item.productName !== selectedProductFilter) {
        return false;
      }

      // District filter
      if (selectedDistrictFilter !== 'all' && item.customerPlace !== selectedDistrictFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'Overdue' && !isOverdue) return false;
        if (selectedStatusFilter !== 'Overdue' && item.status !== selectedStatusFilter) return false;
      }

      // Date shortcut
      if (dateShortcut === 'today' && item.followUpDate !== todayStr) return false;
      if (dateShortcut === 'tomorrow' && item.followUpDate !== tomorrowStr) return false;
      if (dateShortcut === 'this_week') {
        if (item.followUpDate < todayStr || item.followUpDate > weekEndStr) return false;
      }
      if (dateShortcut === 'overdue' && !isOverdue) return false;
      if (dateShortcut === 'custom' && customDate && item.followUpDate !== customDate) return false;

      return true;
    });
  }, [
    allFollowUps,
    activeTab,
    searchQuery,
    selectedExecutiveFilter,
    selectedOrderChanceFilter,
    selectedContactTypeFilter,
    selectedProductFilter,
    selectedDistrictFilter,
    selectedStatusFilter,
    dateShortcut,
    customDate,
    todayStr,
    tomorrowStr,
    weekEndStr,
  ]);

  // Team summary data for Senior Executive & Owner
  const teamSummary = useMemo(() => {
    if (!isOwner && !isSenior) return [];
    const salesTeam = users.filter((u) => u.role !== 'owner');
    return salesTeam.map((u) => {
      const userFollowUps = dataStore.getFollowUps('senior_sales_executive', u.id);
      const todayCount = userFollowUps.filter(
        (f) => f.followUpDate === todayStr && f.status !== 'Completed'
      ).length;
      const overdueCount = userFollowUps.filter(
        (f) =>
          f.status === 'Overdue' ||
          (f.status === 'Pending' && f.followUpDate < todayStr)
      ).length;
      const completedToday = userFollowUps.filter(
        (f) =>
          f.status === 'Completed' &&
          (f.completedAt?.startsWith(todayStr) || f.followUpDate === todayStr)
      ).length;
      const upcomingCount = userFollowUps.filter(
        (f) => f.followUpDate > todayStr && f.status !== 'Completed'
      ).length;

      return {
        user: u,
        todayCount,
        overdueCount,
        completedToday,
        upcomingCount,
        total: userFollowUps.length,
      };
    });
  }, [isOwner, isSenior, users, todayStr]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedExecutiveFilter !== 'all' ||
    selectedOrderChanceFilter !== 'all' ||
    selectedContactTypeFilter !== 'all' ||
    selectedProductFilter !== 'all' ||
    selectedDistrictFilter !== 'all' ||
    selectedStatusFilter !== 'all' ||
    dateShortcut !== 'all' ||
    customDate !== '';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedExecutiveFilter('all');
    setSelectedOrderChanceFilter('all');
    setSelectedContactTypeFilter('all');
    setSelectedProductFilter('all');
    setSelectedDistrictFilter('all');
    setSelectedStatusFilter('all');
    setDateShortcut('all');
    setCustomDate('');
  };

  // Quick Action Handlers
  const handleCall = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleOpenWhatsAppModal = (item: FollowUp, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWhatsAppItem(item);
  };

  const handleViewCustomer = (item: FollowUp, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cust = getCustomerForFollowUp(item);
    if (cust) {
      onSelectCustomer(cust);
    } else {
      // Create minimal customer lead representation to open modal smoothly
      const fallbackCustomer: CustomerLead = {
        id: item.customerId,
        customerName: item.customerName,
        phone: item.customerPhone,
        place: item.customerPlace,
        address: item.customerPlace,
        productInterestedId: '',
        productInterestedName: item.productName,
        enquiryDate: item.createdAt.split('T')[0],
        leadSource: 'Other',
        assignedToId: item.assignedToId,
        assignedToName: item.assignedToName,
        leadStatus: item.status === 'Completed' ? 'Contacted' : 'Follow-up',
        orderChance: item.orderChance,
        expectedValue: 0,
        remarks: item.remarks,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      };
      onSelectCustomer(fallbackCustomer);
    }
  };

  return (
    <div id="followups-module-root" className="space-y-6 pb-20 md:pb-8">
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Follow-ups
            </h1>
            {tabCounts.overdue > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                {tabCounts.overdue} Overdue
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage today's customer follow-ups and upcoming sales activities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Senior Executive Toggle */}
          {isSenior && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setSeniorViewMode('my')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  seniorViewMode === 'my'
                    ? 'bg-white text-[#2563EB] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Follow-ups
              </button>
              <button
                type="button"
                onClick={() => setSeniorViewMode('team')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  seniorViewMode === 'team'
                    ? 'bg-white text-[#2563EB] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Follow-ups</span>
              </button>
            </div>
          )}

          <button
            id="open-schedule-followup-modal-btn"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Follow-up</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Summary Cards (Clicking filters the list) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Today's Follow-ups */}
        <div
          id="summary-card-today"
          onClick={() => {
            setActiveTab('today');
            setDateShortcut('today');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
            activeTab === 'today'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md">
              Due Today
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-3">Today's Follow-ups</div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
            {tabCounts.today}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Calls, WhatsApp & Visits</span>
            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Overdue (Prominent Red Alert) */}
        <div
          id="summary-card-overdue"
          onClick={() => {
            setActiveTab('overdue');
            setDateShortcut('overdue');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
            activeTab === 'overdue'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              Action Required
            </span>
          </div>
          <div className="text-xs font-bold text-rose-700 mt-3">Overdue Follow-ups</div>
          <div className="text-2xl md:text-3xl font-black text-rose-600 mt-0.5">
            {tabCounts.overdue}
          </div>
          <div className="text-[11px] text-rose-600/80 font-medium mt-1 flex items-center gap-1">
            <span>Requires immediate response</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Upcoming */}
        <div
          id="summary-card-upcoming"
          onClick={() => {
            setActiveTab('upcoming');
            setDateShortcut('all');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
            activeTab === 'upcoming'
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-sky-200 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#38BDF8] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-md">
              Pipeline
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-3">Upcoming Activities</div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
            {tabCounts.upcoming}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Tomorrow and later this week</span>
            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Completed Today */}
        <div
          id="summary-card-completed"
          onClick={() => {
            setActiveTab('completed');
            setDateShortcut('all');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
            activeTab === 'completed'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
              Success
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-3">Completed Today</div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
            {tabCounts.completedToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{tabCounts.allCompleted} total completed</span>
            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Team Summary Table for Senior Executive & Owner (Section 15 & 16) */}
      {(isOwner || isSeniorTeamMode) && teamSummary.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>Sales Team Follow-up Monitoring</span>
              </h3>
              <p className="text-xs text-slate-500">
                Live workload distribution across field sales executives.
              </p>
            </div>
            {selectedExecutiveFilter !== 'all' && (
              <button
                onClick={() => setSelectedExecutiveFilter('all')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Reset Executive Filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5">Executive</th>
                  <th className="pb-2.5 text-center">Today</th>
                  <th className="pb-2.5 text-center">Overdue</th>
                  <th className="pb-2.5 text-center">Completed</th>
                  <th className="pb-2.5 text-center">Upcoming</th>
                  <th className="pb-2.5 text-right">Quick Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamSummary.map((item) => {
                  const isSelected = selectedExecutiveFilter === item.user.id;
                  return (
                    <tr
                      key={item.user.id}
                      onClick={() =>
                        setSelectedExecutiveFilter(isSelected ? 'all' : item.user.id)
                      }
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {item.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.user.name}</div>
                          <div className="text-[10px] text-slate-400">{item.user.phone}</div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-bold text-blue-600">
                        {item.todayCount}
                      </td>
                      <td className="py-2.5 text-center">
                        {item.overdueCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px]">
                            {item.overdueCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center font-bold text-emerald-600">
                        {item.completedToday}
                      </td>
                      <td className="py-2.5 text-center text-slate-600 font-semibold">
                        {item.upcomingCount}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Filter'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Search & Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="followup-search-input"
              type="text"
              placeholder="Search by customer name, phone, place, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            id="toggle-filters-panel-btn"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              showFiltersPanel || hasActiveFilters
                ? 'bg-blue-50 border-[#2563EB] text-[#2563EB]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showFiltersPanel && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs animate-in fade-in duration-150">
            {/* Executive Filter */}
            {(isOwner || isSenior) && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Sales Executive
                </label>
                <select
                  id="filter-executive-select"
                  value={selectedExecutiveFilter}
                  onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="all">All Executives</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Order Chance Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Order Chance
              </label>
              <select
                id="filter-orderchance-select"
                value={selectedOrderChanceFilter}
                onChange={(e) => setSelectedOrderChanceFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Chances</option>
                <option value="High">High Chance</option>
                <option value="Medium">Medium Chance</option>
                <option value="Low">Low Chance</option>
              </select>
            </div>

            {/* Contact Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Contact Mode
              </label>
              <select
                id="filter-contacttype-select"
                value={selectedContactTypeFilter}
                onChange={(e) => setSelectedContactTypeFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Modes</option>
                <option value="Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Visit">Site Visit</option>
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Product</label>
              <select
                id="filter-product-select"
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District / Place Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Location / Place
              </label>
              <select
                id="filter-district-select"
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Places</option>
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
              <select
                id="filter-status-select"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
        )}

        {/* Date Shortcuts & Tabs Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Main Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              id="tab-today"
              onClick={() => {
                setActiveTab('today');
                setDateShortcut('today');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today ({tabCounts.today})</span>
            </button>

            <button
              id="tab-overdue"
              onClick={() => {
                setActiveTab('overdue');
                setDateShortcut('overdue');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : tabCounts.overdue > 0
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue ({tabCounts.overdue})</span>
            </button>

            <button
              id="tab-upcoming"
              onClick={() => {
                setActiveTab('upcoming');
                setDateShortcut('all');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming ({tabCounts.upcoming})</span>
            </button>

            <button
              id="tab-completed"
              onClick={() => {
                setActiveTab('completed');
                setDateShortcut('all');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed ({tabCounts.allCompleted})</span>
            </button>

            <button
              id="tab-all"
              onClick={() => {
                setActiveTab('all');
                setDateShortcut('all');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({tabCounts.total})
            </button>
          </div>

          {/* Quick Date Range Shortcuts */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 overflow-x-auto py-1">
            <span className="text-slate-400 mr-1 hidden sm:inline">Date:</span>
            {[
              { id: 'all', label: 'Any' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'this_week', label: 'This Week' },
              { id: 'custom', label: 'Custom' },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setDateShortcut(sc.id as DateShortcut)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  dateShortcut === sc.id
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {sc.label}
              </button>
            ))}

            {dateShortcut === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 py-0.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
              />
            )}
          </div>
        </div>
      </div>

      {/* 4. Follow-up List Display */}
      {filteredFollowUps.length === 0 ? (
        /* Empty States (Section 22) */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center">
          {activeTab === 'today' ? (
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                No follow-ups scheduled for today.
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Great job! All scheduled activities for today are completed or you haven't booked any customer follow-ups yet.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                + Schedule Follow-up
              </button>
            </div>
          ) : activeTab === 'overdue' ? (
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Great! No overdue follow-ups.
              </h3>
              <p className="text-xs text-slate-500">
                All customer contacts are up to date with zero delayed commitments.
              </p>
            </div>
          ) : activeTab === 'completed' ? (
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                No completed follow-ups yet.
              </h3>
              <p className="text-xs text-slate-500">
                Completed customer calls and visits will be preserved here permanently.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                No follow-ups found matching your filters.
              </h3>
              <p className="text-xs text-slate-500">
                Try clearing search terms or removing filter restrictions.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* A. Mobile View (Cards) */}
          <div className="block lg:hidden space-y-3">
            {filteredFollowUps.map((item) => {
              const isOverdue =
                item.status === 'Overdue' ||
                (item.status === 'Pending' && item.followUpDate < todayStr);
              const isToday = item.followUpDate === todayStr;
              const isCompleted = item.status === 'Completed';
              const isRescheduled = item.status === 'Rescheduled';

              return (
                <div
                  key={item.id}
                  id={`mobile-followup-card-${item.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50/70 border-slate-200'
                      : isToday
                      ? 'bg-white border-blue-200 ring-1 ring-blue-500/20 shadow-2xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Top Bar: Customer + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900">
                          {item.customerName}
                        </span>
                        <span className="text-xs text-slate-500">({item.customerPlace})</span>
                      </div>
                      <div className="text-xs font-semibold text-[#2563EB] mt-0.5">
                        {item.productName}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : isRescheduled
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isToday
                            ? 'bg-blue-100 text-[#2563EB] border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isOverdue ? 'OVERDUE' : isToday ? 'DUE TODAY' : item.status}
                      </span>

                      {/* Order Chance Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.orderChance === 'High'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.orderChance === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.orderChance} Chance
                      </span>
                    </div>
                  </div>

                  {/* Date, Time, Executive info */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className={isOverdue ? 'font-bold text-rose-600' : 'font-semibold text-slate-800'}>
                        {item.followUpDate} • {item.followUpTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.assignedToName}</span>
                    </div>
                  </div>

                  {/* Mode & Phone */}
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-slate-700 font-medium">{item.customerPhone}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      Via {item.contactType}
                    </span>
                  </div>

                  {/* Remarks / Customer Response */}
                  {item.remarks && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-100/70 text-xs text-slate-700 italic">
                      "{item.remarks}"
                    </div>
                  )}

                  {item.customerResponse && (
                    <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                      Outcome: {item.customerResponse}
                    </div>
                  )}

                  {/* Primary Touch Buttons (Large, >= 44px) */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleCall(item.customerPhone, e)}
                      className="h-11 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>CALL</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsAppModal(item, e)}
                      className="h-11 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WHATSAPP</span>
                    </button>

                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setCompleteItem(item)}
                        className="h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>COMPLETE</span>
                      </button>
                    ) : (
                      <div className="h-11 bg-emerald-100/70 text-emerald-800 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>DONE</span>
                      </div>
                    )}
                  </div>

                  {/* Secondary Actions (Reschedule & View Customer) */}
                  <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => setRescheduleItem(item)}
                        className="py-2 px-3 rounded-xl border border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100 text-xs font-bold text-center transition-colors"
                      >
                        Reschedule
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleViewCustomer(item)}
                      className={`py-2 px-3 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-center transition-colors ${
                        isCompleted ? 'col-span-2' : ''
                      }`}
                    >
                      View Customer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* B. Desktop View (High-Contrast Table) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Executive</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Order Chance</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredFollowUps.map((item) => {
                    const isOverdue =
                      item.status === 'Overdue' ||
                      (item.status === 'Pending' && item.followUpDate < todayStr);
                    const isToday = item.followUpDate === todayStr;
                    const isCompleted = item.status === 'Completed';
                    const isRescheduled = item.status === 'Rescheduled';

                    return (
                      <tr
                        key={item.id}
                        id={`desktop-followup-row-${item.id}`}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isOverdue ? 'bg-rose-50/30 hover:bg-rose-50/60' : ''
                        }`}
                      >
                        {/* 1. Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {item.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.customerPlace}</span>
                          </div>
                          {item.remarks && (
                            <div className="text-[11px] text-slate-500 italic max-w-xs truncate mt-0.5">
                              "{item.remarks}"
                            </div>
                          )}
                        </td>

                        {/* 2. Phone */}
                        <td className="py-3.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleCall(item.customerPhone)}
                            title="Click to dial"
                            className="font-mono text-slate-800 hover:text-[#2563EB] hover:underline font-semibold text-xs"
                          >
                            {item.customerPhone}
                          </button>
                        </td>

                        {/* 3. Product */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-[#2563EB] max-w-[180px] block truncate" title={item.productName}>
                            {item.productName}
                          </span>
                        </td>

                        {/* 4. Assigned Executive */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                              {item.assignedToName.charAt(0)}
                            </div>
                            <span className="text-slate-800 truncate max-w-[110px]">
                              {item.assignedToName}
                            </span>
                          </div>
                        </td>

                        {/* 5. Date & Time */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div
                            className={`font-bold text-xs ${
                              isOverdue ? 'text-rose-600' : isToday ? 'text-blue-600' : 'text-slate-800'
                            }`}
                          >
                            {item.followUpDate}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.followUpTime}</div>
                        </td>

                        {/* 6. Mode */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              item.contactType === 'Call'
                                ? 'bg-blue-50 text-[#2563EB]'
                                : item.contactType === 'WhatsApp'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-sky-50 text-sky-700'
                            }`}
                          >
                            {item.contactType === 'Call' ? (
                              <Phone className="w-3 h-3" />
                            ) : item.contactType === 'WhatsApp' ? (
                              <MessageCircle className="w-3 h-3" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            <span>{item.contactType}</span>
                          </span>
                        </td>

                        {/* 7. Order Chance */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.orderChance === 'High'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.orderChance === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.orderChance}
                          </span>
                        </td>

                        {/* 8. Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : isRescheduled
                                ? 'bg-amber-100 text-amber-800'
                                : isToday
                                ? 'bg-blue-100 text-[#2563EB]'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isOverdue && <AlertCircle className="w-3 h-3" />}
                            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                            <span>{isOverdue ? 'Overdue' : isToday ? 'Due Today' : item.status}</span>
                          </span>
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Call */}
                            <button
                              type="button"
                              onClick={(e) => handleCall(item.customerPhone, e)}
                              title={`Call ${item.customerName}`}
                              className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenWhatsAppModal(item, e)}
                              title="Message on WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-50 text-[#16A34A] hover:bg-[#16A34A] hover:text-white transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* Complete */}
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => setCompleteItem(item)}
                                title="Complete Follow-up"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            )}

                            {/* Reschedule */}
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => setRescheduleItem(item)}
                                title="Reschedule Follow-up"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                              >
                                Reschedule
                              </button>
                            )}

                            {/* View Customer Profile */}
                            <button
                              type="button"
                              onClick={() => handleViewCustomer(item)}
                              title="View Customer Profile"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div>
                Showing <strong className="text-slate-900">{filteredFollowUps.length}</strong> follow-ups
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Due Today
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      {/* Add Follow-up Modal */}
      <AddFollowUpModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialCustomer={initialSelectedCustomer}
        customers={allCustomers}
        users={users}
        currentUser={currentUser}
      />

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        followUp={completeItem}
        onClose={() => setCompleteItem(null)}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        followUp={rescheduleItem}
        onClose={() => setRescheduleItem(null)}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        followUp={whatsAppItem}
        executiveName={currentUser.name}
        onClose={() => setWhatsAppItem(null)}
      />
    </div>
  );
};

