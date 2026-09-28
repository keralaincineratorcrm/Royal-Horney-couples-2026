import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Users,
  Grid,
  List,
  RotateCcw,
  Eye,
  Phone,
  MessageCircle,
  FileText,
  ShoppingCart,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CustomerVisit, CustomerLead, UserRole } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { VisitCard } from './VisitCard';
import { VisitTable } from './VisitTable';
import { VisitCheckInModal } from './VisitCheckInModal';
import { ScheduleVisitModal } from './ScheduleVisitModal';
import { RescheduleVisitModal } from './RescheduleVisitModal';
import { VisitDetailModal } from './VisitDetailModal';
import { TeamVisitMonitoring } from './TeamVisitMonitoring';

interface VisitModuleProps {
  onSelectCustomer: (customer: CustomerLead) => void;
  initialCustomer?: CustomerLead | null;
  onCreateQuotation?: (customer: CustomerLead, visit: CustomerVisit) => void;
  onCreateOrder?: (customer: CustomerLead, visit: CustomerVisit) => void;
  onViewCustomer?: (customerId: string) => void;
}

type TabType = 'today' | 'upcoming' | 'completed' | 'missed' | 'all';

export const VisitModule: React.FC<VisitModuleProps> = ({
  onSelectCustomer,
  initialCustomer,
  onCreateQuotation,
  onCreateOrder,
  onViewCustomer,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  // Subscribe to real-time updates from dataStore
  const [visits, setVisits] = useState<CustomerVisit[]>(() =>
    dataStore.getVisits(currentUser.role, currentUser.id)
  );

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setVisits(dataStore.getVisits(currentUser.role, currentUser.id));
    });
    return unsub;
  }, [currentUser]);

  // Senior / Owner view scope toggle: "My Visits" vs "Team Visits"
  const [viewScope, setViewScope] = useState<'my' | 'team'>(
    isOwner ? 'team' : isSenior ? 'team' : 'my'
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('All');
  const [selectedOrderChanceFilter, setSelectedOrderChanceFilter] = useState<string>('All');

  // View presentation mode: 'cards' vs 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(!!initialCustomer);
  const [activeCheckInVisit, setActiveCheckInVisit] = useState<CustomerVisit | null>(null);
  const [activeDetailVisit, setActiveDetailVisit] = useState<CustomerVisit | null>(null);
  const [activeRescheduleVisit, setActiveRescheduleVisit] = useState<CustomerVisit | null>(null);

  // Filtered visits list based on view scope
  const scopeVisits = useMemo(() => {
    if (viewScope === 'my') {
      return visits.filter((v) => v.assignedToId === currentUser.id);
    }
    return visits;
  }, [visits, viewScope, currentUser.id]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const todayList = scopeVisits.filter((v) => v.visitDate === todayStr);
    const todayCount = todayList.length;
    const upcomingCount = scopeVisits.filter(
      (v) => (v.status === 'Scheduled' && v.visitDate > todayStr) || (v.visitDate === todayStr && v.status === 'Scheduled')
    ).length;
    const completedCount = scopeVisits.filter((v) => v.status === 'Completed').length;
    const missedCount = scopeVisits.filter((v) => v.status === 'Missed').length;

    return {
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      missed: missedCount,
    };
  }, [scopeVisits, todayStr]);

  // Distinct Filter options
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    scopeVisits.forEach((v) => {
      (v.productsDiscussed || []).forEach((p) => set.add(p));
    });
    return Array.from(set);
  }, [scopeVisits]);

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    scopeVisits.forEach((v) => {
      if (v.location) set.add(v.location);
      else if (v.customerPlace) set.add(v.customerPlace);
    });
    return Array.from(set);
  }, [scopeVisits]);

  const salesTeam = useMemo(() => {
    return users.filter((u) => u.role !== 'owner');
  }, [users]);

  // Tab Filtering + Search Query + Filters
  const filteredVisits = useMemo(() => {
    return scopeVisits.filter((v) => {
      // 1. Tab Filter
      if (activeTab === 'today') {
        if (v.visitDate !== todayStr) return false;
      } else if (activeTab === 'upcoming') {
        if (v.status !== 'Scheduled' && v.status !== 'In Progress') return false;
        if (v.visitDate < todayStr) return false;
      } else if (activeTab === 'completed') {
        if (v.status !== 'Completed') return false;
      } else if (activeTab === 'missed') {
        if (v.status !== 'Missed') return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.customerName.toLowerCase().includes(q);
        const matchesPlace = (v.location || v.customerPlace || '').toLowerCase().includes(q);
        const matchesPhone = (v.customerPhone || '').includes(q);
        const matchesProduct = (v.productsDiscussed || []).some((p) => p.toLowerCase().includes(q));
        const matchesExecutive = (v.assignedToName || v.executiveName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPlace && !matchesPhone && !matchesProduct && !matchesExecutive) {
          return false;
        }
      }

      // 3. Executive Filter
      if (selectedExecutiveFilter !== 'All') {
        if (v.assignedToId !== selectedExecutiveFilter) return false;
      }

      // 4. Status Filter
      if (selectedStatusFilter !== 'All') {
        if (v.status !== selectedStatusFilter) return false;
      }

      // 5. Product Filter
      if (selectedProductFilter !== 'All') {
        if (!v.productsDiscussed?.includes(selectedProductFilter)) return false;
      }

      // 6. Location Filter
      if (selectedLocationFilter !== 'All') {
        if (v.location !== selectedLocationFilter && v.customerPlace !== selectedLocationFilter) {
          return false;
        }
      }

      // 7. Order Chance Filter
      if (selectedOrderChanceFilter !== 'All') {
        if (v.orderChance !== selectedOrderChanceFilter) return false;
      }

      return true;
    });
  }, [
    scopeVisits,
    activeTab,
    todayStr,
    searchQuery,
    selectedExecutiveFilter,
    selectedStatusFilter,
    selectedProductFilter,
    selectedLocationFilter,
    selectedOrderChanceFilter,
  ]);

  const handleCardKpiClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedExecutiveFilter('All');
    setSelectedStatusFilter('All');
    setSelectedProductFilter('All');
    setSelectedLocationFilter('All');
    setSelectedOrderChanceFilter('All');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedExecutiveFilter !== 'All' ||
    selectedStatusFilter !== 'All' ||
    selectedProductFilter !== 'All' ||
    selectedLocationFilter !== 'All' ||
    selectedOrderChanceFilter !== 'All';

  return (
    <div id="visits-module-container" className="space-y-5 pb-24 md:pb-12 text-slate-800">
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Customer Visits</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
              Field Sales CRM
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Manage field sales visits, customer site inspections and GPS check-ins across Kerala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Senior Sales Executive Toggle (Section 20) */}
          {(isOwner || isSenior) && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewScope('my')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewScope === 'my'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Visits
              </button>
              <button
                type="button"
                onClick={() => setViewScope('team')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  viewScope === 'team'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Visits</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-black rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards (Clickable) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Visits */}
        <div
          onClick={() => handleCardKpiClick('today')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            activeTab === 'today'
              ? 'bg-blue-50/70 border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]'
              : 'bg-white border-slate-200 hover:border-blue-200 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Today's Visits
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {kpis.today}
          </div>
          <div className="text-[11px] font-semibold text-[#2563EB] mt-1 flex items-center gap-1">
            <span>Scheduled for today</span>
          </div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => handleCardKpiClick('upcoming')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            activeTab === 'upcoming'
              ? 'bg-sky-50/70 border-[#38BDF8] shadow-sm ring-1 ring-[#38BDF8]'
              : 'bg-white border-slate-200 hover:border-sky-200 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Upcoming
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {kpis.upcoming}
          </div>
          <div className="text-[11px] font-semibold text-[#0284C7] mt-1 flex items-center gap-1">
            <span>Pending visits</span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => handleCardKpiClick('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            activeTab === 'completed'
              ? 'bg-emerald-50/70 border-[#16A34A] shadow-sm ring-1 ring-[#16A34A]'
              : 'bg-white border-slate-200 hover:border-emerald-200 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {kpis.completed}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
            <span>Successful visits</span>
          </div>
        </div>

        {/* Missed */}
        <div
          onClick={() => handleCardKpiClick('missed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            activeTab === 'missed'
              ? 'bg-rose-50/70 border-[#EF4444] shadow-sm ring-1 ring-[#EF4444]'
              : 'bg-white border-slate-200 hover:border-rose-200 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Missed Visits
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#EF4444] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {kpis.missed}
          </div>
          <div className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
            <span>Requires rescheduling</span>
          </div>
        </div>
      </div>

      {/* 3. Team Monitoring Section (For Owner / Senior Executive) */}
      {(isOwner || isSenior) && viewScope === 'team' && (
        <TeamVisitMonitoring
          teamMembers={salesTeam}
          allVisits={visits}
          todayStr={todayStr}
          onSelectExecutive={(execId) => setSelectedExecutiveFilter(execId)}
          selectedExecutiveId={selectedExecutiveFilter !== 'All' ? selectedExecutiveFilter : undefined}
        />
      )}

      {/* 4. Filter & Tab Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 border-b border-slate-100">
          <div className="flex items-center gap-1 sm:gap-2">
            {(
              [
                { id: 'today', label: "Today's Visits", count: kpis.today },
                { id: 'upcoming', label: 'Upcoming', count: kpis.upcoming },
                { id: 'completed', label: 'Completed', count: kpis.completed },
                { id: 'missed', label: 'Missed', count: kpis.missed },
                { id: 'all', label: 'All Visits', count: scopeVisits.length },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View toggle (Grid / Table) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Card View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-500'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone, place, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sales Executive Filter (Owner / Senior) */}
          {(isOwner || isSenior) && (
            <div>
              <select
                value={selectedExecutiveFilter}
                onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Executives</option>
                {salesTeam.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location / District Filter */}
          <div>
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Kerala Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Products</option>
              {uniqueProducts.map((prod) => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">
              Showing <strong>{filteredVisits.length}</strong> matching visits
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Visits Content (Cards or Table) */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Customer Visits Found</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mt-1 mb-4">
            {hasActiveFilters
              ? 'No customer visits match your current search and filter criteria.'
              : `There are currently no ${activeTab === 'all' ? '' : activeTab} customer visits scheduled in this view.`}
          </p>
          <div className="flex items-center justify-center gap-2">
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Clear Filters
              </button>
            ) : null}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Visit</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <VisitTable
          visits={filteredVisits}
          onStartVisit={(v) => setActiveCheckInVisit(v)}
          onViewDetails={(v) => setActiveDetailVisit(v)}
          onReschedule={(v) => setActiveRescheduleVisit(v)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onStartVisit={(v) => setActiveCheckInVisit(v)}
              onViewDetails={(v) => setActiveDetailVisit(v)}
              onReschedule={(v) => setActiveRescheduleVisit(v)}
            />
          ))}
        </div>
      )}

      {/* MODAL 1: Schedule Visit Modal */}
      {showScheduleModal && (
        <ScheduleVisitModal
          initialCustomerId={initialCustomer?.id}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={(newVisitId) => {
            setShowScheduleModal(false);
            // Optionally open detail modal for the new visit
            if (newVisitId) {
              const created = dataStore.getVisits().find((v) => v.id === newVisitId);
              if (created) setActiveDetailVisit(created);
            }
          }}
        />
      )}

      {/* MODAL 2: Visit Check-in & In-progress / Complete Modal */}
      {activeCheckInVisit && (
        <VisitCheckInModal
          visit={activeCheckInVisit}
          onClose={() => setActiveCheckInVisit(null)}
          onComplete={(visitId, outcome) => {
            setActiveCheckInVisit(null);
            // Refresh detail modal if desired
            const updated = dataStore.getVisits().find((v) => v.id === visitId);
            if (updated) setActiveDetailVisit(updated);
          }}
          onCreateQuotation={onCreateQuotation}
          onCreateOrder={onCreateOrder}
        />
      )}

      {/* MODAL 3: Visit Detail Modal */}
      {activeDetailVisit && (
        <VisitDetailModal
          visit={activeDetailVisit}
          onClose={() => setActiveDetailVisit(null)}
          onStartVisit={(v) => {
            setActiveDetailVisit(null);
            setActiveCheckInVisit(v);
          }}
          onReschedule={(v) => {
            setActiveDetailVisit(null);
            setActiveRescheduleVisit(v);
          }}
          onViewCustomer={onViewCustomer}
          onCreateQuotation={onCreateQuotation}
          onCreateOrder={onCreateOrder}
        />
      )}

      {/* MODAL 4: Reschedule Visit Modal */}
      {activeRescheduleVisit && (
        <RescheduleVisitModal
          visit={activeRescheduleVisit}
          onClose={() => setActiveRescheduleVisit(null)}
          onSuccess={(newVisitId) => {
            setActiveRescheduleVisit(null);
            if (newVisitId) {
              const created = dataStore.getVisits().find((v) => v.id === newVisitId);
              if (created) setActiveDetailVisit(created);
            }
          }}
        />
      )}
    </div>
  );
};

