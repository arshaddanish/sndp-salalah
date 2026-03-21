'use client';

import { type Dispatch, type SetStateAction, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createTransactionCategory } from '@/lib/actions/transaction-categories';
import { createCategorySchema } from '@/lib/validations/transaction-categories';
import type { TransactionCategoryType } from '@/types/transaction-categories';

interface CreateCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function CreateCategoryDialog({
  isOpen,
  onOpenChange,
}: Readonly<CreateCategoryDialogProps>) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionCategoryType>('income');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleCreate = () => {
    setError(null);

    const validationResult = createCategorySchema.safeParse({ name, type });
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError?.message || 'Validation failed');
      return;
    }

    setIsPending(true);
    void (async () => {
      try {
        const result = await createTransactionCategory(
          validationResult.data.name,
          validationResult.data.type,
        );

        if (!result.success) {
          setError(result.error || 'Failed to create category');
          return;
        }

        onOpenChange(false);
      } catch (actionError) {
        console.error('Error invoking createTransactionCategory:', actionError);
        setError('Failed to create category');
      } finally {
        setIsPending(false);
      }
    })();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-left">
          <div className="space-y-1.5">
            <label
              className="text-text-secondary text-sm font-medium"
              htmlFor="create-category-name"
            >
              Category Name
            </label>
            <Input
              id="create-category-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Enter category name"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-text-secondary text-sm font-medium"
              htmlFor="create-category-type"
            >
              Type
            </label>
            <select
              id="create-category-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as TransactionCategoryType);
                setError(null);
              }}
              className="border-border bg-surface text-text-primary focus:ring-accent h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-1"
              disabled={isPending}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {error ? <p className="text-danger text-xs">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
