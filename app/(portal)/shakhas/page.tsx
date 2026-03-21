import { CreateShakhaButton } from '@/components/features/shakhas/create-shakha-button';
import { ShakhasTable } from '@/components/features/shakhas/shakhas-table';
import { fetchShakhas } from '@/lib/actions/shakhas';
import { calculatePaginationState } from '@/lib/pagination-utils';
import { normalizePagination } from '@/lib/query-pagination';
import type { ListShakhasRequest } from '@/types/filters/shakhas';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Shakhas | SNDP Salalah',
  description: 'Manage shakhas (branches) and view assigned member counts',
};

export default async function ShakhasPage({
  searchParams,
}: Readonly<{
  searchParams?: ListShakhasRequest | Promise<ListShakhasRequest>;
}>) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { page, pageSize } = normalizePagination(resolvedSearchParams);

  const shakhasResult = await fetchShakhas(page, pageSize);
  const paginatedRows = shakhasResult.success ? (shakhasResult.data?.items ?? []) : [];
  const totalCount = shakhasResult.success ? (shakhasResult.data?.totalCount ?? 0) : 0;

  const { totalRows, pageCount, pageIndex } = calculatePaginationState(page, pageSize, totalCount);
  const errorMessage = shakhasResult.success
    ? null
    : (shakhasResult.error ?? 'Unable to load shakhas. Please try again.');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-bold">Shakhas</h1>
        <CreateShakhaButton />
      </div>

      {errorMessage ? <p className="text-danger text-sm">{errorMessage}</p> : null}

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
