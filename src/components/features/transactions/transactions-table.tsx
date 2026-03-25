'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

// TODO: Filter implementation deferred to next PR - do not review these commented imports
// import { usePathname, useRouter, useSearchParams } from 'next/navigation';
// import { useCallback, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
// TODO: Filter implementation deferred to next PR - do not review these imports
// import { DateRangeFilter } from '@/components/ui/date-range-filter';
// import { FilterDropdown } from '@/components/ui/dropdown-filter';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { useQueryPagination } from '@/hooks/use-query-pagination';
import { useQuerySearch } from '@/hooks/use-query-search';
import type { PaginatedTableProps } from '@/types/pagination';
import type { TransactionStatementRow } from '@/types/transactions';

const MAX_REMARKS_PREVIEW_LENGTH = 30;

// TODO: Filter options deferred to next PR - do not review this code
// const typeOptions = [
//   { label: 'All', value: 'all' },
//   { label: 'Income', value: 'income' },
//   { label: 'Expense', value: 'expense' },
// ];
// const paymentModeOptions = [
//   { label: 'All', value: 'all' },
//   { label: 'Cash', value: 'cash' },
//   { label: 'Bank', value: 'bank' },
// ];

const columns: ColumnDef<TransactionStatementRow>[] = [
  {
    accessorKey: 'transactionCode',
    header: 'ID',
    cell: ({ row }) => <span className="font-medium">{row.original.transactionCode}</span>,
  },
  {
    accessorKey: 'transactionDate',
    header: 'Date',
    cell: ({ row }) => format(row.original.transactionDate, 'dd MMM yy'),
  },
  {
    accessorKey: 'categoryName',
    header: 'Category',
    cell: ({ row }) => (
      <span className="text-text-primary font-medium">{row.original.categoryName}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span
        className={
          row.original.type === 'income'
            ? 'bg-success-bg text-success rounded px-2 py-0.5 text-xs font-medium uppercase'
            : 'bg-danger-bg text-danger rounded px-2 py-0.5 text-xs font-medium uppercase'
        }
      >
        {row.original.type}
      </span>
    ),
  },
  {
    accessorKey: 'paymentMode',
    header: 'Mode',
    cell: ({ row }) => (
      <span className="text-text-secondary text-xs font-medium uppercase">
        {row.original.paymentMode}
      </span>
    ),
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const isIncome = row.original.type === 'income';
      const amount = Number(row.original.amount).toFixed(0);
      const signedAmount = `${isIncome ? '+' : '-'}${amount}`;

      return (
        <div
          className={`text-right font-semibold tabular-nums ${
            isIncome ? 'text-success' : 'text-danger'
          }`}
        >
          {signedAmount}
        </div>
      );
    },
  },
  {
    accessorKey: 'balance',
    header: () => (
      <div className="text-right">
        <Tooltip content="Running total balance at this point in time">
          <span className="cursor-help underline decoration-dotted">Balance</span>
        </Tooltip>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="text-text-primary text-right font-semibold tabular-nums">
          {Number(row.original.balance).toFixed(0)}
        </div>
      );
    },
  },
  {
    accessorKey: 'remarks',
    header: 'Remarks',
    cell: ({ row }) => {
      const remarks = row.original.remarks;
      const shouldTruncate = remarks.length > MAX_REMARKS_PREVIEW_LENGTH;
      const displayValue = shouldTruncate
        ? `${remarks.slice(0, MAX_REMARKS_PREVIEW_LENGTH)}...`
        : remarks;

      if (!shouldTruncate) {
        return <span className="text-text-secondary text-sm">{displayValue}</span>;
      }

      return (
        <Tooltip content={<span className="leading-5">{remarks}</span>}>
          <button
            type="button"
            aria-label={`View full remarks for transaction ${row.original.transactionCode}`}
            className="text-text-secondary focus-visible:outline-accent inline-block max-w-[320px] truncate border-0 bg-transparent p-0 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {displayValue}
          </button>
        </Tooltip>
      );
    },
  },
];

type TransactionsTableProps = PaginatedTableProps<TransactionStatementRow> & {
  searchQuery: string;
  // categoryFilter: string;
  // typeFilter: string;
  // paymentModeFilter: string;
  // startDate: string;
  // endDate: string;
  // categoryOptions?: Array<{ label: string; value: string }>;
};

export function TransactionsTable({
  rows,
  totalRows,
  pageSize,
  pageIndex,
  pageCount,
  searchQuery,
  // TODO: Filter props deferred to next PR - do not review these commented props
  // categoryFilter,
  // typeFilter,
  // paymentModeFilter,
  // startDate,
  // endDate,
  // categoryOptions,
}: Readonly<TransactionsTableProps>) {
  // TODO: Filter implementation deferred to next PR - router/pathname/searchParams/startTransition used by updateUrl below
  // const router = useRouter();
  // const pathname = usePathname();
  // const searchParams = useSearchParams();
  // const [, startTransition] = useTransition();
  const { onPaginationChange, isPending } = useQueryPagination({
    page: pageIndex + 1,
    pageSize,
  });

  const {
    inputValue: searchInputValue,
    onChange: onSearchChange,
    isSearching,
  } = useQuerySearch({
    paramKey: 'q',
    initialValue: searchQuery,
  });
  // TODO: Filter state deferred to next PR - do not review these commented lines
  // const currentCategoryFilter = searchParams.get('categoryId') ?? categoryFilter;
  // const currentTypeFilter = searchParams.get('type') ?? typeFilter;
  // const currentPaymentModeFilter = searchParams.get('paymentMode') ?? paymentModeFilter;
  // const currentStartDate = searchParams.get('startDate') ?? startDate;
  // const currentEndDate = searchParams.get('endDate') ?? endDate;

  // TODO: Filter implementation deferred to next PR - do not remove this commented block
  // const updateUrl = useCallback(
  //   (updates: Record<string, string | null>) => {
  //     const params = new URLSearchParams(searchParams.toString());
  //     Object.entries(updates).forEach(([key, value]) => {
  //       if (value === null || value === '') {
  //         params.delete(key);
  //       } else {
  //         params.set(key, value);
  //       }
  //     });
  //     if (!updates['page']) {
  //       params.delete('page');
  //     }
  //     startTransition(() => {
  //       router.push(`${pathname}?${params.toString()}`, { scroll: false });
  //     });
  //   },
  //   [pathname, router, searchParams, startTransition],
  // );

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      <div className="bg-surface border-border rounded-t-xl border border-b-0 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full sm:w-96">
            <Search
              aria-hidden="true"
              focusable="false"
              className="text-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <Input
              type="text"
              placeholder="Search by transaction ID or remarks"
              aria-label="Search transactions by ID or remarks"
              value={searchInputValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9"
            />
          </div>

          {/* TODO: Filter UI deferred to next PR - do not review this commented section
          Filter UI (Category, Type, Mode, Date Range) deferred to next PR for lean scope
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              value={currentCategoryFilter}
              onChange={(value) => updateUrl({ categoryId: value })}
            />
            <FilterDropdown
              label="Type"
              options={typeOptions}
              value={currentTypeFilter}
              onChange={(value) => updateUrl({ type: value })}
            />
            <FilterDropdown
              label="Mode"
              options={paymentModeOptions}
              value={currentPaymentModeFilter}
              onChange={(value) => updateUrl({ paymentMode: value })}
            />
            <DateRangeFilter
              startDate={currentStartDate}
              endDate={currentEndDate}
              onStartChange={(value) => updateUrl({ startDate: value })}
              onEndChange={(value) => updateUrl({ endDate: value })}
              onClear={() => updateUrl({ startDate: null, endDate: null })}
              startLabel="From"
              endLabel="To"
              inactiveLabel="Date Range"
              activeLabel="Date Range Active"
              clearLabel="Clear Date Range"
            />
          </div>
          */}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isPending || isSearching}
        manualPagination={true}
        rowCount={totalRows}
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}
