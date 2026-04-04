'use client';

import { type ColumnDef, flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import React, { useId } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableBaseProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  isLoading?: boolean;
  skeletonRowCount: number;
  onRowClick?: (row: TData) => void;
  footer?: React.ReactNode;
}

export function DataTableBase<TData, TValue>({
  table,
  columns,
  isLoading = false,
  skeletonRowCount,
  onRowClick,
  footer,
}: Readonly<DataTableBaseProps<TData, TValue>>) {
  const skeletonId = useId();

  const renderSkeletonRows = () => {
    return Array.from({ length: skeletonRowCount }).map((_, i) => (
      <TableRow
        key={`${skeletonId}-${i}`}
        className="border-border/50 border-b hover:bg-transparent"
      >
        {columns.map((_, j) => (
          <TableCell key={`${skeletonId}-cell-${j}`} className="h-13 px-4">
            <Skeleton className="bg-text-muted/10 h-5 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  const renderDataRows = () =>
    table.getRowModel().rows.map((row) => (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && 'selected'}
        className={cn(
          'border-border/50 hover:bg-surface-hover/50 h-13 border-b transition-colors',
          onRowClick && 'cursor-pointer',
        )}
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className="px-4 py-2">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} className="text-text-muted h-50 text-center">
        No results found.
      </TableCell>
    </TableRow>
  );

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border shadow-sm transition-all duration-200">
      <div className="relative overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border border-b hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-text-muted bg-surface-alt/50 h-11 px-4 text-xs font-semibold tracking-wider uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && renderSkeletonRows()}
            {!isLoading && table.getRowModel().rows.length > 0 && renderDataRows()}
            {!isLoading && table.getRowModel().rows.length === 0 && renderEmptyState()}
          </TableBody>
        </Table>
      </div>
      {footer}
    </div>
  );
}
