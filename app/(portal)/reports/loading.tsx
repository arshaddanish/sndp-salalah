import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <h1 className="text-text-primary text-2xl font-bold">
        <Skeleton className="h-8 w-48" />
      </h1>

      {/* Tabs Skeleton */}
      <div className="border-border-muted flex gap-4 border-b pb-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Filters/Summary Skeleton */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border-muted space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="border-border-muted space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Table/Chart Skeleton Base */}
      <div className="mt-8 h-64 rounded-md border border-neutral-100 bg-white p-6">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}
