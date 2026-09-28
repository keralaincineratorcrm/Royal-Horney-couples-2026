import {
  CompanySettings,
  QuotationSettings,
  OrderSettings,
  SystemPreferences,
  LeadSourceItem,
  WorkflowStatusItem,
  AuditLog,
  RolePermissionMatrixItem,
} from '../types';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'Kerala Incinerator',
  tagline: 'Clean Environment, Better Tomorrow.',
  category: 'Commercial, Institutional & Domestic Waste Incinerators',
  logoUrl: '',
  gstin: '32AAACK1234F1Z8 (Kerala State)',
  phone: '+91 94471 20001 / +91 98460 34567',
  whatsapp: '+91 94471 20001',
  email: 'sales@keralaincinerator.com',
  website: 'https://keralaincinerator.com',
  officeAddress: 'Industrial Estate, South Kalamassery, Kochi, Kerala - 682033',
  manufacturingHub: 'Aimury, Perumbavoor, Ernakulam, Kerala - 683544',
  district: 'Ernakulam',
  state: 'Kerala',
  pinCode: '683544',
  defaultTerms: [
    '1. 50% advance payment with confirmed purchase order; 50% balance before dispatch / during installation.',
    '2. Delivery within 7 to 10 working days from receipt of advance payment and site clearance.',
    '3. 12 months comprehensive warranty covering manufacturing defects, burner, and internal refractory chamber.',
    '4. Foundation base concrete platform to be prepared by the customer as per specified dimensions.',
    '5. Transportation & crane unloading charges at actuals unless explicitly included in quotation.',
  ],
  authorizedSignatoryLabel: 'Authorized Signatory / Plant Commercial Head',
  updatedAt: '2026-01-10T09:00:00Z',
  updatedBy: 'John Mathew (Owner)',
};

export const DEFAULT_QUOTATION_SETTINGS: QuotationSettings = {
  prefix: 'KI-QTN',
  numberFormat: 'KI-QTN-YYYY-XXXX',
  defaultGstRate: 18,
  cgstRate: 9,
  sgstRate: 9,
  defaultValidityDays: 30,
  defaultPaymentTerms: '50% advance along with confirmed order, balance prior to delivery / on installation.',
  defaultDeliveryTerms: 'Within 5-7 working days from date of confirmed order across Kerala.',
  defaultInstallationTerms: 'Standard installation, test run and chimney set included by company technician.',
  defaultWarrantyTerms: '12 months comprehensive warranty on fabrication and burner assembly.',
  defaultRemarks: 'Prices are inclusive of standard chimney piping and burner assembly. Electrical connections at customer site.',
  transportationChargeBehavior: 'included',
  defaultTransportCharge: 1500,
  updatedAt: '2026-01-10T09:00:00Z',
  updatedBy: 'John Mathew (Owner)',
};

export const DEFAULT_ORDER_SETTINGS: OrderSettings = {
  prefix: 'KI-ORD',
  numberFormat: 'KI-ORD-YYYY-XXXX',
  defaultPaymentTerms: '50% advance with order confirmation, balance upon delivery & physical site handover.',
  defaultDeliveryTerms: '7-10 working days from payment confirmation to customer destination in Kerala.',
  defaultInstallationBehavior: 'mandatory',
  defaultOrderRemarks: 'Unloading and standard chimney assembly to be coordinated with company technician.',
  updatedAt: '2026-01-10T09:00:00Z',
  updatedBy: 'John Mathew (Owner)',
};

export const DEFAULT_SYSTEM_PREFERENCES: SystemPreferences = {
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  defaultCountry: 'India',
  defaultState: 'Kerala',
  defaultGstRate: 18,
  followUpReminderTime: '09:00',
  defaultQuotationValidityDays: 30,
  paginationSize: 20,
  enableWhatsAppAlerts: true,
  enableGpsVerification: true,
  updatedAt: '2026-01-10T09:00:00Z',
  updatedBy: 'John Mathew (Owner)',
};

export const DEFAULT_LEAD_SOURCES: LeadSourceItem[] = [
  {
    id: 'src_1',
    name: 'Website',
    active: true,
    displayOrder: 1,
    description: 'Online website inquiry forms & organic landing page',
    isSystem: true,
  },
  {
    id: 'src_2',
    name: 'WhatsApp',
    active: true,
    displayOrder: 2,
    description: 'Direct WhatsApp Business chat inquiries & catalog messages',
    isSystem: true,
  },
  {
    id: 'src_3',
    name: 'Phone',
    active: true,
    displayOrder: 3,
    description: 'Direct telephone calls to office / helpline numbers',
    isSystem: true,
  },
  {
    id: 'src_4',
    name: 'Walk-in',
    active: true,
    displayOrder: 4,
    description: 'Direct customer walk-in to Aimury factory or Kalamassery office',
    isSystem: true,
  },
  {
    id: 'src_5',
    name: 'Reference',
    active: true,
    displayOrder: 5,
    description: 'Existing customer recommendations, doctors, and contractor referrals',
    isSystem: true,
  },
  {
    id: 'src_6',
    name: 'Other',
    active: true,
    displayOrder: 6,
    description: 'Tenders, exhibitions, and municipal waste management events',
    isSystem: true,
  },
];

export const DEFAULT_WORKFLOW_STATUSES: WorkflowStatusItem[] = [
  // Leads
  { id: 'ws_l1', name: 'New Lead', category: 'lead', color: '#3B82F6', active: true, isSystem: true, order: 1 },
  { id: 'ws_l2', name: 'Contacted', category: 'lead', color: '#6366F1', active: true, isSystem: true, order: 2 },
  { id: 'ws_l3', name: 'Interested', category: 'lead', color: '#0EA5E9', active: true, isSystem: true, order: 3 },
  { id: 'ws_l4', name: 'Quotation Sent', category: 'lead', color: '#8B5CF6', active: true, isSystem: true, order: 4 },
  { id: 'ws_l5', name: 'Follow-up', category: 'lead', color: '#F59E0B', active: true, isSystem: true, order: 5 },
  { id: 'ws_l6', name: 'Ordered', category: 'lead', color: '#10B981', active: true, isSystem: true, order: 6 },
  { id: 'ws_l7', name: 'Delivered', category: 'lead', color: '#059669', active: true, isSystem: true, order: 7 },
  { id: 'ws_l8', name: 'Completed', category: 'lead', color: '#16A34A', active: true, isSystem: true, order: 8 },
  { id: 'ws_l9', name: 'No Need', category: 'lead', color: '#64748B', active: true, isSystem: true, order: 9 },
  { id: 'ws_l10', name: 'Purchased Another Brand', category: 'lead', color: '#EF4444', active: true, isSystem: true, order: 10 },

  // Quotations
  { id: 'ws_q1', name: 'Draft', category: 'quotation', color: '#94A3B8', active: true, isSystem: true, order: 1 },
  { id: 'ws_q2', name: 'Sent', category: 'quotation', color: '#3B82F6', active: true, isSystem: true, order: 2 },
  { id: 'ws_q3', name: 'Viewed', category: 'quotation', color: '#6366F1', active: true, isSystem: true, order: 3 },
  { id: 'ws_q4', name: 'Negotiation', category: 'quotation', color: '#F59E0B', active: true, isSystem: true, order: 4 },
  { id: 'ws_q5', name: 'Accepted', category: 'quotation', color: '#10B981', active: true, isSystem: true, order: 5 },
  { id: 'ws_q6', name: 'Rejected', category: 'quotation', color: '#EF4444', active: true, isSystem: true, order: 6 },
  { id: 'ws_q7', name: 'Expired', category: 'quotation', color: '#64748B', active: true, isSystem: true, order: 7 },

  // Orders
  { id: 'ws_o1', name: 'Pending', category: 'order', color: '#F59E0B', active: true, isSystem: true, order: 1 },
  { id: 'ws_o2', name: 'Processing / Production', category: 'order', color: '#3B82F6', active: true, isSystem: true, order: 2 },
  { id: 'ws_o3', name: 'Ready for Dispatch', category: 'order', color: '#0EA5E9', active: true, isSystem: true, order: 3 },
  { id: 'ws_o4', name: 'In Transit', category: 'order', color: '#8B5CF6', active: true, isSystem: true, order: 4 },
  { id: 'ws_o5', name: 'Delivered', category: 'order', color: '#059669', active: true, isSystem: true, order: 5 },
  { id: 'ws_o6', name: 'Installed', category: 'order', color: '#10B981', active: true, isSystem: true, order: 6 },
  { id: 'ws_o7', name: 'Completed', category: 'order', color: '#16A34A', active: true, isSystem: true, order: 7 },
  { id: 'ws_o8', name: 'Cancelled', category: 'order', color: '#EF4444', active: true, isSystem: true, order: 8 },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const ROLE_PERMISSION_MATRIX: RolePermissionMatrixItem[] = [
  {
    module: 'Dashboard',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: false, edit: false, delete: false, export: false, assign: false },
    description: 'Executive overview, real-time KPI tiles, alerts, and live activity stream.',
  },
  {
    module: 'Leads & Customers',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: true, edit: true, delete: false, export: false, assign: false },
    description: 'Lead generation, profile management, status pipeline, and contact history.',
  },
  {
    module: 'Follow-ups',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: true, edit: true, delete: false, export: false, assign: false },
    description: 'Scheduled customer follow-up calls, reminders, and outcome resolution.',
  },
  {
    module: 'Visits & GPS Check-ins',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: true, edit: true, delete: false, export: false, assign: false },
    description: 'Field visits, customer site location inspection, and photo documentation.',
  },
  {
    module: 'Quotations',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: true, edit: true, delete: false, export: true, assign: false },
    description: 'Proposal creation, GST computation, PDF generation, and client negotiation.',
  },
  {
    module: 'Orders & Fulfillment',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: true, edit: true, delete: false, export: true, assign: false },
    description: 'Order booking, factory fabrication status, and shipment confirmation.',
  },
  {
    module: 'Payments & Collections',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: false },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: false },
    executive: { view: true, create: true, edit: false, delete: false, export: false, assign: false },
    description: 'Advance & balance collection entries, receipt generation, and payment ledgers.',
  },
  {
    module: 'Delivery & Installation',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: true, edit: true, delete: false, export: true, assign: true },
    executive: { view: true, create: true, edit: true, delete: false, export: false, assign: false },
    description: 'Logistics tracking, delivery challans, and customer site installation handover.',
  },
  {
    module: 'Reports & Analytics',
    owner: { view: true, create: false, edit: false, delete: false, export: true, assign: false },
    senior: { view: true, create: false, edit: false, delete: false, export: true, assign: false },
    executive: { view: true, create: false, edit: false, delete: false, export: false, assign: false },
    description: 'Management reporting, revenue trends, district breakdown, and executive scorecards.',
  },
  {
    module: 'Users & Employees',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: false, edit: false, delete: false, export: false, assign: false },
    executive: { view: false, create: false, edit: false, delete: false, export: false, assign: false },
    description: 'Employee directory, status activation/deactivation, and district assignments.',
  },
  {
    module: 'Product Catalog',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: false },
    senior: { view: true, create: false, edit: false, delete: false, export: true, assign: false },
    executive: { view: true, create: false, edit: false, delete: false, export: false, assign: false },
    description: 'Model specifications, pricing configuration, and active product management.',
  },
  {
    module: 'Company & System Settings',
    owner: { view: true, create: true, edit: true, delete: true, export: true, assign: true },
    senior: { view: true, create: false, edit: false, delete: false, export: false, assign: false },
    executive: { view: false, create: false, edit: false, delete: false, export: false, assign: false },
    description: 'Centralized company credentials, prefix formats, and system defaults.',
  },
  {
    module: 'Audit Logs',
    owner: { view: true, create: false, edit: false, delete: false, export: true, assign: false },
    senior: { view: true, create: false, edit: false, delete: false, export: false, assign: false },
    executive: { view: false, create: false, edit: false, delete: false, export: false, assign: false },
    description: 'Immutable administrative, financial, and record reassignment audit trail.',
  },
];

export function formatRoleBadge(role: string): { label: string; bg: string; text: string } {
  switch (role) {
    case 'owner':
      return { label: 'Owner (Admin)', bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'senior_sales_executive':
      return { label: 'Senior Sales Exec', bg: 'bg-cyan-100', text: 'text-cyan-800' };
    case 'sales_executive':
      return { label: 'Sales Executive', bg: 'bg-slate-100', text: 'text-slate-800' };
    default:
      return { label: role, bg: 'bg-slate-100', text: 'text-slate-700' };
  }
}

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'advance_received', label: 'Advance Received' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'fully_paid', label: 'Fully Paid' },
];

export const DELIVERY_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'In Production / Processing' },
  { value: 'ready_for_dispatch', label: 'Ready for Dispatch' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'installed', label: 'Installed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

