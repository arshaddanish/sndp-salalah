'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function CreateMemberButton() {
  const router = useRouter();

  return (
    <Button size="sm" className="h-8" onClick={() => router.push('/members/new')}>
      <Plus className="mr-2 h-4 w-4" />
      New Member
    </Button>
  );
}
