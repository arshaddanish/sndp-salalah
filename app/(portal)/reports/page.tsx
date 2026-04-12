import type { Metadata } from 'next';

import { ReportsView } from '@/components/features/reports/reports-view';
import { fetchReportData } from '@/lib/actions/reports';

export const metadata: Metadata = {
  title: 'Reports | SNDP Salalah',
  description: 'View date-range income and expense reports',
};

type ReportsPageSearchParams = {
  startDate?: string;
  endDate?: string;
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<ReportsPageSearchParams>;
}>) {
  const queryParams = (await searchParams) ?? {};
  const startDate = (queryParams.startDate ?? '').trim();
  const endDate = (queryParams.endDate ?? '').trim();

  const reportResult = await fetchReportData(startDate, endDate);

  if (!reportResult.success || !reportResult.data) {
    return (
      <div className="space-y-4">
        <h1 className="text-text-primary text-2xl font-bold">Reports</h1>
        <p className="text-danger text-sm">
          {reportResult.error ?? 'Unable to load reports. Please try again.'}
        </p>
      </div>
    );
  }

  return <ReportsView reportData={reportResult.data} startDate={startDate} endDate={endDate} />;
}
