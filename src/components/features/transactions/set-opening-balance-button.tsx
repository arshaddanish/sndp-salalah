'use client';

import { Landmark } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ExistingOpeningBalance } from '@/types/transactions';

import { SetOpeningBalanceDialog } from './set-opening-balance-dialog';

interface SetOpeningBalanceButtonProps {
  existingCash: ExistingOpeningBalance | null;
  existingBank: ExistingOpeningBalance | null;
}

export function SetOpeningBalanceButton({
  existingCash,
  existingBank,
}: Readonly<SetOpeningBalanceButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const hasExistingOpeningBalance = existingCash !== null || existingBank !== null;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="w-full whitespace-nowrap sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        <Landmark />
        {hasExistingOpeningBalance ? 'Edit Opening Balance' : 'Set Opening Balance'}
      </Button>

      {isOpen ? (
        <SetOpeningBalanceDialog
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          existingCash={existingCash}
          existingBank={existingBank}
        />
      ) : null}
    </>
  );
}
