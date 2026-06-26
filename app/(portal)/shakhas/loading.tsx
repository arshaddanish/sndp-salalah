import { Skeleton } from '@/components/ui/skeleton';

export default function ShakhasLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-bold">
          <Skeleton className="h-8 w-32" />
        </h1>
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
