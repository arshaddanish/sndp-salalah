'use client';

import { type Table as TanStackTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  isLoading?: boolean;
  totalRows: number;
  currentPageIndex: number;
  currentPageSize: number;
  onPageIndexChange: (nextPageIndex: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
}

export function DataTablePagination<TData>({
  table,
  isLoading = false,
  totalRows,
  currentPageIndex,
  currentPageSize,
  onPageIndexChange,
  onPageSizeChange,
}: Readonly<DataTablePaginationProps<TData>>) {
  return (
    <div className="border-border bg-surface-alt/30 flex shrink-0 items-center justify-between border-t px-4 py-3">
      <div className="text-text-muted flex items-center gap-4 text-sm">
        <div className="min-w-20">
          {isLoading ? <Skeleton className="h-4 w-16" /> : `Total: ${totalRows}`}
        </div>
        <div className="border-border flex items-center gap-2 border-l pl-4">
          <label htmlFor="rows-per-page-select" className="text-text-muted hidden sm:inline">
            Rows per page
          </label>
          <select
            id="rows-per-page-select"
            value={currentPageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
            className="border-border bg-surface text-text-primary focus:ring-accent hover:bg-surface-hover h-8 w-15 cursor-pointer appearance-none rounded-md border px-1 text-center text-sm font-medium shadow-sm transition-colors outline-none focus:ring-1"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-text-primary flex min-w-25 items-center justify-center text-right text-sm font-medium whitespace-nowrap">
          {isLoading ? (
            <Skeleton className="ml-auto h-4 w-20" />
          ) : (
            <>
              Page {currentPageIndex + 1} of {Math.max(1, table.getPageCount())}
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="secondary"
            className="hidden h-8 w-8 items-center justify-center p-0 lg:flex"
            onClick={() => onPageIndexChange(0)}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="flex h-8 w-8 items-center justify-center p-0"
            onClick={() => onPageIndexChange(Math.max(0, currentPageIndex - 1))}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="flex h-8 w-8 items-center justify-center p-0"
            onClick={() => onPageIndexChange(currentPageIndex + 1)}
            disabled={!table.getCanNextPage() || isLoading}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="hidden h-8 w-8 items-center justify-center p-0 lg:flex"
            onClick={() => onPageIndexChange(Math.max(0, table.getPageCount() - 1))}
            disabled={!table.getCanNextPage() || isLoading || table.getPageCount() < 1}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
