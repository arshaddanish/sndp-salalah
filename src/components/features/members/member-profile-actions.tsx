'use client';

import { CreditCard, Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DeleteMemberDialog } from './delete-member-dialog';
import { RenewMembershipDialog } from './renew-membership-dialog';

type MemberProfileActionsProps = {
  memberId: string;
  memberName: string;
  expiry: string | null;
  hasTransactions: boolean;
};

export function MemberProfileActions({
  memberId,
  memberName,
  expiry,
  hasTransactions,
}: Readonly<MemberProfileActionsProps>) {
  const router = useRouter();
  const [renewOpen, setRenewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <Button
          size="sm"
          onClick={() => setRenewOpen(true)}
          aria-label="Renew membership"
          className="h-8 whitespace-nowrap"
        >
          <CreditCard className="h-4 w-4" />
          Renew Membership
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 whitespace-nowrap"
              aria-label="Open member actions menu"
            >
              <MoreHorizontal className="h-4 w-4" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => router.push(`/members/${memberId}/edit`)}
              className="cursor-pointer"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Member
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="text-danger focus:text-danger cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {hasTransactions ? 'Archive Member' : 'Delete Member'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RenewMembershipDialog
        memberId={memberId}
        currentExpiry={expiry}
        open={renewOpen}
        onOpenChange={setRenewOpen}
      />
      {deleteOpen ? (
        <DeleteMemberDialog
          memberId={memberId}
          memberName={memberName}
          hasTransactions={hasTransactions}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => router.push('/members')}
        />
      ) : null}
    </>
  );
}
