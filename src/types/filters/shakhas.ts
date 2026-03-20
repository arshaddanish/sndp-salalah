/**
 * Shakhas Resource - Request Parameters
 * 
 * Shakhas only support pagination and sorting, no filtering or search
 */

import type { ListOptions } from '../api/list-options';

/**
 * Complete Shakhas list request
 * Supports pagination and sorting only
 */
export type ListShakhasRequest = ListOptions;