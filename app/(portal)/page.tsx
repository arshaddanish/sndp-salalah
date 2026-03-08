import type { Metadata } from 'next';

import { DashboardKpis, type KpiData } from '@/components/features/dashboard/dashboard-kpis';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of organization metrics',
};

// TODO: Replace with real data from Drizzle ORM
const dashboardData: KpiData = {
  totalMembers: 2481,
  nearExpiry: 124,
  cashInHand: 'OMR 1,250.00',
  cashInBank: 'OMR 14,890.50',
  ytdIncome: 'OMR 5,400.00',
  ytdExpense: 'OMR 2,150.00',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-text-primary text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary text-sm">Overview of organization metrics</p>
      </div>

      <DashboardKpis data={dashboardData} />
    </div>
  );
}
