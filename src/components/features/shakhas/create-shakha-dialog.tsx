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
import { createShakha } from '@/lib/actions/shakhas';
import { shakhaNameSchema } from '@/lib/validations/shakhas';

interface CreateShakhaDialogProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function CreateShakhaDialog({ isOpen, onOpenChange }: Readonly<CreateShakhaDialogProps>) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setError(null);

    const validationResult = shakhaNameSchema.safeParse({ name });
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError?.message || 'Validation failed');
      return;
    }

    startTransition(async () => {
      const result = await createShakha(validationResult.data.name);

      if (!result.success) {
        setError(result.error || 'Failed to create shakha');
        return;
      }

      onOpenChange(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shakha</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 text-left">
          <label className="text-text-secondary text-sm font-medium" htmlFor="create-shakha-name">
            Shakha Name
          </label>
          <Input
            id="create-shakha-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="Enter shakha name"
            disabled={isPending}
          />
          {error ? <p className="text-danger mt-1 text-xs">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
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
