'use server';

import { desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { shakhas } from '@/lib/db/schema';
import { MOCK_MEMBERS } from '@/lib/mock-data/members';
import type { ShakhaWithMemberCount } from '@/lib/mock-data/shakhas';
import {
  createShakhaSchema,
  deleteShakhaSchema,
  updateShakhaSchema,
} from '@/lib/validations/shakhas';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';

/**
 * Count members assigned to a specific shakha
 * @param shakhaId shakha ID to count members for
 * @returns number of members with matching shakha_id
 */
function countMembersForShakha(shakhaId: string): number {
  return MOCK_MEMBERS.filter((member) => member.shakha_id === shakhaId).length;
}

function normalizeShakhaName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Fetch paginated shakhas with member counts
 *
 * @param page 1-indexed page number
 * @param pageSize items per page
 * @returns PaginationResponse with items array (including memberCount) and total count
 */
export async function fetchShakhas(
  page: number,
  pageSize: number,
): Promise<ActionResult<PaginationResponse<ShakhaWithMemberCount>>> {
  const isValidPage = Number.isInteger(page) && page > 0;
  const isValidPageSize = Number.isInteger(pageSize) && pageSize > 0;

  if (!isValidPage || !isValidPageSize) {
    return {
      success: false,
      error: 'Invalid pagination: page and pageSize must be positive integers.',
    };
  }

  try {
    const start = (page - 1) * pageSize;

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(shakhas);
    const totalCount = Number(countResult[0]?.count ?? 0);

    const rows = await db
      .select({
        id: shakhas.id,
        name: shakhas.name,
        created_at: shakhas.created_at,
        updated_at: shakhas.updated_at,
      })
      .from(shakhas)
      .orderBy(desc(shakhas.created_at), desc(shakhas.id))
      .limit(pageSize)
      .offset(start);

    const itemsWithCounts: ShakhaWithMemberCount[] = rows.map((shakha) => ({
      ...shakha,
      memberCount: countMembersForShakha(shakha.id),
    }));

    return {
      success: true,
      data: {
        items: itemsWithCounts,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error fetching shakhas:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while loading shakhas',
    };
  }
}

/**
 * Update a shakha's name
 *
 * @param shakhaId ID of the shakha to update
 * @param newName new name for the shakha
 * @returns ActionResult with updated shakha data or error message
 */
export async function updateShakha(
  shakhaId: string,
  newName: string,
): Promise<ActionResult<ShakhaWithMemberCount>> {
  try {
    const validationResult = updateShakhaSchema.safeParse({ id: shakhaId, name: newName });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    const sanitizedName = validationResult.data.name;
    const normalizedName = normalizeShakhaName(sanitizedName);

    const existing = await db
      .select({
        id: shakhas.id,
        name: shakhas.name,
        created_at: shakhas.created_at,
        updated_at: shakhas.updated_at,
      })
      .from(shakhas)
      .where(eq(shakhas.id, shakhaId))
      .limit(1);

    if (!existing[0]) {
      return {
        success: false,
        error: 'Shakha not found',
      };
    }

    if (sanitizedName === existing[0].name) {
      const unchangedShakha = existing[0];
      return {
        success: true,
        data: {
          ...unchangedShakha,
          memberCount: countMembersForShakha(shakhaId),
        },
      };
    }

    const duplicate = await db
      .select({ id: shakhas.id })
      .from(shakhas)
      .where(sql`lower(${shakhas.name}) = ${normalizedName} and ${shakhas.id} <> ${shakhaId}`)
      .limit(1);

    if (duplicate[0]) {
      return {
        success: false,
        error: 'A shakha with this name already exists.',
      };
    }

    const updatedRows = await db
      .update(shakhas)
      .set({ name: sanitizedName, updated_at: new Date() })
      .where(eq(shakhas.id, shakhaId))
      .returning({
        id: shakhas.id,
        name: shakhas.name,
        created_at: shakhas.created_at,
        updated_at: shakhas.updated_at,
      });
    const updated = updatedRows[0];

    if (!updated) {
      return {
        success: false,
        error: 'Shakha not found',
      };
    }

    revalidatePath('/shakhas');

    return {
      success: true,
      data: {
        ...updated,
        memberCount: countMembersForShakha(shakhaId),
      },
    };
  } catch (error) {
    console.error('Error updating shakha:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating the shakha',
    };
  }
}

/**
 * Create a new shakha with zero assigned members
 *
 * @param name name of the new shakha
 * @returns ActionResult with created shakha data or error message
 */
export async function createShakha(name: string): Promise<ActionResult<ShakhaWithMemberCount>> {
  try {
    const validationResult = createShakhaSchema.safeParse({ name });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    const sanitizedName = validationResult.data.name;
    const normalizedName = normalizeShakhaName(sanitizedName);
    const duplicate = await db
      .select({ id: shakhas.id })
      .from(shakhas)
      .where(sql`lower(${shakhas.name}) = ${normalizedName}`)
      .limit(1);

    if (duplicate[0]) {
      return {
        success: false,
        error: 'A shakha with this name already exists.',
      };
    }

    const createdRows = await db
      .insert(shakhas)
      .values({
        name: sanitizedName,
        updated_at: new Date(),
      })
      .returning({
        id: shakhas.id,
        name: shakhas.name,
        created_at: shakhas.created_at,
        updated_at: shakhas.updated_at,
      });
    const created = createdRows[0];

    if (!created) {
      return {
        success: false,
        error: 'An unexpected error occurred while creating the shakha',
      };
    }

    revalidatePath('/shakhas');

    return {
      success: true,
      data: {
        ...created,
        memberCount: 0,
      },
    };
  } catch (error) {
    console.error('Error creating shakha:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the shakha',
    };
  }
}

/**
 * Delete a shakha when it has no assigned members
 *
 * @param shakhaId ID of the shakha to delete
 * @returns ActionResult with deleted ID or business error message
 */
export async function deleteShakha(shakhaId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = deleteShakhaSchema.safeParse({ id: shakhaId });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    const memberCount = countMembersForShakha(shakhaId);
    if (memberCount > 0) {
      return {
        success: false,
        error: `This shakha has ${memberCount} assigned member${memberCount === 1 ? '' : 's'}. Delete ${memberCount === 1 ? 'that member' : 'those members'} first before deleting this shakha.`,
      };
    }

    const deleted = await db
      .delete(shakhas)
      .where(eq(shakhas.id, shakhaId))
      .returning({ id: shakhas.id });

    if (!deleted[0]) {
      return {
        success: false,
        error: 'Shakha not found',
      };
    }

    revalidatePath('/shakhas');

    return {
      success: true,
      data: { id: shakhaId },
    };
  } catch (error) {
    console.error('Error deleting shakha:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the shakha',
    };
  }
}
