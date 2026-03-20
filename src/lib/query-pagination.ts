export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Base pagination parameters - reusable across all resources
 */
export type PaginationParams = {
  page?: string;
  pageSize?: string;
};

export type PaginationDefaults = {
  page?: number;
  pageSize?: number;
};

const parsePositiveInt = (value: string | null | undefined, fallback: number) => {
  if (value == null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
};

export function normalizePagination(
  query: PaginationParams,
  defaults?: PaginationDefaults,
): { page: number; pageSize: number } {
  const basePage = defaults?.page ?? DEFAULT_PAGE;
  const basePageSize = defaults?.pageSize ?? DEFAULT_PAGE_SIZE;

  const page = parsePositiveInt(query.page ?? null, basePage);
  const pageSize = parsePositiveInt(query.pageSize ?? null, basePageSize);

  return {
    page,
    pageSize,
  };
}
