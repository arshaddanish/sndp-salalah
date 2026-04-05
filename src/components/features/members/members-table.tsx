'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { DataTableBase } from '@/components/ui/data-table-base';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { FilterDropdown } from '@/components/ui/dropdown-filter';
import { Input } from '@/components/ui/input';
import { useQueryPagination } from '@/hooks/use-query-pagination';
import { useQuerySearch } from '@/hooks/use-query-search';
import { getMemberStatus } from '@/lib/mock-data/members';
import type { Member } from '@/types/members';
import type { PaginatedTableProps } from '@/types/pagination';

type MembersTableProps = PaginatedTableProps<Member> & {
  searchQuery: string;
  statusFilter: string;
  shakhaFilter: string;
  startDate: string;
  endDate: string;
  shakhaOptions: Array<{ label: string; value: string }>;
};

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Near Expiry', value: 'near-expiry' },
  { label: 'Expired', value: 'expired' },
  { label: 'Lifetime', value: 'lifetime' },
];

const columns: ColumnDef<Member>[] = [
  { accessorKey: 'member_code', header: 'ID' },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="text-text-primary font-medium">{row.getValue('name')}</span>
    ),
  },
  { accessorKey: 'whatsapp_no', header: 'Whatsapp' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'family_status', header: 'Marital Status' },
  {
    accessorKey: 'expiry',
    header: 'Expiry',
    cell: ({ row }) => {
      if (row.original.is_lifetime) {
        return 'Lifetime';
      }
      const expiry = row.original.expiry;
      return expiry ? format(expiry, 'dd MMM yyyy') : 'Pending';
    },
  },
  {
    accessorKey: 'shakha_id',
    header: 'Shakha',
    cell: ({ row }) => (
      <span className="text-text-secondary text-xs font-medium uppercase">
        Shakha {row.original.shakha_id}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = getMemberStatus(row.original.expiry, row.original.is_lifetime);
      let statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      if (status === 'near-expiry') {
        statusLabel = 'Near Expiry';
      } else if (status === 'pending') {
        statusLabel = 'Pending';
      }

      return <Badge variant={status}>{statusLabel}</Badge>;
    },
  },
];

export function MembersTable({
  rows,
  totalRows,
  searchQuery,
  statusFilter,
  shakhaFilter,
  startDate,
  endDate,
  shakhaOptions,
  pageSize,
  pageIndex,
  pageCount,
}: Readonly<MembersTableProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
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

  const currentStatusFilter = searchParams.get('status') ?? statusFilter;
  const currentShakhaFilter = searchParams.get('shakha') ?? shakhaFilter;
  const currentStartDate = searchParams.get('createdStart') ?? startDate;
  const currentEndDate = searchParams.get('createdEnd') ?? endDate;

  const paginationState = useMemo<PaginationState>(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: { pagination: paginationState },
    onPaginationChange,
  });

  const currentPageSize = paginationState.pageSize;
  const currentPageIndex = paginationState.pageIndex;

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === 'all' || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      if (!updates['page']) {
        params.delete('page');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      <div className="bg-surface border-border flex flex-col items-start justify-between gap-4 rounded-t-xl border border-b-0 px-4 py-3 lg:flex-row lg:items-center">
        <div className="relative w-full sm:w-80">
          <Search
            aria-hidden="true"
            focusable="false"
            className="text-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          />
          <Input
            type="text"
            placeholder="Search by ID, Name or Whatsapp"
            aria-label="Search members by ID, Name, or Whatsapp"
            value={searchInputValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <FilterDropdown
            label="Shakha"
            options={shakhaOptions}
            value={currentShakhaFilter}
            onChange={(v) => updateUrl({ shakha: v })}
          />
          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={currentStatusFilter}
            onChange={(v) => updateUrl({ status: v })}
          />
          <DateRangeFilter
            startDate={currentStartDate}
            endDate={currentEndDate}
            onStartChange={(v) => updateUrl({ createdStart: v })}
            onEndChange={(v) => updateUrl({ createdEnd: v })}
            onClear={() => updateUrl({ createdStart: null, createdEnd: null })}
          />
        </div>
      </div>

      <DataTableBase
        table={table}
        columns={columns}
        isLoading={isPending || isSearching}
        skeletonRowCount={currentPageSize}
        onRowClick={(member) => router.push(`/members/${member.id}`)}
        footer={
          <DataTablePagination
            table={table}
            isLoading={isPending || isSearching}
            totalRows={totalRows}
            currentPageIndex={currentPageIndex}
            currentPageSize={currentPageSize}
            onPageIndexChange={(nextPageIndex: number) =>
              onPaginationChange({ pageIndex: nextPageIndex, pageSize: currentPageSize })
            }
            onPageSizeChange={(nextPageSize: number) =>
              onPaginationChange({ pageIndex: 0, pageSize: nextPageSize })
            }
          />
        }
      />
    </div>
  );
}
