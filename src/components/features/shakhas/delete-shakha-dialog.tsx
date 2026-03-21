'use client';

import { type Dispatch, type SetStateAction, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteShakha } from '@/lib/actions/shakhas';
import type { ShakhaWithMemberCount } from '@/lib/mock-data/shakhas';

interface DeleteShakhaDialogProps {
  shakha: ShakhaWithMemberCount;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function DeleteShakhaDialog({
  shakha,
  isOpen,
  onOpenChange,
}: Readonly<DeleteShakhaDialogProps>) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasMembers = shakha.memberCount > 0;

  const handleDelete = () => {
    setError(null);

    if (hasMembers) {
      setError(
        `This shakha has ${shakha.memberCount} assigned member${shakha.memberCount === 1 ? '' : 's'}. Delete those members first before deleting this shakha.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await deleteShakha(shakha.id);

      if (!result.success) {
        setError(result.error || 'Failed to delete shakha');
        return;
      }

      onOpenChange(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasMembers ? 'Cannot Delete Shakha' : 'Delete Shakha'}</DialogTitle>
          <DialogDescription>
            {hasMembers ? null : `Are you sure you want to delete "${shakha.name}"?`}
          </DialogDescription>
        </DialogHeader>

        {hasMembers ? (
          <div className="bg-warning-bg border-warning/20 rounded-md border p-3">
            <p className="text-warning text-sm font-medium">
              This shakha has {shakha.memberCount} assigned member
              {shakha.memberCount === 1 ? '' : 's'}.
            </p>
            <p className="text-text-secondary mt-1 text-xs">
              This shakha can be deleted only after deletion of all members assigned to this shakha.
            </p>
          </div>
        ) : null}

        {error ? <p className="text-danger text-xs">{error}</p> : null}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isPending || hasMembers}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
