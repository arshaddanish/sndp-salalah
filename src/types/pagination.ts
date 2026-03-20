/**
 * Pagination Types - Shared across all paginated tables
 */

/**
 * Standard pagination response type from server actions/API endpoints
 * All paginated endpoints should return data in this format
 */
export type PaginationResponse<T> = {
  data: T[];
  totalCount: number;
};

/**
 * Pagination state passed to table components
 * Server calculates all values; client only syncs URL state
 */
export type PaginatedTableProps<T> = {
  rows: T[];
  totalRows: number;
  pageSize: number;
  pageIndex: number;
  pageCount: number;
};
