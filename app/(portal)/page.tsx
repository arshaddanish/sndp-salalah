import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

import { DashboardFinancialActivity } from '@/components/features/dashboard/dashboard-financial-activity';
import { DashboardFinancialChart } from '@/components/features/dashboard/dashboard-financial-chart';
import { DashboardKpis } from '@/components/features/dashboard/dashboard-kpis';
import { DashboardMemberActivity } from '@/components/features/dashboard/dashboard-member-activity';
import { DashboardMemberChart } from '@/components/features/dashboard/dashboard-member-chart';
import {
  getDashboardFinancialActivity,
  getDashboardFinancialKpis,
  getDashboardFinancialTrend,
  getDashboardMemberActivity,
  getDashboardMemberKpis,
  getDashboardMemberStatus,
} from '@/lib/queries/dashboard';
import type { KpiData } from '@/types/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of organization metrics',
};

export default async function DashboardPage() {
  const financialKpis = await getDashboardFinancialKpis();

  const [kpis, memberStatus, memberActivity, financialActivity, financialTrend] = await Promise.all(
    [
      getDashboardMemberKpis(),
      getDashboardMemberStatus(),
      getDashboardMemberActivity(),
      getDashboardFinancialActivity(financialKpis),
      getDashboardFinancialTrend(),
    ],
  );
  const kpiStats: KpiData = {
    totalMembers: kpis.totalMembers,
    nearExpiry: kpis.nearExpiry,
    cashInHand: financialKpis.cashInHand,
    cashInBank: financialKpis.cashInBank,
    ytdIncome: financialKpis.ytdIncome,
    ytdExpense: financialKpis.ytdExpense,
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
