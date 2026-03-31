import { Download } from 'lucide-react';

import { CreateMemberButton } from '@/components/features/members/create-member-button';
import { MembersTable } from '@/components/features/members/members-table';
import { Button } from '@/components/ui/button';
import { fetchMembers, fetchShakhaOptions } from '@/lib/actions/members';
import { calculatePaginationState } from '@/lib/pagination-utils';
import { normalizePagination } from '@/lib/query-pagination';
import type { ListMembersRequest } from '@/types/filters/members';

export const metadata = {
  title: 'Members | SNDP Salalah',
  description: 'View and manage the member directory with search, filters, and pagination',
};

export const dynamic = 'force-dynamic';

export default async function MembersPage({
  searchParams,
}: {
  readonly searchParams?: ListMembersRequest | Promise<ListMembersRequest>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const searchQuery = (resolvedSearchParams.q ?? '').trim();
  const statusFilter = resolvedSearchParams.status ?? 'all';
  const shakhaFilter = resolvedSearchParams.shakha ?? 'all';
  const createdStartDate = resolvedSearchParams.createdStart ?? '';
  const createdEndDate = resolvedSearchParams.createdEnd ?? '';
  const { page, pageSize } = normalizePagination(resolvedSearchParams);

  const [membersResult, shakhaOptionsResult] = await Promise.all([
    fetchMembers(page, pageSize, {
      q: searchQuery,
      status: statusFilter,
      shakha: shakhaFilter,
      createdStart: createdStartDate,
      createdEnd: createdEndDate,
    }),
    fetchShakhaOptions(),
  ]);

  const paginatedRows = membersResult.success ? (membersResult.data?.items ?? []) : [];
  const totalCount = membersResult.success ? (membersResult.data?.totalCount ?? 0) : 0;
  const shakhaOptions = shakhaOptionsResult.success
    ? [{ label: 'All', value: 'all' }, ...(shakhaOptionsResult.data ?? [])]
    : [{ label: 'All', value: 'all' }];

  if (!membersResult.success && membersResult.error) {
    console.error('Failed to fetch members for members page', {
      error: membersResult.error,
      page,
      pageSize,
    });
  }

  if (!shakhaOptionsResult.success && shakhaOptionsResult.error) {
    console.error('Failed to fetch shakha options for members page', {
      error: shakhaOptionsResult.error,
    });
  }

  const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);

  const errorMessage = membersResult.success
    ? null
    : (membersResult.error ?? 'Unable to load members. Please try again.');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-bold">Members</h1>
        <div className="flex gap-2">
          <CreateMemberButton />
          <Button variant="secondary" size="sm" className="h-8">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

      <MembersTable
        rows={paginatedRows}
        totalRows={totalRows}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        shakhaFilter={shakhaFilter}
        startDate={createdStartDate}
        endDate={createdEndDate}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
        shakhaOptions={shakhaOptions}
      />
    </div>
  );
}
