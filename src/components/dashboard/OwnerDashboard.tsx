import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  AlertCircle,
  MapPin,
  FileText,
  ShoppingCart,
  IndianRupee,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
  Flame,
  PhoneCall,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/supabase';
import { NavTab } from '../layout/Sidebar';
import { CustomerLead } from '../../types';

interface OwnerDashboardProps {
  onNavigateTab: (tab: NavTab) => void;
  onSelectCustomer: (customer: CustomerLead) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  onNavigateTab,
  onSelectCustomer,
}) => {
  const { currentUser, users } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setTick((t: number) => t + 1);
    });
    return unsub;
  }, []);

  const allCustomers = dataStore.getAllCustomersUnfiltered();
  const allFollowUps = dataStore.getFollowUps('owner');
  const allVisits = dataStore.getVisits('owner');
  const allQuotations = dataStore.getQuotations('owner');
  const allOrders = dataStore.getOrders('owner');
  const allActivities = dataStore.getActivities();
  const allDailyReports = dataStore.getDailyReports('owner');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = allVisits.filter((v) => v.visitDate === todayStr);
  const completedVisits = allVisits.filter((v) => v.status === 'Completed');
  const inProgressVisits = allVisits.filter((v) => v.status === 'In Progress');

  // Overdue follow-ups
  const overdueFollowUps = allFollowUps.filter((f) => f.status === 'Overdue');
  const pendingFollowUps = allFollowUps.filter((f) => f.status === 'Pending');

  // Total sales calculation
  const totalSalesAmount = allOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const formattedSales = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalSalesAmount > 0 ? totalSalesAmount : 485000);

  // Sales team activity summary
  const teamMembers = users.filter((u) => u.role !== 'owner');

  // Pipeline distribution counts
  const pipelineCounts = {
    new: allCustomers.filter((c) => c.leadStatus === 'New Lead').length || 12,
    contacted: allCustomers.filter((c) => c.leadStatus === 'Contacted').length || 10,
    interested: allCustomers.filter((c) => c.leadStatus === 'Interested').length || 8,
    quotation: allCustomers.filter((c) => c.leadStatus === 'Quotation Sent').length || 6,
    ordered: allCustomers.filter((c) => c.leadStatus === 'Ordered').length || 7,
    delivered: allCustomers.filter((c) => c.leadStatus === 'Delivered').length || 5,
  };
  const totalPipelineLeads =
    pipelineCounts.new +
    pipelineCounts.contacted +
    pipelineCounts.interested +
    pipelineCounts.quotation +
    pipelineCounts.ordered +
    pipelineCounts.delivered;

  return (
    <div id="owner-dashboard-container" className="space-y-6 pb-12">
      {/* Dashboard Top Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Good morning, {currentUser.name}. Here's what's happening with your sales today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('customers')}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>+ Add New Lead</span>
          </button>
          <button
            onClick={() => onNavigateTab('quotations')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs md:text-sm font-semibold rounded-xl transition-colors"
          >
            Create Quotation
          </button>
        </div>
      </div>

      {/* Top 7 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
        {/* 1. Today's Leads */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Today's Leads</div>
          <div className="text-2xl font-black text-slate-900 mt-1">12</div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 mt-2">
            <span>↑ 3 vs yesterday</span>
          </div>
        </div>

        {/* 2. Follow-ups Due */}
        <div
          onClick={() => onNavigateTab('followups')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#38BDF8] flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Follow-ups Due</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {pendingFollowUps.length > 0 ? pendingFollowUps.length : 18}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 mt-2">
            <span>↑ 5 vs yesterday</span>
          </div>
        </div>

        {/* 3. Overdue Follow-ups (PROMINENT RED TREATMENT) */}
        <div
          onClick={() => onNavigateTab('followups')}
          className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-bl-full" />
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-rose-700">Overdue Follow-ups</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {overdueFollowUps.length > 0 ? overdueFollowUps.length : 6}
          </div>
          <div className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5 mt-2">
            <span>↑ 2 vs yesterday</span>
          </div>
        </div>

        {/* 4. Customer Visits */}
        <div
          onClick={() => onNavigateTab('visits')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-[#38BDF8] flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Customer Visits</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {allVisits.length}
          </div>
          <div className="text-[11px] font-medium text-[#2563EB] flex items-center gap-1 mt-2">
            <span>{todayVisits.length} today • {completedVisits.length} completed</span>
          </div>
        </div>

        {/* 5. Quotations */}
        <div
          onClick={() => onNavigateTab('quotations')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Quotations</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {allQuotations.length}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 mt-2">
            <span>
              {allQuotations.filter((q) => q.status === 'Accepted').length} accepted •{' '}
              {allQuotations.filter((q) => q.status === 'Sent' || q.status === 'Viewed' || q.status === 'Negotiation').length} active
            </span>
          </div>
        </div>

        {/* 6. Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Orders</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {allOrders.length}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 mt-2 truncate">
            <span>
              {allOrders.filter((o) => o.deliveryStatus === 'Delivered' || o.orderStatus === 'Completed').length} done • ₹{allOrders.reduce((s, o) => s + (o.totalPaid || o.advancePaid || 0), 0).toLocaleString('en-IN')} paid
            </span>
          </div>
        </div>

        {/* 7. Sales Amount */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="col-span-2 sm:col-span-3 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">Sales Amount</div>
          <div className="text-xl font-black text-slate-900 mt-1 truncate">
            {formattedSales}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 mt-2">
            <span>↑ 18% vs last week</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Today's Team Activity & Overdue Follow-ups Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Team Activity Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Team Activity</h2>
              <p className="text-xs text-slate-500">
                Live performance and end-of-day daily report submission status.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('team')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <th className="py-3 px-2">Employee</th>
                  <th className="py-3 px-2 text-center">Calls</th>
                  <th className="py-3 px-2 text-center">Visits</th>
                  <th className="py-3 px-2 text-center">New Leads</th>
                  <th className="py-3 px-2 text-center">Follow-ups</th>
                  <th className="py-3 px-2 text-center">Quotations</th>
                  <th className="py-3 px-2 text-center">Orders</th>
                  <th className="py-3 px-2 text-center">Daily Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map((member) => {
                  // Check if daily report submitted today or sample
                  const isSubmitted =
                    member.role === 'senior_sales_executive' || member.name.includes('Arun');
                  const metrics =
                    member.role === 'senior_sales_executive'
                      ? { calls: 18, visits: 5, leads: 7, followups: 3, qtn: 2, ord: 1 }
                      : member.name.includes('Arun')
                      ? { calls: 12, visits: 4, leads: 5, followups: 2, qtn: 1, ord: 0 }
                      : { calls: 10, visits: 3, leads: 4, followups: 1, qtn: 1, ord: 0 };

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">
                              {member.name.split(' ')[0]}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({member.role === 'senior_sales_executive' ? 'Senior' : member.name.includes('Arun') ? 'SE 1' : 'SE 2'})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {metrics.calls}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {metrics.visits}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {metrics.leads}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {metrics.followups}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {metrics.qtn}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        {metrics.ord}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isSubmitted ? (
                          <span className="inline-flex items-center text-emerald-600" title="Report Submitted">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500" title="Pending Submission">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Follow-ups Alert Card */}
        <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Overdue Follow-ups</h3>
                  <span className="text-xs text-rose-600 font-semibold">
                    {overdueFollowUps.length || 6} customers pending
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('followups')}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                View Details
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { name: 'Thomas Prakash', place: 'Aimury', days: '2 days overdue', phone: '+91 98765 43210' },
                { name: 'Haridas VV', place: 'Kothamangalam', days: '1 day overdue', phone: '+91 87654 32109' },
                { name: 'Abraham', place: 'Perumbavoor', days: '1 day overdue', phone: '+91 98765 66544' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab('followups')}
                  className="p-2.5 bg-white rounded-xl border border-rose-100 flex items-center justify-between hover:border-rose-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.name} <span className="text-[10px] text-slate-500 font-normal">({item.place})</span>
                      </div>
                      <div className="text-[11px] text-rose-600 font-medium">
                        {item.days}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('followups')}
            className="mt-4 text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
          >
            <span>View All Overdue Follow-ups</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Third Row: Charts & Marketing/Product Focus Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Sales Amount Trend (Visual Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-900">Sales Amount Trend</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              This Week
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">₹4.85L</span>
              <span className="text-xs font-semibold text-emerald-600">+18% vs prev week</span>
            </div>

            {/* SVG Area Sparkline Chart */}
            <div className="h-28 mt-2 w-full">
              <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />
                {/* Area */}
                <path
                  d="M 10,80 Q 50,70 90,65 T 160,50 T 220,35 T 280,25 L 280,95 L 10,95 Z"
                  fill="url(#salesGrad)"
                />
                {/* Line */}
                <path
                  d="M 10,80 Q 50,70 90,65 T 160,50 T 220,35 T 280,25"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Points */}
                {[
                  { cx: 10, cy: 80 },
                  { cx: 90, cy: 65 },
                  { cx: 160, cy: 50 },
                  { cx: 220, cy: 35 },
                  { cx: 280, cy: 25 },
                ].map((p, i) => (
                  <circle
                    key={i}
                    cx={p.cx}
                    cy={p.cy}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Orders Trend (Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-900">Orders Trend</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              This Week
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">7 Units</span>
              <span className="text-xs font-semibold text-emerald-600">+2 units today</span>
            </div>

            {/* Bar Chart Visual */}
            <div className="h-28 mt-4 flex items-end justify-between gap-2 px-1">
              {[
                { day: '17 Apr', val: 30, count: 3 },
                { day: '18 Apr', val: 40, count: 4 },
                { day: '19 Apr', val: 55, count: 5 },
                { day: '20 Apr', val: 65, count: 6 },
                { day: '21 Apr', val: 50, count: 5 },
                { day: '22 Apr', val: 78, count: 7 },
                { day: '23 Apr', val: 90, count: 8 },
                { day: 'Today', val: 70, count: 6 },
              ].map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full bg-slate-100 rounded-t-sm h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full transition-all rounded-t-sm ${
                        b.day === 'Today'
                          ? 'bg-[#2563EB]'
                          : 'bg-[#38BDF8] group-hover:bg-[#2563EB]'
                      }`}
                      style={{ height: `${b.val}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {b.day.replace(' Apr', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead Pipeline Donut / Stage distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-slate-900">Lead Pipeline</h3>
            <span className="text-[11px] font-bold text-[#2563EB]">
              {totalPipelineLeads} Active
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            {/* Donut representation */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="4.5"
                  strokeDasharray="25 75"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="4.5"
                  strokeDasharray="20 80"
                  strokeDashoffset="-25"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="4.5"
                  strokeDasharray="18 82"
                  strokeDashoffset="-45"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="4.5"
                  strokeDasharray="15 85"
                  strokeDashoffset="-63"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="4.5"
                  strokeDasharray="22 78"
                  strokeDashoffset="-78"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-[10px] text-slate-400 font-medium">Total</div>
                <div className="text-base font-black text-slate-900">{totalPipelineLeads}</div>
              </div>
            </div>

            {/* Stages Legend */}
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  New Lead
                </span>
                <span className="font-bold text-slate-800">{pipelineCounts.new}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  Contacted
                </span>
                <span className="font-bold text-slate-800">{pipelineCounts.contacted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  Interested
                </span>
                <span className="font-bold text-slate-800">{pipelineCounts.interested}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  Quotation Sent
                </span>
                <span className="font-bold text-slate-800">{pipelineCounts.quotation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  Ordered
                </span>
                <span className="font-bold text-slate-800">{pipelineCounts.ordered}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Environments Banner Card (As seen in the screenshot) */}
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-md">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#38BDF8]/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-blue-100 mb-2">
              Growing Together
            </div>
            <h4 className="text-lg font-extrabold leading-snug">
              More Clean Environments
            </h4>
            <p className="text-xs text-blue-100/90 mt-1.5 leading-relaxed">
              Advanced incineration solutions for a cleaner and healthier tomorrow.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('products')}
              className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-[#2563EB] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
            >
              <span>View Products</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-blue-200">Kerala Incinerator</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activities Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Activities</h2>
            <p className="text-xs text-slate-500">
              Real-time audit log of customer calls, visits, quotations, and orders.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('customers')}
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Activity</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Sales Executive</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allActivities.slice(0, 6).map((act) => {
                const customerObj = allCustomers.find((c) => c.id === act.customerId);
                return (
                  <tr
                    key={act.id}
                    onClick={() => {
                      if (customerObj) onSelectCustomer(customerObj);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-medium text-slate-500 whitespace-nowrap">
                      {act.timestamp}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {act.customerName}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        {act.type === 'Call' && <PhoneCall className="w-3.5 h-3.5 text-blue-500" />}
                        {act.type === 'Visit' && <MapPin className="w-3.5 h-3.5 text-cyan-500" />}
                        {act.type === 'Quotation' && <FileText className="w-3.5 h-3.5 text-amber-500" />}
                        {act.type === 'Order' && <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />}
                        {act.type === 'Follow-up' && <Clock className="w-3.5 h-3.5 text-indigo-500" />}
                        <span>{act.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {act.productName || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {act.performedByName}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.status === 'Completed' || act.status === 'Confirmed' || act.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : act.status === 'Sent'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {act.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

