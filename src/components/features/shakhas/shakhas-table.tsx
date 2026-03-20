'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui/tooltip';
import { useQueryPagination } from '@/hooks/use-query-pagination';
import { type Shakha } from '@/lib/mock-data/shakhas';
import type { PaginatedTableProps } from '@/types/pagination';

const columns: ColumnDef<Shakha>[] = [
  {
    id: 'serial',
    header: 'S.No',
    cell: ({ row }) => <span>{row.index + 1}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Shakha',
  },
  {
    id: 'actions',
    header: () => <div className="text-right whitespace-nowrap">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="flex justify-end gap-2 sm:gap-4">
          <Tooltip content="Edit Shakha">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit shakha"
              className="text-accent hover:text-accent-hover hover:bg-accent-subtle h-8 w-8"
              // TODO: Replace console.log with actual edit logic (e.g., open edit modal or navigate to edit page)
              onClick={() => {
                console.log('Edit', row.original.id);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Delete Shakha">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete shakha"
              className="text-danger hover:bg-danger-bg hover:text-danger h-8 w-8"
              // TODO: Replace console.log with actual delete logic (e.g., open confirmation dialog and call delete API)
              onClick={() => {
                if (confirm('Are you sure you want to delete this shakha?')) {
                  console.log('Delete', row.original.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      );
    },
  },
];

/**
 * Shakhas Table Component
 * Receives pre-paginated data and pagination state from server
 * Handles client-side pagination UI and URL state synchronization
 */
export function ShakhasTable({
  rows,
  totalRows,
  pageSize,
  pageIndex,
  pageCount,
}: Readonly<PaginatedTableProps<Shakha>>) {
  const { onPaginationChange, isPending } = useQueryPagination({
    page: pageIndex + 1,
    pageSize,
  });

  return (
    <div className="flex flex-col gap-0 overflow-hidden">
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isPending}
        manualPagination={true}
        rowCount={totalRows}
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}
