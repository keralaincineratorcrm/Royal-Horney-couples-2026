import React, { useState } from 'react';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Check,
  Smartphone,
  Monitor,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/supabase';
import { InAppNotification } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  isMobilePreview,
  onToggleMobilePreview,
  onNavigateTab,
}) => {
  const { currentUser, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = dataStore.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date());

  const handleNotificationClick = (n: InAppNotification) => {
    dataStore.markNotificationAsRead(n.id);
    setShowNotifications(false);
    if (n.link) {
      onNavigateTab(n.link);
    }
  };

  return (
    <header
      id="main-app-header"
      className="bg-white border-b border-[#E2E8F0] px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <button
          id="global-search-trigger"
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 px-3.5 py-2 rounded-xl border border-slate-200 text-sm transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB]" />
            <span className="text-slate-500 font-normal text-xs md:text-sm">
              Search customers, leads, quotations, orders...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-4 ml-3">
        {/* Device Switcher (Mobile simulator toggle) */}
        <button
          id="toggle-device-view"
          onClick={onToggleMobilePreview}
          title={isMobilePreview ? 'Switch to Full Width View' : 'Simulate Android Phone View'}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isMobilePreview
              ? 'bg-blue-50 border-blue-200 text-[#2563EB]'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isMobilePreview ? (
            <>
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile View</span>
            </>
          )}
        </button>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dataStore.markAllNotificationsAsRead()}
                    className="text-xs text-[#2563EB] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                          n.type === 'danger'
                            ? 'bg-rose-500'
                            : n.type === 'success'
                            ? 'bg-emerald-500'
                            : n.type === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400">Today</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            id="user-profile-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          >
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 capitalize">
                {currentUser.role === 'owner'
                  ? 'Owner'
                  : currentUser.role === 'senior_sales_executive'
                  ? 'Senior SE'
                  : 'Sales Executive'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* User Selection Popover */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      currentUser.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
                      {currentUser.role === 'owner'
                        ? 'Owner / Director'
                        : currentUser.role === 'senior_sales_executive'
                        ? 'Senior Sales Executive'
                        : 'Field Sales Executive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 border-b border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Department:</span>
                  <span className="font-semibold text-slate-800">{currentUser.department || 'General'}</span>
                </div>
                {currentUser.phone && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Phone:</span>
                    <span className="font-semibold text-slate-800">{currentUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-500">
                  <span>Status:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Authenticated Session
                  </span>
                </div>
              </div>

              {/* Logout Action Button */}
              <div className="p-2 border-t border-slate-100">
                <button
                  type="button"
                  id="user-logout-btn"
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

