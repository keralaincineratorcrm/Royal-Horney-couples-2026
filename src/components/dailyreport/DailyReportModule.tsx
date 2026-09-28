import React, { useState } from 'react';
import {
  ClipboardCheck,
  Send,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  IndianRupee,
  Phone,
  MapPin,
  FileText,
  ShoppingCart,
  Plus,
} from 'lucide-react';
import { DailyReport } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const DailyReportModule: React.FC = () => {
  const { currentUser, isOwner, isSenior, users } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState('All');

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-calculated metrics for today for the current user
  const todayMetrics = dataStore.calculateTodayMetricsForUser(currentUser.id, todayStr);

  // Form states
  const [callsMade, setCallsMade] = useState(todayMetrics.callsMade || 12);
  const [visitsDone, setVisitsDone] = useState(todayMetrics.visitsCompleted || 4);
  const [newLeads, setNewLeads] = useState(todayMetrics.newLeadsCreated || 5);
  const [followupsDone, setFollowupsDone] = useState(todayMetrics.followUpsCompleted || 3);
  const [quotationsSent, setQuotationsSent] = useState(todayMetrics.quotationsSent || 2);
  const [ordersReceived, setOrdersReceived] = useState(todayMetrics.ordersReceived || 1);
  const [collectionAmount, setCollectionAmount] = useState(todayMetrics.collectionAmount || 15000);
  const [summary, setSummary] = useState(
    'Covered Kothamangalam and Aimury area. Customer demonstrated keen interest in the 10kg SS incinerator.'
  );
  const [planForTomorrow, setPlanForTomorrow] = useState(
    'Scheduled 3 customer visits in Perumbavoor. Follow-up on pending quotations.'
  );

  const reports = dataStore.getDailyReports(currentUser.role, currentUser.id);

  const filteredReports = reports.filter((r) => {
    if (selectedExecutiveFilter === 'All') return true;
    return r.executiveId === selectedExecutiveFilter || r.userId === selectedExecutiveFilter;
  });

  // Check today's submission status for team members
  const salesTeam = users.filter((u) => u.role !== 'owner');

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.addDailyReport({
      reportDate: todayStr,
      date: todayStr,
      executiveId: currentUser.id,
      userId: currentUser.id,
      executiveName: currentUser.name,
      userName: currentUser.name,
      userRole: currentUser.role,
      callsMade,
      visitsCompleted: visitsDone,
      newLeadsCreated: newLeads,
      newLeadsGenerated: newLeads,
      followUpsCompleted: followupsDone,
      quotationsSent,
      ordersReceived,
      collectionAmount,
      summaryOfTheDay: summary,
      remarks: summary,
      planForTomorrow,
    });

    setShowSubmitModal(false);
  };

  return (
    <div id="daily-reports-container" className="space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Daily Activity Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-of-day sales logs, team productivity monitoring, and next-day sales plans.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Submit Today's Report</span>
        </button>
      </div>

      {/* Owner/Senior Overview: Today's Team Submission Status */}
      {(isOwner || isSenior) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Today's Submission Status ({todayStr})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {salesTeam.map((member) => {
              const isSubmitted = reports.some(
                (r) =>
                  (r.executiveId === member.id || r.userId === member.id) &&
                  (r.reportDate === todayStr || r.date === todayStr)
              );

              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isSubmitted
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {member.role.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSubmitted ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Submitted
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter by Executive (for Owner) */}
      {(isOwner || isSenior) && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Filter Executive:</span>
          <select
            value={selectedExecutiveFilter}
            onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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

      {/* Reports Feed */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>No daily reports submitted yet.</p>
          </div>
        ) : (
          filteredReports.map((rep) => {
            const displayName = rep.executiveName || rep.userName || 'Sales Executive';
            const displayDate = rep.reportDate || rep.date;
            const displayLeads = rep.newLeadsGenerated ?? rep.newLeadsCreated ?? 0;
            const displaySummary = rep.summaryOfTheDay || rep.remarks;

            return (
              <div
                key={rep.id}
                className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{displayName}</h3>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{displayDate}</span>
                        <span>• Submitted at {rep.submittedAt.split('T')[1]?.slice(0, 5) || '18:30'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved Daily Log</span>
                  </div>
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Calls</div>
                    <div className="text-base font-black text-slate-900">{rep.callsMade}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Visits</div>
                    <div className="text-base font-black text-slate-900">{rep.visitsCompleted}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Leads</div>
                    <div className="text-base font-black text-slate-900">{displayLeads}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Follow-ups</div>
                    <div className="text-base font-black text-slate-900">{rep.followUpsCompleted}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Quotations</div>
                    <div className="text-base font-black text-slate-900">{rep.quotationsSent}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Orders</div>
                    <div className="text-base font-black text-slate-900">{rep.ordersReceived}</div>
                  </div>
                  <div className="col-span-3 sm:col-span-1 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                    <div className="text-[10px] text-blue-700 font-semibold">Collection</div>
                    <div className="text-base font-black text-[#2563EB]">
                      ₹{(rep.collectionAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Narrative Summary & Tomorrow's Plan */}
                <div className="text-xs space-y-2 pt-1">
                  <div>
                    <span className="font-bold text-slate-700">Summary of the Day:</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl">
                      {displaySummary}
                    </p>
                  </div>
                  {rep.planForTomorrow && (
                    <div>
                      <span className="font-bold text-slate-700">Plan for Tomorrow:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                        {rep.planForTomorrow}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Daily Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    End-of-Day Daily Activity Report
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Submit your field activities for {todayStr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              {/* Auto-calculated Field Visits Section (Section 25) */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#2563EB] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>Customer Visits (Auto-Calculated)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    From GPS Check-ins
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Scheduled</div>
                    <div className="text-base font-black text-slate-900">{todayMetrics.visitsScheduled}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase">Completed</div>
                    <div className="text-base font-black text-emerald-700">{todayMetrics.visitsCompleted}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <div className="text-[10px] text-rose-700 font-bold uppercase">Missed</div>
                    <div className="text-base font-black text-rose-700">{todayMetrics.visitsMissed}</div>
                  </div>
                </div>

                {todayMetrics.customersVisited && todayMetrics.customersVisited.length > 0 && (
                  <div className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-blue-100">
                    <span className="font-bold text-slate-900">Customers Visited Today: </span>
                    <span>{todayMetrics.customersVisited.join(', ')}</span>
                  </div>
                )}

                {todayMetrics.productsDiscussed && todayMetrics.productsDiscussed.length > 0 && (
                  <div className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-blue-100">
                    <span className="font-bold text-slate-900">Products Discussed: </span>
                    <span>{todayMetrics.productsDiscussed.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Calls Made
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={callsMade}
                    onChange={(e) => setCallsMade(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Site Visits Done
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={visitsDone}
                    onChange={(e) => setVisitsDone(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Leads Generated
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newLeads}
                    onChange={(e) => setNewLeads(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Follow-ups Completed
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={followupsDone}
                    onChange={(e) => setFollowupsDone(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quotations Sent
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quotationsSent}
                    onChange={(e) => setQuotationsSent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Orders Received
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={ordersReceived}
                    onChange={(e) => setOrdersReceived(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advance / Collection Amount Received (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Summary of the Day <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Key customer responses, areas visited, and challenges faced..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Plan for Tomorrow <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  value={planForTomorrow}
                  onChange={(e) => setPlanForTomorrow(e.target.value)}
                  placeholder="Planned site visits, customer calls, and delivery follow-ups..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

