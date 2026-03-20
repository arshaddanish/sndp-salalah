import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn('bg-text-muted/40 animate-pulse rounded-md', className)} {...props} />;
}

export { Skeleton };
