import { Badge } from '@/components/ui/badge';
import type { MemberDetail } from '@/types/members';

import { MemberPhotoEditor } from './member-photo-editor';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  expired: 'Expired',
  lifetime: 'Lifetime',
  'near-expiry': 'Near Expiry',
};

type MemberProfileHeaderProps = {
  member: MemberDetail;
};

function formatExpiry(expiry: Date | null, isLifetime: boolean): string {
  if (isLifetime) {
    return 'Lifetime';
  }
  if (!expiry) {
    return 'Pending';
  }

  return expiry.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function MemberProfileHeader({ member }: Readonly<MemberProfileHeaderProps>) {
  const statusLabel = STATUS_LABELS[member.status] ?? member.status;

  return (
    <div className="border-border bg-surface flex flex-col gap-6 rounded-xl border p-6 sm:flex-row sm:items-start">
      {/* Photo — inline-editable via camera badge */}
      <MemberPhotoEditor
        memberId={member.id}
        currentPhotoKey={member.photo_key}
        memberName={member.name}
      />

      {/* Member Summary */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-text-primary text-2xl font-bold">{member.name}</h1>
            <Badge variant={member.status}>{statusLabel}</Badge>
          </div>
          <div className="text-text-secondary flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              Member ID: <span className="text-text-primary font-medium">{member.member_code}</span>
            </span>
            <span>
              Civil ID: <span className="text-text-primary font-medium">{member.civil_id_no}</span>
            </span>
            <span>
              Shakha: <span className="text-text-primary font-medium">{member.shakhaName}</span>
            </span>
            <span>
              Expiry:{' '}
              <span className="text-text-primary font-medium">
                {formatExpiry(member.expiry, member.is_lifetime)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
