'use server';

import { revalidatePath } from 'next/cache';

import { getMemberStatus, type Member, MOCK_MEMBERS } from '@/lib/mock-data/members';
import { type CreateMemberInput, createMemberSchema } from '@/lib/validations/members';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';

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
    const parsedValue = Number.parseInt(member.id.replace(/\D+/g, ''), 10);
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
