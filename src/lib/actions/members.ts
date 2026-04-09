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
import { MOCK_TRANSACTIONS } from '@/lib/mock-data/transactions';
import { parseDateOrNull } from '@/lib/utils/date';
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
  const startDate = parseDateOrNull(activeWindowStart);
  const endDate = parseDateOrNull(activeWindowEnd);

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
        .select()
        .from(members)
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

    try {
      // Use transaction to atomically insert member + family members
      const result = await db.transaction(async (tx) => {
        // Insert member
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
            shakha_id: parsedData.officeShakhaId ?? '1',
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
            union: parsedData.union,
            district: parsedData.district,
          })
          .returning({ id: members.id, member_code: members.member_code });

        if (!insertedMembers[0]) {
          throw new Error('Failed to create member');
        }

        const insertedMember = insertedMembers[0];

        // Insert family members if any
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
      // Handle PostgreSQL unique constraint violations
      const error = dbError as { code?: string };
      if (error.code === '23505') {
        // Unique constraint violation
        return {
          success: false,
          error: 'A member with this Civil ID already exists.',
        };
      }
      throw dbError;
    }
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

    try {
      await db.transaction(async (tx) => {
        // Check if member exists and not archived
        const existing = await tx.query.members.findFirst({
          where: and(eq(members.id, memberId), eq(members.is_archived, false)),
        });

        if (!existing) {
          throw new Error('Member not found or archived');
        }

        // Check for civil_id uniqueness (excluding current member)
        const duplicate = await tx.query.members.findFirst({
          where: and(eq(members.civil_id_no, normalizedCivilId), not(eq(members.id, memberId))),
        });

        if (duplicate) {
          throw new Error('A member with this Civil ID already exists.');
        }

        // Update member
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
            union: data.union,
            district: data.district,
            shakha_id: data.officeShakhaId ?? existing.shakha_id,
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

        // Delete all existing family members for this member
        await tx.delete(family_members).where(eq(family_members.member_id, memberId));

        // Insert new family members
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
      const err = error as { code?: string; message?: string };
      if (err.code === '23505') {
        return { success: false, error: 'A member with this Civil ID already exists.' };
      }
      if (err.message === 'Member not found or archived') {
        return { success: false, error: 'Member not found.' };
      }
      if (err.message?.includes('Civil ID')) {
        return { success: false, error: err.message };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating member:', error);
    return { success: false, error: 'Unable to update member. Please try again.' };
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
