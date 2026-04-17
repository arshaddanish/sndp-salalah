import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import type {
  FinancialActivityMetrics,
  MemberActivityMetrics,
  MemberStatusData,
} from '@/types/dashboard';
export async function getDashboardMemberKpis(): Promise<{
  totalMembers: number;
  nearExpiry: number;
}> {
  const [totalMembersResult, nearExpiryResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.is_archived, false)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.is_lifetime} = false AND ${members.expiry} >= CURRENT_DATE AND ${members.expiry} <= CURRENT_DATE + INTERVAL '30 days'`,
      ),
  ]);

  return {
    totalMembers: Number(totalMembersResult[0]?.count ?? 0),
    nearExpiry: Number(nearExpiryResult[0]?.count ?? 0),
  };
}

export async function getDashboardMemberStatus(): Promise<MemberStatusData> {
  const [statusResult] = await db
    .select({
      active: sql<number>`count(*) filter (where expiry > CURRENT_DATE + INTERVAL '30 days' and is_archived = false and is_lifetime = false)`,
      nearExpiry: sql<number>`count(*) filter (where expiry >= CURRENT_DATE and expiry <= CURRENT_DATE + INTERVAL '30 days' and is_archived = false and is_lifetime = false)`,
      expired: sql<number>`count(*) filter (where expiry < CURRENT_DATE and is_archived = false and is_lifetime = false)`,
      lifetime: sql<number>`count(*) filter (where is_lifetime = true and is_archived = false)`,
      pending: sql<number>`count(*) filter (where expiry is null and is_lifetime = false and is_archived = false)`,
    })
    .from(members);

  return {
    pending: Number(statusResult?.pending ?? 0),
    active: Number(statusResult?.active ?? 0),
    expired: Number(statusResult?.expired ?? 0),
    lifetime: Number(statusResult?.lifetime ?? 0),
    nearExpiry: Number(statusResult?.nearExpiry ?? 0),
  };
}

export async function getDashboardMemberActivity(): Promise<MemberActivityMetrics> {
  const [periodResult] = await db
    .select({
      periodLabel: sql<string>`to_char(DATE_TRUNC('month', CURRENT_DATE), 'FMMonth YYYY')`,
    })
    .from(members)
    .limit(1);

  const periodLabel =
    periodResult?.periodLabel ??
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

  const [newThisMonthResult, renewedThisMonthResult, expiredThisMonthResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.is_lifetime} = false AND ${members.active_from} >= DATE_TRUNC('month', CURRENT_DATE) AND COALESCE(${members.first_joined_at}, ${members.active_from}) >= DATE_TRUNC('month', CURRENT_DATE)`,
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.is_lifetime} = false AND ${members.active_from} >= DATE_TRUNC('month', CURRENT_DATE) AND COALESCE(${members.first_joined_at}, ${members.active_from}) < DATE_TRUNC('month', CURRENT_DATE)`,
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.is_lifetime} = false AND ${members.expiry} >= DATE_TRUNC('month', CURRENT_DATE) AND ${members.expiry} < CURRENT_DATE`,
      ),
  ]);

  return {
    period: periodLabel,
    newThisMonth: Number(newThisMonthResult[0]?.count ?? 0),
    renewedThisMonth: Number(renewedThisMonthResult[0]?.count ?? 0),
    expiredThisMonth: Number(expiredThisMonthResult[0]?.count ?? 0),
  };
}
export async function getDashboardFinancialKpis(): Promise<{
  cashInHand: number;
  cashInBank: number;
  ytdIncome: number;
  ytdExpense: number;
}> {
  const result = await db.execute(sql`
    SELECT
      SUM(CASE WHEN fund_account = 'cash' AND (entry_kind = 'opening_balance' OR type = 'income') THEN amount::numeric
               WHEN fund_account = 'cash' AND type = 'expense' THEN -amount::numeric ELSE 0 END) AS cash_balance,
      SUM(CASE WHEN fund_account = 'bank' AND (entry_kind = 'opening_balance' OR type = 'income') THEN amount::numeric
               WHEN fund_account = 'bank' AND type = 'expense' THEN -amount::numeric ELSE 0 END) AS bank_balance,
      SUM(CASE WHEN entry_kind = 'regular' AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE) AND type = 'income'
               THEN amount::numeric ELSE 0 END) AS ytd_income,
      SUM(CASE WHEN entry_kind = 'regular' AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE) AND type = 'expense'
               THEN amount::numeric ELSE 0 END) AS ytd_expense
    FROM transactions
  `);

  const row = result.rows[0] as
    | { cash_balance: string; bank_balance: string; ytd_income: string; ytd_expense: string }
    | undefined;

  return {
    cashInHand: Number(row?.cash_balance ?? 0),
    cashInBank: Number(row?.bank_balance ?? 0),
    ytdIncome: Number(row?.ytd_income ?? 0),
    ytdExpense: Number(row?.ytd_expense ?? 0),
  };
}

export async function getDashboardFinancialActivity(balances: {
  cashInHand: number;
  cashInBank: number;
}): Promise<FinancialActivityMetrics> {
  const [periodResult, monthResult] = await Promise.all([
    db
      .select({
        periodLabel: sql<string>`to_char(DATE_TRUNC('month', CURRENT_DATE), 'FMMonth YYYY')`,
      })
      .from(members)
      .limit(1),
    db.execute(sql`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) AS expense
      FROM transactions
      WHERE entry_kind = 'regular'
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `),
  ]);

  const periodLabel =
    periodResult[0]?.periodLabel ??
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

  const monthRow = monthResult.rows[0] as { income: string; expense: string } | undefined;
  const incomeThisMonth = Number(monthRow?.income ?? 0);
  const expensesThisMonth = Number(monthRow?.expense ?? 0);

  const closingBalance = balances.cashInHand + balances.cashInBank;
  const openingBalance = closingBalance - incomeThisMonth + expensesThisMonth;

  return {
    period: periodLabel,
    openingBalance,
    incomeThisMonth,
    expensesThisMonth,
    closingBalance,
  };
}
export async function getDashboardFinancialTrend(): Promise<FinancialTrendData> {
  const result = await db.execute(sql`
    SELECT
      to_char(DATE_TRUNC('month', transaction_date), 'Mon YY') AS month,
      SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) AS expense
    FROM transactions
    WHERE entry_kind = 'regular'
      AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
      AND transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    GROUP BY DATE_TRUNC('month', transaction_date)
    ORDER BY DATE_TRUNC('month', transaction_date)
  `);

  const monthlyData = (result.rows as { month: string; income: string; expense: string }[]).map(
    (row) => ({
      month: row.month,
      income: Number(row.income),
      expense: Number(row.expense),
    }),
  );

  const totalIncome = monthlyData.reduce((sum, r) => sum + r.income, 0);
  const totalExpense = monthlyData.reduce((sum, r) => sum + r.expense, 0);
  const count = monthlyData.length || 1;
  const averageMonthlyIncome = totalIncome / count;
  const averageMonthlyExpense = totalExpense / count;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return {
    monthlyData,
    averageMonthlyIncome,
    averageMonthlyExpense,
    savingsRate,
  };
}
