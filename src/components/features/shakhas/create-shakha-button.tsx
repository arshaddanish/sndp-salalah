'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { CreateShakhaDialog } from './create-shakha-dialog';

export function CreateShakhaButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus />
        Add Shakha
      </Button>

      {isOpen ? <CreateShakhaDialog isOpen={isOpen} onOpenChange={setIsOpen} /> : null}
    </>
  );
}
