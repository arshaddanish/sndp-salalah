import * as XLSX from 'xlsx';

import { getMemberStatus } from '@/lib/utils/member-status';
import type { Member } from '@/types/members';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB');
}

function formatStatus(member: Member): string {
  const status = getMemberStatus(member.expiry, member.is_lifetime);
  if (status === 'near-expiry') return 'Near Expiry';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function exportMembersToExcel(members: Member[]): void {
  const rows = members.map((m) => ({
    'Member ID': m.member_code,
    'Civil ID': m.civil_id_no,
    Name: m.name,
    DOB: formatDate(m.dob),
    Email: m.email ?? '',
    'GSM No': m.gsm_no ?? '',
    'WhatsApp No': m.whatsapp_no ?? '',
    'Blood Group': m.blood_group ?? '',
    'Marital Status': m.family_status ?? '',
    Profession: m.profession ?? '',
    'Residential Area': m.residential_area ?? '',
    'Passport No': m.passport_no ?? '',
    'Address India': m.address_india ?? '',
    'Tel No India': m.tel_no_india ?? '',
    'Family in Oman': m.is_family_in_oman ? 'Yes' : 'No',
    'Application No': m.application_no ?? '',
    'Received On': formatDate(m.received_on),
    'Submitted By': m.submitted_by ?? '',
    'Shakha India': m.shakha_india ?? '',
    'Checked By': m.checked_by ?? '',
    'Approved By': m.approved_by ?? '',
    President: m.president ?? '',
    Secretary: m.secretary ?? '',
    'Union Name': m.union_name ?? '',
    District: m.district ?? '',
    Shakha: m.shakhaName ?? '',
    'Active From': formatDate(m.active_from),
    Expiry: m.is_lifetime ? 'Lifetime' : formatDate(m.expiry),
    Status: formatStatus(m),
    'Created At': formatDate(m.created_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

  XLSX.writeFile(workbook, `members-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
