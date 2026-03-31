import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        active: 'border-success/20 bg-success-bg text-success',
        expired: 'border-danger/20 bg-danger-bg text-danger',
        lifetime: 'border-lifetime/20 bg-lifetime-bg text-lifetime',
        'near-expiry': 'border-warning/20 bg-warning-bg text-warning',
        info: 'border-info/20 bg-info-bg text-info',
        default: 'border-border bg-surface text-text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
