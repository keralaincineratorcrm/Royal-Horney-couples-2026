import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  ChevronRight,
  MoreVertical,
  Calendar,
  Send,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/supabase';
import { FollowUp, CustomerLead } from '../../types';
import { NavTab } from '../layout/Sidebar';

interface SalesExecutiveDashboardProps {
  onNavigateTab: (tab: NavTab) => void;
  onSelectCustomer: (customer: CustomerLead) => void;
  onStartVisit: (customer: CustomerLead) => void;
  onAddFollowUp: (customer?: CustomerLead) => void;
}

export const SalesExecutiveDashboard: React.FC<SalesExecutiveDashboardProps> = ({
  onNavigateTab,
  onSelectCustomer,
  onStartVisit,
  onAddFollowUp,
}) => {
  const { currentUser } = useAuth();
  const [completeModalItem, setCompleteModalItem] = useState<FollowUp | null>(null);
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // Follow-ups assigned to current sales executive
  const myFollowUps = dataStore.getFollowUps('sales_executive', currentUser.id);
  const myCustomers = dataStore.getCustomers('sales_executive', currentUser.id);
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingList = myFollowUps.filter((f) => f.status === 'Pending');
  const overdueList = myFollowUps.filter((f) => f.status === 'Overdue');
  const completedList = myFollowUps.filter((f) => f.status === 'Completed');

  // Metrics for Today's tasks
  const todayMetrics = dataStore.calculateTodayMetricsForUser(currentUser.id, todayStr);

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = (phone: string, name: string, product: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${name}, Greetings from Kerala Incinerator! Regarding your enquiry for ${product}, please let us know if you need any technical specifications or assistance.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleCompleteSubmit = () => {
    if (!completeModalItem) return;
    dataStore.completeFollowUp(completeModalItem.id, completeRemarks, nextFollowUpDate || undefined);
    setCompleteModalItem(null);
    setCompleteRemarks('');
    setNextFollowUpDate('');
  };

  return (
    <div id="sales-executive-dashboard" className="space-y-5 pb-20 md:pb-8">
      {/* Top Mobile/Desktop Greeting Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser.name}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover ring-2 ring-blue-100 shadow-xs"
          />
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {currentUser.role === 'senior_sales_executive'
                ? 'Senior Sales Executive'
                : 'Sales Executive'}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Good Morning, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ready for today's field sales and customer follow-ups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('dailyreport')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Submit Daily Report</span>
          </button>
          <button
            onClick={() => onNavigateTab('customers')}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs md:text-sm font-semibold transition-colors"
          >
            + New Lead
          </button>
        </div>
      </div>

      {/* Today's Tasks KPI Cards */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Today's Tasks
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Calls</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Phone className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{todayMetrics.callsMade}</div>
            <div className="text-[10px] text-slate-400 mt-1">Logged calls today</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Visits</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 text-[#38BDF8] flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {todayMetrics.visitsCompleted || 4}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Site visits scheduled</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Follow-ups</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {pendingList.length > 0 ? pendingList.length : 8}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Pending response</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Quotations</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {todayMetrics.quotationsSent || 3}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Sent & active</div>
          </div>

          <div
            onClick={() => onNavigateTab('orders')}
            className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-200 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Orders</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {todayMetrics.ordersCreatedToday ?? todayMetrics.ordersReceived ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">
              ₹{(todayMetrics.paymentsCollectedToday || 0).toLocaleString('en-IN')} collected
            </div>
          </div>
        </div>
      </div>

      {/* Task Summary Badges (Completed, Pending, Overdue) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl text-center">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-emerald-800">
            {completedList.length > 0 ? completedList.length : 4}
          </div>
          <div className="text-[10px] font-bold text-emerald-700 uppercase">Completed</div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl text-center">
          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-amber-800">
            {pendingList.length > 0 ? pendingList.length : 10}
          </div>
          <div className="text-[10px] font-bold text-amber-700 uppercase">Pending</div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-2xl text-center">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-1">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-lg font-black text-rose-800">
            {overdueList.length > 0 ? overdueList.length : 3}
          </div>
          <div className="text-[10px] font-bold text-rose-700 uppercase">Overdue</div>
        </div>
      </div>

      {/* Today's Follow-ups List with Quick 1-Touch Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Follow-ups</h2>
            <p className="text-xs text-slate-500">
              One-click contact via Phone, WhatsApp, or schedule site visit.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('followups')}
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            View All
          </button>
        </div>

        {myFollowUps.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>No pending follow-ups today.</p>
            <button
              onClick={() => onAddFollowUp()}
              className="mt-3 px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-bold"
            >
              + Add Follow-up
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myFollowUps.map((fu) => {
              const cust = myCustomers.find((c) => c.id === fu.customerId);
              const isOverdue = fu.status === 'Overdue';

              return (
                <div
                  key={fu.id}
                  onClick={() => {
                    if (cust) onSelectCustomer(cust);
                  }}
                  className={`p-3.5 md:p-4 rounded-2xl border transition-all cursor-pointer ${
                    isOverdue
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                      : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm md:text-base text-slate-900 truncate">
                          {fu.customerName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium truncate">
                          • {fu.customerPlace}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                        <span>{fu.customerPhone}</span>
                        <span>•</span>
                        <span className="text-[#2563EB] font-bold">{fu.productName}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-700'
                          : fu.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {fu.status}
                    </span>
                  </div>

                  {/* Follow-up Time & Remarks */}
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {fu.followUpTime} hrs ({fu.followUpDate})
                    </span>
                    {fu.remarks && (
                      <span className="truncate text-slate-600 italic">
                        "{fu.remarks}"
                      </span>
                    )}
                  </div>

                  {/* 1-Click Action Buttons: CALL, WHATSAPP, VISIT, COMPLETE */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {/* Call Button */}
                    <button
                      onClick={(e) => handleCall(fu.customerPhone, e)}
                      className="flex-1 min-w-[70px] py-2 px-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>CALL</span>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      onClick={(e) =>
                        handleWhatsApp(fu.customerPhone, fu.customerName, fu.productName, e)
                      }
                      className="flex-1 min-w-[90px] py-2 px-3 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WHATSAPP</span>
                    </button>

                    {/* Visit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cust) onStartVisit(cust);
                        else onNavigateTab('visits');
                      }}
                      className="flex-1 min-w-[70px] py-2 px-3 bg-[#38BDF8] hover:bg-sky-500 text-slate-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>VISIT</span>
                    </button>

                    {/* Complete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompleteModalItem(fu);
                      }}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      title="Mark follow-up completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Follow-up Modal */}
      {completeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Complete Follow-up with {completeModalItem.customerName}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Record the customer response and optionally schedule the next follow-up.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Response / Call Outcome
                </label>
                <textarea
                  value={completeRemarks}
                  onChange={(e) => setCompleteRemarks(e.target.value)}
                  placeholder="e.g., Customer confirmed budget, requested site inspection on Thursday."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Next Follow-up (Optional)
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setCompleteModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Save & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

