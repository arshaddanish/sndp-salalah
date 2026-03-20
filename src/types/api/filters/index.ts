/**
 * Generic ListRequest Builder
 * 
 * Compose this with resource-specific Filter and Search types
 * to create type-safe list/query requests for any resource
 */

import type { ListOptions } from '../list-options';

/**
 * Generic request builder for list operations
 * 
 * @template TFilter - Resource-specific structured filters
 * @template TSearch - Resource-specific search parameters
 * 
 * @example
 * ```typescript
 * export type MembersFilter = { status?: string; shakha?: string };
 * export type MembersSearch = { q?: string };
 * export type ListMembersRequest = ListRequest<MembersFilter, MembersSearch>;
 * ```
 */
export type ListRequest<TFilter = Record<string, unknown>, TSearch = Record<string, unknown>> = ListOptions & TFilter & TSearch;
