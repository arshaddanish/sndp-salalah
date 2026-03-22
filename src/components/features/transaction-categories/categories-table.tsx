'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit2, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip } from '@/components/ui/tooltip';
import { useQueryPagination } from '@/hooks/use-query-pagination';
import type { PaginatedTableProps } from '@/types/pagination';
import type { TransactionCategoryWithUsageCount } from '@/types/transaction-categories';

import { DeleteCategoryDialog } from './delete-category-dialog';
import { EditCategoryDialog } from './edit-category-dialog';

const columns: ColumnDef<TransactionCategoryWithUsageCount>[] = [
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
    header: 'Category',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-text-primary font-medium">{row.original.name}</span>
        {row.original.is_system ? (
          <span className="bg-warning-bg text-warning rounded px-2 py-0.5 text-xs font-medium">
            System
          </span>
        ) : null}
      </div>
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
    accessorKey: 'transactionCount',
    header: 'Transactions',
    cell: ({ row }) => (
      <span className="text-text-secondary text-sm font-medium">
        {row.original.transactionCount}
      </span>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right whitespace-nowrap">Actions</div>,
    cell: ({ row }) => <CategoryRowActions category={row.original} />,
  },
];

function CategoryRowActions({
  category,
}: Readonly<{ category: TransactionCategoryWithUsageCount }>) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (category.is_system) {
    return (
      <div className="flex justify-end">
        <Tooltip content="System category — cannot be modified">
          <span className="text-text-tertiary flex h-8 w-8 items-center justify-center">
            <Lock className="h-4 w-4" />
          </span>
        </Tooltip>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end gap-2 sm:gap-4">
        <Tooltip content="Edit Category">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit category"
            className="text-accent hover:text-accent-hover hover:bg-accent-subtle h-8 w-8"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Delete Category">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete category"
            className="text-danger hover:bg-danger-bg hover:text-danger h-8 w-8"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {isEditDialogOpen ? (
        <EditCategoryDialog
          category={category}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      ) : null}

      {isDeleteDialogOpen ? (
        <DeleteCategoryDialog
          category={category}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      ) : null}
    </>
  );
}

export function CategoriesTable({
  rows,
  totalRows,
  pageSize,
  pageIndex,
  pageCount,
}: Readonly<PaginatedTableProps<TransactionCategoryWithUsageCount>>) {
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
