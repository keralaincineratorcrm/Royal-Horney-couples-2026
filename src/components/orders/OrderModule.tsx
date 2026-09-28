import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Search,
  Filter,
  Download,
  Phone,
  MessageCircle,
  CreditCard,
  MapPin,
  Calendar,
  Eye,
  Printer,
  ChevronDown,
  LayoutGrid,
  List,
  Wrench,
  Award,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Order, Payment, CustomerLead, DeliveryStatus, PaymentStatus } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { OrderStatsCards } from './OrderStatsCards';
import { OrderDetailModal } from './OrderDetailModal';
import { CreateOrderModal } from './CreateOrderModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { UpdateDeliveryModal } from './UpdateDeliveryModal';
import { OrderReceiptModal } from './OrderReceiptModal';

interface OrderModuleProps {
  onSelectCustomer: (customer: CustomerLead) => void;
  initialCustomer?: CustomerLead | null;
  onNavigateTab?: (tab: string) => void;
}

export const OrderModule: React.FC<OrderModuleProps> = ({
  onSelectCustomer,
  initialCustomer,
  onNavigateTab,
}) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'senior_sales_executive';

  // Live state
  const [orders, setOrders] = useState<Order[]>(
    dataStore.getOrders(currentUser.role, currentUser.id)
  );
  const [payments, setPayments] = useState<Payment[]>(dataStore.getPayments());

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setOrders(dataStore.getOrders(currentUser.role, currentUser.id));
      setPayments(dataStore.getPayments());
    });
    return unsub;
  }, [currentUser]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(!!initialCustomer);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<Order | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [executiveFilter, setExecutiveFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct lists for filters
  const districts = Array.from(
    new Set(orders.map((o) => o.district).filter(Boolean) as string[])
  ).sort();
  const executives = Array.from(
    new Set(
      orders
        .map((o) => o.assignedToName || o.assignedExecutiveName)
        .filter(Boolean) as string[]
    )
  ).sort();

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.customerPlace.toLowerCase().includes(q) ||
        (o.district && o.district.toLowerCase().includes(q)) ||
        (o.productName && o.productName.toLowerCase().includes(q)) ||
        (o.sourceQuotationNumber && o.sourceQuotationNumber.toLowerCase().includes(q));
      if (!match) return false;
    }

    // 2. Status Tab / KPI Filter
    if (selectedFilter !== 'All') {
      if (selectedFilter === 'PendingPayment') {
        const bal = o.balanceDue ?? o.balanceAmount ?? Math.max(0, (o.grandTotal || o.amount) - (o.totalPaid || o.advancePaid || 0));
        if (bal <= 0) return false;
      } else if (selectedFilter === 'Installed') {
        if (o.deliveryStatus !== 'Installed' && o.installationStatus !== 'Completed') return false;
      } else if (selectedFilter === 'Completed') {
        if (o.orderStatus !== 'Completed' && o.deliveryStatus !== 'Completed') return false;
      } else {
        if (o.deliveryStatus !== selectedFilter && o.orderStatus !== selectedFilter) return false;
      }
    }

    // 3. Payment Filter
    if (paymentFilter !== 'All') {
      if (paymentFilter === 'Fully Paid' && o.paymentStatus !== 'Fully Paid' && o.paymentStatus !== 'Paid') return false;
      if (paymentFilter === 'Advance' && o.paymentStatus !== 'Advance Received' && o.paymentStatus !== 'Advance') return false;
      if (paymentFilter === 'Partial' && o.paymentStatus !== 'Partial Paid' && o.paymentStatus !== 'Partial') return false;
      if (paymentFilter === 'Pending' && o.paymentStatus !== 'Pending') return false;
    }

    // 4. District Filter
    if (districtFilter !== 'All' && o.district !== districtFilter) {
      return false;
    }

    // 5. Executive Filter
    if (executiveFilter !== 'All') {
      const execName = o.assignedToName || o.assignedExecutiveName;
      if (execName !== executiveFilter) return false;
    }

    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Order Date',
      'Source Quotation',
      'Customer Name',
      'Phone',
      'Place',
      'District',
      'Product',
      'Quantity',
      'Total Amount (₹)',
      'Total Paid (₹)',
      'Balance Due (₹)',
      'Payment Status',
      'Delivery Status',
      'Expected Delivery Date',
      'Actual Delivery Date',
      'Installation Status',
      'Assigned Executive',
    ];

    const rows = filteredOrders.map((o) => {
      const grandTotal = o.grandTotal || o.amount || 0;
      const totalPaid = o.totalPaid || o.advancePaid || 0;
      const bal = o.balanceDue ?? o.balanceAmount ?? Math.max(0, grandTotal - totalPaid);

      return [
        `"${o.orderNumber}"`,
        `"${o.orderDate || ''}"`,
        `"${o.sourceQuotationNumber || o.source_quotation_id || ''}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerPhone}"`,
        `"${o.customerPlace}"`,
        `"${o.district || ''}"`,
        `"${(o.productName || '').replace(/"/g, '""')}"`,
        o.quantity || 1,
        grandTotal,
        totalPaid,
        bal,
        `"${o.paymentStatus}"`,
        `"${o.deliveryStatus}"`,
        `"${o.expectedDeliveryDate || ''}"`,
        `"${o.actualDeliveryDate || o.deliveryDate || ''}"`,
        `"${o.installationStatus || ''}"`,
        `"${o.assignedToName || o.assignedExecutiveName || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kerala_Incinerator_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV successfully.');
  };

  const statusTabs = [
    { id: 'All', label: 'All Orders' },
    { id: 'Processing', label: 'In Production' },
    { id: 'Ready for Dispatch', label: 'Ready Dispatch' },
    { id: 'In Transit', label: 'In Transit' },
    { id: 'Delivered', label: 'Delivered' },
    { id: 'Installed', label: 'Installed' },
    { id: 'Completed', label: 'Completed' },
    { id: 'PendingPayment', label: 'Balance Due' },
  ];

  return (
    <div id="orders-module-container" className="space-y-4 pb-20 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Orders, Payments & Delivery Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full sales order execution: fabrication tracking, advance collections, field dispatches, and on-site incinerator commissioning.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Export filtered orders to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-extrabold shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Real-time Order Stats & KPI Cards */}
      <OrderStatsCards
        orders={orders}
        payments={payments}
        selectedFilter={selectedFilter}
        onSelectFilter={(filter) => setSelectedFilter(filter)}
      />

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Horizontal Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {statusTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer, Phone, Place, Product, or Quotation..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
              showAdvancedFilters || districtFilter !== 'All' || paymentFilter !== 'All' || executiveFilter !== 'All'
                ? 'bg-blue-50 border-blue-200 text-[#2563EB]'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white text-[#2563EB] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Expansion */}
        {showAdvancedFilters && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-150 text-xs">
            {/* Payment Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Fully Paid">Fully Paid</option>
                <option value="Advance">Advance Received</option>
                <option value="Partial">Partial Paid</option>
                <option value="Pending">Pending Payment</option>
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                District (Kerala)
              </label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="All">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Executive Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Assigned Executive
              </label>
              <select
                value={executiveFilter}
                onChange={(e) => setExecutiveFilter(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="All">All Sales Executives</option>
                {executives.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">No Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || selectedFilter !== 'All'
                ? 'No customer orders match your current search terms or filters.'
                : 'No sales orders have been registered yet. Create a new order or convert an accepted customer quotation.'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Order</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="grid grid-cols-1 gap-3.5">
          {filteredOrders.map((ord) => {
            const grandTotal = ord.grandTotal || ord.amount || 0;
            const totalPaid = ord.totalPaid || ord.advancePaid || 0;
            const bal = ord.balanceDue ?? ord.balanceAmount ?? Math.max(0, grandTotal - totalPaid);
            const isCompleted = ord.orderStatus === 'Completed' || ord.deliveryStatus === 'Completed';

            return (
              <div
                key={ord.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-200 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                {/* Top Row: Order #, Badges, Customer Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-slate-900 tracking-tight">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({ord.orderDate})
                      </span>
                      {ord.sourceQuotationNumber && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                          Qtn: {ord.sourceQuotationNumber}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.deliveryStatus === 'Delivered'
                            ? 'bg-teal-100 text-teal-800'
                            : ord.deliveryStatus === 'In Transit'
                            ? 'bg-sky-100 text-sky-800'
                            : ord.deliveryStatus === 'Ready for Dispatch'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.deliveryStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bal <= 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : totalPaid > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{ord.customerName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">
                        {ord.customerPlace}
                        {ord.district ? `, ${ord.district}` : ''}
                      </span>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="text-xs text-[#2563EB] font-bold hover:underline ml-1 inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{ord.customerPhone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Header: Value & Balance */}
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-base font-black text-slate-900">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center sm:justify-end gap-2 mt-0.5">
                      <span className="text-emerald-700 font-semibold">
                        Paid: ₹{totalPaid.toLocaleString('en-IN')}
                      </span>
                      <span>•</span>
                      <span className={`font-bold ${bal > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        Due: ₹{bal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Product & Delivery Info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800">
                      Product:{' '}
                      <span className="text-slate-900 font-bold">
                        {ord.productName || 'Kerala Incinerator'} (x{ord.quantity || 1})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-md">
                        {ord.deliveryAddress || ord.customerPlace}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      <span>ETA: <strong>{ord.expectedDeliveryDate || 'Prompt'}</strong></span>
                    </div>
                    {ord.actualDeliveryDate && (
                      <span className="text-emerald-700 font-semibold">
                        Delivered: {ord.actualDeliveryDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedOrderForDetail(ord)}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => setPaymentModalOrder(ord)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>

                    <button
                      onClick={() => setDeliveryModalOrder(ord)}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold border border-sky-200 transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Update Dispatch</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setReceiptModalOrder(ord)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Print Challan & Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const cust = dataStore.getCustomerById(ord.customerId);
                        if (cust) onSelectCustomer(cust);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Customer Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Order Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer & Location</th>
                  <th className="py-3 px-3">Equipment</th>
                  <th className="py-3 px-3 text-right">Total (₹)</th>
                  <th className="py-3 px-3 text-right">Paid (₹)</th>
                  <th className="py-3 px-3 text-right">Due (₹)</th>
                  <th className="py-3 px-3">Delivery</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((ord) => {
                  const grandTotal = ord.grandTotal || ord.amount || 0;
                  const totalPaid = ord.totalPaid || ord.advancePaid || 0;
                  const bal = ord.balanceDue ?? ord.balanceAmount ?? Math.max(0, grandTotal - totalPaid);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        <button
                          onClick={() => setSelectedOrderForDetail(ord)}
                          className="hover:text-[#2563EB] hover:underline text-left"
                        >
                          {ord.orderNumber}
                        </button>
                        {ord.sourceQuotationNumber && (
                          <div className="text-[10px] text-blue-600 font-semibold">
                            {ord.sourceQuotationNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {ord.orderDate}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-500">
                          {ord.customerPlace}
                          {ord.district ? `, ${ord.district}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 truncate max-w-xs">
                          {ord.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">Qty: {ord.quantity || 1}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                        ₹{bal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.deliveryStatus === 'Delivered' || ord.deliveryStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.deliveryStatus === 'In Transit'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.deliveryStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bal <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPaymentModalOrder(ord)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeliveryModalOrder(ord)}
                            className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors"
                            title="Update Dispatch"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReceiptModalOrder(ord)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                            title="Print Challan"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newOrd) => {
            setShowCreateModal(false);
            showToast(`Order ${newOrd.orderNumber} successfully confirmed!`);
          }}
          initialCustomer={initialCustomer}
        />
      )}

      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onUpdate={() => {
            setOrders(dataStore.getOrders(currentUser.role, currentUser.id));
            setPayments(dataStore.getPayments());
          }}
          onSelectCustomer={onSelectCustomer}
        />
      )}

      {paymentModalOrder && (
        <RecordPaymentModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onSuccess={(p) => {
            setPaymentModalOrder(null);
            showToast(`Payment of ₹${p.amount.toLocaleString('en-IN')} recorded for ${p.orderNumber}!`);
          }}
        />
      )}

      {deliveryModalOrder && (
        <UpdateDeliveryModal
          order={deliveryModalOrder}
          onClose={() => setDeliveryModalOrder(null)}
          onSuccess={() => {
            setDeliveryModalOrder(null);
            showToast('Dispatch & delivery details updated successfully.');
          }}
        />
      )}

      {receiptModalOrder && (
        <OrderReceiptModal
          order={receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}
    </div>
  );
};

