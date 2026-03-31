'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { TransactionCategoryOption } from '@/types/transaction-categories';

import { CreateTransactionDialog } from './create-transaction-dialog';

type CreateTransactionButtonProps = {
  categories: TransactionCategoryOption[];
};

export function CreateTransactionButton({ categories }: Readonly<CreateTransactionButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        className="w-full whitespace-nowrap sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        <Plus />
        New Transaction
      </Button>

      {isOpen ? (
        <CreateTransactionDialog isOpen={isOpen} onOpenChange={setIsOpen} categories={categories} />
      ) : null}
    </>
  );
}
