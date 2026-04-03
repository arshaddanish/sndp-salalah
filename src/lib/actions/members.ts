'use server';

import { revalidatePath } from 'next/cache';

import { getMemberStatus, MOCK_MEMBERS } from '@/lib/mock-data/members';
import { MOCK_SHAKHAS } from '@/lib/mock-data/shakhas';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';
import {
  type CreateMemberInput,
  createMemberSchema,
  renewMembershipSchema,
  updateMemberSchema,
} from '@/lib/validations/members';
import type { ActionResult } from '@/types/actions';
import type { Member, MemberDetail, MemberTransaction } from '@/types/members';
import type { PaginationResponse } from '@/types/pagination';
import type { TransactionPaymentMode } from '@/types/transactions';

/**
 * Filter options for members endpoint
 * API-Ready: Pass these filters directly to backend API
 * Follows enterprise API naming: 'q' for full-text search, specific field names for filters
 */
type MembersFilterOptions = {
  q?: string; // Full-text search query
  status?: string;
  shakha?: string;
  createdStart?: string; // Filter by member creation date (start)
  createdEnd?: string; // Filter by member creation date (end)
};

/**
 * Apply member filters (client-side for mocked data, server-side on API)
 * API-Ready: This logic will move to the backend when API is implemented
 */
function filterMembers(members: Member[], filters: MembersFilterOptions): Member[] {
  const { q = '', status = 'all', shakha = 'all', createdStart = '', createdEnd = '' } = filters;

  return members.filter((member) => {
    // Full-text search filter
    const matchesSearch =
      q === '' ||
      [member.name, member.email, member.member_code.toString(), member.whatsapp_no].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(q.toLowerCase()),
      );

    // Status filter
    const memberStatus = getMemberStatus(member.expiry);
    const matchesStatus = status === 'all' || memberStatus === status;

    // Shakha filter
    const matchesShakha = shakha === 'all' || member.shakha_id.toString() === shakha;

    // Date range filter (by creation date)
    let matchesDate = true;
    if (createdStart && member.created_at) {
      matchesDate = new Date(member.created_at) >= new Date(createdStart);
    }
    if (matchesDate && createdEnd && member.expiry) {
      matchesDate = new Date(member.expiry) <= new Date(createdEnd);
    }

    return matchesSearch && matchesStatus && matchesShakha && matchesDate;
  });
}

export async function fetchMembers(
  page: number,
  pageSize: number,
  filters?: MembersFilterOptions,
): Promise<ActionResult<PaginationResponse<Member>>> {
  const isValidPage = Number.isInteger(page) && page > 0;
  const isValidPageSize = Number.isInteger(pageSize) && pageSize > 0;

  if (!isValidPage || !isValidPageSize) {
    return {
      success: false,
      error: 'Invalid pagination: page and pageSize must be positive integers.',
    };
  }

  try {
    const sorted = [...MOCK_MEMBERS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const filteredMembers = filterMembers(sorted, filters ?? {});
    const start = (page - 1) * pageSize;
    const paginatedData = filteredMembers.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items: paginatedData,
        totalCount: filteredMembers.length,
      },
    };
  } catch (error) {
    console.error('Error fetching members:', error);
    return {
      success: false,
      error: 'Unable to load members. Please try again.',
    };
  }
}

export async function fetchShakhaOptions(): Promise<
  ActionResult<Array<{ label: string; value: string }>>
> {
  try {
    const uniqueShakhas = Array.from(new Set(MOCK_MEMBERS.map((member) => member.shakha_id))).sort(
      (a, b) => a.localeCompare(b),
    );

    return {
      success: true,
      data: uniqueShakhas.map((id) => ({ label: `Shakha ${id}`, value: id })),
    };
  } catch (error) {
    console.error('Error fetching shakha options:', error);
    return {
      success: false,
      error: 'Unable to load shakha options.',
    };
  }
}

function getNextMemberCode(): number {
  const maxMemberCode = MOCK_MEMBERS.reduce(
    (maxCode, member) => Math.max(maxCode, member.member_code),
    1000,
  );

  return maxMemberCode + 1;
}

function getNextMemberId(): string {
  const maxNumericId = MOCK_MEMBERS.reduce((maxId, member) => {
    const parsedValue = Number.parseInt(member.id.replaceAll(/\D+/g, ''), 10);
    if (Number.isNaN(parsedValue)) {
      return maxId;
    }

    return Math.max(maxId, parsedValue);
  }, 0);

  return `m${maxNumericId + 1}`;
}

function normalizeOptionalText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateOrNull(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDefaultExpiryDate(): Date {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear;
}

export async function getNextMemberCodePreview(): Promise<number> {
  return getNextMemberCode();
}

export async function createMember(
  input: CreateMemberInput,
): Promise<ActionResult<{ id: string; memberCode: number }>> {
  try {
    const validationResult = createMemberSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid member form input',
      };
    }

    const parsedData = validationResult.data;
    const normalizedCivilId = parsedData.civilIdNo.trim().toLowerCase();
    const hasDuplicateCivilId = MOCK_MEMBERS.some(
      (member) => member.civil_id_no.trim().toLowerCase() === normalizedCivilId,
    );

    if (hasDuplicateCivilId) {
      return {
        success: false,
        error: 'A member with this Civil ID already exists.',
      };
    }

    const calculatedMemberCode = getNextMemberCode();
    const memberCode = Math.max(parsedData.memberCodePreview, calculatedMemberCode);
    const expiryDate = parseDateOrNull(parsedData.expiry) ?? getDefaultExpiryDate();
    const createdAt = new Date();
    const newMemberId = getNextMemberId();

    const createdMember: Member = {
      id: newMemberId,
      member_code: memberCode,
      civil_id_no: parsedData.civilIdNo.trim(),
      name: parsedData.name.trim(),
      dob: new Date(parsedData.dob),
      family_status: normalizeOptionalText(parsedData.familyStatus),
      email: normalizeOptionalText(parsedData.email),
      photo_key: parsedData.photoKey,
      gsm_no: parsedData.gsmNo.trim(),
      whatsapp_no: parsedData.whatsappNo.trim(),
      blood_group: normalizeOptionalText(parsedData.bloodGroup),
      profession: parsedData.profession.trim(),
      shakha_id: normalizeOptionalText(parsedData.officeShakhaId) ?? '1',
      residential_area: parsedData.residentialArea.trim(),
      passport_no: parsedData.passportNo.trim(),
      address_india: parsedData.addressIndia.trim(),
      tel_no_india: normalizeOptionalText(parsedData.telNoIndia),
      is_family_in_oman: parsedData.isFamilyInOman,
      application_no: parsedData.applicationNo.trim(),
      received_on: new Date(parsedData.receivedOn),
      submitted_by: parsedData.submittedBy.trim(),
      shakha_india: normalizeOptionalText(parsedData.shakhaIndia),
      checked_by: parsedData.checkedBy.trim(),
      approved_by: parsedData.approvedBy.trim(),
      president: normalizeOptionalText(parsedData.president),
      secretary: normalizeOptionalText(parsedData.secretary),
      union: normalizeOptionalText(parsedData.union),
      district: normalizeOptionalText(parsedData.district),
      family_members: parsedData.familyMembers.map((familyMember, index) => ({
        id: `${newMemberId}-f${index + 1}`,
        name: familyMember.name.trim(),
        relation: normalizeOptionalText(familyMember.relation),
        dob: parseDateOrNull(familyMember.dob),
        created_at: createdAt,
      })),
      expiry: expiryDate,
      created_at: createdAt,
    };

    MOCK_MEMBERS.unshift(createdMember);
    revalidatePath('/members');

    return {
      success: true,
      data: {
        id: createdMember.id,
        memberCode: createdMember.member_code,
      },
    };
  } catch (error) {
    console.error('Error creating member:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the member',
    };
  }
}

export async function fetchMemberById(id: string): Promise<ActionResult<MemberDetail>> {
  try {
    const member = MOCK_MEMBERS.find((item) => item.id === id);
    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    const shakha = MOCK_SHAKHAS.find((s) => s.id === member.shakha_id);

    return {
      success: true,
      data: {
        ...member,
        shakhaName: shakha?.name ?? `Shakha ${member.shakha_id}`,
        status: getMemberStatus(member.expiry),
        familyMembersList: member.family_members ?? [],
      },
    };
  } catch (error) {
    console.error('Error fetching member:', error);
    return { success: false, error: 'Unable to load member profile. Please try again.' };
  }
}

export async function fetchMemberTransactions(
  memberId: string,
): Promise<ActionResult<MemberTransaction[]>> {
  try {
    const memberTransactions = MOCK_TRANSACTIONS.filter(
      (txn) => txn.memberId === memberId && txn.entryKind === 'regular',
    )
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
      .map((txn) => ({
        id: txn.id,
        transactionCode: txn.transactionCode,
        transactionDate: txn.transactionDate,
        amount: txn.amount,
        paymentMode: txn.paymentMode as TransactionPaymentMode,
        fundAccount: txn.fundAccount,
        remarks: txn.remarks,
        createdAt: txn.createdAt,
      }));

    return {
      success: true,
      data: memberTransactions,
    };
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    return { success: false, error: 'Unable to load payment history.' };
  }
}

export async function renewMembership(
  input: unknown,
): Promise<ActionResult<{ transactionId: string }>> {
  try {
    const validationResult = renewMembershipSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Invalid renewal input' };
    }

    const data = validationResult.data;
    const member = MOCK_MEMBERS.find((m) => m.id === data.memberId);
    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    const maxCode = MOCK_TRANSACTIONS.reduce(
      (max, txn) => Math.max(max, txn.transactionCode),
      1000,
    );
    const newTransactionId = `txn-renew-${Date.now()}`;

    const attachmentKey = data.attachmentKey?.trim();

    MOCK_TRANSACTIONS.push({
      id: newTransactionId,
      transactionCode: maxCode + 1,
      transactionDate: new Date(),
      entryKind: 'regular',
      categoryId: 'cat-1',
      categoryName: 'Membership Fee',
      type: 'income',
      paymentMode: data.paymentMode,
      fundAccount: data.fundAccount,
      memberId: data.memberId,
      amount: data.amount.toFixed(3),
      cashBalance: '0.000',
      bankBalance: '0.000',
      remarks: data.remarks ?? '',
      ...(attachmentKey ? { attachmentKey } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    member.expiry = new Date(data.newExpiry);

    revalidatePath(`/members/${data.memberId}`);
    revalidatePath('/transactions');
    revalidatePath('/members');

    return { success: true, data: { transactionId: newTransactionId } };
  } catch (error) {
    console.error('Error renewing membership:', error);
    return { success: false, error: 'Unable to process renewal. Please try again.' };
  }
}

export async function updateMember(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = updateMemberSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Invalid member data' };
    }

    const data = validationResult.data;
    const memberIndex = MOCK_MEMBERS.findIndex((m) => m.id === data.id);
    if (memberIndex === -1) {
      return { success: false, error: 'Member not found.' };
    }

    const normalizedCivilId = data.civilIdNo.trim().toLowerCase();
    const hasDuplicateCivilId = MOCK_MEMBERS.some(
      (m) => m.id !== data.id && m.civil_id_no.trim().toLowerCase() === normalizedCivilId,
    );
    if (hasDuplicateCivilId) {
      return { success: false, error: 'A member with this Civil ID already exists.' };
    }

    const existing = MOCK_MEMBERS[memberIndex]!;
    const updatedMember: Member = {
      ...existing,
      name: data.name.trim(),
      dob: new Date(data.dob),
      profession: data.profession.trim(),
      whatsapp_no: data.whatsappNo.trim(),
      gsm_no: data.gsmNo.trim(),
      family_status: normalizeOptionalText(data.familyStatus),
      blood_group: normalizeOptionalText(data.bloodGroup),
      residential_area: data.residentialArea.trim(),
      civil_id_no: data.civilIdNo.trim(),
      passport_no: data.passportNo.trim(),
      email: normalizeOptionalText(data.email),
      tel_no_india: normalizeOptionalText(data.telNoIndia),
      address_india: data.addressIndia.trim(),
      is_family_in_oman: data.isFamilyInOman,
      family_members: data.familyMembers.map((fm, i) => ({
        id: existing.family_members?.[i]?.id ?? `${data.id}-f${i + 1}`,
        name: fm.name.trim(),
        relation: normalizeOptionalText(fm.relation),
        dob: parseDateOrNull(fm.dob),
        created_at: existing.family_members?.[i]?.created_at ?? new Date(),
      })),
      shakha_india: normalizeOptionalText(data.shakhaIndia),
      union: normalizeOptionalText(data.union),
      district: normalizeOptionalText(data.district),
      shakha_id: normalizeOptionalText(data.officeShakhaId) ?? existing.shakha_id,
      submitted_by: data.submittedBy.trim(),
      approved_by: data.approvedBy.trim(),
      received_on: new Date(data.receivedOn),
      checked_by: data.checkedBy.trim(),
      expiry: parseDateOrNull(data.expiry) ?? existing.expiry,
      application_no: data.applicationNo.trim(),
      secretary: normalizeOptionalText(data.secretary),
      president: normalizeOptionalText(data.president),
      photo_key: data.photoKey,
    };

    MOCK_MEMBERS[memberIndex] = updatedMember;

    revalidatePath(`/members/${data.id}`);
    revalidatePath('/members');

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error('Error updating member:', error);
    return { success: false, error: 'Unable to update member. Please try again.' };
  }
}

export async function deleteMember(memberId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const memberIndex = MOCK_MEMBERS.findIndex((member) => member.id === memberId);

    if (memberIndex === -1) {
      return { success: false, error: 'Member not found.' };
    }

    const hasLinkedTransactions = MOCK_TRANSACTIONS.some((txn) => txn.memberId === memberId);

    if (hasLinkedTransactions) {
      return {
        success: false,
        error:
          'Cannot delete this member because linked transactions exist. Remove or reassign transactions first.',
      };
    }

    MOCK_MEMBERS.splice(memberIndex, 1);

    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);

    return { success: true, data: { id: memberId } };
  } catch (error) {
    console.error('Error deleting member:', error);
    return { success: false, error: 'Unable to delete member. Please try again.' };
  }
}
