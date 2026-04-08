import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MemberPaymentHistory } from '@/components/features/members/member-payment-history';
import { MemberProfileActions } from '@/components/features/members/member-profile-actions';
import { MemberProfileHeader } from '@/components/features/members/member-profile-header';
import { MemberProfileSections } from '@/components/features/members/member-profile-sections';
import { fetchMemberById, fetchMemberTransactions } from '@/lib/actions/members';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Member Profile | SNDP Salalah',
  description: 'View member profile details',
};

type MemberProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberProfilePage({ params }: Readonly<MemberProfilePageProps>) {
  const { id } = await params;

  const [memberResult, transactionsResult] = await Promise.all([
    fetchMemberById(id),
    fetchMemberTransactions(id),
  ]);

  if (!memberResult.success || !memberResult.data) {
    notFound();
  }

  const member = memberResult.data;
  const transactions = transactionsResult.success ? (transactionsResult.data ?? []) : [];
  const transactionsError = transactionsResult.success
    ? null
    : (transactionsResult.error ?? 'Unable to load payment history.');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/members"
            className="text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Members
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-text-primary font-medium">Member Profile</span>
        </nav>

        <MemberProfileActions
          memberId={member.id}
          memberName={member.name}
          expiry={member.expiry?.toISOString() ?? null}
          isLifetime={member.is_lifetime}
          hasTransactions={transactions.length > 0}
        />
      </div>

      <MemberProfileHeader member={member} />
      <MemberProfileSections member={member} />
      <MemberPaymentHistory transactions={transactions} errorMessage={transactionsError} />
    </div>
  );
}
