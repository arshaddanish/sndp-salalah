/**
 * Members Resource - Filter and Search Parameters
 *
 * MembersFilter: Structured predicates for filtering
 * MembersSearch: Full-text search parameters
 * ListMembersRequest: Complete request type with pagination + sorting
 */

import type { ListRequest } from '../api/filters';

/**
 * Structured filters for Members resource
 * These are field-specific predicates for filtering
 */
export type MembersFilter = {
  status?: 'active' | 'expired' | 'near-expiry' | 'lifetime';
  shakha?: string;
  createdStart?: string; // ISO date
  createdEnd?: string; // ISO date
};

/**
 * Full-text search parameters for Members
 * Separate from filters to allow flexible search across fields
 */
export type MembersSearch = {
  q?: string; // Full-text search query (follows GitHub/Slack convention)
};

/**
 * Complete Members list request
 * Combines pagination, sorting, filters, and search
 */
export type ListMembersRequest = ListRequest<MembersFilter, MembersSearch>;
