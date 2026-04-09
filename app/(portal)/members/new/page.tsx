import type { Metadata } from 'next';

import { MemberForm } from '@/components/features/members/member-form';
import { fetchShakhaOptions } from '@/lib/actions/members';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Add Member | SNDP Salalah',
  description: 'Register a new member with personal, family, and office-use details',
};

export default async function NewMemberPage() {
  const result = await fetchShakhaOptions();
  const shakhaOptions = result.success ? (result.data ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-text-primary text-2xl font-bold">Add Member</h1>
      </div>

      <MemberForm shakhaOptions={shakhaOptions} />
    </div>
  );
}
