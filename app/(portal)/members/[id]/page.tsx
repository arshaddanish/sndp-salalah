import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { MemberCardExportPayload } from '@/components/features/members/member-card-export-button';
import { MemberPaymentHistory } from '@/components/features/members/member-payment-history';
import { MemberProfileActions } from '@/components/features/members/member-profile-actions';
import { MemberProfileHeader } from '@/components/features/members/member-profile-header';
import { MemberProfileSections } from '@/components/features/members/member-profile-sections';
import { fetchMemberProfileByIdentifier, fetchMemberTransactions } from '@/lib/actions/members';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Member Profile | SNDP Salalah',
  description: 'View member profile details',
};

type MemberProfilePageProps = {
  params: Promise<{ id: string }>;
};

function formatDateLabel(date: Date | null) {
  if (!date) {
    return null;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCardDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getMemberStatusLabel(status: string) {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    active: 'Active',
    expired: 'Expired',
    lifetime: 'Lifetime',
    'near-expiry': 'Near Expiry',
  };

  return statusLabels[status] ?? status;
}

export default async function MemberProfilePage({ params }: Readonly<MemberProfilePageProps>) {
  const { id: memberCodeParam } = await params;

  const memberResult = await fetchMemberProfileByIdentifier(memberCodeParam);

  if (!memberResult.success) {
    notFound();
  }

  if (!memberResult.data) {
    notFound();
  }

  const { member } = memberResult.data;

  const transactionsResult = await fetchMemberTransactions(member.id);
  const transactions = transactionsResult.success ? (transactionsResult.data ?? []) : [];
  const transactionsError = transactionsResult.success
    ? null
    : (transactionsResult.error ?? 'Unable to load payment history.');
  const cardExportPayload: MemberCardExportPayload = {
    memberCode: member.member_code,
    name: member.name,
    photoSrc: member.photo_key,
    statusLabel: getMemberStatusLabel(member.status),
    officeShakha: member.shakhaName,
    expiryLabel: member.is_lifetime ? 'Lifetime' : (formatCardDate(member.expiry) ?? 'Pending'),
    dateOfBirthLabel: formatDateLabel(member.dob),
    bloodGroup: member.blood_group,
    phoneLabel: member.whatsapp_no ?? member.gsm_no,
    familyMemberNames: member.familyMembersList.map((familyMember) => familyMember.name),
    civilIdNo: member.civil_id_no,
    passportNo: member.passport_no ?? null,
    profession: member.profession ?? null,
    residentialArea: member.residential_area ?? null,
    addressIndia: member.address_india ?? null,
    email: member.email ?? null,
    shakhaIndia: member.shakha_india ?? null,
    unionName: member.union_name ?? null,
    district: member.district ?? null,
    submittedBy: member.submitted_by ?? null,
    receivedOnLabel: formatDateLabel(member.received_on ?? null),
    checkedBy: member.checked_by ?? null,
    approvedBy: member.approved_by ?? null,
    president: member.president ?? null,
    secretary: member.secretary ?? null,
    applicationNo: member.application_no ?? null,
  };

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
          memberCode={member.member_code}
          memberName={member.name}
          expiry={member.expiry?.toISOString() ?? null}
          isLifetime={member.is_lifetime}
          hasTransactions={transactions.length > 0}
          cardExportPayload={cardExportPayload}
        />
      </div>

      <MemberProfileHeader member={member} />
      <MemberProfileSections member={member} />
      <MemberPaymentHistory transactions={transactions} errorMessage={transactionsError} />
    </div>
  );
}
