
export interface PlanningData {
  overallBV: number; // Crores
  ats: number; // Crores
  digitalContributionPercent: number;
  presalesContributionPercent: number;
  brandContributionPercent: number;
  referralContributionPercent: number;
  cpContributionPercent: number;
  ltwPercent: number; // Lead to Walkin
  wtbPercent: number; // Walkin to Booking
  cpl: number; // Cost per Lead (INR)
  taxPercent: number;
  receivedBudget: number;
  calculationMode: 'revenue' | 'budget';
  budgetInput: number;
}

export interface CalculatedMetrics {
  totalUnits: number;
  digitalUnits: number;
  presalesUnits: number;
  digitalBV: number;
  presalesBV: number;
  targetWalkins: number;
  targetLeads: number;
  baseBudget: number;
  taxAmount: number;
  allInBudget: number;
  cpw: number;
  cpb: number;
  revenue: number; // INR
  targetCOM: number;
}

export interface WeeklyData {
  id: number;
  weekLabel: string;
  dateRange: string;
  startDate: string; // ISO String
  monthLabel: string; // e.g. "Apr 2025"
  quarterLabel: string; // e.g. "Q1 (Apr-Jun)"
  halfYearLabel: string; // e.g. "H1 (Apr-Sep)"
  
  spendDistribution: number;
  leadDistribution: number;
  adConversion: number;
  
  leads: number;
  cumulativeLeads: number;
  ap: number;
  cumulativeAp: number;
  ad: number;
  cumulativeAd: number;
  spendsBase: number;
  spendsAllIn: number;
}

export interface WeeklyActuals {
  weekId: number;
  leads?: number;
  ap?: number;
  ad?: number;
  spends?: number;
  bookings?: number;
  presalesBookings?: number;
  brandBookings?: number;
  referralBookings?: number;
  cpBookings?: number;
}

export interface MediaChannel {
  id: string;
  name: string;
  allocationPercent: number;
  estimatedCpl: number;
  budget?: number; 
  leads?: number;
  capiPercent: number;
  capiToApPercent: number;
  apToAdPercent: number;
  isCustom?: boolean;
}

export interface ChannelPerformance {
  channelId: string;
  spends: number;
  leads: number;
  openAttempted: number;
  contacted: number;
  assignedToSales: number;
  ap: number;
  ad: number;
  bookings: number;
  lost: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  section: string;
  message: string;
}

export interface Poc {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  poc: string;
  status: 'Planning' | 'Active' | 'Completed';
  plan: PlanningData;
  otherSpends: number;
  manualMediaBudget?: number;
  mediaPlan: MediaChannel[]; 
  channelPerformance: ChannelPerformance[];
  weeks: WeeklyData[];
  actuals: Record<number, WeeklyActuals>; 
  logs: LogEntry[];
  isLocked: boolean; 
}

export enum ViewMode {
  BRAND = 'BRAND',
  AGENCY = 'AGENCY'
}

export enum TimeGranularity {
  WEEKLY = 'WoW',
  MONTHLY = 'MoM',
  QUARTERLY = 'QoQ',
  HALF_YEARLY = 'H1/H2'
}

export enum TabView {
  PLANNING = 'PLANNING',
  MEDIA_MIX = 'MEDIA_MIX',
  WOW_PLAN = 'WOW_PLAN',
  PERFORMANCE = 'PERFORMANCE',
  CHANNEL_TRACKER = 'CHANNEL_TRACKER',
  HISTORY = 'HISTORY'
}

export enum UserRole {
  GM = 'General Manager',
  SM = 'Senior Manager',
  MANAGER = 'Manager'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
