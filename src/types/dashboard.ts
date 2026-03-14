// Dashboard KPI metrics
export interface KpiData {
  totalMembers: number;
  nearExpiry: number;
  cashInHand: number;
  cashInBank: number;
  ytdIncome: number;
  ytdExpense: number;
}

// Member status distribution
export interface MemberStatusData {
  active: number;
  expired: number;
  lifetime: number;
  nearExpiry: number;
}

// Member activity metrics for a specific period
export interface MemberActivityMetrics {
  period: string; // e.g., "March 2026"
  newThisMonth: number;
  renewedThisMonth: number;
  expiredThisMonth: number;
}

// Financial activity for a specific period
export interface FinancialActivityMetrics {
  period: string; // e.g., "March 2026"
  openingBalance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  closingBalance: number;
}

// Monthly financial data point
export interface FinancialDataPoint {
  month: string; // "Jan 25", "Feb 25", etc.
  income: number;
  expense: number;
}

// Financial trend data for monthly display
export interface FinancialTrendData {
  monthlyData: FinancialDataPoint[];
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  savingsRate: number;
}
