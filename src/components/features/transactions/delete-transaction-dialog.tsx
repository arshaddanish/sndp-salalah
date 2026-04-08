'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteTransaction } from '@/lib/actions/transactions';
import type { RegularTransactionRow } from '@/types/transactions';

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (_value: boolean) => void;
  transaction: RegularTransactionRow;
  onSuccess: () => void;
}

export function DeleteTransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
  onSuccess,
}: Readonly<DeleteTransactionDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (!result.success) {
        setErrorMessage(result.error ?? 'Unable to delete transaction. Please try again.');
        return;
      }
      onSuccess();
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transaction #{transaction.transactionCode}</DialogTitle>
        </DialogHeader>
        <p className="text-text-secondary text-sm">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        {errorMessage ? (
          <p className="text-danger text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
