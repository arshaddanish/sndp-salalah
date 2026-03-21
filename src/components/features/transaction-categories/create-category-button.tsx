'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { CreateCategoryDialog } from './create-category-dialog';

export function CreateCategoryButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus />
        Add Category
      </Button>

      {isOpen ? <CreateCategoryDialog isOpen={isOpen} onOpenChange={setIsOpen} /> : null}
    </>
  );
}
