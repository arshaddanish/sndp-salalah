import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Skeleton className="h-10 w-full md:w-[250px]" />
        <Skeleton className="h-10 w-full md:w-[150px]" />
        <Skeleton className="h-10 w-full md:w-[150px]" />
        <Skeleton className="h-10 w-full md:w-[280px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border border-neutral-100 bg-white">
        <div className="border-b border-neutral-100 p-4">
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
