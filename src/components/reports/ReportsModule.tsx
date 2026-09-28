import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  GitCommit,
  FileText,
  Truck,
  MapPin,
  Award,
  Package,
  Activity,
  Layers,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/supabase';
import { DateRangeFilter, ManagementAnalyticsData, CustomerLead } from '../../types';
import { DateRangeSelector } from './DateRangeSelector';
import { ReportHeaderSnapshot } from './ReportHeaderSnapshot';
import { ManagementAlertsPanel } from './ManagementAlertsPanel';
import { KpiDashboardCards } from './KpiDashboardCards';
import { SalesOverviewSection } from './SalesOverviewSection';
import { OutstandingBalanceReport } from './OutstandingBalanceReport';
import { PaymentAnalyticsSection } from './PaymentAnalyticsSection';
import { PipelineFunnelSection } from './PipelineFunnelSection';
import { QuotationAnalyticsSection } from './QuotationAnalyticsSection';
import { OrderDeliverySection } from './OrderDeliverySection';
import { DistrictPerformanceSection } from './DistrictPerformanceSection';
import { ExecutivePerformanceSection } from './ExecutivePerformanceSection';
import { ProductPerformanceSection } from './ProductPerformanceSection';
import { CustomerValueSection } from './CustomerValueSection';
import { DailyActivityAnalytics } from './DailyActivityAnalytics';
import { exportToCSV } from './exportUtils';

interface ReportsModuleProps {
  onNavigateTab?: (tab: string, filter?: any) => void;
  onSelectCustomerById?: (customerId: string) => void;
  onSelectOrderById?: (orderId: string) => void;
}

type ReportSubTab =
  | 'all'
  | 'sales'
  | 'outstanding'
  | 'pipeline'
  | 'quotations'
  | 'delivery'
  | 'districts'
  | 'team'
  | 'products'
  | 'customers'
  | 'activity';

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  onNavigateTab,
  onSelectCustomerById,
  onSelectOrderById,
}) => {
  const { currentUser } = useAuth();
  const [, setTick] = useState(0);

  // Filter states
  const [dateRange, setDateRange] = useState<DateRangeFilter>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<ReportSubTab>('all');

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Compute live analytics from DataStore
  const analytics: ManagementAnalyticsData = useMemo(() => {
    return dataStore.getManagementAnalytics({
      dateRange,
      customStart: customStart || undefined,
      customEnd: customEnd || undefined,
      role: currentUser.role,
      userId: currentUser.id,
    });
  }, [dateRange, customStart, customEnd, currentUser.role, currentUser.id, setTick]);

  const handleRangeChange = (
    range: DateRangeFilter,
    start?: string,
    end?: string
  ) => {
    setDateRange(range);
    if (start) setCustomStart(start);
    if (end) setCustomEnd(end);
  };

  const handleExportFullCSV = () => {
    const summaryRows = [
      { Metric: 'Reporting Period', Value: `${analytics.startDate} to ${analytics.endDate} (${analytics.periodLabel})` },
      { Metric: 'Total Leads Registered', Value: analytics.kpis.totalLeads },
      { Metric: 'New Leads in Period', Value: analytics.kpis.newLeads },
      { Metric: 'Active Follow-ups', Value: analytics.kpis.activeFollowUps },
      { Metric: 'Overdue Follow-ups', Value: analytics.kpis.overdueFollowUps },
      { Metric: 'Customer Visits Completed', Value: analytics.kpis.visits },
      { Metric: 'Quotations Created', Value: analytics.kpis.quotations },
      { Metric: 'Accepted Quotations', Value: analytics.kpis.acceptedQuotations },
      { Metric: 'Quotation Conversion Rate', Value: `${analytics.quotationAnalytics.conversionRate}%` },
      { Metric: 'Total Orders Booked', Value: analytics.kpis.orders },
      { Metric: 'Gross Confirmed Sales Value (₹)', Value: analytics.kpis.totalSales },
      { Metric: 'Actual Payments Collected (₹)', Value: analytics.kpis.paymentsCollected },
      { Metric: 'Total Outstanding Balance Due (₹)', Value: analytics.kpis.balancePending },
      { Metric: 'Completed Incinerator Orders', Value: analytics.kpis.completedOrders },
      { Metric: 'Pending Deliveries', Value: analytics.deliveryPerformance.pending },
      { Metric: 'In Transit Deliveries', Value: analytics.deliveryPerformance.inTransit },
      { Metric: 'Overdue Deliveries Count', Value: analytics.deliveryPerformance.overdueCount },
    ];

    exportToCSV('Kerala_Incinerator_Executive_Report_Summary', summaryRows, [
      { key: 'Metric', label: 'Management KPI / Benchmark' },
      { key: 'Value', label: 'Recorded Value' },
    ]);
  };

  const navTabs: { id: ReportSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'Complete Overview', icon: Layers },
    { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
    { id: 'outstanding', label: 'Outstanding Balances', icon: Coins },
    { id: 'pipeline', label: 'Pipeline & Sources', icon: GitCommit },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'delivery', label: 'Orders & Deliveries', icon: Truck },
    { id: 'districts', label: '14 Kerala Districts', icon: MapPin },
    { id: 'team', label: 'Team Scorecard', icon: Award },
    { id: 'products', label: 'Incinerator Models', icon: Package },
    { id: 'customers', label: 'Customer Accounts', icon: Users },
    { id: 'activity', label: 'Field Activity & GPS', icon: Activity },
  ];

  return (
    <div id="management-reports-container" className="space-y-6 pb-20 md:pb-8">
      {/* Official Header Snapshot with Print & CSV Export */}
      <ReportHeaderSnapshot
        reportTitle="Kerala Incinerator Sales CRM — Executive Analytics"
        periodLabel={analytics.periodLabel}
        startDate={analytics.startDate}
        endDate={analytics.endDate}
        currentUser={currentUser}
        onRefresh={() => setTick((t) => t + 1)}
        onExportAllCSV={handleExportFullCSV}
      />

      {/* Global Date Range Selector */}
      <DateRangeSelector
        currentRange={dateRange}
        customStart={customStart}
        customEnd={customEnd}
        onRangeChange={handleRangeChange}
        activePeriodLabel={analytics.periodLabel}
        startDate={analytics.startDate}
        endDate={analytics.endDate}
      />

      {/* Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none print:hidden">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-report-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.id === 'outstanding' && analytics.outstandingBalances.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 ml-1">
                  {analytics.outstandingBalances.length}
                </span>
              )}
              {tab.id === 'delivery' && analytics.deliveryPerformance.overdueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white ml-1">
                  {analytics.deliveryPerformance.overdueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actionable Overdue & Management Alerts */}
      <ManagementAlertsPanel
        alerts={analytics.managementAlerts}
        onNavigateTab={(tab) => {
          if (onNavigateTab) {
            onNavigateTab(tab);
          } else {
            setActiveTab(tab as any);
          }
        }}
      />

      {/* 12 Clickable High-Level KPI Cards */}
      <KpiDashboardCards
        kpis={analytics.kpis}
        onNavigateTab={(tab, filter) => {
          if (onNavigateTab) {
            onNavigateTab(tab, filter);
          }
        }}
        onSelectReportSection={(sectionId) => setActiveTab(sectionId as any)}
      />

      {/* SECTION VIEWS */}

      {/* 1. Sales & Revenue Overview Section */}
      {(activeTab === 'all' || activeTab === 'sales') && (
        <section id="section-sales-overview" className="space-y-4">
          <SalesOverviewSection
            salesOverview={analytics.salesOverview}
            timeSeries={analytics.timeSeries}
          />
          <PaymentAnalyticsSection paymentAnalytics={analytics.paymentAnalytics} />
        </section>
      )}

      {/* 2. Outstanding Balances & Receivables */}
      {(activeTab === 'all' || activeTab === 'outstanding') && (
        <section id="section-outstanding-balances">
          <OutstandingBalanceReport
            balances={analytics.outstandingBalances}
            onSelectOrder={onSelectOrderById}
            onSelectCustomer={onSelectCustomerById}
          />
        </section>
      )}

      {/* 3. Pipeline Funnel & Lead Source Analytics */}
      {(activeTab === 'all' || activeTab === 'pipeline') && (
        <section id="section-pipeline">
          <PipelineFunnelSection
            pipeline={analytics.pipeline}
            leadSources={analytics.leadSources}
            onNavigateTab={onNavigateTab}
          />
        </section>
      )}

      {/* 4. Quotation Conversion Pipeline */}
      {(activeTab === 'all' || activeTab === 'quotations') && (
        <section id="section-quotations">
          <QuotationAnalyticsSection
            quotationAnalytics={analytics.quotationAnalytics}
            onNavigateTab={onNavigateTab}
          />
        </section>
      )}

      {/* 5. Orders & Delivery Logistics */}
      {(activeTab === 'all' || activeTab === 'delivery') && (
        <section id="section-orders-delivery">
          <OrderDeliverySection
            orderAnalytics={analytics.orderAnalytics}
            deliveryPerformance={analytics.deliveryPerformance}
            onSelectOrder={onSelectOrderById}
            onNavigateTab={onNavigateTab}
          />
        </section>
      )}

      {/* 6. Kerala 14 Districts Performance */}
      {(activeTab === 'all' || activeTab === 'districts') && (
        <section id="section-districts">
          <DistrictPerformanceSection
            districtPerformance={analytics.districtPerformance}
            onNavigateTab={onNavigateTab}
          />
        </section>
      )}

      {/* 7. Sales Executive Team Scorecard */}
      {(activeTab === 'all' || activeTab === 'team') && (
        <section id="section-executive-scorecard">
          <ExecutivePerformanceSection
            executivePerformance={analytics.executivePerformance}
            currentUser={currentUser}
          />
        </section>
      )}

      {/* 8. Incinerator Product Performance */}
      {(activeTab === 'all' || activeTab === 'products') && (
        <section id="section-products">
          <ProductPerformanceSection
            productPerformance={analytics.productPerformance}
          />
        </section>
      )}

      {/* 9. Customer Accounts & Value Portfolio */}
      {(activeTab === 'all' || activeTab === 'customers') && (
        <section id="section-customers">
          <CustomerValueSection
            customerAnalytics={analytics.customerAnalytics}
            onSelectCustomer={onSelectCustomerById}
          />
        </section>
      )}

      {/* 10. Daily Activity & GPS Field Execution */}
      {(activeTab === 'all' || activeTab === 'activity') && (
        <section id="section-daily-activity">
          <DailyActivityAnalytics
            currentUser={currentUser}
            periodLabel={analytics.periodLabel}
          />
        </section>
      )}
    </div>
  );
};

