'use server';

import { and, eq, gte, lte, sql } from 'drizzle-orm';

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

    const [summaryRows, categoryRows, monthlyRows] = await Promise.all([
      db
        .select({
          type: transactions.type,
          fundAccount: transactions.fund_account,
          total: sql<number>`sum(${transactions.amount})`,
          count: sql<number>`count(${transactions.id})`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.type, transactions.fund_account),
      db
        .select({
          type: transactions.type,
          categoryName: transactionCategories.name,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(transactionCategories, eq(transactions.category_id, transactionCategories.id))
        .where(and(...conditions))
        .groupBy(transactions.type, transactionCategories.name),
      db
        .select({
          month: sql<string>`to_char(${transactions.transaction_date}, 'YYYY-MM')`,
          monthLabel: sql<string>`to_char(${transactions.transaction_date}, 'Mon YY')`,
          type: transactions.type,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(sql`1`, sql`2`, transactions.type)
        .orderBy(sql`1`),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeTransactionCount = 0;
    let expenseTransactionCount = 0;
    let cashIncome = 0;
    let cashExpense = 0;
    let bankIncome = 0;
    let bankExpense = 0;

    summaryRows.forEach((row) => {
      const amount = Number(row.total);
      const count = Number(row.count);
      if (row.type === 'income') {
        totalIncome += amount;
        incomeTransactionCount += count;
        if (row.fundAccount === 'cash') cashIncome += amount;
        else if (row.fundAccount === 'bank') bankIncome += amount;
      } else if (row.type === 'expense') {
        totalExpense += amount;
        expenseTransactionCount += count;
        if (row.fundAccount === 'cash') cashExpense += amount;
        else if (row.fundAccount === 'bank') bankExpense += amount;
      }
    });

    const incomeBreakdown = sortBreakdownItems(
      categoryRows
        .filter((r) => r.type === 'income')
        .map((r) => ({ categoryName: r.categoryName ?? 'Uncategorized', total: Number(r.total) })),
    );

    const expenseBreakdown = sortBreakdownItems(
      categoryRows
        .filter((r) => r.type === 'expense')
        .map((r) => ({ categoryName: r.categoryName ?? 'Uncategorized', total: Number(r.total) })),
    );

    const monthlyMap = new Map<string, MonthlyDataPoint>();
    monthlyRows.forEach((row) => {
      const entry = monthlyMap.get(row.month) ?? { month: row.monthLabel, income: 0, expense: 0 };
      if (row.type === 'income') entry.income += Number(row.total);
      else if (row.type === 'expense') entry.expense += Number(row.total);
      monthlyMap.set(row.month, entry);
    });

    return {
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          periodNet: totalIncome - totalExpense,
          transactionCount: incomeTransactionCount + expenseTransactionCount,
          incomeTransactionCount,
          expenseTransactionCount,
        },
        fundAccountBreakdown: {
          cash: buildFundAccountMetrics(cashIncome, cashExpense, totalIncome, totalExpense),
          bank: buildFundAccountMetrics(bankIncome, bankExpense, totalIncome, totalExpense),
        },
        incomeBreakdown,
        expenseBreakdown,
        monthlyTrend: Array.from(monthlyMap.values()),
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
