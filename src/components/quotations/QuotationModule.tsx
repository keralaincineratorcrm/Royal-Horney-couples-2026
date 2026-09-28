import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Printer,
  CheckCircle2,
  X,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  IndianRupee,
  Calendar,
  User,
  Clock,
  ArrowUpDown,
  Phone,
  MapPin,
  Eye,
  Copy,
  ShoppingCart,
  Check,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { Quotation, QuotationStatus, CustomerLead, Product } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  generateQuotationPDF,
  printQuotationPdf,
  shareQuotationWhatsApp,
  formatINR,
} from '../../lib/pdfGenerator';
import { CreateQuotationModal } from './CreateQuotationModal';
import { QuotationDetailModal } from './QuotationDetailModal';
import { QuotationPreviewModal } from './QuotationPreviewModal';

interface QuotationModuleProps {
  onSelectCustomer: (customer: CustomerLead) => void;
  initialCustomer?: CustomerLead | null;
  onConvertToOrder?: (quotation: Quotation) => void;
  onNavigateTab?: (tab: string) => void;
}

const STATUS_BADGE: Record<
  QuotationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  Draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  Sent: { label: 'Sent', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  Viewed: { label: 'Viewed', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  Negotiation: {
    label: 'Negotiation',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  Accepted: {
    label: 'Accepted',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  Rejected: { label: 'Rejected', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  Expired: { label: 'Expired', bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-300' },
};

export const QuotationModule: React.FC<QuotationModuleProps> = ({
  onSelectCustomer,
  initialCustomer,
  onConvertToOrder,
  onNavigateTab,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();

  // Data
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    dataStore.getQuotations(currentUser.role, currentUser.id)
  );
  const products = dataStore.getProducts();
  const customers = dataStore.getCustomers(currentUser.role, currentUser.id);

  // Subscribe to changes in dataStore
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setQuotations(dataStore.getQuotations(currentUser.role, currentUser.id));
    });
    return unsubscribe;
  }, [currentUser]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(!!initialCustomer);
  const [selectedQuotationForDetail, setSelectedQuotationForDetail] = useState<Quotation | null>(null);
  const [selectedQuotationForPreview, setSelectedQuotationForPreview] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [executiveFilter, setExecutiveFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [amountFilter, setAmountFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name'>(
    'date-desc'
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Quick Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert Quotation to Order handler
  const handleConvertQuotationToOrder = (quotation: Quotation) => {
    try {
      const order = dataStore.convertQuotationToOrder(quotation.id);
      if (!order) {
        alert('Could not convert quotation to order.');
        return;
      }
      showToast(`Quotation ${quotation.quotationNumber} successfully converted to Order ${order.orderNumber}!`);
      if (selectedQuotationForDetail) {
        setSelectedQuotationForDetail(null);
      }
      if (onConvertToOrder) {
        onConvertToOrder(quotation);
      } else if (onNavigateTab) {
        onNavigateTab('orders');
      }
    } catch (e: any) {
      alert(`Could not convert to order: ${e?.message || e}`);
    }
  };

  // Duplicate Quotation handler
  const handleDuplicateQuotation = (quotation: Quotation) => {
    const dup: Quotation = {
      ...quotation,
      id: '',
      quotationNumber: dataStore.generateNextQuotationNumber(),
      quotationDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      convertedToOrderId: undefined,
      createdAt: new Date().toISOString(),
    };
    setEditingQuotation(dup);
    setShowCreateModal(true);
    if (selectedQuotationForDetail) {
      setSelectedQuotationForDetail(null);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = quotations.length;
    const draft = quotations.filter((q) => q.status === 'Draft').length;
    const sent = quotations.filter((q) => q.status === 'Sent' || q.status === 'Viewed').length;
    const negotiation = quotations.filter((q) => q.status === 'Negotiation').length;
    const accepted = quotations.filter((q) => q.status === 'Accepted').length;
    const rejected = quotations.filter((q) => q.status === 'Rejected').length;
    const totalValue = quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
    const acceptedValue = quotations
      .filter((q) => q.status === 'Accepted')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);

    return { total, draft, sent, negotiation, accepted, rejected, totalValue, acceptedValue };
  }, [quotations]);

  // Filtered & Sorted Quotations
  const filteredQuotations = useMemo(() => {
    return quotations
      .filter((q) => {
        // 1. Text Search
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchNumber = q.quotationNumber.toLowerCase().includes(query);
          const matchCustomer = q.customerName.toLowerCase().includes(query);
          const matchPhone = (q.customerPhone || '').includes(query);
          const matchPlace = (q.customerPlace || '').toLowerCase().includes(query);
          const matchProduct = (q.items || []).some((it) =>
            it.productName.toLowerCase().includes(query)
          );
          if (!matchNumber && !matchCustomer && !matchPhone && !matchPlace && !matchProduct) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter !== 'All') {
          if (statusFilter === 'Sent') {
            if (q.status !== 'Sent' && q.status !== 'Viewed') return false;
          } else if (q.status !== statusFilter) {
            return false;
          }
        }

        // 3. Executive Filter
        if (executiveFilter !== 'All') {
          if (q.assignedToId !== executiveFilter && q.preparedById !== executiveFilter) {
            return false;
          }
        }

        // 4. Product Filter
        if (productFilter !== 'All') {
          const hasProduct = (q.items || []).some(
            (it) => it.productId === productFilter || it.productName.includes(productFilter)
          );
          if (!hasProduct) return false;
        }

        // 5. Date Filter
        if (dateFilter !== 'All') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (dateFilter === 'Today') {
            if (q.quotationDate !== todayStr) return false;
          } else if (dateFilter === 'Last 7 Days') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];
            if (q.quotationDate < sevenDaysAgo) return false;
          } else if (dateFilter === 'This Month') {
            const thisMonthPrefix = todayStr.substring(0, 7);
            if (!q.quotationDate.startsWith(thisMonthPrefix)) return false;
          }
        }

        // 6. Amount Filter
        if (amountFilter !== 'All') {
          const amt = q.totalAmount || 0;
          if (amountFilter === 'Under ₹25k' && amt >= 25000) return false;
          if (amountFilter === '₹25k - ₹50k' && (amt < 25000 || amt > 50000)) return false;
          if (amountFilter === '₹50k - ₹1L' && (amt < 50000 || amt > 100000)) return false;
          if (amountFilter === 'Above ₹1L' && amt <= 100000) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.quotationDate).getTime() - new Date(a.quotationDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.quotationDate).getTime() - new Date(b.quotationDate).getTime();
        }
        if (sortBy === 'amount-desc') {
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        if (sortBy === 'amount-asc') {
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        }
        if (sortBy === 'name') {
          return a.customerName.localeCompare(b.customerName);
        }
        return 0;
      });
  }, [
    quotations,
    searchQuery,
    statusFilter,
    executiveFilter,
    productFilter,
    dateFilter,
    amountFilter,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setExecutiveFilter('All');
    setProductFilter('All');
    setDateFilter('All');
    setAmountFilter('All');
    setSortBy('date-desc');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'All' ||
    executiveFilter !== 'All' ||
    productFilter !== 'All' ||
    dateFilter !== 'All' ||
    amountFilter !== 'All';

  return (
    <div id="quotations-module-root" className="space-y-4 pb-20 md:pb-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Quotations & Estimates
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-[#2563EB]">
              {quotations.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            GST-compliant Kerala Incinerator quotations with instant PDF generation, letterhead printing, and WhatsApp sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-create-quotation"
            onClick={() => {
              setEditingQuotation(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* 2. CLICKABLE KPI CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-blue-50/80 border-[#2563EB] shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total
          </div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All created</div>
        </div>

        {/* Draft */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Draft' ? 'All' : 'Draft')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Draft'
              ? 'bg-slate-100 border-slate-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Draft
          </div>
          <div className="text-xl font-black text-slate-700 mt-0.5">{stats.draft}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unsent</div>
        </div>

        {/* Sent / Viewed */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Sent' ? 'All' : 'Sent')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Sent'
              ? 'bg-blue-50 border-blue-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            Sent / Viewed
          </div>
          <div className="text-xl font-black text-blue-700 mt-0.5">{stats.sent}</div>
          <div className="text-[10px] text-blue-500 mt-0.5">Delivered</div>
        </div>

        {/* Negotiation */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Negotiation' ? 'All' : 'Negotiation')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Negotiation'
              ? 'bg-amber-50 border-amber-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            Negotiation
          </div>
          <div className="text-xl font-black text-amber-700 mt-0.5">{stats.negotiation}</div>
          <div className="text-[10px] text-amber-500 mt-0.5">In discussions</div>
        </div>

        {/* Accepted */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Accepted' ? 'All' : 'Accepted')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Accepted'
              ? 'bg-emerald-50 border-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Accepted
          </div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{stats.accepted}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {formatINR(stats.acceptedValue)}
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Rejected' ? 'All' : 'Rejected')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-50 border-rose-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            Rejected
          </div>
          <div className="text-xl font-black text-rose-700 mt-0.5">{stats.rejected}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Lost / Expired</div>
        </div>

        {/* Total Pipeline Value */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-900 to-[#0F172A] text-white">
          <div className="text-[10px] font-extrabold text-blue-200 uppercase tracking-wider">
            Total Value
          </div>
          <div className="text-base font-black text-[#38BDF8] mt-0.5 truncate">
            {formatINR(stats.totalValue)}
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            Avg: {formatINR(stats.total ? Math.round(stats.totalValue / stats.total) : 0)}
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="input-quotation-search"
              type="text"
              placeholder="Search by QTN #, Customer, Phone, Place (e.g. Ernakulam), or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Quick Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Viewed">Viewed</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>

            {/* Sort Dropdown */}
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="name">Customer (A-Z)</option>
            </select>

            {/* Toggle Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-blue-50 border-[#2563EB] text-[#2563EB]'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Expandable Row */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
            {/* Executive Filter (Owner/Senior) */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Sales Executive
              </label>
              <select
                value={executiveFilter}
                onChange={(e) => setExecutiveFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Executives</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Model Filter */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Incinerator Model
              </label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="This Month">This Month</option>
              </select>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Quotation Amount
              </label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="All">All Values</option>
                <option value="Under ₹25k">Under ₹25,000</option>
                <option value="₹25k - ₹50k">₹25,000 - ₹50,000</option>
                <option value="₹50k - ₹1L">₹50,000 - ₹1,00,000</option>
                <option value="Above ₹1L">Above ₹1,00,000</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN QUOTATIONS LIST / TABLE */}
      {filteredQuotations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">No Quotations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No quotations match your active search or filter criteria. Try clearing filters.'
              : 'Create your first GST-compliant customer quotation for incinerator installations.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quotation</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table Layout (hidden on mobile, visible sm+) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0F172A] text-white text-[10px] font-extrabold uppercase">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer & Location</th>
                  <th className="py-3 px-4">Products & Spec</th>
                  <th className="py-3 px-4">Executive</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQuotations.map((q) => {
                  const statusObj = STATUS_BADGE[q.status] || STATUS_BADGE.Draft;
                  const isExp =
                    q.validUntil &&
                    q.status !== 'Accepted' &&
                    q.status !== 'Rejected' &&
                    new Date(q.validUntil) < new Date();
                  const custObj = customers.find((c) => c.id === q.customerId);

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedQuotationForDetail(q)}
                    >
                      {/* Quotation # */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#2563EB] flex items-center gap-1.5">
                          <span>{q.quotationNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {q.quotationDate}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div
                          onClick={() => {
                            if (custObj) onSelectCustomer(custObj);
                          }}
                          className="font-extrabold text-slate-900 hover:text-[#2563EB] cursor-pointer flex items-center gap-1"
                        >
                          <span>{q.customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{q.customerPlace}</span>
                          <span className="text-slate-300">•</span>
                          <span>{q.customerPhone}</span>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {q.items[0]?.productName || 'Incinerator Unit'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {q.items.length > 1
                            ? `+ ${q.items.length - 1} other item(s)`
                            : `Qty: ${q.items[0]?.quantity || 1} • ${q.items[0]?.capacity || ''}`}
                        </div>
                      </td>

                      {/* Executive */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {q.assignedToName || q.preparedByName || 'Sales Executive'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{Math.round(q.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          incl. 18% GST
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusObj.bg} ${statusObj.text} ${statusObj.border}`}
                        >
                          {q.status}
                        </span>
                        {q.convertedToOrderId && (
                          <div className="text-[9px] font-bold text-emerald-700 mt-0.5">
                            ✓ Ordered
                          </div>
                        )}
                      </td>

                      {/* Valid Until */}
                      <td className="py-3.5 px-4">
                        <span className={isExp ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                          {q.validUntil || '15 Days'}
                        </span>
                        {isExp && (
                          <div className="text-[9px] text-rose-500 font-bold uppercase">Expired</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Letterhead Preview */}
                          <button
                            id={`btn-table-preview-${q.id}`}
                            onClick={() => setSelectedQuotationForPreview(q)}
                            className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-[#2563EB] rounded-lg transition-colors"
                            title="Preview Letterhead Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* PDF Download */}
                          <button
                            id={`btn-table-pdf-${q.id}`}
                            onClick={() => generateQuotationPDF(q)}
                            className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-[#2563EB] rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            id={`btn-table-whatsapp-${q.id}`}
                            onClick={() => shareQuotationWhatsApp(q)}
                            className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-[#16A34A] rounded-lg transition-colors"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Convert to Order (if accepted) */}
                          {q.status === 'Accepted' && !q.convertedToOrderId && (
                            <button
                              id={`btn-table-convert-${q.id}`}
                              onClick={() => handleConvertQuotationToOrder(q)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-extrabold transition-colors flex items-center gap-1 border border-emerald-300"
                              title="Convert Quotation to Confirmed Order"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Convert</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Touch Cards Layout (visible on screens < lg) */}
          <div className="lg:hidden space-y-3">
            {filteredQuotations.map((q) => {
              const statusObj = STATUS_BADGE[q.status] || STATUS_BADGE.Draft;
              const isExp =
                q.validUntil &&
                q.status !== 'Accepted' &&
                q.status !== 'Rejected' &&
                new Date(q.validUntil) < new Date();
              const custObj = customers.find((c) => c.id === q.customerId);

              return (
                <div
                  key={q.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  {/* Card Top: Number, Date, Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#2563EB] text-sm">
                          {q.quotationNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusObj.bg} ${statusObj.text} ${statusObj.border}`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Issued: {q.quotationDate} • Valid: {q.validUntil || '15 Days'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">
                        ₹{Math.round(q.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-slate-400">incl. 18% GST</div>
                    </div>
                  </div>

                  {/* Customer Information with Quick Touch Dial & WhatsApp */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div
                        onClick={() => {
                          if (custObj) onSelectCustomer(custObj);
                        }}
                        className="font-extrabold text-slate-900 text-sm hover:text-[#2563EB] cursor-pointer"
                      >
                        {q.customerName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{q.customerPlace}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${q.customerPhone}`}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => shareQuotationWhatsApp(q)}
                        className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] flex items-center justify-center transition-colors"
                        title="WhatsApp Customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Products Summary */}
                  <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex justify-between">
                      <span>{q.items[0]?.productName || 'Incinerator'}</span>
                      <span className="text-slate-500 font-normal">
                        Qty: {q.items[0]?.quantity || 1}
                      </span>
                    </div>
                    {q.items.length > 1 && (
                      <div className="text-[10px] text-slate-500">
                        + {q.items.length - 1} additional product(s) in quotation
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Quick Actions (touch target >= 44px) */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedQuotationForDetail(q)}
                      className="min-h-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => generateQuotationPDF(q)}
                      className="min-h-[44px] px-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex-1 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </button>

                    {q.status === 'Accepted' && !q.convertedToOrderId ? (
                      <button
                        onClick={() => handleConvertQuotationToOrder(q)}
                        className="min-h-[44px] px-3 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex-1 flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Order</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDuplicateQuotation(q)}
                        className="min-h-[44px] px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Duplicate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MODALS */}

      {/* Create / Edit Quotation Modal */}
      {showCreateModal && (
        <CreateQuotationModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingQuotation(null);
          }}
          onSuccess={(saved) => {
            setShowCreateModal(false);
            setEditingQuotation(null);
            showToast(`Quotation ${saved.quotationNumber} saved successfully!`);
          }}
          initialCustomer={initialCustomer}
          editQuotation={editingQuotation}
        />
      )}

      {/* Quotation Detail Modal */}
      {selectedQuotationForDetail && (
        <QuotationDetailModal
          quotation={selectedQuotationForDetail}
          onClose={() => setSelectedQuotationForDetail(null)}
          onEdit={(q) => {
            setSelectedQuotationForDetail(null);
            setEditingQuotation(q);
            setShowCreateModal(true);
          }}
          onConvertToOrder={handleConvertQuotationToOrder}
          onSelectCustomer={onSelectCustomer}
          onDuplicate={handleDuplicateQuotation}
        />
      )}

      {/* Quotation In-App Letterhead Preview Modal */}
      {selectedQuotationForPreview && (
        <QuotationPreviewModal
          quotation={selectedQuotationForPreview}
          onClose={() => setSelectedQuotationForPreview(null)}
          onConvertToOrder={handleConvertQuotationToOrder}
        />
      )}
    </div>
  );
};

