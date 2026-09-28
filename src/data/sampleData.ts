import {
  UserProfile,
  Product,
  CustomerLead,
  FollowUp,
  CustomerVisit,
  Quotation,
  Order,
  Payment,
  DailyReport,
  CustomerActivity,
  InAppNotification,
} from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_owner_01',
    name: 'John Mathew',
    email: 'john.owner@keralaincinerator.com',
    role: 'owner',
    phone: '+91 94471 20001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    active: true,
    department: 'Management',
    createdAt: '2024-01-01T09:00:00Z',
  },
  {
    id: 'usr_senior_02',
    name: 'Rahul Varma',
    email: 'rahul.senior@keralaincinerator.com',
    role: 'senior_sales_executive',
    phone: '+91 98460 34567',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    active: true,
    department: 'Sales Leadership',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'usr_se1_03',
    name: 'Arun Kumar',
    email: 'arun.sales1@keralaincinerator.com',
    role: 'sales_executive',
    phone: '+91 97455 89012',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    active: true,
    department: 'Field Sales - Central Kerala',
    createdAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'usr_se2_04',
    name: 'Bineesh K.B.',
    email: 'bineesh.sales2@keralaincinerator.com',
    role: 'sales_executive',
    phone: '+91 94967 12345',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    active: true,
    department: 'Field Sales - North & Highrange',
    createdAt: '2024-02-15T09:00:00Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_10ms_burner',
    name: '10kg MS Burner Incinerator',
    category: 'Standard Burner',
    description: '10kg mild steel domestic & light commercial waste incinerator with high heat resistance.',
    defaultPrice: 18500,
    active: true,
    capacity: '10 kg per batch (30-45 mins)',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    features: ['High-temp MS body', 'Secondary air intake grate', 'Spark arrestor mesh', 'Rain cowl chimney'],
  },
  {
    id: 'prod_10ss_burner',
    name: '10kg SS Burner Incinerator',
    category: 'Stainless Steel Burner',
    description: 'Grade 304 stainless steel 10kg burner incinerator, rust-proof with smoke reduction chamber.',
    defaultPrice: 24500,
    active: true,
    capacity: '10 kg per batch (30-40 mins)',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=80',
    features: ['SS 304 food-grade stainless steel', '100% rust proof in Kerala rains', 'Zero-maintenance body', 'Low smoke output'],
  },
  {
    id: 'prod_10ms_drum',
    name: '10kg MS Drum Incinerator',
    category: 'Drum Model',
    description: 'Heavy gauge MS drum incinerator with aeration grates, ideal for agricultural & general waste.',
    defaultPrice: 16000,
    active: true,
    capacity: '10 kg dry & semi-wet waste',
    imageUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=500&auto=format&fit=crop&q=80',
    features: ['Heavy gauge steel sheet', 'Perforated bottom air diffuser', 'Removable ash collector', 'Sturdy tripod legs'],
  },
  {
    id: 'prod_10ss_drum',
    name: '10kg SS Drum Incinerator',
    category: 'Drum Model',
    description: 'SS 304 premium drum incinerator engineered for long life and minimal maintenance.',
    defaultPrice: 22000,
    active: true,
    capacity: '10 kg per burning cycle',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80',
    features: ['All SS 304 construction', 'Weather resistant for outdoor installation', 'Easy ash disposal tray', 'Thermal insulation lid'],
  },
  {
    id: 'prod_10ss_rfl',
    name: '10kg SS RFL Incinerator',
    category: 'Refractory Lined',
    description: 'High performance stainless steel refractory-lined unit ensuring smokeless operation.',
    defaultPrice: 29500,
    active: true,
    capacity: '10 kg high-temp incineration',
    imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=500&auto=format&fit=crop&q=80',
    features: ['Ceramic refractory brick lining', 'Burn temp exceeding 900°C', 'Near smokeless odorless emissions', 'Ideal for residential villas'],
  },
  {
    id: 'prod_25kg_incinerator',
    name: '25kg Commercial Incinerator',
    category: 'Commercial',
    description: 'Medium scale commercial incinerator for clinics, resorts, and small institutions.',
    defaultPrice: 48000,
    active: true,
    capacity: '25 kg continuous burn rate',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    features: ['Dual burning chamber', 'Air blower assist connection', 'Commercial grade refractory wall', 'Heavy steel casing'],
  },
  {
    id: 'prod_50kg_heavy',
    name: '50kg Heavy Duty Industrial Incinerator',
    category: 'Industrial',
    description: 'Heavy duty dual-chamber incinerator designed for hospitals, factories, and poultry farms.',
    defaultPrice: 95000,
    active: true,
    capacity: '50 kg / hour throughput',
    imageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=500&auto=format&fit=crop&q=80',
    features: ['Compliant with Kerala Pollution Control norms', 'High chimney with wet scrubber option', 'Automatic temperature monitoring', 'Designed for medical & farm waste'],
  },
];

// Production clean state: all sample/demo transactional records removed
export const INITIAL_CUSTOMERS: CustomerLead[] = [];
export const INITIAL_FOLLOWUPS: FollowUp[] = [];
export const INITIAL_VISITS: CustomerVisit[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_ACTIVITIES: CustomerActivity[] = [];
export const INITIAL_DAILY_REPORTS: DailyReport[] = [];
export const INITIAL_NOTIFICATIONS: InAppNotification[] = [];
