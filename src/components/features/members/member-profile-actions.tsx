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
import { SetMemberLifetimeDialog } from './set-member-lifetime-dialog';

type MemberProfileActionsProps = {
  memberId: string;
  memberCode: number;
  memberName: string;
  expiry: string | null;
  isLifetime: boolean;
  hasTransactions: boolean;
};

export function MemberProfileActions({
  memberId,
  memberCode,
  memberName,
  expiry,
  isLifetime,
  hasTransactions,
}: Readonly<MemberProfileActionsProps>) {
  const router = useRouter();
  const [renewOpen, setRenewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lifetimeOpen, setLifetimeOpen] = useState(false);
  const isPendingMembership = expiry === null && !isLifetime;
  const membershipActionLabel = isPendingMembership ? 'Register Membership' : 'Renew Membership';

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <Button
          size="sm"
          onClick={() => setRenewOpen(true)}
          aria-label={membershipActionLabel}
          className="h-8 whitespace-nowrap"
          disabled={isLifetime}
        >
          <CreditCard className="h-4 w-4" />
          {membershipActionLabel}
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
              onSelect={() => router.push(`/members/${memberCode}/edit`)}
              className="cursor-pointer"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Member
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLifetimeOpen(true)} className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              {isLifetime ? 'Remove Lifetime Membership' : 'Set Lifetime Membership'}
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
        mode={isPendingMembership ? 'register' : 'renew'}
        open={renewOpen}
        onOpenChange={setRenewOpen}
      />
      {lifetimeOpen ? (
        <SetMemberLifetimeDialog
          memberId={memberId}
          memberName={memberName}
          isLifetime={isLifetime}
          open={lifetimeOpen}
          onOpenChange={setLifetimeOpen}
        />
      ) : null}
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
