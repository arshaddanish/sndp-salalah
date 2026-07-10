# Pagination Architecture — SNDP Salalah Membership Portal

> This document describes the pagination pattern used across all paginated tables in the portal. It is **API-ready**: designed to easily integrate with actual backend API calls.

---

## Overview

Pagination in this portal follows a **server-driven, client-synced** pattern:

1. **Server fetches paginated data** via Server Actions (`src/lib/actions/`)
2. **Client syncs pagination state** to URL query parameters via hooks
3. **Tables receive pre-paginated data** and display it

This design separates concerns cleanly and makes swapping mock data for real API calls trivial.

---

## Architecture: Separation of Concerns

### Pagination vs Filters

**Pagination** (page, pageSize) and **Filters** (search, status, date range) are orthogonal concerns:

- **Pagination**: How many rows to show, which page
- **Filters**: Which rows to show

Each page/resource has **different filters**, but all use the same pagination pattern:

**Base Pagination** (reusable everywhere):

```typescript
export type PaginationParams = {
  page?: string;
  pageSize?: string;
};
```

**Resource-Specific Search Params** (in `src/types/filters/`):

```typescript
// src/types/filters/members.ts
export type MembersSearchParams = PaginationParams & {
  search?: string;
  status?: string;
  shakha?: string;
  start?: string;
  end?: string;
};

// src/types/filters/shakhas.ts
export type ShakhasSearchParams = PaginationParams; // No filters yet
```

**Benefits**:

- ✅ Clear separation: pagination ≠ filters
- ✅ Scalable: new page ≠ modify shared types
- ✅ Type safe: each page knows its valid filters
- ✅ Self-documenting: filters live near their pages

```
┌──────────────────────────────────┐
│  Page Component (Server)         │
│  - Parses URL query params       │
│  - Calls Server Action           │
│  - Calculates page count         │
│  - Passes props to Table         │
└──────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│  Server Action (src/lib/actions/)│
│  - Fetches data (mock or API)    │
│  - Applies filters (if any)      │
│  - Slices/paginates data         │
│  - Returns { data, totalCount }  │
└──────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────┐
│  Table Component (Client)        │
│  - Receives paginated data       │
│  - Uses useQueryPagination() hook│
│  - Syncs URL on pagination change│
│  - Renders DataTable             │
└──────────────────────────────────┘
```

---

## Utilities & Types

### PaginationState & calculatePaginationState

All pagination calculations should use this centralized utility to **eliminate DRY violations**:

**File**: `src/lib/pagination-utils.ts`

```typescript
export type PaginationState = {
  totalRows: number;
  pageCount: number;
  pageIndex: number; // 0-indexed, normalized for React Table
};

export function calculatePaginationState(
  page: number, // 1-indexed from URL
  pageSize: number,
  totalCount: number, // from API/server action
): PaginationState;
```

**Usage in page components**:

```typescript
// Single line replaces the 3-line calculation that was duplicated everywhere
const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);
```

**Benefits**:

- ✅ No duplication across pages
- ✅ Handles edge cases in one place
- ✅ Easy to unit test
- ✅ Single source of truth for pagination math

### PaginationResponse

All server actions return data in this format:

```typescript
// src/types/pagination.ts
type PaginationResponse<T> = {
  data: T[]; // Pre-paginated array
  totalCount: number; // Total count AFTER filters (used to calculate page count)
};
```

**Example**: Fetching page 2 of members with 10 per page:

```typescript
{
  data: [member11, member12, ..., member20], // 10 items
  totalCount: 247  // 247 members match the filters, so page count = 25
}
```

### PaginatedTableProps

All table components receive pagination props via this type:

```typescript
// src/types/pagination.ts
type PaginatedTableProps<T> = {
  rows: T[]; // Pre-paginated array from server
  totalRows: number; // Total rows (after filters)
  pageSize: number; // Items per page (e.g., 10)
  pageIndex: number; // 0-indexed (e.g., page 2 = pageIndex 1)
  pageCount: number; // Total pages (calculated server-side)
};
```

---

## Implementation Pattern

### Step 1: Create a Server Action

**File**: `src/lib/actions/yourresource.ts`

```typescript
'use server';

import type { PaginationResponse } from '@/types/pagination';

/**
 * Fetch paginated data
 * API-Ready: Replace mock logic with actual fetch() to API endpoint
 */
export async function fetchYourResource(
  page: number,        // 1-indexed
  pageSize: number,
  filters?: { [key: string]: any },
): Promise<PaginationResponse<YourType>> {
  // TODO: When API is ready, replace with:
  // const response = await fetch(`${API_URL}/yourresource`, {
  //   params: { page, pageSize, ...filters },
  //   headers: { Authorization: `Bearer ${token}` }
  // })
  // return response.json()

  // Mock implementation for now
  let data = MOCK_DATA;

  // Apply filters if provided
  if (filters?.searchQuery) {
    data = data.filter(item => /* ... */);
  }

  // Paginate
  const start = (page - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);

  return {
    data: paginatedData,
    totalCount: data.length,
  };
}
```

### Step 2: Update Your Page Component

**File**: `app/(portal)/yourfeature/page.tsx`

```typescript
import { normalizePagination, type PaginationQuery } from '@/lib/query-pagination';
import { fetchYourResource } from '@/lib/actions/yourresource';
import { YourResourceTable } from '@/components/features/yourresource/table';

export default async function YourResourcePage({
  searchParams,
}: {
  readonly searchParams?: PaginationQuery | Promise<PaginationQuery>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  // Parse pagination from URL
  const { page, pageSize } = normalizePagination(resolvedSearchParams);

  // Extract filters from URL (if your table has filters)
  const searchQuery = (resolvedSearchParams.search ?? '').trim();
  const statusFilter = resolvedSearchParams.status ?? 'all';
  // ... more filters as needed

  // Fetch paginated data from server action
  const { data: paginatedRows, totalCount } = await fetchYourResource(page, pageSize, {
    search: searchQuery,
    status: statusFilter,
    // ... pass other filters
  });

  // Calculate pagination info
  const totalRows = totalCount;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageIndex = Math.min(Math.max(0, page - 1), pageCount - 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Resource</h1>

      <YourResourceTable
        rows={paginatedRows}
        totalRows={totalRows}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
        // ... pass filters if your table has them
      />
    </div>
  );
}
```

### Step 3: Create Your Table Component

**File**: `src/components/features/yourresource/table.tsx`

```typescript
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableBase } from '@/components/ui/data-table-base';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useDataTableInstance } from '@/hooks/use-data-table-instance';
import { useQueryPagination } from '@/hooks/use-query-pagination';
import type { PaginatedTableProps } from '@/types/pagination';
import type { YourType } from '@/lib/mock-data/yourresource';

const columns: ColumnDef<YourType>[] = [
  // Define your columns
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  // ...
];

/**
 * Your Resource Table
 * Receives pre-paginated data from server
 * Handles client-side pagination UI and URL sync
 */
export function YourResourceTable({
  rows,
  totalRows,
  pageSize,
  pageIndex,
  pageCount,
}: Readonly<PaginatedTableProps<YourType>>) {
  // This hook syncs pagination changes to URL query params
  const { onPaginationChange, isPending } = useQueryPagination({
    page: pageIndex + 1,  // Convert 0-indexed to 1-indexed for URL
    pageSize,
  });
  const { table, totalRows: tableTotalRows, currentPageSize, currentPageIndex, setPageIndex, setPageSize } =
    useDataTableInstance({
      columns,
      data: rows,
      manualPagination: true,
      rowCount: totalRows,
      pageCount,
      pagination: { pageIndex, pageSize },
      onPaginationChange,
    });

  return (
    <DataTableBase
      table={table}
      columns={columns}
      isLoading={isPending}
      skeletonRowCount={currentPageSize}
      footer={
        <DataTablePagination
          table={table}
          isLoading={isPending}
          totalRows={tableTotalRows}
          currentPageIndex={currentPageIndex}
          currentPageSize={currentPageSize}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      }
    />
  );
}
```

### Step 4: With Filters (Optional)

If your table has filters (search, status, date range, etc.), extend the props:

```typescript
// src/components/features/yourresource/table.tsx

type YourResourceTableProps = PaginatedTableProps<YourType> & {
  searchQuery: string;
  statusFilter: string;
  // ... other filters
};

export function YourResourceTable({
  rows,
  totalRows,
  pageSize,
  pageIndex,
  pageCount,
  searchQuery,
  statusFilter,
  // ... other filters
}: Readonly<YourResourceTableProps>) {
  // Your filter UI + DataTable rendering
}
```

---

## Common Scenarios

### Scenario 1: Simple Table (No Filters)

**Setup**:

- Create server action with just `page` and `pageSize` params
- Table component uses just `PaginatedTableProps<T>`
- Example: Shakhas table

**File structure**:

```
src/lib/actions/shakhas.ts          ← Server action
app/(portal)/shakhas/page.tsx        ← Page
src/components/features/shakhas/table.tsx ← Table
```

### Scenario 2: Table with Filters

**Setup**:

- Create server action accepting filters (search, status, etc.)
- Table component extends `PaginatedTableProps<T>` with filter props
- Page passes filter values from URL to server action
- Example: Members table

**File structure**:

```
src/lib/actions/members.ts              ← Server action (handles filters + pagination)
app/(portal)/members/page.tsx            ← Page (extracts filters + pagination from URL)
src/components/features/members/table.tsx ← Table (renders filters + data)
```

---

## API Integration Checklist

When switching from mock data to real API:

- [ ] Update server action imports (remove mock data imports)
- [ ] Replace slice/filter logic with API fetch
- [ ] Ensure API returns `{ data, totalCount }` structure
- [ ] Test pagination across all pages
- [ ] Test filters if applicable
- [ ] Verify URL state syncs correctly

**Example API integration**:

```typescript
// src/lib/actions/shakhas.ts (before: mock)
import { MOCK_SHAKHAS } from '@/lib/mock-data/shakhas';

export async function fetchShakhas(page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    data: MOCK_SHAKHAS.slice(start, start + pageSize),
    totalCount: MOCK_SHAKHAS.length,
  };
}
```

```typescript
// src/lib/actions/shakhas.ts (after: API)
export async function fetchShakhas(page: number, pageSize: number) {
  const response = await fetch(`${process.env.API_URL}/shakhas?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
  });
  return response.json(); // Assumes API returns { data, totalCount }
}
```

---

## Best Practices

1. **Always calculate `pageCount` server-side** — never rely on client-side calculations.

   ```typescript
   // ✅ Correct
   const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

   // ❌ Wrong
   const pageCount = data.length / pageSize; // Breaks when API paginates
   ```

2. **Pass pre-paginated `data` to tables** — tables should never slice data again.

   ```typescript
   // ✅ Correct
   <YourTable rows={paginatedData} totalRows={totalCount} ... />

   // ❌ Wrong
   <YourTable rows={allData} ... /> // Then filters/slices in table logic
   ```

3. **Use `PaginatedTableProps<T>` for consistency** — all paginated tables should use this type.

   ```typescript
   // ✅ Correct
   export function MyTable(props: PaginatedTableProps<MyType>) { ... }

   // ❌ Wrong
   export function MyTable(props: { data, totalRows, ... }) { ... }
   ```

4. **Apply filters before pagination** — filter first, then paginate the result.

   ```
   All data → Apply filters → Get totalCount → Paginate → Return data
   ```

5. **URL state is the source of truth** — never store pagination in component state.

   ```typescript
   // ✅ Correct
   const { onPaginationChange } = useQueryPagination(...)

   // ❌ Wrong
   const [page, setPage] = useState(1); // Breaks on browser back/forward
   ```

---

## Troubleshooting

**Problem**: Pagination buttons don't work.

- Check that `useQueryPagination()` is called in your table.
- Verify `onPaginationChange` is passed to `DataTable`.

**Problem**: Page shows wrong data after changing pagination.

- Ensure server action returns the correct slice of data.
- Check that `totalCount` is calculated AFTER filters.

**Problem**: URL state doesn't match displayed data.

- Verify page component extracts search params correctly.
- Check that `normalizePagination()` is parsing the URL correctly.

**Problem**: Filters don't work with pagination.

- Apply filters in the server action BEFORE calculating `totalCount`.
- Pass filter values to server action from the page component.

---

## Summary

| Layer                                   | Responsibility                                                           |
| --------------------------------------- | ------------------------------------------------------------------------ |
| **Server Action**                       | Fetch data, apply filters, paginate, return `{ data, totalCount }`       |
| **Page Component**                      | Parse URL, call server action, calculate page count, pass props to table |
| **Table Component**                     | Receive paginated data, render UI, sync pagination changes to URL        |
| **useQueryPagination Hook**             | Sync pagination state to URL query params                                |
| **DataTableBase + DataTablePagination** | Composed table primitives: base renderer + optional pagination footer    |
| **useDataTableInstance Hook**           | Shared TanStack table-state setup for static and paginated screens       |

---

## File Reference

| File                                           | Purpose                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `src/types/pagination.ts`                      | Shared types: `PaginationResponse<T>`, `PaginatedTableProps<T>` |
| `src/lib/query-pagination.ts`                  | Utility: `normalizePagination()` for parsing URL query params   |
| `src/hooks/use-query-pagination.ts`            | React hook for syncing pagination to URL                        |
| `src/lib/actions/*.ts`                         | Server actions for data fetching (one per resource)             |
| `src/components/ui/data-table-base.tsx`        | Base table renderer (headers, rows, loading, empty state)       |
| `src/components/ui/data-table-pagination.tsx`  | Pagination footer controls and counters                         |
| `src/components/ui/use-data-table-instance.ts` | Hook to configure TanStack table state/options                  |
| `src/components/features/*/table.tsx`          | High-level table wrappers (domain-specific columns + filters)   |
