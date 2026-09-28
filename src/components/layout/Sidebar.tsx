import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  MapPin,
  FileText,
  ShoppingCart,
  ClipboardCheck,
  UserCheck,
  BarChart3,
  Settings,
  ChevronRight,
  Flame,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'customers'
  | 'followups'
  | 'visits'
  | 'quotations'
  | 'orders'
  | 'dailyreport'
  | 'team'
  | 'reports'
  | 'products'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingFollowUpsCount?: number;
  overdueFollowUpsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingFollowUpsCount = 0,
  overdueFollowUpsCount = 0,
}) => {
  const { currentUser, isOwner, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers' as NavTab, label: 'Customers & Leads', icon: Users },
    {
      id: 'followups' as NavTab,
      label: 'Follow-ups',
      icon: Clock,
      badge: overdueFollowUpsCount > 0 ? `${overdueFollowUpsCount}` : undefined,
      badgeVariant: 'danger',
    },
    { id: 'visits' as NavTab, label: 'Visits', icon: MapPin },
    { id: 'quotations' as NavTab, label: 'Quotations', icon: FileText },
    { id: 'orders' as NavTab, label: 'Orders', icon: ShoppingCart },
    { id: 'dailyreport' as NavTab, label: 'Daily Reports', icon: ClipboardCheck },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'products' as NavTab, label: 'Products', icon: Flame },
    ...(isOwner
      ? [
          { id: 'team' as NavTab, label: 'Team & Staff', icon: UserCheck },
          { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <aside
      id="sidebar-desktop"
      className="hidden md:flex flex-col w-64 bg-[#0F172A] text-slate-300 border-r border-slate-800/80 shrink-0 h-screen sticky top-0 select-none z-30"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <BrandLogo light={true} size="md" />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#38BDF8]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Active User Session and Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-[#0B1120]">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 capitalize truncate">
                {currentUser.role === 'owner'
                  ? 'Owner (Full Access)'
                  : currentUser.role === 'senior_sales_executive'
                  ? 'Senior Executive'
                  : 'Field Sales Executive'}
              </div>
            </div>
          </div>
          <button
            type="button"
            id="sidebar-logout-btn"
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-slate-500 px-1 pt-1 truncate flex items-center justify-between">
          <span>Kerala Incinerator</span>
          <span className="text-[#38BDF8] font-medium">CRM v1.0</span>
        </div>
      </div>
    </aside>
  );
};

