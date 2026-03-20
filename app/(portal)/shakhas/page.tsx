import { Plus } from 'lucide-react';

import { ShakhasTable } from '@/components/features/shakhas/shakhas-table';
import { Button } from '@/components/ui/button';
import { fetchShakhas } from '@/lib/actions/shakhas';
import { calculatePaginationState } from '@/lib/pagination-utils';
import { normalizePagination } from '@/lib/query-pagination';
import type { ListShakhasRequest } from '@/types/filters/shakhas';

export const dynamic = 'force-dynamic';

export default async function ShakhasPage({
  searchParams,
}: Readonly<{
  searchParams?: ListShakhasRequest | Promise<ListShakhasRequest>;
}>) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { page, pageSize } = normalizePagination(resolvedSearchParams);

  const { data: paginatedRows, totalCount } = await fetchShakhas(page, pageSize);

  const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-bold">Shakhas</h1>
        <Button size="sm">
          <Plus />
          Add Shakha
        </Button>
      </div>

      <ShakhasTable
        rows={paginatedRows}
        totalRows={totalRows}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
      />
    </div>
  );
}
