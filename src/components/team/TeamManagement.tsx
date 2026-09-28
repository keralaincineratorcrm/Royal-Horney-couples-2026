import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/supabase';
import { UserProfile, UserRole } from '../../types';

export const TeamManagement: React.FC = () => {
  const { users, currentUser, isOwner } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  // New member form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('sales_executive');

  const allCustomers = dataStore.getAllCustomersUnfiltered();
  const allReports = dataStore.getDailyReports('owner');
  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.addUser({
      name,
      email,
      phone,
      role,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      active: true,
    });
    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div id="team-management-container" className="space-y-4 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Sales Team & Field Force
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control, active lead allocation, and executive performance tracking.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {users.map((member) => {
          const assignedCount = allCustomers.filter((c) => c.assignedToId === member.id).length;
          const isSubmittedToday = allReports.some(
            (r) =>
              (r.executiveId === member.id || r.userId === member.id) &&
              (r.reportDate === todayStr || r.date === todayStr)
          );
          const isCurrent = member.id === currentUser.id;

          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 transition-all ${
                isCurrent ? 'ring-2 ring-[#2563EB] border-transparent' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {member.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : member.role === 'senior_sales_executive'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {member.role === 'owner'
                        ? 'Company Owner'
                        : member.role === 'senior_sales_executive'
                        ? 'Senior Sales Executive'
                        : 'Sales Executive'}
                    </span>
                  </div>
                </div>

                {isCurrent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB] text-white">
                    Active
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{member.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-500">Active Leads</div>
                  <div className="text-base font-black text-slate-900">{assignedCount}</div>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-500">Daily Report</div>
                  <div className="text-xs font-bold mt-1">
                    {member.role === 'owner' ? (
                      <span className="text-slate-400">N/A</span>
                    ) : isSubmittedToday ? (
                      <span className="text-emerald-600 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Status Badge */}
              <div
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  isCurrent
                    ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{isCurrent ? 'Your Active Session' : 'CRM Team Member'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 md:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="text-base font-bold text-slate-900">Add Sales Team Member</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Create executive credentials and set role-based access level.
            </p>

            <form onSubmit={handleAddMember} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sreejith K."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sreejith@keralaincinerator.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94470 12345"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="sales_executive">Sales Executive (Own leads only)</option>
                  <option value="senior_sales_executive">
                    Senior Sales Executive (Team access & reassign)
                  </option>
                  <option value="owner">Owner (Full administrative control)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
