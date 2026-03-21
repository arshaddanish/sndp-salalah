'use client';

import { type Dispatch, type SetStateAction, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateShakha } from '@/lib/actions/shakhas';
import type { ShakhaWithMemberCount } from '@/lib/mock-data/shakhas';
import { shakhaNameSchema } from '@/lib/validations/shakhas';

interface EditShakhaDialogProps {
  shakha: ShakhaWithMemberCount;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function EditShakhaDialog({
  shakha,
  isOpen,
  onOpenChange,
}: Readonly<EditShakhaDialogProps>) {
  const [name, setName] = useState(shakha.name);
  const [error, setError] = useState<string | null>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasMembers = shakha.memberCount > 0;
  const nameHasChanged = name !== shakha.name;

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleValidation = (nextName: string) => {
    const result = shakhaNameSchema.safeParse({ name: nextName });
    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError?.message || 'Validation failed');
      return false;
    }
    return true;
  };

  const handleSaveForm = (formData: FormData) => {
    setError(null);

    if (isPending || isSaveDisabled) {
      return;
    }

    const rawName = formData.get('name');
    const newName = typeof rawName === 'string' ? rawName : '';

    if (!handleValidation(newName)) {
      return;
    }

    startTransition(async () => {
      const result = await updateShakha(shakha.id, newName);

      if (!result.success) {
        setError(result.error || 'Failed to update shakha');
        return;
      }

      onOpenChange(false);
    });
  };

  const isFormValid = nameHasChanged && (!hasMembers || confirmationChecked);
  const isSaveDisabled = isPending || !isFormValid;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shakha</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveForm(new FormData(event.currentTarget));
          }}
        >
          <div className="space-y-1.5 text-left">
            <label
              className="text-text-secondary text-sm font-medium"
              htmlFor={`shakha-name-${shakha.id}`}
            >
              Shakha Name
            </label>
            <Input
              id={`shakha-name-${shakha.id}`}
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Enter shakha name"
              disabled={isPending}
            />
            {error && <p className="text-danger mt-1 text-xs">{error}</p>}
          </div>

          {hasMembers && (
            <div className="bg-warning-bg border-warning/20 rounded-md border p-3">
              <p className="text-warning text-sm font-medium">
                ⚠️ This shakha has {shakha.memberCount} assigned member
                {shakha.memberCount === 1 ? '' : 's'}
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                Renaming this shakha will update their shakha assignment throughout the system.
              </p>

              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="confirm"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  disabled={isPending}
                  className="border-border accent-accent h-4 w-4 cursor-pointer rounded border"
                  aria-label="I understand the impact"
                />
                <span className="text-text-secondary text-xs">
                  I understand and want to proceed with the name change
                </span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isPending}
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
