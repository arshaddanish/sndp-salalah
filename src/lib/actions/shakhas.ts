'use server';

import { MOCK_SHAKHAS, type Shakha } from '@/lib/mock-data/shakhas';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';

/**
 * Fetch paginated shakhas
 * API-Ready: Replace the mock data logic with actual API call:
 *
 * @param page 1-indexed page number
 * @param pageSize items per page
 * @returns PaginationResponse with items array and total count
 */
export async function fetchShakhas(
  page: number,
  pageSize: number,
): Promise<ActionResult<PaginationResponse<Shakha>>> {
  const isValidPage = Number.isInteger(page) && page > 0;
  const isValidPageSize = Number.isInteger(pageSize) && pageSize > 0;

  if (!isValidPage || !isValidPageSize) {
    return {
      success: false,
      error: 'Invalid pagination: page and pageSize must be positive integers.',
    };
  }

  // Mock implementation - simulates paginated API response
  const start = (page - 1) * pageSize;
  const paginatedData = MOCK_SHAKHAS.slice(start, start + pageSize);

  return {
    success: true,
    data: {
      items: paginatedData,
      totalCount: MOCK_SHAKHAS.length,
    },
  };
}
