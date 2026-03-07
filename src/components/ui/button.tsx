import * as React from 'react';

import { cn } from '@/lib/utils';

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'default' | 'icon';
  }
>(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'focus-visible:ring-accent/5 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-4 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        {
          'bg-accent hover:bg-accent-hover text-white': variant === 'primary',
          'text-text-primary border-border hover:bg-surface-hover border bg-white':
            variant === 'secondary',
          'bg-danger-bg text-danger border-danger/20 hover:bg-danger/10 border':
            variant === 'danger',
          'hover:bg-surface-hover text-text-primary': variant === 'ghost',
        },
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-10 w-10': size === 'icon',
        },
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
