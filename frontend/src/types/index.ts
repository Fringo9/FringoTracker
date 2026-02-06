export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  userId: string;
  name: string;
  category: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SnapshotEntry {
  id: string;
  userId: string;
  snapshotId: string;
  itemId: string;
  value: number;
  item?: Item;
  createdAt?: Date;
}

export interface Snapshot {
  id: string;
  userId: string;
  date: Date;
  frequency: "monthly" | "weekly";
  totalValue: number;
  encryptedData?: string;
  entries: SnapshotEntry[];
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
  categoryType: string;
  value: number;
  percentage: number;
}

export interface Projection {
  optimistic: number;
  realistic: number;
  pessimistic: number;
  months: number;
}
