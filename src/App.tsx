import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { OwnerDashboard } from './components/dashboard/OwnerDashboard';
import { SalesExecutiveDashboard } from './components/dashboard/SalesExecutiveDashboard';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { AddCustomerModal } from './components/customers/AddCustomerModal';
import { FollowUpModule } from './components/followups/FollowUpModule';
import { VisitModule } from './components/visits/VisitModule';
import { QuotationModule } from './components/quotations/QuotationModule';
import { OrderModule } from './components/orders/OrderModule';
import { DailyReportModule } from './components/dailyreport/DailyReportModule';
import { TeamManagement } from './components/team/TeamManagement';
import { ReportsModule } from './components/reports/ReportsModule';
import { ProductsModule } from './components/products/ProductsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { dataStore } from './lib/supabase';
import { CustomerLead, Quotation, Order, Product } from './types';
import { Plus, Phone, MapPin, Send, Flame } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { BrandLogo } from './components/common/BrandLogo';

function resolveTabFromPath(pathname: string, isOwner: boolean): NavTab {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  switch (clean) {
    case 'customers':
    case 'leads':
      return 'customers';
    case 'followups':
    case 'follow-ups':
      return 'followups';
    case 'visits':
      return 'visits';
    case 'quotations':
      return 'quotations';
    case 'orders':
    case 'payments':
    case 'delivery':
      return 'orders';
    case 'dailyreport':
    case 'daily-reports':
      return 'dailyreport';
    case 'reports':
      return 'reports';
    case 'products':
      return 'products';
    case 'team':
      return isOwner ? 'team' : 'dashboard';
    case 'settings':
      return isOwner ? 'settings' : 'dashboard';
    case 'dashboard':
    default:
      return 'dashboard';
  }
}

function MainCRMApp() {
  const { currentUser, isOwner, isSenior } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>(() =>
    resolveTabFromPath(window.location.pathname, isOwner)
  );
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync URL path when currentTab changes, and protect Owner-only routes from Staff
  useEffect(() => {
    if (!isOwner && (currentTab === 'team' || currentTab === 'settings')) {
      setCurrentTab('dashboard');
      window.history.replaceState({}, '', '/dashboard');
      return;
    }
    const targetPath = `/${currentTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [currentTab, isOwner]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setCurrentTab(resolveTabFromPath(window.location.pathname, isOwner));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOwner]);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLead | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Targets for sub-modules
  const [customerForFollowUp, setCustomerForFollowUp] = useState<CustomerLead | null>(null);
  const [customerForVisit, setCustomerForVisit] = useState<CustomerLead | null>(null);
  const [customerForQuotation, setCustomerForQuotation] = useState<CustomerLead | null>(null);
  const [showMobileQuickAction, setShowMobileQuickAction] = useState(false);

  // Data subscriptions for notification counters
  const [followUps, setFollowUps] = useState(dataStore.getFollowUps(currentUser.role, currentUser.id));

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setFollowUps(dataStore.getFollowUps(currentUser.role, currentUser.id));
    });
    return unsub;
  }, [currentUser]);

  const overdueCount = followUps.filter((f) => f.status === 'Overdue').length;
  const pendingCount = followUps.filter((f) => f.status === 'Pending').length;

  // Handlers
  const handleSelectCustomer = (customer: CustomerLead) => {
    setSelectedCustomer(customer);
  };

  const handleStartVisit = (customer: CustomerLead) => {
    setCustomerForVisit(customer);
    setCurrentTab('visits');
  };

  const handleAddFollowUp = (customer?: CustomerLead) => {
    setCustomerForFollowUp(customer || null);
    setCurrentTab('followups');
  };

  const handleCreateQuotation = (customer: CustomerLead) => {
    setCustomerForQuotation(customer);
    setCurrentTab('quotations');
  };

  const handleGenerateQuotationForProduct = (product: Product) => {
    setCurrentTab('quotations');
  };

  // Render tab content
  const renderCurrentTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return isOwner ? (
          <OwnerDashboard
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectCustomer={handleSelectCustomer}
          />
        ) : (
          <SalesExecutiveDashboard
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectCustomer={handleSelectCustomer}
            onStartVisit={handleStartVisit}
            onAddFollowUp={handleAddFollowUp}
          />
        );

      case 'customers':
        return (
          <CustomerList
            onSelectCustomer={handleSelectCustomer}
            onOpenAddModal={() => setIsAddCustomerOpen(true)}
            onAddFollowUp={handleAddFollowUp}
          />
        );

      case 'followups':
        return (
          <FollowUpModule
            onSelectCustomer={handleSelectCustomer}
            onStartVisit={handleStartVisit}
            initialSelectedCustomer={customerForFollowUp}
          />
        );

      case 'visits':
        return (
          <VisitModule
            onSelectCustomer={handleSelectCustomer}
            initialCustomer={customerForVisit}
            onCreateQuotation={(cust) => {
              setCustomerForQuotation(cust);
              setCurrentTab('quotations');
            }}
            onCreateOrder={(cust) => {
              setSelectedCustomer(cust);
              setCurrentTab('orders');
            }}
            onViewCustomer={(customerId) => {
              const c = dataStore.getAllCustomersUnfiltered().find((cust) => cust.id === customerId);
              if (c) handleSelectCustomer(c);
            }}
          />
        );

      case 'quotations':
        return (
          <QuotationModule
            onSelectCustomer={handleSelectCustomer}
            initialCustomer={customerForQuotation}
            onNavigateTab={(tab) => setCurrentTab(tab as any)}
            onConvertToOrder={(qtn) => {
              const cust = dataStore.getAllCustomersUnfiltered().find((c) => c.id === qtn.customerId);
              if (cust) setSelectedCustomer(cust);
              setCurrentTab('orders');
            }}
          />
        );

      case 'orders':
        return (
          <OrderModule
            onSelectCustomer={handleSelectCustomer}
            initialCustomer={selectedCustomer}
          />
        );

      case 'dailyreport':
        return <DailyReportModule />;

      case 'team':
        return isOwner ? (
          <TeamManagement />
        ) : (
          <SalesExecutiveDashboard
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectCustomer={handleSelectCustomer}
            onStartVisit={handleStartVisit}
            onAddFollowUp={handleAddFollowUp}
          />
        );

      case 'reports':
        return (
          <ReportsModule
            onNavigateTab={(tab) => setCurrentTab(tab as any)}
            onSelectCustomerById={(customerId) => {
              const cust = dataStore.getAllCustomersUnfiltered().find((c) => c.id === customerId);
              if (cust) handleSelectCustomer(cust);
            }}
            onSelectOrderById={() => {
              setCurrentTab('orders');
            }}
          />
        );

      case 'products':
        return (
          <ProductsModule
            onGenerateQuotationForProduct={handleGenerateQuotationForProduct}
          />
        );

      case 'settings':
        return isOwner ? (
          <SettingsModule />
        ) : (
          <SalesExecutiveDashboard
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectCustomer={handleSelectCustomer}
            onStartVisit={handleStartVisit}
            onAddFollowUp={handleAddFollowUp}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-[#2563EB]">
      {/* If Mobile Simulator toggle is active on desktop */}
      <div
        className={`flex-1 flex ${
          isMobilePreview
            ? 'justify-center items-center p-4 bg-slate-950/90'
            : 'w-full'
        }`}
      >
        <div
          className={`flex w-full min-h-screen ${
            isMobilePreview
              ? 'max-w-[420px] h-[860px] max-h-[92vh] rounded-[42px] border-[10px] border-slate-800 bg-[#F8FAFC] shadow-2xl overflow-hidden flex-col relative'
              : ''
          }`}
        >
          {/* Mobile Speaker/Camera cutout when in phone simulation mode */}
          {isMobilePreview && (
            <div className="h-6 bg-slate-900 flex items-center justify-center shrink-0">
              <div className="w-20 h-3.5 bg-black rounded-full flex items-center justify-end px-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              </div>
            </div>
          )}

          {/* Desktop Left Sidebar (Hidden if mobile preview or small screens) */}
          {!isMobilePreview && (
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setCustomerForFollowUp(null);
                setCustomerForVisit(null);
                setCustomerForQuotation(null);
              }}
              pendingFollowUpsCount={pendingCount}
              overdueFollowUpsCount={overdueCount}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Header */}
            <Header
              onOpenSearch={() => setIsSearchOpen(true)}
              isMobilePreview={isMobilePreview}
              onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />

            {/* Authenticated User Session Banner */}
            <div className="bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent px-4 md:px-8 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Logged in as:</span>
                <strong className="text-[#0F172A]">
                  {currentUser.name} ({currentUser.role === 'owner' ? 'Owner (Full Access)' : currentUser.role === 'senior_sales_executive' ? 'Senior Executive' : 'Field Sales Executive'})
                </strong>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="hidden sm:inline">Aimury, Perumbavoor, Kerala</span>
                <span className="font-bold text-[#2563EB]">keralaincinerator.com</span>
              </div>
            </div>

            {/* Page Content */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
              {renderCurrentTabContent()}
            </main>

            {/* Mobile Bottom Navigation (Visible on mobile screens or mobile simulation) */}
            <MobileBottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setCustomerForFollowUp(null);
                setCustomerForVisit(null);
                setCustomerForQuotation(null);
              }}
              overdueCount={overdueCount}
            />
          </div>
        </div>
      </div>

      {/* Floating Quick Action Button on Mobile (for easy field tasks) */}
      <div className="md:hidden fixed bottom-16 right-4 z-40">
        <button
          onClick={() => setShowMobileQuickAction(!showMobileQuickAction)}
          className="w-12 h-12 bg-[#2563EB] hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
          aria-label="Quick Action"
        >
          <Plus className={`w-6 h-6 transition-transform ${showMobileQuickAction ? 'rotate-45' : ''}`} />
        </button>

        {showMobileQuickAction && (
          <div className="absolute bottom-14 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 animate-in fade-in zoom-in-90 duration-150">
            <button
              onClick={() => {
                setIsAddCustomerOpen(true);
                setShowMobileQuickAction(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#2563EB]" />
              <span>Add New Lead</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab('visits');
                setShowMobileQuickAction(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-[#38BDF8]" />
              <span>Check-in Visit</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab('dailyreport');
                setShowMobileQuickAction(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Daily Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCustomer={(c) => setSelectedCustomer(c)}
        onSelectQuotation={(q) => {
          setCustomerForQuotation({
            id: q.customerId,
            customerName: q.customerName,
            phone: q.customerPhone,
            place: q.customerPlace,
            address: q.customerAddress,
            productInterestedId: q.items[0]?.productId || '',
            productInterestedName: q.items[0]?.productName || '',
            enquiryDate: q.quotationDate,
            leadSource: 'Phone',
            assignedToId: currentUser.id,
            assignedToName: currentUser.name,
            leadStatus: 'Quotation Sent',
            orderChance: 'High',
            expectedValue: q.totalAmount,
            remarks: '',
            createdAt: q.createdAt,
            updatedAt: q.updatedAt || q.createdAt,
          });
          setCurrentTab('quotations');
        }}
        onSelectOrder={(o) => {
          setCurrentTab('orders');
        }}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onAddFollowUp={(c) => handleAddFollowUp(c)}
        onStartVisit={(c) => handleStartVisit(c)}
        onCreateQuotation={(c) => handleCreateQuotation(c)}
        onCreateOrder={(c) => {
          setSelectedCustomer(c);
          setCurrentTab('orders');
        }}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerAdded={(newCust) => {
          setSelectedCustomer(newCust);
        }}
      />
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync URL based on authentication state
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
        setCurrentPath('/login');
      }
    } else {
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo light={true} size="lg" />
          <div className="flex items-center gap-2 text-slate-400 text-xs mt-2">
            <div className="w-3.5 h-3.5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
            <span>Restoring secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Route protection: Unauthenticated users are strictly shown the LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated users enter the CRM system
  return <MainCRMApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
