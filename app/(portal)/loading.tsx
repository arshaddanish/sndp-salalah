import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-[400px] rounded-xl border border-neutral-100 bg-white p-6">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="col-span-3 h-[400px] rounded-xl border border-neutral-100 bg-white p-6">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
