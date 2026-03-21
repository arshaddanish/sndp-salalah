'use client';

import { type Dispatch, type SetStateAction, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteTransactionCategory } from '@/lib/actions/transaction-categories';
import type { TransactionCategoryWithUsageCount } from '@/types/transaction-categories';

interface DeleteCategoryDialogProps {
  category: TransactionCategoryWithUsageCount;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function DeleteCategoryDialog({
  category,
  isOpen,
  onOpenChange,
}: Readonly<DeleteCategoryDialogProps>) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const hasTransactions = category.transactionCount > 0;

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleDelete = () => {
    setError(null);

    setIsPending(true);
    void (async () => {
      try {
        const result = await deleteTransactionCategory(category.id);

        if (!result.success) {
          setError(result.error || 'Failed to delete category');
          return;
        }

        onOpenChange(false);
      } catch (actionError) {
        console.error('Error invoking deleteTransactionCategory:', actionError);
        setError('Failed to delete category');
      } finally {
        setIsPending(false);
      }
    })();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {hasTransactions ? 'Cannot Delete Category' : 'Delete Category'}
          </DialogTitle>
          <DialogDescription>
            {hasTransactions ? null : (
              <>
                Are you sure you want to delete <span className="font-medium">{category.name}</span>
                ?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasTransactions ? (
          <div className="bg-warning-bg border-warning/20 rounded-md border p-3">
            <p className="text-warning text-sm font-medium">
              This category is used in {category.transactionCount} transaction
              {category.transactionCount === 1 ? '' : 's'}.
            </p>
            <p className="text-text-secondary mt-1 text-xs">
              This category can only be deleted after removing all transactions that reference it.
            </p>
          </div>
        ) : null}

        {error ? <p className="text-danger text-xs">{error}</p> : null}

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isPending || hasTransactions}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
