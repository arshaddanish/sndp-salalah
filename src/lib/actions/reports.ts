'use server';

import { format } from 'date-fns';
import { and, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/lib/db';
import { transactionCategories, transactions } from '@/lib/db/schema';
import { parseEndOfDayOrNull, parseStartOfDayOrNull } from '@/lib/utils/date';
import type { ActionResult } from '@/types/actions';
import type {
  CategoryBreakdownItem,
  FundAccountMetrics,
  MonthlyDataPoint,
  ReportData,
} from '@/types/reports';

function sortBreakdownItems(items: CategoryBreakdownItem[]) {
  return items.sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }

    return left.categoryName.localeCompare(right.categoryName);
  });
}

function buildFundAccountMetrics(
  income: number,
  expense: number,
  totalIncome: number,
  totalExpense: number,
): FundAccountMetrics {
  return {
    income,
    expense,
    net: income - expense,
    incomeShare: totalIncome === 0 ? 0 : (income / totalIncome) * 100,
    expenseShare: totalExpense === 0 ? 0 : (expense / totalExpense) * 100,
  };
}

export async function fetchReportData(
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<ReportData>> {
  try {
    const start = parseStartOfDayOrNull(startDate);
    const end = parseEndOfDayOrNull(endDate);

    const conditions = [eq(transactions.entry_kind, 'regular')];

    if (start) {
      conditions.push(gte(transactions.transaction_date, start));
    }

    if (end) {
      conditions.push(lte(transactions.transaction_date, end));
    }

    const filteredRows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        fundAccount: transactions.fund_account,
        transactionDate: transactions.transaction_date,
        categoryName: transactionCategories.name,
      })
      .from(transactions)
      .leftJoin(transactionCategories, eq(transactions.category_id, transactionCategories.id))
      .where(and(...conditions));

    const incomeTotalsByCategory = new Map<string, number>();
    const expenseTotalsByCategory = new Map<string, number>();
    const monthlyTotals = new Map<
      string,
      {
        monthLabel: string;
        income: number;
        expense: number;
      }
    >();

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeTransactionCount = 0;
    let expenseTransactionCount = 0;
    let cashIncome = 0;
    let cashExpense = 0;
    let bankIncome = 0;
    let bankExpense = 0;

    filteredRows.forEach((row) => {
      const amount = Number(row.amount);
      const monthKey = format(row.transactionDate, 'yyyy-MM');
      const monthlyEntry = monthlyTotals.get(monthKey) ?? {
        monthLabel: format(row.transactionDate, 'MMM yy'),
        income: 0,
        expense: 0,
      };

      const categoryName = row.categoryName ?? 'Uncategorized';

      if (row.type === 'income') {
        totalIncome += amount;
        incomeTransactionCount += 1;
        incomeTotalsByCategory.set(
          categoryName,
          (incomeTotalsByCategory.get(categoryName) ?? 0) + amount,
        );
        monthlyEntry.income += amount;

        if (row.fundAccount === 'cash') {
          cashIncome += amount;
        } else {
          bankIncome += amount;
        }
      } else {
        totalExpense += amount;
        expenseTransactionCount += 1;
        expenseTotalsByCategory.set(
          categoryName,
          (expenseTotalsByCategory.get(categoryName) ?? 0) + amount,
        );
        monthlyEntry.expense += amount;

        if (row.fundAccount === 'cash') {
          cashExpense += amount;
        } else {
          bankExpense += amount;
        }
      }

      monthlyTotals.set(monthKey, monthlyEntry);
    });

    const incomeBreakdown = sortBreakdownItems(
      Array.from(incomeTotalsByCategory.entries()).map(([categoryName, total]) => ({
        categoryName,
        total,
      })),
    );

    const expenseBreakdown = sortBreakdownItems(
      Array.from(expenseTotalsByCategory.entries()).map(([categoryName, total]) => ({
        categoryName,
        total,
      })),
    );

    const monthlyTrend: MonthlyDataPoint[] = Array.from(monthlyTotals.entries())
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([, value]) => ({
        month: value.monthLabel,
        income: value.income,
        expense: value.expense,
      }));

    const totalTransactions = filteredRows.length;

    const fundAccountBreakdown = {
      cash: buildFundAccountMetrics(cashIncome, cashExpense, totalIncome, totalExpense),
      bank: buildFundAccountMetrics(bankIncome, bankExpense, totalIncome, totalExpense),
    };

    return {
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          periodNet: totalIncome - totalExpense,
          transactionCount: totalTransactions,
          incomeTransactionCount,
          expenseTransactionCount,
        },
        fundAccountBreakdown,
        incomeBreakdown,
        expenseBreakdown,
        monthlyTrend,
      },
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    return {
      success: false,
      error: 'Unable to load report data. Please try again.',
    };
  }
}
