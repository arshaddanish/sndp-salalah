import type { Metadata } from 'next';

import { MemberForm } from '@/components/features/members/member-form';
import { MOCK_SHAKHAS } from '@/lib/mock-data/shakhas';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Add Member | SNDP Salalah',
  description: 'Register a new member with personal, family, and office-use details',
};

export default async function NewMemberPage() {
  const shakhaOptions = MOCK_SHAKHAS.slice(0, 100).map((shakha) => ({
    label: shakha.name,
    value: shakha.id,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-text-primary text-2xl font-bold">Add Member</h1>
      </div>

      <MemberForm shakhaOptions={shakhaOptions} />
    </div>
  );
}
