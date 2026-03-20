'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type OnChangeFn,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import React, { useId } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  rowCount?: number;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  manualPagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  rowCount,
  pageCount,
  pagination,
  onPaginationChange,
  manualPagination = false,
}: Readonly<DataTableProps<TData, TValue>>) {
  const skeletonId = useId();
  const tableOptions = React.useMemo(
    () => ({
      data,
      columns,
      pageCount: pageCount ?? -1,
      state: {
        ...(pagination && { pagination }),
      },
      ...(onPaginationChange ? { onPaginationChange } : {}),
      manualPagination,
      getCoreRowModel: getCoreRowModel(),
      ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 10,
        },
      },
    }),
    [data, columns, pageCount, pagination, onPaginationChange, manualPagination],
  );
  const table = useReactTable(tableOptions);

  const currentPagination = pagination ??
    table.getState().pagination ?? { pageIndex: 0, pageSize: 10 };
  const currentPageSize = currentPagination.pageSize;
  const currentPageIndex = currentPagination.pageIndex;
  const totalRows = manualPagination
    ? (rowCount ?? Math.max(0, table.getPageCount() * currentPageSize))
    : table.getFilteredRowModel().rows.length;

  const setPageIndex = (nextPageIndex: number) => {
    if (manualPagination && onPaginationChange) {
      onPaginationChange({ pageIndex: nextPageIndex, pageSize: currentPageSize });
      return;
    }

    table.setPageIndex(nextPageIndex);
  };

  const setPageSize = (nextPageSize: number) => {
    if (manualPagination && onPaginationChange) {
      onPaginationChange({ pageIndex: 0, pageSize: nextPageSize });
      return;
    }

    table.setPageSize(nextPageSize);
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: currentPageSize }).map((_, i) => (
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
        className="border-border/50 hover:bg-surface-hover/50 h-13 border-b transition-colors"
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
            {!isLoading && table.getRowModel().rows?.length > 0 && renderDataRows()}
            {!isLoading && table.getRowModel().rows?.length === 0 && renderEmptyState()}
          </TableBody>
        </Table>
      </div>

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
                setPageSize(Number(e.target.value));
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
              onClick={() => setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center p-0"
              onClick={() => setPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center p-0"
              onClick={() => setPageIndex(currentPageIndex + 1)}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="hidden h-8 w-8 items-center justify-center p-0 lg:flex"
              onClick={() => setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
