'use server';

import { MOCK_SHAKHAS, type Shakha } from '@/lib/mock-data/shakhas';
import type { PaginationResponse } from '@/types/pagination';

/**
 * Fetch paginated shakhas
 * API-Ready: Replace the mock data logic with actual API call:
 *
 * @param page 1-indexed page number
 * @param pageSize items per page
 * @returns PaginationResponse with data array and total count
 */
export async function fetchShakhas(
  page: number,
  pageSize: number,
): Promise<PaginationResponse<Shakha>> {
  // Mock implementation - simulates paginated API response
  const start = (page - 1) * pageSize;
  const paginatedData = MOCK_SHAKHAS.slice(start, start + pageSize);

  return {
    data: paginatedData,
    totalCount: MOCK_SHAKHAS.length,
  };
}
