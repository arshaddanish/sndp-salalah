import type { Metadata } from 'next';

import { DashboardFinancialActivity } from '@/components/features/dashboard/dashboard-financial-activity';
import { DashboardFinancialChart } from '@/components/features/dashboard/dashboard-financial-chart';
import { DashboardKpis } from '@/components/features/dashboard/dashboard-kpis';
import { DashboardMemberActivity } from '@/components/features/dashboard/dashboard-member-activity';
import { DashboardMemberChart } from '@/components/features/dashboard/dashboard-member-chart';
import {
  getDashboardFinancialActivity,
  getDashboardFinancialKpis,
  getDashboardMemberActivity,
  getDashboardMemberKpis,
  getDashboardMemberStatus,
} from '@/lib/queries/dashboard';
import type { FinancialTrendData, KpiData } from '@/types/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of organization metrics',
};

export default async function DashboardPage() {
  const financialKpis = await getDashboardFinancialKpis();

  const [kpis, memberStatus, memberActivity, financialActivity] = await Promise.all([
    getDashboardMemberKpis(),
    getDashboardMemberStatus(),
    getDashboardMemberActivity(),
    getDashboardFinancialActivity(financialKpis),
  ]);

  const kpiStats: KpiData = {
    totalMembers: kpis.totalMembers,
    nearExpiry: kpis.nearExpiry,
    cashInHand: financialKpis.cashInHand,
    cashInBank: financialKpis.cashInBank,
    ytdIncome: financialKpis.ytdIncome,
    ytdExpense: financialKpis.ytdExpense,
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
        <DashboardMemberChart data={memberStatus} />
        <div className="space-y-6">
          <DashboardFinancialActivity data={financialActivity} />
          <DashboardMemberActivity data={memberActivity} />
        </div>
      </div>
      <DashboardFinancialChart data={financialTrend} />
    </div>
  );
}
