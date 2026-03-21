'use server';

import { MOCK_MEMBERS } from '@/lib/mock-data/members';
import { MOCK_SHAKHAS, type ShakhaWithMemberCount } from '@/lib/mock-data/shakhas';
import { updateShakhaSchema } from '@/lib/validations/shakhas';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';

// TODO: Replace the mock data logic with actual DB integration

/**
 * Count members assigned to a specific shakha
 * @param shakhaId shakha ID to count members for
 * @returns number of members with matching shakha_id
 */
function countMembersForShakha(shakhaId: string): number {
  return MOCK_MEMBERS.filter((member) => member.shakha_id === shakhaId).length;
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
    // Validate input
    const validationResult = updateShakhaSchema.safeParse({ id: shakhaId, name: newName });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    // Find the shakha in mock data
    const shakhaIndex = MOCK_SHAKHAS.findIndex((s) => s.id === shakhaId);

    if (shakhaIndex === -1) {
      return {
        success: false,
        error: 'Shakha not found',
      };
    }

    // Update the shakha name (mock implementation - modifies in-place)
    MOCK_SHAKHAS[shakhaIndex]!.name = newName;
    MOCK_SHAKHAS[shakhaIndex]!.updated_at = new Date();

    // Return the updated shakha with member count
    const updatedShakha = MOCK_SHAKHAS[shakhaIndex]!;
    revalidatePath('/shakhas');
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
