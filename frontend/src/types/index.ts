export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  snapshotId: string;
  name: string;
  categoryType: CategoryType;
  value: number;
  encryptedData?: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CategoryDefinition {
  id: string;
  userId: string;
  name: string;
  categoryType: CategoryType;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CategoryType {
  WALLET = "wallet",
  BANK = "bank",
  INVESTMENT = "investment",
  DEBT = "debt",
  CREDIT = "credit",
  SHARED = "shared",
  OTHER = "other",
}

export interface Snapshot {
  id: string;
  userId: string;
  date: Date;
  frequency: "monthly" | "weekly";
  totalValue: number;
  encryptedData?: string;
  categories: Category[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  userId: string;
  date: Date;
  title: string;
  description: string;
  eventType: MilestoneType;
  icon?: string;
  createdAt: Date;
}

export enum MilestoneType {
  JOB_CHANGE = "job_change",
  PURCHASE = "purchase",
  INVESTMENT = "investment",
  DEBT_PAID = "debt_paid",
  OTHER = "other",
}

export interface Analytics {
  totalWealth: number;
  monthlyAvgSavings: number;
  cagrTotal: number;
  cagrYoY: number;
  volatility: number;
  volatilityAnnualized: number;
  maxDrawdown: number;
  runway: number;
  runwayReal: number;
  categoryBreakdown: CategoryBreakdown[];
  projection: Projection;
}

export interface CategoryBreakdown {
  categoryType: CategoryType;
  value: number;
  percentage: number;
  change: number;
}

export interface Projection {
  optimistic: number;
  realistic: number;
  pessimistic: number;
  months: number;
}

export const PREDEFINED_CATEGORIES = [
  { name: "Portafoglio", type: CategoryType.WALLET, sortOrder: 1 },
  { name: "Portafoglio Blu", type: CategoryType.WALLET, sortOrder: 2 },
  { name: "Saldo Amazon", type: CategoryType.WALLET, sortOrder: 3 },
  { name: "SatisPay", type: CategoryType.WALLET, sortOrder: 4 },
  { name: "Welfare", type: CategoryType.WALLET, sortOrder: 5 },
  { name: "N26", type: CategoryType.WALLET, sortOrder: 6 },
  { name: "Revolut", type: CategoryType.WALLET, sortOrder: 7 },
  { name: "Hype", type: CategoryType.WALLET, sortOrder: 8 },
  { name: "Prepagata", type: CategoryType.WALLET, sortOrder: 9 },
  { name: "PayPal", type: CategoryType.WALLET, sortOrder: 10 },
  { name: "Debiti Nadia", type: CategoryType.DEBT, sortOrder: 11 },
  {
    name: "Caparra casa Santa Lucia",
    type: CategoryType.CREDIT,
    sortOrder: 12,
  },
  { name: "Richieste Satispay", type: CategoryType.CREDIT, sortOrder: 13 },
  {
    name: "Bilancio Splitwise (casa, vacanze e auto)",
    type: CategoryType.SHARED,
    sortOrder: 14,
  },
  {
    name: "Bilancio spese divise AllMed Fisio",
    type: CategoryType.SHARED,
    sortOrder: 15,
  },
  { name: "Investimenti", type: CategoryType.INVESTMENT, sortOrder: 16 },
  { name: "Degiro", type: CategoryType.INVESTMENT, sortOrder: 17 },
  { name: "Conto Sella", type: CategoryType.BANK, sortOrder: 18 },
  { name: "Conto BBVA", type: CategoryType.BANK, sortOrder: 19 },
  { name: "Fatture da fare", type: CategoryType.CREDIT, sortOrder: 20 },
  {
    name: "Spese Casa (da dividere)",
    type: CategoryType.SHARED,
    sortOrder: 21,
  },
];
