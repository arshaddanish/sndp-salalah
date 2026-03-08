import * as React from 'react';

import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-border bg-surface rounded-xl border p-6 shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export { Card };
