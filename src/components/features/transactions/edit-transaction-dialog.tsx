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
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const form = event.currentTarget.form;
    if (!form) return;
    const formData = new FormData(form);
    const currentAmount = formData.get('amount') as string;
    const currentRemarks = formData.get('remarks') as string;
    setIsDirty(currentAmount !== transaction.amount || currentRemarks !== transaction.remarks);
  };

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Transaction #{transaction.transactionCode}</DialogTitle>
        </DialogHeader>

        <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="edit-amount">
              Amount *
            </label>
            <div className="border-border focus-within:border-accent focus-within:ring-accent/20 flex h-10 items-center rounded-lg border bg-white transition-all focus-within:ring-2">
              <span className="bg-surface-hover text-text-secondary flex h-full items-center rounded-l-lg px-3 text-sm font-medium">
                OMR
              </span>
              <input
                id="edit-amount"
                name="amount"
                inputMode="decimal"
                required
                defaultValue={transaction.amount}
                disabled={isPending}
                onChange={handleChange}
                className="text-text-primary placeholder:text-text-muted h-full flex-1 rounded-r-lg bg-white px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="edit-remarks">
              Remarks
            </label>
            <textarea
              id="edit-remarks"
              name="remarks"
              rows={3}
              defaultValue={transaction.remarks}
              disabled={isPending}
              onChange={handleChange}
              className="border-border text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-accent/20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add transaction notes"
            />
          </div>

          {errorMessage ? (
            <p className="text-danger text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-transaction-form" disabled={isPending || !isDirty}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
