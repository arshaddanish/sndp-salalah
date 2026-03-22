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
import { updateTransactionCategory } from '@/lib/actions/transaction-categories';
import { updateCategorySchema } from '@/lib/validations/transaction-categories';
import type {
  TransactionCategoryType,
  TransactionCategoryWithUsageCount,
} from '@/types/transaction-categories';

interface EditCategoryDialogProps {
  category: TransactionCategoryWithUsageCount;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function EditCategoryDialog({
  category,
  isOpen,
  onOpenChange,
}: Readonly<EditCategoryDialogProps>) {
  const [name, setName] = useState(category.name);
  const [type, setType] = useState<TransactionCategoryType>(category.type);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const hasTransactions = category.transactionCount > 0;
  const nameHasChanged = name.trim() !== category.name.trim();
  const typeHasChanged = type !== category.type;
  const isFormDirty = nameHasChanged || typeHasChanged;
  const isSaveDisabled = isPending || !isFormDirty || (hasTransactions && !confirmationChecked);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSaveForm = (formData: FormData) => {
    setError(null);

    if (isSaveDisabled) {
      return;
    }

    const rawName = formData.get('name');
    const rawType = formData.get('type');
    const nextName = typeof rawName === 'string' ? rawName : '';
    const nextType = rawType === 'income' || rawType === 'expense' ? rawType : type;

    const validationResult = updateCategorySchema.safeParse({
      id: category.id,
      name: nextName,
      type: nextType,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError?.message || 'Validation failed');
      return;
    }

    setIsPending(true);
    void (async () => {
      try {
        const result = await updateTransactionCategory(
          validationResult.data.id,
          validationResult.data.name,
          validationResult.data.type,
        );

        if (!result.success) {
          setError(result.error || 'Failed to update category');
          return;
        }

        onOpenChange(false);
      } catch (actionError) {
        console.error('Error invoking updateTransactionCategory:', actionError);
        setError('Failed to update category');
      } finally {
        setIsPending(false);
      }
    })();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveForm(new FormData(event.currentTarget));
          }}
        >
          <div className="space-y-1.5">
            <label className="text-text-secondary text-sm font-medium" htmlFor="edit-category-name">
              Category Name
            </label>
            <Input
              id="edit-category-name"
              name="name"
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
            <label className="text-text-secondary text-sm font-medium" htmlFor="edit-category-type">
              Type
            </label>
            <select
              id="edit-category-type"
              name="type"
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

          {hasTransactions ? (
            <div className="bg-warning-bg border-warning/20 rounded-md border p-3">
              <p className="text-warning text-sm font-medium">
                ⚠️ This category is used in {category.transactionCount} transaction
                {category.transactionCount === 1 ? '' : 's'}
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                Renaming or retyping will update labels on all linked transactions.
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  name="confirm"
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  disabled={isPending}
                  className="border-border accent-accent h-4 w-4 cursor-pointer rounded border"
                  aria-label="I understand the impact"
                />
                <span className="text-text-secondary text-xs">
                  I understand and want to proceed
                </span>
              </label>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isPending}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaveDisabled}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
