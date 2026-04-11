'use server';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  isNull,
  lt,
  lte,
  not,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { family_members, members, shakhas } from '@/lib/db/schema';
import { shouldShowDetailedErrors } from '@/lib/env';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';
import { parseDateOrNull, parseEndOfDayOrNull, parseStartOfDayOrNull } from '@/lib/utils/date';
import { getMemberStatus } from '@/lib/utils/member-status';
import {
  type CreateMemberInput,
  createMemberSchema,
  renewMembershipSchema,
  setMemberLifetimeSchema,
  updateMemberPhotoSchema,
  updateMemberSchema,
} from '@/lib/validations/members';
import type { ActionResult } from '@/types/actions';
import type { Member, MemberDetail, MemberTransaction } from '@/types/members';
import type { PaginationResponse } from '@/types/pagination';
import type { TransactionPaymentMode } from '@/types/transactions';

/**
 * Filter options for members endpoint
 * Follows enterprise API naming: 'q' for full-text search, specific field names for filters
 */
type MembersFilterOptions = {
  q?: string; // Full-text search query
  status?: string;
  shakha?: string;
  activeWindowStart?: string; // Filter by activity window start date
  activeWindowEnd?: string; // Filter by activity window end date
};

type MembersWhereCondition = SQL<unknown>;

type ResolvedMemberProfile = {
  member: MemberDetail;
};

type PostgresLikeError = {
  code?: string;
  constraint?: string;
  message?: string;
  cause?: unknown;
};

function collectErrorChain(error: unknown): PostgresLikeError[] {
  const collected: PostgresLikeError[] = [];
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (current && !visited.has(current) && collected.length < 6) {
    visited.add(current);
    if (typeof current === 'object') {
      const candidate = current as PostgresLikeError;
      collected.push(candidate);
      current = candidate.cause;
      continue;
    }
    break;
  }

  return collected;
}

function extractFirstKnownErrorCode(error: unknown): string | null {
  const chain = collectErrorChain(error);
  for (const item of chain) {
    if (typeof item.code === 'string' && item.code.length > 0) {
      return item.code;
    }
  }
  return null;
}

function extractFirstKnownConstraint(error: unknown): string | null {
  const chain = collectErrorChain(error);
  for (const item of chain) {
    if (typeof item.constraint === 'string' && item.constraint.length > 0) {
      return item.constraint;
    }
  }

  const joinedMessage = extractJoinedErrorMessage(error);
  const constraintPattern = /constraint\s+"([^"]+)"/i;
  const match = constraintPattern.exec(joinedMessage);
  return match?.[1] ?? null;
}

function extractJoinedErrorMessage(error: unknown): string {
  const messages = collectErrorChain(error)
    .map((item) => item.message)
    .filter((message): message is string => typeof message === 'string' && message.length > 0);

  return messages.join(' | ');
}

function mapMemberMutationErrorByCode(code: string | null): string | null {
  if (!code) {
    return null;
  }

  const codeMap: Record<string, string> = {
    '23505': 'A duplicate member record was detected. Please verify the details and try again.',
    '23503': 'Please select a valid office shakha.',
    '23502': 'Please complete all required fields and try again.',
    '22P02': 'One of the submitted values is invalid. Please review the form and try again.',
    '42501': 'Database permission error while saving the member. Please contact an administrator.',
    '25006': 'Database is in read-only mode. Member updates are temporarily unavailable.',
  };

  return codeMap[code] ?? `Unable to save member due to a database error (${code}).`;
}

const MEMBER_MUTATION_MESSAGE_RULES = [
  {
    matches: (joinedMessage: string) => joinedMessage.includes('Member not found or archived'),
    message: 'Member not found.',
  },
  {
    matches: (_: string, normalizedMessage: string) =>
      normalizedMessage.includes('violates foreign key constraint') &&
      normalizedMessage.includes('shakha_id'),
    message: 'Please select a valid office shakha.',
  },
  {
    matches: (_: string, normalizedMessage: string) =>
      normalizedMessage.includes('null value in column'),
    message: 'Please complete all required fields and try again.',
  },
  {
    matches: (_: string, normalizedMessage: string) =>
      normalizedMessage.includes('invalid input syntax') && normalizedMessage.includes('date'),
    message: 'One of the submitted dates is invalid. Please review the form and try again.',
  },
  {
    matches: (_: string, normalizedMessage: string) =>
      normalizedMessage.includes('read-only') || normalizedMessage.includes('readonly'),
    message: 'Database is in read-only mode. Member updates are temporarily unavailable.',
  },
];

function mapMemberMutationErrorByMessage(joinedMessage: string): string | null {
  if (!joinedMessage) {
    return null;
  }

  const normalizedMessage = joinedMessage.toLowerCase();

  for (const rule of MEMBER_MUTATION_MESSAGE_RULES) {
    if (rule.matches(joinedMessage, normalizedMessage)) {
      return rule.message;
    }
  }

  return null;
}

function mapMemberUniqueConstraintError(
  constraint: string | null,
  normalizedMessage: string,
): string {
  const normalizedConstraint = constraint?.toLowerCase() ?? '';
  const hasUniqueConstraintMessage = normalizedMessage.includes('violates unique constraint');
  const hasCivilIdKeyDetail =
    normalizedMessage.includes('key (civil_id_no)=') ||
    normalizedMessage.includes('key ("civil_id_no")=');
  const hasMemberCodeKeyDetail =
    normalizedMessage.includes('key (member_code)=') ||
    normalizedMessage.includes('key ("member_code")=');

  if (
    normalizedConstraint.includes('members_civil_id_no_unique') ||
    (hasUniqueConstraintMessage && normalizedMessage.includes('civil_id_no')) ||
    hasCivilIdKeyDetail
  ) {
    return 'A member with this Civil ID already exists.';
  }

  if (
    normalizedConstraint.includes('members_member_code_unique') ||
    (hasUniqueConstraintMessage && normalizedMessage.includes('member_code')) ||
    hasMemberCodeKeyDetail
  ) {
    return 'Unable to generate a new member ID right now. Please try again.';
  }

  return 'A duplicate member record was detected. Please verify the details and try again.';
}

function mapMemberMutationError(error: unknown): string | null {
  const joinedMessage = extractJoinedErrorMessage(error);
  const normalizedMessage = joinedMessage.toLowerCase();
  const code = extractFirstKnownErrorCode(error);
  const constraint = extractFirstKnownConstraint(error);
  const hasUniqueConstraintMessage = normalizedMessage.includes('violates unique constraint');
  const normalizedConstraint = constraint?.toLowerCase() ?? '';
  const hasUniqueConstraintName = normalizedConstraint.includes('unique');

  if (code === '23505' || hasUniqueConstraintMessage || hasUniqueConstraintName) {
    return mapMemberUniqueConstraintError(constraint, normalizedMessage);
  }

  const messageMapped = mapMemberMutationErrorByMessage(joinedMessage);
  if (messageMapped) {
    return messageMapped;
  }

  return mapMemberMutationErrorByCode(code);
}

function buildDevDiagnosticMemberMutationError(error: unknown): string {
  const code = extractFirstKnownErrorCode(error);
  const joinedMessage = extractJoinedErrorMessage(error);

  if (!shouldShowDetailedErrors) {
    return 'Unable to update member. Please try again.';
  }

  const details = [code ? `code=${code}` : '', joinedMessage ? `message=${joinedMessage}` : '']
    .filter((part) => part.length > 0)
    .join(' | ');

  return details
    ? `Unable to update member. Please try again. (${details})`
    : 'Unable to update member. Please try again. (no DB details available)';
}

function parseMemberCodeIdentifier(identifier: string): number | null {
  if (!/^\d+$/.test(identifier)) {
    return null;
  }

  const parsed = Number.parseInt(identifier, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 2147483647) {
    return null;
  }

  return parsed;
}

function buildSearchCondition(query: string): MembersWhereCondition | null {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return null;
  }

  const memberCodeNum = Number.parseInt(normalizedQuery, 10);

  return (
    or(
      ilike(members.name, `%${normalizedQuery}%`),
      ilike(members.email, `%${normalizedQuery}%`),
      ilike(members.whatsapp_no, `%${normalizedQuery}%`),
      ...(Number.isNaN(memberCodeNum) ? [] : [eq(members.member_code, memberCodeNum)]),
    ) ?? null
  );
}

function buildStatusCondition(status: string): MembersWhereCondition | null {
  switch (status) {
    case 'lifetime':
      return eq(members.is_lifetime, true);
    case 'pending':
      return and(eq(members.is_lifetime, false), isNull(members.expiry)) ?? null;
    case 'expired':
      return and(eq(members.is_lifetime, false), lt(members.expiry, sql`CURRENT_DATE`)) ?? null;
    case 'near-expiry':
      return (
        and(
          eq(members.is_lifetime, false),
          gte(members.expiry, sql`CURRENT_DATE`),
          lte(members.expiry, sql`CURRENT_DATE + INTERVAL '30 days'`),
        ) ?? null
      );
    case 'active':
      return (
        and(
          eq(members.is_lifetime, false),
          gt(members.expiry, sql`CURRENT_DATE + INTERVAL '30 days'`),
        ) ?? null
      );
    default:
      return null;
  }
}

function buildActivityWindowConditions(
  activeWindowStart?: string,
  activeWindowEnd?: string,
): MembersWhereCondition[] {
  const startDate = parseStartOfDayOrNull(activeWindowStart);
  const endDate = parseEndOfDayOrNull(activeWindowEnd);

  if (!startDate || !endDate) {
    return [];
  }

  return [lte(members.active_from, startDate), gte(members.expiry, endDate)];
}

function buildMembersWhereClause(filters: MembersFilterOptions): SQL<unknown> | undefined {
  const {
    q = '',
    status = 'all',
    shakha = 'all',
    activeWindowStart = '',
    activeWindowEnd = '',
  } = filters;

  const conditions: MembersWhereCondition[] = [eq(members.is_archived, false)];

  const searchCondition = buildSearchCondition(q);
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  if (shakha && shakha !== 'all') {
    conditions.push(eq(members.shakha_id, shakha));
  }

  if (status && status !== 'all') {
    const statusCondition = buildStatusCondition(status);
    if (statusCondition) {
      conditions.push(statusCondition);
    }
  }

  conditions.push(...buildActivityWindowConditions(activeWindowStart, activeWindowEnd));

  return and(...conditions);
}

export async function fetchShakhaOptions(): Promise<
  ActionResult<Array<{ label: string; value: string }>>
> {
  try {
    const result = await db
      .select({
        label: shakhas.name,
        value: shakhas.id,
      })
      .from(shakhas)
      .orderBy(asc(shakhas.name));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error fetching shakha options:', error);
    return {
      success: false,
      error: 'Unable to load shakha options.',
    };
  }
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
    const whereClause = buildMembersWhereClause(filters ?? {});

    // Fetch data and count in parallel
    const [items, countResult] = await Promise.all([
      db
        .select({
          id: members.id,
          member_code: members.member_code,
          civil_id_no: members.civil_id_no,
          name: members.name,
          dob: members.dob,
          family_status: members.family_status,
          email: members.email,
          photo_key: members.photo_key,
          gsm_no: members.gsm_no,
          whatsapp_no: members.whatsapp_no,
          blood_group: members.blood_group,
          profession: members.profession,
          shakha_id: members.shakha_id,
          shakhaName: shakhas.name,
          residential_area: members.residential_area,
          passport_no: members.passport_no,
          address_india: members.address_india,
          tel_no_india: members.tel_no_india,
          is_family_in_oman: members.is_family_in_oman,
          application_no: members.application_no,
          received_on: members.received_on,
          submitted_by: members.submitted_by,
          shakha_india: members.shakha_india,
          checked_by: members.checked_by,
          approved_by: members.approved_by,
          president: members.president,
          secretary: members.secretary,
          union_name: members.union_name,
          district: members.district,
          is_archived: members.is_archived,
          archived_at: members.archived_at,
          is_lifetime: members.is_lifetime,
          active_from: members.active_from,
          expiry: members.expiry,
          created_at: members.created_at,
          updated_at: members.updated_at,
        })
        .from(members)
        .leftJoin(shakhas, eq(shakhas.id, members.shakha_id))
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(desc(members.created_at)),
      db.select({ count: count() }).from(members).where(whereClause),
    ]);

    return {
      success: true,
      data: {
        items,
        totalCount: countResult[0]?.count ?? 0,
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
    const normalizedCivilId = parsedData.civilIdNo.trim();
    const normalizedOfficeShakhaId = parsedData.officeShakhaId.trim();

    try {
      const result = await db.transaction(async (tx) => {
        const insertedMembers = await tx
          .insert(members)
          .values({
            civil_id_no: normalizedCivilId,
            name: parsedData.name.trim(),
            dob: new Date(parsedData.dob),
            family_status: parsedData.familyStatus,
            email: parsedData.email,
            photo_key: parsedData.photoKey,
            gsm_no: parsedData.gsmNo.trim(),
            whatsapp_no: parsedData.whatsappNo.trim(),
            blood_group: parsedData.bloodGroup,
            profession: parsedData.profession.trim(),
            shakha_id: normalizedOfficeShakhaId,
            residential_area: parsedData.residentialArea.trim(),
            passport_no: parsedData.passportNo.trim(),
            address_india: parsedData.addressIndia.trim(),
            tel_no_india: parsedData.telNoIndia,
            is_family_in_oman: parsedData.isFamilyInOman,
            application_no: parsedData.applicationNo.trim(),
            received_on: new Date(parsedData.receivedOn),
            submitted_by: parsedData.submittedBy.trim(),
            shakha_india: parsedData.shakhaIndia,
            checked_by: parsedData.checkedBy.trim(),
            approved_by: parsedData.approvedBy.trim(),
            president: parsedData.president,
            secretary: parsedData.secretary,
            union_name: parsedData.unionName,
            district: parsedData.district,
          })
          .returning({ id: members.id, member_code: members.member_code });

        if (!insertedMembers[0]) {
          throw new Error('Failed to create member');
        }

        const insertedMember = insertedMembers[0];

        if (parsedData.familyMembers && parsedData.familyMembers.length > 0) {
          await tx.insert(family_members).values(
            parsedData.familyMembers.map((fm) => ({
              member_id: insertedMember.id,
              name: fm.name.trim(),
              relation: fm.relation,
              dob: parseDateOrNull(fm.dob),
            })),
          );
        }

        return insertedMember;
      });

      revalidatePath('/members');

      return {
        success: true,
        data: {
          id: result.id,
          memberCode: result.member_code,
        },
      };
    } catch (dbError: unknown) {
      const mappedError = mapMemberMutationError(dbError);
      if (mappedError) {
        return { success: false, error: mappedError };
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating member:', error);
    const mappedError = mapMemberMutationError(error);
    if (mappedError) {
      return { success: false, error: mappedError };
    }
    return {
      success: false,
      error: shouldShowDetailedErrors
        ? `Unable to create member. Please try again. (${extractJoinedErrorMessage(error) || 'no DB details available'})`
        : 'Unable to create member. Please try again.',
    };
  }
}

export async function fetchMemberById(id: string): Promise<ActionResult<MemberDetail>> {
  try {
    const member = await db.query.members.findFirst({
      where: and(eq(members.id, id), eq(members.is_archived, false)),
      with: {
        family_members: {
          orderBy: asc(family_members.created_at),
        },
      },
    });

    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    const shakha = await db.query.shakhas.findFirst({
      where: eq(shakhas.id, member.shakha_id),
    });

    return {
      success: true,
      data: {
        ...member,
        shakhaName: shakha?.name ?? `Shakha ${member.shakha_id}`,
        status: getMemberStatus(member.expiry, member.is_lifetime),
        familyMembersList: member.family_members ?? [],
      },
    };
  } catch (error) {
    console.error('Error fetching member:', error);
    return { success: false, error: 'Unable to load member profile. Please try again.' };
  }
}

export async function fetchMemberProfileByIdentifier(
  identifier: string,
): Promise<ActionResult<ResolvedMemberProfile>> {
  const normalizedIdentifier = identifier.trim();

  if (!normalizedIdentifier) {
    return { success: false, error: 'MEMBER_NOT_FOUND' };
  }

  const parsedMemberCode = parseMemberCodeIdentifier(normalizedIdentifier);
  if (parsedMemberCode === null) {
    return { success: false, error: 'MEMBER_NOT_FOUND' };
  }

  try {
    const member = await db.query.members.findFirst({
      where: and(eq(members.is_archived, false), eq(members.member_code, parsedMemberCode)),
      with: {
        family_members: {
          orderBy: asc(family_members.created_at),
        },
      },
    });

    if (!member) {
      return { success: false, error: 'MEMBER_NOT_FOUND' };
    }

    const shakha = await db.query.shakhas.findFirst({
      where: eq(shakhas.id, member.shakha_id),
    });

    return {
      success: true,
      data: {
        member: {
          ...member,
          shakhaName: shakha?.name ?? `Shakha ${member.shakha_id}`,
          status: getMemberStatus(member.expiry, member.is_lifetime),
          familyMembersList: member.family_members ?? [],
        },
      },
    };
  } catch (error) {
    console.error('Error resolving member profile identifier:', error);
    throw error;
  }
}

export async function fetchMemberTransactions(
  memberId: string,
): Promise<ActionResult<MemberTransaction[]>> {
  try {
    // Pending transactions table integration: replace this with a DB query.
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

    // Fetch member from DB
    const member = await db.query.members.findFirst({
      where: and(eq(members.id, data.memberId), eq(members.is_archived, false)),
    });

    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    if (member.is_lifetime) {
      return {
        success: false,
        error: 'Lifetime members do not require registration or renewal payments.',
      };
    }

    // Pending transactions table integration: replace this with a DB insert.
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

    // Update member expiry in DB
    const normalizedToday = new Date();
    normalizedToday.setHours(0, 0, 0, 0);

    const existingExpiry = member.expiry ? new Date(member.expiry) : null;
    if (existingExpiry) {
      existingExpiry.setHours(0, 0, 0, 0);
    }

    let nextActiveFrom = new Date(normalizedToday);
    if (existingExpiry !== null) {
      const dayAfterExistingExpiry = new Date(existingExpiry);
      dayAfterExistingExpiry.setDate(dayAfterExistingExpiry.getDate() + 1);
      nextActiveFrom =
        dayAfterExistingExpiry.getTime() > normalizedToday.getTime()
          ? dayAfterExistingExpiry
          : new Date(normalizedToday);
    }

    await db
      .update(members)
      .set({
        active_from: nextActiveFrom,
        expiry: new Date(data.newExpiry),
        is_lifetime: false,
      })
      .where(eq(members.id, data.memberId));

    revalidatePath(`/members/${data.memberId}`);
    revalidatePath('/transactions');
    revalidatePath('/members');

    return { success: true, data: { transactionId: newTransactionId } };
  } catch (error) {
    console.error('Error renewing membership:', error);
    return { success: false, error: 'Unable to process renewal. Please try again.' };
  }
}

export async function updateMember(
  memberId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = updateMemberSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Invalid member data' };
    }

    const data = validationResult.data;
    const normalizedCivilId = data.civilIdNo.trim();
    const normalizedOfficeShakhaId = data.officeShakhaId.trim();

    try {
      // Check if member exists and not archived
      const existing = await db.query.members.findFirst({
        where: and(eq(members.id, memberId), eq(members.is_archived, false)),
      });

      if (!existing) {
        throw new Error('Member not found or archived');
      }

      await db.transaction(async (tx) => {
        // Check for civil_id uniqueness (excluding current member)
        const duplicate = await tx.query.members.findFirst({
          where: and(eq(members.civil_id_no, normalizedCivilId), not(eq(members.id, memberId))),
        });

        if (duplicate) {
          throw new Error('A member with this Civil ID already exists.');
        }

        await tx
          .update(members)
          .set({
            name: data.name.trim(),
            dob: new Date(data.dob),
            profession: data.profession.trim(),
            whatsapp_no: data.whatsappNo.trim(),
            gsm_no: data.gsmNo.trim(),
            family_status: data.familyStatus,
            blood_group: data.bloodGroup,
            residential_area: data.residentialArea.trim(),
            civil_id_no: normalizedCivilId,
            passport_no: data.passportNo.trim(),
            email: data.email,
            tel_no_india: data.telNoIndia,
            address_india: data.addressIndia.trim(),
            is_family_in_oman: data.isFamilyInOman,
            shakha_india: data.shakhaIndia,
            union_name: data.unionName,
            district: data.district,
            shakha_id: normalizedOfficeShakhaId,
            submitted_by: data.submittedBy.trim(),
            approved_by: data.approvedBy.trim(),
            received_on: new Date(data.receivedOn),
            checked_by: data.checkedBy.trim(),
            expiry: parseDateOrNull(data.expiry) ?? existing.expiry,
            application_no: data.applicationNo.trim(),
            secretary: data.secretary,
            president: data.president,
            photo_key: data.photoKey?.trim() || existing.photo_key,
          })
          .where(eq(members.id, memberId));

        await tx.delete(family_members).where(eq(family_members.member_id, memberId));

        if (data.familyMembers && data.familyMembers.length > 0) {
          await tx.insert(family_members).values(
            data.familyMembers.map((fm) => ({
              member_id: memberId,
              name: fm.name.trim(),
              relation: fm.relation,
              dob: parseDateOrNull(fm.dob),
            })),
          );
        }
      });

      revalidatePath(`/members/${memberId}`);
      revalidatePath('/members');

      return { success: true, data: { id: memberId } };
    } catch (error: unknown) {
      const mappedError = mapMemberMutationError(error);
      if (mappedError) {
        return { success: false, error: mappedError };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating member:', error);
    const mappedError = mapMemberMutationError(error);
    if (mappedError) {
      return { success: false, error: mappedError };
    }
    return { success: false, error: buildDevDiagnosticMemberMutationError(error) };
  }
}

export async function updateMemberPhoto(
  memberId: string,
  photoKey: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = updateMemberPhotoSchema.safeParse({ memberId, photoKey });
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Invalid photo input' };
    }

    const { memberId: validatedId, photoKey: validatedKey } = validationResult.data;

    // Check if member exists and not archived
    const member = await db.query.members.findFirst({
      where: and(eq(members.id, validatedId), eq(members.is_archived, false)),
    });

    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    await db.update(members).set({ photo_key: validatedKey }).where(eq(members.id, validatedId));

    revalidatePath(`/members/${validatedId}`);
    return { success: true, data: { id: validatedId } };
  } catch (error) {
    console.error('Error updating member photo:', error);
    return { success: false, error: 'Unable to update photo. Please try again.' };
  }
}

export async function setMemberLifetime(
  input: unknown,
): Promise<ActionResult<{ id: string; isLifetime: boolean }>> {
  try {
    const validationResult = setMemberLifetimeSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { success: false, error: firstError?.message ?? 'Invalid lifetime input' };
    }

    const { memberId, isLifetime } = validationResult.data;

    // Check if member exists and not archived
    const member = await db.query.members.findFirst({
      where: and(eq(members.id, memberId), eq(members.is_archived, false)),
    });

    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    await db.update(members).set({ is_lifetime: isLifetime }).where(eq(members.id, memberId));

    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);

    return { success: true, data: { id: memberId, isLifetime } };
  } catch (error) {
    console.error('Error updating member lifetime:', error);
    return { success: false, error: 'Unable to update lifetime status. Please try again.' };
  }
}

export async function archiveMember(memberId: string): Promise<ActionResult<{ id: string }>> {
  try {
    // Check if member exists
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    if (member.is_archived) {
      return { success: true, data: { id: memberId } };
    }

    await db
      .update(members)
      .set({
        is_archived: true,
        archived_at: new Date(),
      })
      .where(eq(members.id, memberId));

    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);

    return { success: true, data: { id: memberId } };
  } catch (error) {
    console.error('Error archiving member:', error);
    return { success: false, error: 'Unable to archive member. Please try again.' };
  }
}

export async function deleteMember(memberId: string): Promise<ActionResult<{ id: string }>> {
  try {
    // Check if member exists
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (!member) {
      return { success: false, error: 'Member not found.' };
    }

    // Pending transactions table integration: re-add linked-transactions guard.
    // For now, cascade delete on family_members FK handles cleanup

    await db.delete(members).where(eq(members.id, memberId));

    revalidatePath('/members');

    return { success: true, data: { id: memberId } };
  } catch (error) {
    console.error('Error deleting member:', error);
    return { success: false, error: 'Unable to delete member. Please try again.' };
  }
}
