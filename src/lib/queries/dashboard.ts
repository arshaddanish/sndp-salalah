import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import type {
  FinancialActivityMetrics,
  FinancialTrendData,
  MemberActivityMetrics,
  MemberStatusData,
} from '@/types/dashboard';

export async function getDashboardMemberKpis(): Promise<{
  totalMembers: number;
  nearExpiry: number;
}> {
  const [counts] = await db
    .select({
      totalMembers: sql<number>`count(*) FILTER (WHERE ${members.is_archived} = false)`,
      nearExpiry: sql<number>`count(*) FILTER (
        WHERE ${members.is_archived} = false
          AND ${members.is_lifetime} = false
          AND ${members.expiry} >= CURRENT_DATE
          AND ${members.expiry} <= CURRENT_DATE + INTERVAL '30 days'
      )`,
    })
    .from(members);

  return {
    totalMembers: Number(counts?.totalMembers ?? 0),
    nearExpiry: Number(counts?.nearExpiry ?? 0),
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
  // Compute period label in JS — no DB round-trip needed
  const periodLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const [newThisMonthResult, expiredThisMonthResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        sql`${members.is_archived} = false AND ${members.is_lifetime} = false AND ${members.active_from} >= DATE_TRUNC('month', CURRENT_DATE)`,
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
    renewedThisMonth: 0,
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
  // Compute period label in JS — no DB round-trip needed
  const periodLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const monthResult = await db.execute(sql`
    SELECT
      SUM(CASE WHEN type = 'income'  THEN amount::numeric ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) AS expense
    FROM transactions
    WHERE entry_kind = 'regular'
      AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND transaction_date <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  `);

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
      to_char(gs.month, 'Mon YY') AS month,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount::numeric ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount::numeric ELSE 0 END), 0) AS expense
    FROM generate_series(
      DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
      DATE_TRUNC('month', CURRENT_DATE),
      INTERVAL '1 month'
    ) AS gs(month)
    LEFT JOIN transactions t
      ON DATE_TRUNC('month', t.transaction_date) = gs.month
      AND t.entry_kind = 'regular'
    GROUP BY gs.month
    ORDER BY gs.month
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
  const averageMonthlyIncome = totalIncome / 12;
  const averageMonthlyExpense = totalExpense / 12;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return {
    monthlyData,
    averageMonthlyIncome,
    averageMonthlyExpense,
    savingsRate,
  };
}
