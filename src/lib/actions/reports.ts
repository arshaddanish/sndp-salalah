'use server';

import { and, eq, gte, lte, sql, ne } from 'drizzle-orm';

import { db } from '@/lib/db';
import { members, shakhas, transactionCategories, transactions } from '@/lib/db/schema';
import { parseEndOfDayOrNull, parseStartOfDayOrNull } from '@/lib/utils/date';
import type { ActionResult } from '@/types/actions';
import type {
  CategoryBreakdownItem,
  FundAccountMetrics,
  MembershipActivityDataPoint,
  MembershipActivitySummary,
  MonthlyDataPoint,
  RenewedMemberRow,
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

    const conditions = [
      eq(transactions.entry_kind, 'regular'),
      ne(transactions.payment_mode, 'pending'),
    ];

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

export async function fetchRenewedMembers(
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<RenewedMemberRow[]>> {
  try {
    const start = parseStartOfDayOrNull(startDate);
    const end = parseEndOfDayOrNull(endDate);

    const category = await db.query.transactionCategories.findFirst({
      where: and(
        eq(transactionCategories.name, 'Membership Fee'),
        eq(transactionCategories.type, 'income'),
      ),
    });

    if (!category) {
      return {
        success: true,
        data: [],
      };
    }

    const conditions = [
      eq(transactions.category_id, category.id),
      eq(members.is_archived, false),
      sql`${transactions.transaction_date} > ${members.first_joined_at}`,
      ne(transactions.payment_mode, 'pending'),
    ];

    if (start) {
      conditions.push(gte(transactions.transaction_date, start));
    }

    if (end) {
      conditions.push(lte(transactions.transaction_date, end));
    }

    const rows = await db
      .select({
        id: members.id,
        memberCode: members.member_code,
        name: members.name,
        civilIdNo: members.civil_id_no,
        shakhaName: shakhas.name,
        firstJoinedAt: sql<string>`to_char(${members.first_joined_at}, 'YYYY-MM-DD')`,
        activeFrom: sql<string>`to_char(${transactions.transaction_date}, 'YYYY-MM-DD')`,
        expiry: sql<string | null>`to_char(${members.expiry}, 'YYYY-MM-DD')`,
      })
      .from(transactions)
      .innerJoin(members, eq(transactions.member_id, members.id))
      .leftJoin(shakhas, eq(members.shakha_id, shakhas.id))
      .where(and(...conditions))
      .orderBy(sql`${transactions.transaction_date} desc`);

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error('Error fetching renewed members:', error);
    return {
      success: false,
      error: 'Unable to load renewed members. Please try again.',
    };
  }
}

export async function fetchMembershipActivity(
  startDate?: string,
  endDate?: string,
): Promise<ActionResult<MembershipActivitySummary>> {
  try {
    const start = parseStartOfDayOrNull(startDate);
    const end = parseEndOfDayOrNull(endDate);

    const category = await db.query.transactionCategories.findFirst({
      where: and(
        eq(transactionCategories.name, 'Membership Fee'),
        eq(transactionCategories.type, 'income'),
      ),
    });

    if (!category) {
      return {
        success: true,
        data: {
          totalRenewed: 0,
          totalExpired: 0,
          monthlyBreakdown: [],
        },
      };
    }

    const renewedConditions = [
      eq(transactions.category_id, category.id),
      eq(members.is_archived, false),
      sql`${transactions.transaction_date} > ${members.first_joined_at}`,
      ne(transactions.payment_mode, 'pending'),
    ];
    if (start) renewedConditions.push(gte(transactions.transaction_date, start));
    if (end) renewedConditions.push(lte(transactions.transaction_date, end));

    const expiredConditions = [
      sql`${members.expiry} < CURRENT_DATE`,
      eq(members.is_archived, false),
    ];
    if (start) expiredConditions.push(gte(members.expiry, start));
    if (end) expiredConditions.push(lte(members.expiry, end));

    const [renewedRows, expiredRows] = await Promise.all([
      db
        .select({
          month: sql<string>`to_char(${transactions.transaction_date}, 'YYYY-MM')`,
          monthLabel: sql<string>`to_char(${transactions.transaction_date}, 'Mon YY')`,
          count: sql<number>`count(distinct ${transactions.member_id})`,
        })
        .from(transactions)
        .innerJoin(members, eq(transactions.member_id, members.id))
        .where(and(...renewedConditions))
        .groupBy(sql`1`, sql`2`)
        .orderBy(sql`1`),
      db
        .select({
          month: sql<string>`to_char(${members.expiry}, 'YYYY-MM')`,
          monthLabel: sql<string>`to_char(${members.expiry}, 'Mon YY')`,
          count: sql<number>`count(*)`,
        })
        .from(members)
        .where(and(...expiredConditions))
        .groupBy(sql`1`, sql`2`)
        .orderBy(sql`1`),
    ]);

    const monthlyMap = new Map<string, MembershipActivityDataPoint>();

    renewedRows.forEach((row) => {
      const entry = monthlyMap.get(row.month) ?? {
        month: row.monthLabel,
        renewedCount: 0,
        expiredCount: 0,
      };
      entry.renewedCount = Number(row.count);
      monthlyMap.set(row.month, entry);
    });

    expiredRows.forEach((row) => {
      const entry = monthlyMap.get(row.month) ?? {
        month: row.monthLabel,
        renewedCount: 0,
        expiredCount: 0,
      };
      entry.expiredCount = Number(row.count);
      monthlyMap.set(row.month, entry);
    });

    const totalRenewed = renewedRows.reduce((sum, row) => sum + Number(row.count), 0);
    const totalExpired = expiredRows.reduce((sum, row) => sum + Number(row.count), 0);

    return {
      success: true,
      data: {
        totalRenewed,
        totalExpired,
        monthlyBreakdown: Array.from(monthlyMap.values()),
      },
    };
  } catch (error) {
    console.error('Error fetching membership activity:', error);
    return {
      success: false,
      error: 'Unable to load membership activity. Please try again.',
    };
  }
}
