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
import { updateTransaction } from '@/lib/actions/transactions';
import type { RegularTransactionRow } from '@/types/transactions';

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: RegularTransactionRow;
}

export function EditTransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
}: Readonly<EditTransactionDialogProps>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateTransaction(transaction.id, {
        amount: formData.get('amount') as string,
        remarks: formData.get('remarks') as string,
      });
      if (!result.success) {
        setErrorMessage(result.error ?? 'Unable to update transaction.');
        return;
      }
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction #{transaction.transactionCode}</DialogTitle>
        </DialogHeader>
        <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="edit-amount">
              Amount (OMR)
            </label>
            <input
              id="edit-amount"
              name="amount"
              inputMode="decimal"
              required
              defaultValue={transaction.amount}
              disabled={isPending}
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="edit-remarks">
              Remarks
            </label>
            <textarea
              id="edit-remarks"
              name="remarks"
              rows={3}
              defaultValue={transaction.remarks}
              disabled={isPending}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
          </div>
          {errorMessage && <p className="text-danger text-sm">{errorMessage}</p>}
        </form>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-transaction-form" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
