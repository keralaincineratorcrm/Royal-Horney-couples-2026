import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Power,
  Search,
  Filter,
  Activity,
  Calendar,
  FileText,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Clock,
  Briefcase,
  AlertTriangle,
  X,
  IndianRupee,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { UserProfile, UserRole } from '../../../types';
import { formatRoleBadge } from '../../../data/settingsData';
import { useAuth } from '../../../context/AuthContext';

interface UsersEmployeesSectionProps {
  canManage: boolean;
}

export const UsersEmployeesSection: React.FC<UsersEmployeesSectionProps> = ({ canManage }) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';
  const [users, setUsers] = useState<UserProfile[]>(() => dataStore.getUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals & drawers
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deactivateConfirmUser, setDeactivateConfirmUser] = useState<UserProfile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales_executive' as UserRole,
    district: 'Ernakulam',
    active: true,
  });

  const refreshUsers = () => {
    setUsers(dataStore.getUsers());
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.active) ||
      (statusFilter === 'inactive' && !u.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '+91 ',
      role: 'sales_executive',
      district: 'Ernakulam',
      active: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      district: user.assignedDistricts?.[0] || 'Ernakulam',
      active: user.active,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenView = (user: UserProfile) => {
    setSelectedUser(user);
    setIsViewDrawerOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    // Security: Only an Owner can assign roles; others default to sales_executive
    const assignedRole = isOwner ? formData.role : 'sales_executive';
    dataStore.addUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: assignedRole,
      active: formData.active,
      assignedDistricts: [formData.district],
    });
    refreshUsers();
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !canManage) return;
    // Security: Only an Owner can change another user's role
    const assignedRole = isOwner ? formData.role : selectedUser.role;
    dataStore.updateUser(selectedUser.id, {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: assignedRole,
      assignedDistricts: [formData.district],
      active: formData.active,
    });
    refreshUsers();
    setIsEditModalOpen(false);
  };

  const handleToggleActive = (user: UserProfile) => {
    if (!canManage) return;
    if (user.role === 'owner') {
      alert('The Owner account cannot be deactivated.');
      return;
    }
    if (user.active) {
      setDeactivateConfirmUser(user);
    } else {
      dataStore.toggleUserActive(user.id, true);
      refreshUsers();
    }
  };

  const confirmDeactivation = () => {
    if (!deactivateConfirmUser) return;
    dataStore.toggleUserActive(deactivateConfirmUser.id, false);
    refreshUsers();
    setDeactivateConfirmUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">User & Employee Management</h3>
            <p className="text-xs text-slate-500">
              Manage field sales executives, permissions, and workload assignments. Deactivated employees retain full historical CRM data.
            </p>
          </div>
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              Add New Employee
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner (Administrator)</option>
              <option value="senior_sales_executive">Senior Sales Executive</option>
              <option value="sales_executive">Sales Executive</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-3">Role</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-center">Assigned Leads</th>
                <th className="py-3.5 px-3 text-center">Orders & Val</th>
                <th className="py-3.5 px-3">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const summary = dataStore.getUserActivitySummary(user.id);
                  const roleBadge = formatRoleBadge(user.role);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !user.active ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                              user.active
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.role === 'owner' && (
                                <Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{user.assignedDistricts?.[0] || 'Kerala'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="text-slate-900 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {user.email}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {user.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Assigned Leads */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-900 text-xs px-2 py-1 bg-slate-100 rounded-lg">
                          {summary.assignedLeadsCount} leads
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {summary.openFollowUpsCount} pending follow-ups
                        </div>
                      </td>

                      {/* Orders & Val */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-emerald-700">
                          ₹{summary.totalOrderValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {summary.ordersCount} orders • {summary.quotationsCount} quotes
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {summary.lastActivityDate ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(summary.lastActivityDate).toLocaleDateString('en-IN')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No logs yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenView(user)}
                            className="p-1.5 min-h-[36px] min-w-[36px] text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Full Profile & Performance"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 min-h-[36px] min-w-[36px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {user.role !== 'owner' && (
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  className={`p-1.5 min-h-[36px] min-w-[36px] rounded-lg transition-colors ${
                                    user.active
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={user.active ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW EMPLOYEE DRAWER / MODAL */}
      {isViewDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                  {selectedUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {selectedUser.name}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedUser.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedUser.active ? 'Active' : 'Inactive'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedUser.email} • {selectedUser.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsViewDrawerOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Performance Stats Cards */}
              {(() => {
                const summary = dataStore.getUserActivitySummary(selectedUser.id);
                return (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Executive Portfolio & Workload
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Assigned Leads</div>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          {summary.assignedLeadsCount}
                        </div>
                        <div className="text-[10px] text-slate-400">{summary.openFollowUpsCount} pending</div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Visits Logged</div>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          {summary.visitsCount}
                        </div>
                        <div className="text-[10px] text-slate-400">Field inspections</div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Quotations Sent</div>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          {summary.quotationsCount}
                        </div>
                        <div className="text-[10px] text-slate-400">Generated</div>
                      </div>

                      <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="text-xs text-emerald-800 font-medium">Booked Revenue</div>
                        <div className="text-xl font-black text-emerald-700 mt-1">
                          ₹{summary.totalOrderValue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-600">{summary.ordersCount} closed orders</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Roles & System Access */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Assigned Role:</span>
                  <span className="font-bold text-blue-700 capitalize">
                    {selectedUser.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Operating Territory / District:</span>
                  <span className="text-slate-800">{selectedUser.assignedDistricts?.[0] || 'Kerala State'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Account ID:</span>
                  <span className="font-mono text-slate-500">{selectedUser.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Supabase RLS Policy:</span>
                  <span className="text-emerald-700 font-semibold">Role-Enforced</span>
                </div>
              </div>

              {/* Activity History Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recent Executive Actions
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dataStore
                    .getAuditLogs({ userId: selectedUser.id })
                    .slice(0, 5)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{log.action}</div>
                          <div className="text-[11px] text-slate-600">{log.description}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 font-mono">
                          {new Date(log.timestamp).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    ))}
                  {dataStore.getAuditLogs({ userId: selectedUser.id }).length === 0 && (
                    <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                      No logged activities for this user yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewDrawerOpen(false)}
                className="px-5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAdd}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Team Member</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sreelakshmi Nair"
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sreelakshmi@keralaincinerator.com"
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Mobile / WhatsApp Phone *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 94471 XXXXX"
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Role & Hierarchy *
                </label>
                <select
                  value={isOwner ? formData.role : 'sales_executive'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  disabled={!isOwner}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                >
                  <option value="sales_executive">Sales Executive (Field Staff)</option>
                  <option value="senior_sales_executive">Senior Sales Executive (Team Lead)</option>
                  <option value="owner">Owner (Full Admin)</option>
                </select>
                {!isOwner && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Only an authorized Owner can provision leadership or Owner accounts.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Primary District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Ernakulam / Kottayam"
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Employee: {selectedUser.name}</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  disabled={selectedUser.role === 'owner' || !isOwner}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                >
                  <option value="sales_executive">Sales Executive</option>
                  <option value="senior_sales_executive">Senior Sales Executive</option>
                  <option value="owner">Owner (Administrator)</option>
                </select>
                {!isOwner && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Role modifications are restricted to authorized Owner accounts.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEACTIVATE CONFIRM MODAL */}
      {deactivateConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Deactivate {deactivateConfirmUser.name}?
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                This account will be marked <strong>Inactive</strong> and prevented from logging in.
                All historical customer leads, quotations, visits, and closed orders associated with{' '}
                {deactivateConfirmUser.name} will <strong>remain permanently preserved</strong> in Kerala Incinerator records.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateConfirmUser(null)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivation}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
