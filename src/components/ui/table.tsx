import * as React from 'react';

import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => {
    const childElements = React.Children.toArray(children) as React.ReactElement[];
    const hasHeader = childElements.some((child) => {
      if (!React.isValidElement(child)) {
        return false;
      }

      if (typeof child.type === 'string') {
        return child.type === 'thead';
      }

      return (child.type as { displayName?: string }).displayName === 'TableHeader';
    });

    return (
      <div className="border-border relative h-full w-full overflow-auto rounded-lg border">
        <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props}>
          {!hasHeader ? (
            <thead className="sr-only">
              <tr>
                <th scope="col">Data</th>
              </tr>
            </thead>
          ) : null}
          {children}
        </table>
      </div>
    );
  },
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-surface-hover border-border sticky top-0 z-10 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.05)]',
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('bg-surface [&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-border hover:bg-surface-hover border-b transition-colors', className)}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'text-text-secondary px-4 py-3 text-left align-middle text-xs font-medium tracking-wider uppercase',
      className,
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('text-text-primary px-4 py-3 align-middle text-sm', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
