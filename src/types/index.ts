export type UserRole = 'owner' | 'senior_sales_executive' | 'sales_executive';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  active: boolean;
  department?: string;
  employeeCode?: string;
  assignedDistricts?: string[];
  notes?: string;
  lastActivity?: string;
  createdAt: string;
}

export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Interested'
  | 'Quotation Sent'
  | 'Follow-up'
  | 'Ordered'
  | 'Delivered'
  | 'Completed'
  | 'No Need'
  | 'Purchased Another Brand';

export type OrderChance = 'High' | 'Medium' | 'Low';

export type LeadSource =
  | 'Website'
  | 'Phone'
  | 'WhatsApp'
  | 'Reference'
  | 'Walk-in'
  | 'Other';

export interface Product {
  id: string;
  name: string;
  model?: string;
  category: string;
  description: string;
  defaultPrice: number;
  active: boolean;
  capacity?: string;
  imageUrl?: string;
  features?: string[];
  specification?: string;
  unit?: string;
  gstRate?: number;
  displayOrder?: number;
}

export interface CustomerLead {
  id: string;
  customerName: string;
  phone: string;
  alternativePhone?: string;
  contactPerson?: string;
  place: string; // e.g., Aimury, Perumbavoor, Kothamangalam
  district?: string;
  customerCategory?: string;
  address: string;
  careOf?: string;
  productInterestedId?: string;
  productInterestedName: string;
  enquiryDate: string;
  leadSource: LeadSource;
  assignedToId: string;
  assignedToName: string;
  leadStatus: LeadStatus;
  orderChance: OrderChance;
  expectedValue: number;
  remarks: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactType = 'Call' | 'WhatsApp' | 'Visit';
export type FollowUpStatus = 'Pending' | 'Completed' | 'Overdue' | 'Cancelled' | 'Rescheduled';

export interface FollowUp {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerPlace: string;
  assignedToId: string;
  assignedToName: string;
  followUpDate: string; // YYYY-MM-DD
  followUpTime: string; // HH:mm
  contactType: ContactType;
  productName: string;
  customerResponse?: string;
  orderChance: OrderChance;
  orderId?: string;
  orderNumber?: string;
  followUpCategory?: 'Payment' | 'Delivery' | 'Installation' | 'Customer Confirmation' | 'General';
  nextFollowUpDate?: string;
  remarks: string;
  status: FollowUpStatus;
  completedAt?: string;
  rescheduledReason?: string;
  rescheduledToDate?: string;
  rescheduledAt?: string;
  createdAt: string;
}

export type VisitStatus =
  | 'Scheduled'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Rescheduled'
  | 'Missed'
  | 'Cancelled';

export type VisitPurpose =
  | 'Initial Enquiry'
  | 'Product Demonstration'
  | 'Quotation Discussion'
  | 'Follow-up Visit'
  | 'Site Inspection'
  | 'Order Discussion'
  | 'Delivery Discussion'
  | 'Other';

export type CustomerResponseOption =
  | 'Interested'
  | 'Very Interested'
  | 'Quotation Required'
  | 'Need More Information'
  | 'Will Discuss Internally'
  | 'Order Expected'
  | 'Not Interested'
  | 'Purchased Another Brand'
  | 'No Decision Yet'
  | 'Other';

export type VisitOutcome =
  | 'Quotation Required'
  | 'Follow-up Required'
  | 'Order Confirmed'
  | 'Product Demonstration Required'
  | 'Site Requirement Pending'
  | 'Customer Not Interested'
  | 'Purchased Another Brand'
  | 'No Further Action'
  | 'Interested'
  | 'Need More Information'
  | 'Other';

export interface CustomerVisit {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerPlace: string;
  assignedToId: string;
  assignedToName: string;
  executiveId?: string;
  executiveName?: string;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:mm
  location: string;
  purpose: VisitPurpose | string;
  productsDiscussed: string[];
  discussionPoints?: string;
  discussionNotes?: string;
  customerRequirements?: string;
  quantityRequirement?: string;
  customerQuestions?: string;
  competitorMentioned?: string;
  customerResponse?: CustomerResponseOption | string;
  orderChance?: OrderChance;
  estimatedOrderValue?: number;
  outcome?: VisitOutcome | string;
  visitRemarks: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  nextFollowUpId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  startedAt?: string;
  completedAt?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracy?: number;
  gpsCapturedAt?: string;
  gpsUnavailable?: boolean;
  photos?: string[];
  rescheduledReason?: string;
  rescheduledToDate?: string;
  rescheduledAt?: string;
  status: VisitStatus;
  createdAt: string;
  updatedAt?: string;
}

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Negotiation'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export interface QuotationItem {
  id?: string;
  productId: string;
  productName: string;
  productModel?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountAmount?: number;
  taxRate: number; // e.g. 18 for 18% GST
  taxAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  taxableAmount?: number;
  lineTotal?: number;
  totalAmount: number;
  capacity?: string;
  amount?: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerPlace: string;
  alternativePhone?: string;
  contactPerson?: string;
  careOf?: string;
  district?: string;
  sourceVisitId?: string;
  source_visit_id?: string;
  assignedToId: string;
  assignedToName: string;
  preparedById?: string;
  preparedByName?: string;
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  discountAmount?: number;
  taxableAmount?: number;
  taxTotal: number;
  taxPercent?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  gstAmount?: number;
  transportationCharges?: number;
  totalAmount: number;
  grandTotal?: number;
  validityDays: number;
  validUntil?: string;
  quotationDate: string;
  status: QuotationStatus;
  paymentTerms?: string;
  deliveryTerms?: string;
  installationTerms?: string;
  warranty?: string;
  notes?: string;
  remarks?: string;
  convertedToOrderId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentStatus =
  | 'Pending'
  | 'Advance'
  | 'Advance Received'
  | 'Partial'
  | 'Partial Paid'
  | 'Paid'
  | 'Fully Paid';

export type DeliveryStatus =
  | 'Pending'
  | 'Processing'
  | 'Ready for Dispatch'
  | 'In Transit'
  | 'Delivered'
  | 'Installed'
  | 'Completed'
  | 'Cancelled';

export type OrderStatus =
  | 'New'
  | 'Processing'
  | 'Ready for Dispatch'
  | 'In Transit'
  | 'Delivered'
  | 'Installed'
  | 'Completed'
  | 'Cancelled';

export type InstallationStatus = 'Pending' | 'Scheduled' | 'Completed' | 'Not Required';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerId: string;
  customerName?: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedById: string;
  recordedByName: string;
  recordedBy?: string;
  createdAt: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  productModel?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountAmount?: number;
  gstPercent?: number; // Default 18%
  gstAmount?: number;
  lineTotal?: number;
  amount: number;
}

export interface Order {
  id: string;
  orderNumber: string; // KI-ORD-YYYY-XXXX
  orderDate?: string;
  sourceQuotationId?: string;
  source_quotation_id?: string;
  sourceQuotationNumber?: string;
  sourceQuotationDate?: string;
  sourceVisitId?: string;
  source_visit_id?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerPlace: string;
  alternativePhone?: string;
  contactPerson?: string;
  careOf?: string;
  district?: string;
  assignedToId: string;
  assignedToName: string;
  assignedExecutiveId?: string;
  assignedExecutiveName?: string;
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  gstAmount?: number;
  transportationCharges?: number;
  grandTotal?: number;
  amount: number; // Total order value
  totalPaid?: number;
  advancePaid?: number;
  balanceDue?: number;
  balanceAmount?: number;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus;
  deliveryStatus: DeliveryStatus;
  installationRequired?: boolean;
  installationStatus?: InstallationStatus;
  installationDate?: string;
  installationRemarks?: string;
  deliveryAddress?: string;
  billingAddress?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  productName?: string;
  quantity?: number;
  notes?: string;
  remarks?: string;
  deliveryRemarks?: string;
  createdBy?: string;
  createdById?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  date: string; // YYYY-MM-DD
  submittedAt: string;
  callsMade: number;
  customersContacted: number;
  visitsCompleted: number;
  newLeadsCreated: number;
  quotationsSent: number;
  quotationsCreated?: number;
  quotationsAccepted?: number;
  totalQuotationValue?: number;
  acceptedQuotationValue?: number;
  ordersReceived: number;
  followUpsCompleted: number;
  hotLeadsCount: number;
  mediumLeadsCount: number;
  lowLeadsCount: number;
  tomorrowFollowUpsCount: number;
  remarks: string;
  // Convenience aliases for reporting views
  executiveId?: string;
  executiveName?: string;
  reportDate?: string;
  newLeadsGenerated?: number;
  collectionAmount?: number;
  summaryOfTheDay?: string;
  planForTomorrow?: string;
}

export type ActivityType =
  | 'Lead Created'
  | 'Call'
  | 'WhatsApp'
  | 'Follow-up'
  | 'Visit'
  | 'Quotation'
  | 'Order'
  | 'Delivery'
  | 'Status Changed'
  | 'Reassigned';

export interface CustomerActivity {
  id: string;
  customerId: string;
  customerName: string;
  type: ActivityType;
  title: string;
  description: string;
  performedById: string;
  performedByName: string;
  productName?: string;
  amount?: number;
  status?: string;
  timestamp: string;
}

export interface InAppNotification {
  id: string;
  userId: string; // Target user or 'all'
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  link?: string;
  createdAt: string;
}

export type DateRangeFilter =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export interface ManagementAnalyticsData {
  startDate: string;
  endDate: string;
  periodLabel: string;
  period: {
    startDate: string;
    endDate: string;
    label: string;
    filter: DateRangeFilter;
  };
  kpis: {
    totalLeads: number;
    newLeads: number;
    activeFollowUps: number;
    overdueFollowUps: number;
    visits: number;
    quotations: number;
    acceptedQuotations: number;
    orders: number;
    totalSales: number;
    paymentsCollected: number;
    balancePending: number;
    completedOrders: number;
  };
  salesOverview: {
    totalOrderValue: number;
    totalPaymentsCollected: number;
    outstandingBalance: number;
    orderCount: number;
    avgOrderValue: number;
    completedOrderValue: number;
    cancelledOrderValue: number;
  };
  timeSeries: {
    daily: { date: string; label: string; sales: number; orders: number; payments: number }[];
    weekly: { week: string; label: string; sales: number; orders: number; payments: number }[];
    monthly: { month: string; label: string; sales: number; orders: number; payments: number }[];
  };
  pipeline: {
    stage: LeadStatus | 'Follow-up';
    count: number;
    estimatedValue: number;
  }[];
  leadSources: {
    source: LeadSource;
    leadCount: number;
    interestedCount: number;
    quotationCount: number;
    orderCount: number;
    orderValue: number;
  }[];
  quotationAnalytics: {
    totalQuotations: number;
    statusCounts: Record<QuotationStatus, number>;
    totalQuotedValue: number;
    acceptedValue: number;
    rejectedValue: number;
    avgQuotationValue: number;
    conversionRate: number; // Accepted / Eligible * 100
  };
  orderAnalytics: {
    totalOrders: number;
    statusCounts: Record<DeliveryStatus | OrderStatus, number>;
    totalOrderValue: number;
  };
  paymentAnalytics: {
    totalOrderValue: number;
    totalPaid: number;
    advanceReceived: number;
    partialPayments: number;
    outstandingBalance: number;
    methodBreakdown: {
      method: PaymentMethod;
      count: number;
      amount: number;
    }[];
  };
  outstandingBalances: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    district: string;
    salesExecutiveId: string;
    salesExecutiveName: string;
    orderDate: string;
    orderAmount: number;
    totalPaid: number;
    balanceDue: number;
    lastPaymentDate: string;
    paymentStatus: PaymentStatus;
    deliveryStatus: DeliveryStatus;
  }[];
  deliveryPerformance: {
    pending: number;
    processing: number;
    readyForDispatch: number;
    inTransit: number;
    delivered: number;
    installed: number;
    completed: number;
    overdueCount: number;
    overdueList: {
      orderId: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      expectedDate: string;
      currentStatus: DeliveryStatus;
      salesExecutiveName: string;
    }[];
  };
  districtPerformance: {
    district: string;
    leads: number;
    quotations: number;
    orders: number;
    orderValue: number;
    paymentsCollected: number;
    outstandingBalance: number;
  }[];
  executivePerformance: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    leads: number;
    calls: number;
    followUps: number;
    visits: number;
    quotations: number;
    orders: number;
    orderValue: number;
    paymentsCollected: number;
    completedOrders: number;
  }[];
  productPerformance: {
    productId: string;
    productName: string;
    category: string;
    quotationCount: number;
    orderCount: number;
    quantitySold: number;
    orderValue: number;
    rankTag: 'Highest Order Volume' | 'Lowest Order Volume' | 'Standard Volume';
  }[];
  customerAnalytics: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    withOpenFollowUps: number;
    withOrders: number;
    withCompletedOrders: number;
    customerValues: {
      customerId: string;
      customerName: string;
      customerPhone: string;
      place: string;
      district: string;
      orderCount: number;
      totalOrderValue: number;
      totalPaid: number;
      outstandingBalance: number;
      lastOrderDate: string;
    }[];
  };
  managementAlerts: {
    id: string;
    type: 'warning' | 'danger' | 'info';
    category: 'Follow-up' | 'Delivery' | 'Payment' | 'Quotation' | 'Order';
    title: string;
    description: string;
    count: number;
    targetTab: string;
  }[];
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  category: string;
  logoUrl?: string;
  gstin: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  officeAddress: string;
  manufacturingHub: string;
  district: string;
  state: string;
  pinCode: string;
  defaultTerms: string[];
  authorizedSignatoryLabel: string;
  updatedAt: string;
  updatedBy: string;
}

export interface QuotationSettings {
  prefix: string; // e.g. 'KI-QTN'
  numberFormat: string; // 'KI-QTN-YYYY-XXXX'
  defaultGstRate: number; // 18
  cgstRate: number; // 9
  sgstRate: number; // 9
  defaultValidityDays: number; // 30
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  defaultInstallationTerms: string;
  defaultWarrantyTerms: string;
  defaultRemarks: string;
  transportationChargeBehavior: 'included' | 'actuals' | 'fixed';
  defaultTransportCharge: number;
  updatedAt: string;
  updatedBy: string;
}

export interface OrderSettings {
  prefix: string; // e.g. 'KI-ORD'
  numberFormat: string; // 'KI-ORD-YYYY-XXXX'
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  defaultInstallationBehavior: 'mandatory' | 'optional_requested' | 'not_required';
  defaultOrderRemarks: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SystemPreferences {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultCountry: string;
  defaultState: string;
  defaultGstRate: number;
  followUpReminderTime: string;
  defaultQuotationValidityDays: number;
  paginationSize: number;
  enableWhatsAppAlerts: boolean;
  enableGpsVerification: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface LeadSourceItem {
  id: string;
  name: string;
  active: boolean;
  displayOrder: number;
  description?: string;
  isSystem?: boolean;
}

export interface WorkflowStatusItem {
  id: string;
  name: string;
  category: 'lead' | 'quotation' | 'order' | 'delivery';
  color: string;
  active: boolean;
  isSystem: boolean;
  order: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module:
    | 'Users'
    | 'Leads'
    | 'Customers'
    | 'Quotations'
    | 'Orders'
    | 'Payments'
    | 'Delivery'
    | 'Products'
    | 'Settings'
    | 'Visits'
    | 'Follow-ups';
  recordId: string;
  recordNumber?: string;
  description: string;
  details?: Record<string, any>;
  previousValue?: string;
  newValue?: string;
}

export interface RolePermissionMatrixItem {
  module: string;
  owner: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean; assign: boolean };
  senior: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean; assign: boolean };
  executive: { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean; assign: boolean };
  description: string;
}

