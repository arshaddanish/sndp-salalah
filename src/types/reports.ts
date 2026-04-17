export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  periodNet: number;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
}

export interface FundAccountMetrics {
  income: number;
  expense: number;
  net: number;
  incomeShare: number;
  expenseShare: number;
}

export interface FundAccountBreakdown {
  cash: FundAccountMetrics;
  bank: FundAccountMetrics;
}

export interface CategoryBreakdownItem {
  categoryName: string;
  total: number;
}

export interface MonthlyDataPoint {
  month: string;
  income: number;
  expense: number;
}

export interface ReportData {
  summary: ReportSummary;
  fundAccountBreakdown: FundAccountBreakdown;
  incomeBreakdown: CategoryBreakdownItem[];
  expenseBreakdown: CategoryBreakdownItem[];
  monthlyTrend: MonthlyDataPoint[];
}
