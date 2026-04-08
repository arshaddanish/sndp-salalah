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
import { setMemberLifetime } from '@/lib/actions/members';

type SetMemberLifetimeDialogProps = {
  memberId: string;
  memberName: string;
  isLifetime: boolean;
  open: boolean;
  onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'];
};

export function SetMemberLifetimeDialog({
  memberId,
  memberName,
  isLifetime,
  open,
  onOpenChange,
}: Readonly<SetMemberLifetimeDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }

    if (!nextOpen) {
      setErrorMessage(null);
    }

    onOpenChange?.(nextOpen);
  };

  const title = isLifetime ? 'Remove Lifetime Membership' : 'Set Lifetime Membership';
  let submitLabel = isLifetime ? 'Remove Lifetime' : 'Set Lifetime';
  if (isPending) {
    submitLabel = isLifetime ? 'Removing...' : 'Saving...';
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isLifetime
              ? `${memberName} will return to regular membership flow and can be registered/renewed using an expiry date.`
              : `${memberName} will be marked as Lifetime. Membership register/renew actions will be disabled.`}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);

            startTransition(async () => {
              const result = await setMemberLifetime({
                memberId,
                isLifetime: !isLifetime,
              });
              if (!result.success) {
                setErrorMessage(result.error ?? 'Unable to update lifetime status.');
                return;
              }

              onOpenChange?.(false);
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
            <Button type="submit" disabled={isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
