import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Check,
  X,
  Lock,
  Eye,
  Key,
  Database,
  Info,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { RolePermissionMatrixItem, UserRole } from '../../../types';

export const RolesPermissionsSection: React.FC = () => {
  const matrix = dataStore.getRolePermissionMatrix();
  const [activeTab, setActiveTab] = useState<'matrix' | 'hierarchy'>('matrix');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Roles & Access Permissions</h3>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase rounded-full">
              Supabase RLS Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized authorization matrix. Frontend permissions mirror database Row Level Security policies.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg transition-colors ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg transition-colors ${
              activeTab === 'hierarchy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Role Hierarchy & Principles
          </button>
        </div>
      </div>

      {/* RLS Security Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-md flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-sm text-cyan-300">
            Strict Multi-Tier RLS Security Guarantee
          </div>
          <p className="text-slate-300 leading-relaxed">
            Frontend UI role checks are supplemented by database Row Level Security.
            <strong> Sales Executives</strong> only read and modify their directly assigned leads, visits, and follow-ups.
            <strong> Senior Sales Executives</strong> can oversee team pipelines and reassign work.
            <strong> The Owner</strong> holds unrestricted administrative sovereignty over company financial ledgers, audit logs, and settings.
          </p>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        /* Permission Matrix Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-1/4">CRM Module</th>
                  <th className="py-3.5 px-4 text-center bg-blue-50/50 text-blue-900 border-x border-slate-200">
                    <div className="font-extrabold">Owner</div>
                    <div className="text-[10px] font-normal text-blue-600">Full Administrator</div>
                  </th>
                  <th className="py-3.5 px-4 text-center bg-cyan-50/50 text-cyan-900 border-r border-slate-200">
                    <div className="font-extrabold">Senior Sales Exec</div>
                    <div className="text-[10px] font-normal text-cyan-700">Team Supervisor</div>
                  </th>
                  <th className="py-3.5 px-4 text-center bg-slate-50 text-slate-800">
                    <div className="font-extrabold">Sales Executive</div>
                    <div className="text-[10px] font-normal text-slate-500">Field Operations</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {matrix.map((row) => (
                  <tr key={row.module} className="hover:bg-slate-50/70 transition-colors">
                    {/* Module Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                        <span>{row.module}</span>
                      </div>
                    </td>

                    {/* Owner Permissions */}
                    <td className="py-3 px-4 text-center bg-blue-50/30 border-x border-slate-200">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {Object.entries(row.owner)
                          .filter(([_, allowed]) => allowed)
                          .map(([perm]) => (
                            <span
                              key={perm}
                              className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold capitalize rounded-md"
                            >
                              {perm}
                            </span>
                          ))}
                      </div>
                    </td>

                    {/* Senior Sales Executive */}
                    <td className="py-3 px-4 text-center bg-cyan-50/20 border-r border-slate-200">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {Object.entries(row.senior)
                          .filter(([_, allowed]) => allowed)
                          .map(([perm]) => (
                            <span
                              key={perm}
                              className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-bold capitalize rounded-md"
                            >
                              {perm}
                            </span>
                          ))}
                      </div>
                    </td>

                    {/* Sales Executive */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {Object.entries(row.executive)
                          .filter(([_, allowed]) => allowed)
                          .map(([perm]) => (
                            <span
                              key={perm}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold capitalize rounded-md"
                            >
                              {perm}
                            </span>
                          ))}
                        {!Object.values(row.executive).some(Boolean) && (
                          <span className="text-[10px] text-slate-400 italic">No Access</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Role Hierarchy Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Owner */}
          <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Owner (Admin)</h4>
                <p className="text-xs text-blue-600 font-semibold">Complete Operational Control</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Full access across all 14 Kerala districts</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Modify company legal data, bank details, & GSTIN</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Manage employee accounts, activation & deactivation</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Approve discounts, cancellations & financial reports</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>View immutable security audit trail</span>
              </li>
            </ul>
          </div>

          {/* Senior Sales Executive */}
          <div className="bg-white rounded-2xl border border-cyan-300 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Senior Sales Executive</h4>
                <p className="text-xs text-cyan-600 font-semibold">Team Supervisor & Lead Dispatch</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>View all company leads and field activities</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Assign and reassign customer leads among executives</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Create quotations and convert to orders</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Review executive daily field visit reports</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400">Cannot alter core company settings or delete orders</span>
              </li>
            </ul>
          </div>

          {/* Sales Executive */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Sales Executive</h4>
                <p className="text-xs text-slate-500 font-semibold">Field Sales & Site Visits</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>View and manage assigned leads and follow-ups</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Log field visits, site photos, and incinerator specs</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Generate quotations for assigned leads</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Submit mandatory daily sales reports</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400">No access to other executives' leads or system settings</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
