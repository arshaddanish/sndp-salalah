'use server';

import { and, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { members, shakhas } from '@/lib/db/schema';
import {
  createShakhaSchema,
  deleteShakhaSchema,
  updateShakhaSchema,
} from '@/lib/validations/shakhas';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';
import type { ShakhaWithMemberCount } from '@/types/shakhas';

/**
 * Count members assigned to a specific shakha from the database
 */
async function getMemberCountForShakha(shakhaId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(and(eq(members.shakha_id, shakhaId), eq(members.is_archived, false)));
  return Number(result[0]?.count ?? 0);
}

function normalizeShakhaName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Fetch paginated shakhas with member counts from database
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
        memberCount: sql<number>`(
          SELECT count(*) 
          FROM members 
          WHERE members.shakha_id = shakhas.id AND members.is_archived = false
        )`.mapWith(Number),
      })
      .from(shakhas)
      .orderBy(desc(shakhas.created_at), desc(shakhas.id))
      .limit(pageSize)
      .offset(start);

    return {
      success: true,
      data: {
        items: rows as ShakhaWithMemberCount[],
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
          memberCount: await getMemberCountForShakha(shakhaId),
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
        memberCount: await getMemberCountForShakha(shakhaId),
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

    const memberCount = await getMemberCountForShakha(shakhaId);
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
