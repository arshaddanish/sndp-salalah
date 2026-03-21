'use server';

import { revalidatePath } from 'next/cache';

import { MOCK_MEMBERS } from '@/lib/mock-data/members';
import { MOCK_SHAKHAS, type ShakhaWithMemberCount } from '@/lib/mock-data/shakhas';
import {
  createShakhaSchema,
  deleteShakhaSchema,
  updateShakhaSchema,
} from '@/lib/validations/shakhas';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';

// Scaffolded mock-data implementation; replace with DB integration when persistence layer is available.

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

function getNextShakhaId(): string {
  const maxId = MOCK_SHAKHAS.reduce((currentMax, shakha) => {
    const parsedId = Number.parseInt(shakha.id, 10);
    return Number.isNaN(parsedId) ? currentMax : Math.max(currentMax, parsedId);
  }, 0);

  return String(maxId + 1);
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

  // Mock implementation - simulates paginated API response with member counts
  const start = (page - 1) * pageSize;
  const paginatedShakhas = MOCK_SHAKHAS.slice(start, start + pageSize);

  const itemsWithCounts: ShakhaWithMemberCount[] = paginatedShakhas.map((shakha) => ({
    ...shakha,
    memberCount: countMembersForShakha(shakha.id),
  }));

  return {
    success: true,
    data: {
      items: itemsWithCounts,
      totalCount: MOCK_SHAKHAS.length,
    },
  };
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

    const shakhaIndex = MOCK_SHAKHAS.findIndex((s) => s.id === shakhaId);

    if (shakhaIndex === -1) {
      return {
        success: false,
        error: 'Shakha not found',
      };
    }

    const hasDuplicateName = MOCK_SHAKHAS.some(
      (shakha) => shakha.id !== shakhaId && normalizeShakhaName(shakha.name) === normalizedName,
    );

    if (hasDuplicateName) {
      return {
        success: false,
        error: 'A shakha with this name already exists.',
      };
    }

    MOCK_SHAKHAS[shakhaIndex]!.name = sanitizedName;
    MOCK_SHAKHAS[shakhaIndex]!.updated_at = new Date();

    revalidatePath('/shakhas');

    const updatedShakha = MOCK_SHAKHAS[shakhaIndex]!;
    return {
      success: true,
      data: {
        ...updatedShakha,
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
    const hasDuplicateName = MOCK_SHAKHAS.some(
      (shakha) => normalizeShakhaName(shakha.name) === normalizedName,
    );

    if (hasDuplicateName) {
      return {
        success: false,
        error: 'A shakha with this name already exists.',
      };
    }

    const createdShakha: ShakhaWithMemberCount = {
      id: getNextShakhaId(),
      name: sanitizedName,
      created_at: new Date(),
      updated_at: new Date(),
      memberCount: 0,
    };

    MOCK_SHAKHAS.unshift({
      id: createdShakha.id,
      name: createdShakha.name,
      created_at: createdShakha.created_at,
      updated_at: createdShakha.updated_at,
    });

    revalidatePath('/shakhas');

    return {
      success: true,
      data: createdShakha,
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

    const shakhaIndex = MOCK_SHAKHAS.findIndex((shakha) => shakha.id === shakhaId);

    if (shakhaIndex === -1) {
      return {
        success: false,
        error: 'Shakha not found',
      };
    }

    const memberCount = countMembersForShakha(shakhaId);
    if (memberCount > 0) {
      return {
        success: false,
        error: `This shakha has ${memberCount} assigned member${memberCount === 1 ? '' : 's'}. Delete those members first before deleting this shakha.`,
      };
    }

    MOCK_SHAKHAS.splice(shakhaIndex, 1);

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
