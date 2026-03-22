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

import { DeleteShakhaDialog } from './delete-shakha-dialog';
import { EditShakhaDialog } from './edit-shakha-dialog';

const columns: ColumnDef<ShakhaWithMemberCount>[] = [
  {
    id: 'serial',
    header: 'S.No',
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      const globalSerial = pageIndex * pageSize + row.index + 1;
      return <span>{globalSerial}</span>;
    },
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {isEditDialogOpen ? (
        <EditShakhaDialog
          shakha={shakha}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      ) : null}
      {isDeleteDialogOpen ? (
        <DeleteShakhaDialog
          shakha={shakha}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      ) : null}
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
