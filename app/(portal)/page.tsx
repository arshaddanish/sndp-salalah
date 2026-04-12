import { and, eq, gte, lt, sql } from 'drizzle-orm';
import type { Metadata } from 'next';

import { DashboardFinancialActivity } from '@/components/features/dashboard/dashboard-financial-activity';
import { DashboardFinancialChart } from '@/components/features/dashboard/dashboard-financial-chart';
import { DashboardKpis } from '@/components/features/dashboard/dashboard-kpis';
import { DashboardMemberActivity } from '@/components/features/dashboard/dashboard-member-activity';
import { DashboardMemberChart } from '@/components/features/dashboard/dashboard-member-chart';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import type {
  FinancialActivityMetrics,
  FinancialTrendData,
  KpiData,
  MemberActivityMetrics,
  MemberStatusData,
} from '@/types/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of organization metrics',
};

export default async function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalMembersResult,
    nearExpiryResult,
    memberStatusResult,
    newThisMonthResult,
    renewedThisMonthResult,
    expiredThisMonthResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.is_archived, false)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.is_archived, false),
          gte(members.expiry, now),
          lt(members.expiry, thirtyDaysFromNow),
        ),
      ),

    db
      .select({
        active: sql<number>`count(*) filter (where expiry >= ${now} and is_archived = false and is_lifetime = false)`,
        expired: sql<number>`count(*) filter (where expiry < ${now} and is_archived = false)`,
        lifetime: sql<number>`count(*) filter (where is_lifetime = true and is_archived = false)`,
        pending: sql<number>`count(*) filter (where expiry is null and is_lifetime = false and is_archived = false)`,
      })
      .from(members),

    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(and(eq(members.is_archived, false), gte(members.active_from, startOfMonth))),

    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.is_archived, false),
          gte(members.active_from, startOfMonth),
          gte(members.expiry, now),
        ),
      ),

    db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(
        and(
          eq(members.is_archived, false),
          gte(members.expiry, startOfMonth),
          lt(members.expiry, now),
        ),
      ),
  ]);

  const totalMembers = Number(totalMembersResult[0]?.count ?? 0);
  const nearExpiry = Number(nearExpiryResult[0]?.count ?? 0);
  const statusRow = memberStatusResult[0];
  const periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const kpiStats: KpiData = {
    totalMembers,
    nearExpiry,
    cashInHand: 1250,
    cashInBank: 14890.5,
    ytdIncome: 5400,
    ytdExpense: 2150,
  };

  const memberStatusData: MemberStatusData = {
    pending: Number(statusRow?.pending ?? 0),
    active: Number(statusRow?.active ?? 0),
    expired: Number(statusRow?.expired ?? 0),
    lifetime: Number(statusRow?.lifetime ?? 0),
    nearExpiry,
  };

  const monthlyActivity: MemberActivityMetrics = {
    period: periodLabel,
    newThisMonth: Number(newThisMonthResult[0]?.count ?? 0),
    renewedThisMonth: Number(renewedThisMonthResult[0]?.count ?? 0),
    expiredThisMonth: Number(expiredThisMonthResult[0]?.count ?? 0),
  };

  const financialActivity: FinancialActivityMetrics = {
    period: 'March 2026',
    openingBalance: 9950,
    incomeThisMonth: 2150,
    expensesThisMonth: 950,
    closingBalance: 11150,
  };

  const financialTrend: FinancialTrendData = {
    monthlyData: [
      { month: 'Apr 25', income: 475, expense: 190 },
      { month: 'May 25', income: 540, expense: 200 },
      { month: 'Jun 25', income: 620, expense: 240 },
      { month: 'Jul 25', income: 590, expense: 210 },
      { month: 'Aug 25', income: 650, expense: 250 },
      { month: 'Sep 25', income: 510, expense: 185 },
      { month: 'Oct 25', income: 580, expense: 215 },
      { month: 'Nov 25', income: 700, expense: 280 },
      { month: 'Dec 25', income: 750, expense: 310 },
      { month: 'Jan 26', income: 450, expense: 180 },
      { month: 'Feb 26', income: 520, expense: 195 },
      { month: 'Mar 26', income: 480, expense: 170 },
    ],
    averageMonthlyIncome: 570,
    averageMonthlyExpense: 213,
    savingsRate: 63,
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-text-primary text-2xl font-bold">Dashboard</h1>
      </div>
      <DashboardKpis data={kpiStats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardMemberChart data={memberStatusData} />
        <div className="space-y-6">
          <DashboardFinancialActivity data={financialActivity} />
          <DashboardMemberActivity data={monthlyActivity} />
        </div>
      </div>
      <DashboardFinancialChart data={financialTrend} />
    </div>
  );
}
