import React, { useState } from 'react';
import {
  Home,
  Users,
  Clock,
  MapPin,
  Menu,
  FileText,
  ShoppingCart,
  ClipboardCheck,
  UserCheck,
  BarChart3,
  Settings,
  Flame,
  X,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  overdueCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  overdueCount = 0,
}) => {
  const { isOwner } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: Home },
    { id: 'customers' as NavTab, label: 'Leads', icon: Users },
    {
      id: 'followups' as NavTab,
      label: 'Follow-ups',
      icon: Clock,
      badge: overdueCount > 0 ? `${overdueCount}` : undefined,
    },
    { id: 'visits' as NavTab, label: 'Visits', icon: MapPin },
  ];

  const moreTabs = [
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

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* "More" Drawer Modal for Mobile */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-sm font-bold text-slate-900">More CRM Modules</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-2">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center ${
                      isActive
                        ? 'bg-blue-50 border-blue-300 text-[#2563EB] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1.5" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative ${
                isActive ? 'text-[#2563EB]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#2563EB] mt-0.5" />
              )}
            </button>
          );
        })}

        {/* More button */}
        <button
          id="mobile-tab-more"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex-1 flex flex-col items-center justify-center py-1 relative ${
            moreTabs.some((t) => t.id === currentTab)
              ? 'text-[#2563EB]'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </nav>
    </>
  );
};

