import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MemberForm } from '@/components/features/members/member-form';
import { fetchMemberProfileByIdentifier, fetchShakhaOptions } from '@/lib/actions/members';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Member | SNDP Salalah',
  description: 'Edit member profile details',
};

type EditMemberPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMemberPage({ params }: Readonly<EditMemberPageProps>) {
  const { id: memberCodeParam } = await params;

  const [memberResult, shakhaResult] = await Promise.all([
    fetchMemberProfileByIdentifier(memberCodeParam),
    fetchShakhaOptions(),
  ]);

  if (!memberResult.success) {
    notFound();
  }

  if (!memberResult.data) {
    notFound();
  }

  const { member } = memberResult.data;
  const shakhaOptions = shakhaResult.success ? (shakhaResult.data ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href={`/members/${member.member_code}`}
          className="text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Member Profile
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-medium">Edit</span>
      </nav>

      <h1 className="text-text-primary text-2xl font-bold">Edit Member</h1>

      <MemberForm shakhaOptions={shakhaOptions} initialData={member} />
    </div>
  );
}
