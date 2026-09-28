import React, { useState } from 'react';
import {
  Building2,
  Users,
  Shield,
  Package,
  Share2,
  FileText,
  ShoppingBag,
  GitBranch,
  Sliders,
  History,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CompanyProfileSection } from './sections/CompanyProfileSection';
import { UsersEmployeesSection } from './sections/UsersEmployeesSection';
import { RolesPermissionsSection } from './sections/RolesPermissionsSection';
import { ProductSettingsSection } from './sections/ProductSettingsSection';
import { LeadSourcesSection } from './sections/LeadSourcesSection';
import { QuotationSettingsSection } from './sections/QuotationSettingsSection';
import { OrderSettingsSection } from './sections/OrderSettingsSection';
import { WorkflowSettingsSection } from './sections/WorkflowSettingsSection';
import { SystemPreferencesSection } from './sections/SystemPreferencesSection';
import { AuditLogsSection } from './sections/AuditLogsSection';

export type SettingsTabId =
  | 'company'
  | 'users'
  | 'roles'
  | 'products'
  | 'lead_sources'
  | 'quotation'
  | 'orders'
  | 'workflow'
  | 'preferences'
  | 'audit';

interface TabConfig {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const SETTINGS_TABS: TabConfig[] = [
  {
    id: 'company',
    label: 'Company Profile',
    description: 'Entity details, GSTIN, contacts & PDF branding',
    icon: Building2,
    adminOnly: true,
  },
  {
    id: 'users',
    label: 'Users & Employees',
    description: 'Sales force, accounts, credentials & status',
    icon: Users,
    adminOnly: true,
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    description: 'Supabase RLS access matrix & capabilities',
    icon: Shield,
    adminOnly: false,
  },
  {
    id: 'products',
    label: 'Product Settings',
    description: 'Catalog models, base pricing & GST rates',
    icon: Package,
    adminOnly: true,
  },
  {
    id: 'lead_sources',
    label: 'Lead Sources',
    description: 'Marketing channels & attribution tracking',
    icon: Share2,
    adminOnly: true,
  },
  {
    id: 'quotation',
    label: 'Quotation Settings',
    description: 'Prefix numbering, GST splits & default terms',
    icon: FileText,
    adminOnly: true,
  },
  {
    id: 'orders',
    label: 'Order Settings',
    description: 'Booking IDs, dispatch rules & statuses',
    icon: ShoppingBag,
    adminOnly: true,
  },
  {
    id: 'workflow',
    label: 'Workflow Settings',
    description: '8-stage visual pipeline & lifecycle gates',
    icon: GitBranch,
    adminOnly: true,
  },
  {
    id: 'preferences',
    label: 'System Preferences',
    description: 'Regional currency, reminders & database backup',
    icon: Sliders,
    adminOnly: true,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    description: 'Append-only immutable transaction ledger',
    icon: History,
    adminOnly: false,
  },
];

export const SettingsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('company');

  // Role permissions:
  // Owner: Full Edit and View across all settings
  // Senior Sales Executive: Manage users/leads/products/workflow, View audit/roles
  // Sales Executive: Read-only access to roles/audit/preferences, Restricted from editing company/quotation defaults
  const isOwner = currentUser?.role === 'owner';
  const isSenior = currentUser?.role === 'senior_sales_executive';
  const canEditGeneral = isOwner || isSenior;
  const canEditAdminOnly = isOwner;

  const currentTabConfig = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  return (
    <div id="settings-module-container" className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Settings & Configuration
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-md">
              Enterprise CRM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized controls for Kerala Incinerator company profiles, team permissions, pricing catalog, and audit trails.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">
          Role: <strong className="text-slate-800 capitalize">{currentUser?.role?.replace(/_/g, ' ') || 'Owner'}</strong>
        </div>
      </div>

      {/* Mobile Scrollable Tabs (Visible on small screens) */}
      <div className="lg:hidden bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout: Sidebar + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-2 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Configuration Modules
            </div>

            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isRestrictedForSalesExec = tab.adminOnly && !canEditAdminOnly;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 min-h-[48px] rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs leading-none">{tab.label}</div>
                      <div
                        className={`text-[10px] mt-1 line-clamp-1 ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {tab.description}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Helper Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white text-xs space-y-2 shadow-sm">
            <div className="font-bold flex items-center gap-1.5 text-cyan-400">
              <Shield className="w-4 h-4" />
              Multi-Tenant Data Store
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All settings are synced reactively with local state and can be backed up to Supabase Cloud PostgreSQL at any time.
            </p>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          {activeTab === 'company' && (
            <CompanyProfileSection canEdit={canEditAdminOnly} />
          )}

          {activeTab === 'users' && (
            <UsersEmployeesSection canManage={canEditGeneral} />
          )}

          {activeTab === 'roles' && (
            <RolesPermissionsSection />
          )}

          {activeTab === 'products' && (
            <ProductSettingsSection canEdit={canEditGeneral} />
          )}

          {activeTab === 'lead_sources' && (
            <LeadSourcesSection canEdit={canEditGeneral} />
          )}

          {activeTab === 'quotation' && (
            <QuotationSettingsSection canEdit={canEditAdminOnly} />
          )}

          {activeTab === 'orders' && (
            <OrderSettingsSection canEdit={canEditAdminOnly} />
          )}

          {activeTab === 'workflow' && (
            <WorkflowSettingsSection canEdit={canEditAdminOnly} />
          )}

          {activeTab === 'preferences' && (
            <SystemPreferencesSection canEdit={canEditAdminOnly} />
          )}

          {activeTab === 'audit' && (
            <AuditLogsSection />
          )}
        </div>
      </div>
    </div>
  );
};

