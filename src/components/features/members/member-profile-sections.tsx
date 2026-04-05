import { Card } from '@/components/ui/card';
import type { MemberDetail, MemberFamilyMember } from '@/types/members';

type MemberProfileSectionsProps = {
  member: MemberDetail;
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoField({
  label,
  value,
}: Readonly<{ label: string; value: string | null | undefined }>) {
  return (
    <div className="space-y-0.5">
      <p className="text-text-secondary text-xs font-medium">{label}</p>
      <p className="text-text-primary text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

function SectionDivider({ title, first }: Readonly<{ title: string; first?: boolean }>) {
  return (
    <p
      className={`text-text-secondary col-span-full text-xs font-semibold tracking-wider uppercase ${first ? '' : 'border-border border-t pt-4'}`}
    >
      {title}
    </p>
  );
}

function FamilyTable({ familyMembers }: Readonly<{ familyMembers: MemberFamilyMember[] }>) {
  if (familyMembers.length === 0) {
    return <p className="text-text-muted col-span-full text-sm">No family members recorded.</p>;
  }
  return (
    <div className="col-span-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b">
            <th className="text-text-secondary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
              Name
            </th>
            <th className="text-text-secondary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
              Relation
            </th>
            <th className="text-text-secondary px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
              Date of Birth
            </th>
          </tr>
        </thead>
        <tbody>
          {familyMembers.map((fm) => (
            <tr key={fm.id} className="border-border border-b last:border-0">
              <td className="text-text-primary px-3 py-2 font-medium">{fm.name}</td>
              <td className="text-text-primary px-3 py-2 font-medium">{fm.relation ?? '—'}</td>
              <td className="text-text-primary px-3 py-2 font-medium">{formatDate(fm.dob)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MemberProfileSections({ member }: Readonly<MemberProfileSectionsProps>) {
  let familyInOmanLabel = '—';
  if (member.is_family_in_oman === true) {
    familyInOmanLabel = 'Yes';
  } else if (member.is_family_in_oman === false) {
    familyInOmanLabel = 'No';
  }

  let expiryLabel = 'Pending';
  if (member.is_lifetime) {
    expiryLabel = 'Lifetime';
  } else if (member.expiry !== null) {
    expiryLabel = formatDate(member.expiry);
  }

  return (
    <div className="space-y-6">
      {/* Single dense card: Personal · Contact · Identity · Family · SNDP · Address */}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SectionDivider title="Personal Information" first />
          <InfoField label="Date of Birth" value={formatDate(member.dob)} />
          <InfoField label="Profession" value={member.profession} />
          <InfoField label="Blood Group" value={member.blood_group} />
          <InfoField label="Marital Status" value={member.family_status} />
          <InfoField label="Residential Area" value={member.residential_area} />
          <InfoField label="Family in Oman" value={familyInOmanLabel} />
          {member.address_india ? (
            <div className="col-span-full space-y-0.5">
              <p className="text-text-secondary text-xs font-medium">Address (India)</p>
              <p className="text-text-primary text-sm font-medium">{member.address_india}</p>
            </div>
          ) : null}

          <SectionDivider title="Contact Details" />
          <InfoField label="WhatsApp" value={member.whatsapp_no} />
          <InfoField label="GSM No" value={member.gsm_no} />
          <InfoField label="Email" value={member.email} />
          <InfoField label="Telephone (India)" value={member.tel_no_india} />

          <SectionDivider title="Identity Documents" />
          <InfoField label="Civil ID No" value={member.civil_id_no} />
          <InfoField label="Passport No" value={member.passport_no} />

          <SectionDivider title="Family Members" />
          <FamilyTable familyMembers={member.familyMembersList} />

          <SectionDivider title="SNDP India Unit" />
          <InfoField label="Shakha (India)" value={member.shakha_india} />
          <InfoField label="Union" value={member.union} />
          <InfoField label="District" value={member.district} />
        </div>
      </Card>

      {/* Office Use — intentionally standalone to signal admin-only fields */}
      <Card>
        <h2 className="text-text-primary mb-4 text-lg font-semibold">Office Use</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Office Shakha" value={member.shakhaName} />
          <InfoField label="Submitted By" value={member.submitted_by} />
          <InfoField label="Received On" value={formatDate(member.received_on)} />
          <InfoField label="Checked By" value={member.checked_by} />
          <InfoField label="Approved By" value={member.approved_by} />
          <InfoField label="President" value={member.president} />
          <InfoField label="Secretary" value={member.secretary} />
          <InfoField label="Application No" value={member.application_no} />
          <InfoField label="Expiry" value={expiryLabel} />
          <InfoField label="Created" value={formatDate(member.created_at)} />
        </div>
      </Card>
    </div>
  );
}
