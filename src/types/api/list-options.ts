/**
 * Core List/Query Options
 * Reusable pagination and sorting parameters for all list operations
 * 
 * This is the base for all resource-specific ListRequest types
 */

export type ListOptions = {
  // Pagination
  page?: string;
  pageSize?: string;
  // Sorting (future-proof, extensible)
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
