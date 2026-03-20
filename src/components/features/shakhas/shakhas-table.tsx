'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui/tooltip';
import { useQueryPagination } from '@/hooks/use-query-pagination';
import { type ShakhaWithMemberCount } from '@/lib/mock-data/shakhas';
import type { PaginatedTableProps } from '@/types/pagination';

import { EditShakhaDialog } from './edit-shakha-dialog';

const columns: ColumnDef<ShakhaWithMemberCount>[] = [
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
    accessorKey: 'memberCount',
    header: 'Members',
    cell: ({ row }) => (
      <span className="text-text-secondary text-sm font-medium">{row.original.memberCount}</span>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right whitespace-nowrap">Actions</div>,
    cell: ({ row }) => {
      return <ShakhaRowActions shakha={row.original} />;
    },
  },
];

/**
 * Row-level actions for each shakha (edit/delete)
 */
function ShakhaRowActions({ shakha }: Readonly<{ shakha: ShakhaWithMemberCount }>) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end gap-2 sm:gap-4">
        <Tooltip content="Edit Shakha">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit shakha"
            className="text-accent hover:text-accent-hover hover:bg-accent-subtle h-8 w-8"
            onClick={() => setIsEditDialogOpen(true)}
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
            onClick={() => {
              // TODO: Implement delete shakha action with confirmation and DB call
              if (confirm('Are you sure you want to delete this shakha?')) {
                console.log('Delete', shakha.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      <EditShakhaDialog
        shakha={shakha}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}

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
}: Readonly<PaginatedTableProps<ShakhaWithMemberCount>>) {
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
