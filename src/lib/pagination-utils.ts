/**
 * Pagination Utilities - Centralized pagination logic
 * Single source of truth for calculating derived pagination state
 */

export type PaginationState = {
  totalRows: number;
  pageCount: number;
  pageIndex: number; // 0-indexed, normalized for React Table
};

/**
 * Calculate derived pagination state from raw inputs
 *
 * Handles:
 * - Converting 1-indexed page to 0-indexed pageIndex
 * - Calculating total page count
 * - Clamping page to valid range
 *
 * @param page 1-indexed page number from URL query params
 * @param pageSize Items per page
 * @param totalCount Total count after filters (from API/server action)
 * @returns Normalized pagination state for table components
 */
export function calculatePaginationState(
  page: number,
  pageSize: number,
  totalCount: number,
): PaginationState {
  const totalRows = totalCount;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  // Clamp pageIndex to valid range [0, pageCount - 1]
  const pageIndex = Math.min(Math.max(0, page - 1), pageCount - 1);

  return {
    totalRows,
    pageCount,
    pageIndex,
  };
}
