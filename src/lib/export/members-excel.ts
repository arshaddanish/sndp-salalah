import ExcelJS from 'exceljs';

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

export async function exportMembersToExcel(members: Member[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Members');

  worksheet.columns = [
    { header: 'Member ID', key: 'member_code' },
    { header: 'Civil ID', key: 'civil_id_no' },
    { header: 'Name', key: 'name' },
    { header: 'DOB', key: 'dob' },
    { header: 'Email', key: 'email' },
    { header: 'GSM No', key: 'gsm_no' },
    { header: 'WhatsApp No', key: 'whatsapp_no' },
    { header: 'Blood Group', key: 'blood_group' },
    { header: 'Marital Status', key: 'family_status' },
    { header: 'Profession', key: 'profession' },
    { header: 'Residential Area', key: 'residential_area' },
    { header: 'Passport No', key: 'passport_no' },
    { header: 'Address India', key: 'address_india' },
    { header: 'Tel No India', key: 'tel_no_india' },
    { header: 'Family in Oman', key: 'is_family_in_oman' },
    { header: 'Application No', key: 'application_no' },
    { header: 'Received On', key: 'received_on' },
    { header: 'Submitted By', key: 'submitted_by' },
    { header: 'Shakha India', key: 'shakha_india' },
    { header: 'Checked By', key: 'checked_by' },
    { header: 'Approved By', key: 'approved_by' },
    { header: 'President', key: 'president' },
    { header: 'Secretary', key: 'secretary' },
    { header: 'Union Name', key: 'union_name' },
    { header: 'District', key: 'district' },
    { header: 'Shakha', key: 'shakhaName' },
    { header: 'Active From', key: 'active_from' },
    { header: 'Expiry', key: 'expiry' },
    { header: 'Status', key: 'status' },
    { header: 'Created At', key: 'created_at' },
  ];

  for (const m of members) {
    worksheet.addRow({
      member_code: m.member_code,
      civil_id_no: m.civil_id_no,
      name: m.name,
      dob: formatDate(m.dob),
      email: m.email ?? '',
      gsm_no: m.gsm_no ?? '',
      whatsapp_no: m.whatsapp_no ?? '',
      blood_group: m.blood_group ?? '',
      family_status: m.family_status ?? '',
      profession: m.profession ?? '',
      residential_area: m.residential_area ?? '',
      passport_no: m.passport_no ?? '',
      address_india: m.address_india ?? '',
      tel_no_india: m.tel_no_india ?? '',
      is_family_in_oman: m.is_family_in_oman ? 'Yes' : 'No',
      application_no: m.application_no ?? '',
      received_on: formatDate(m.received_on),
      submitted_by: m.submitted_by ?? '',
      shakha_india: m.shakha_india ?? '',
      checked_by: m.checked_by ?? '',
      approved_by: m.approved_by ?? '',
      president: m.president ?? '',
      secretary: m.secretary ?? '',
      union_name: m.union_name ?? '',
      district: m.district ?? '',
      shakhaName: m.shakhaName ?? '',
      active_from: formatDate(m.active_from),
      expiry: m.is_lifetime ? 'Lifetime' : formatDate(m.expiry),
      status: formatStatus(m),
      created_at: formatDate(m.created_at),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `members-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
