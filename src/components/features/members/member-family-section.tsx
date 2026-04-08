import { Card } from '@/components/ui/card';
import type { MemberFamilyMember } from '@/types/members';

type MemberFamilySectionProps = {
  familyMembers: MemberFamilyMember[];
};

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function MemberFamilySection({ familyMembers }: Readonly<MemberFamilySectionProps>) {
  return (
    <Card>
      <h2 className="text-text-primary mb-4 text-lg font-semibold">Family Members</h2>

      {familyMembers.length === 0 ? (
        <p className="text-text-muted text-sm">No family members recorded.</p>
      ) : (
        <div className="overflow-x-auto">
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
                  <td className="text-text-secondary px-3 py-2">{fm.relation ?? '—'}</td>
                  <td className="text-text-secondary px-3 py-2">{formatDate(fm.dob)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
