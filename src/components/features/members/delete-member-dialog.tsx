'use client';

import type { ComponentProps } from 'react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { archiveMember, deleteMember } from '@/lib/actions/members';

type DeleteMemberDialogProps = {
  memberId: string;
  memberName: string;
  hasTransactions: boolean;
  open: boolean;
  onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'];
  onDeleted: () => void;
};

export function DeleteMemberDialog({
  memberId,
  memberName,
  hasTransactions,
  open,
  onOpenChange,
  onDeleted,
}: Readonly<DeleteMemberDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitVariant: 'danger' = 'danger';
  let submitLabel = 'Delete Member';
  if (hasTransactions) {
    submitLabel = 'Archive Member';
  }
  if (isPending) {
    submitLabel = hasTransactions ? 'Archiving...' : 'Deleting...';
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        role="alertdialog"
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{hasTransactions ? 'Archive Member' : 'Delete Member'}</DialogTitle>
          <DialogDescription>
            {hasTransactions
              ? `This member has linked transactions. ${memberName} will be archived and hidden from normal member views.`
              : `Are you sure you want to delete ${memberName}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);

            startTransition(async () => {
              const result = hasTransactions
                ? await archiveMember(memberId)
                : await deleteMember(memberId);
              if (!result.success) {
                setErrorMessage(
                  result.error ??
                    (hasTransactions ? 'Unable to archive member.' : 'Unable to delete member.'),
                );
                return;
              }
              onOpenChange?.(false);
              onDeleted();
            });
          }}
        >
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant={submitVariant} disabled={isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
